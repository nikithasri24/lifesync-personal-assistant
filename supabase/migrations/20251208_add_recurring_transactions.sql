-- Recurring Transactions Feature
-- Allows users to set up recurring transactions that auto-generate with approval workflow

-- Main recurring transactions table (templates)
CREATE TABLE IF NOT EXISTS recurring_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,

  -- Transaction details
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  type TEXT CHECK (type IN ('credit', 'debit')) NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,

  -- Recurrence settings
  frequency TEXT CHECK (frequency IN ('daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly')) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE, -- NULL means indefinite
  day_of_month INTEGER, -- For monthly: 1-31, or -1 for last day
  day_of_week INTEGER, -- For weekly: 0=Sun, 1=Mon, etc.

  -- Auto-generation settings
  auto_create BOOLEAN NOT NULL DEFAULT false, -- If true, auto-create transactions
  require_approval BOOLEAN NOT NULL DEFAULT true, -- If true, create as pending
  days_before INTEGER NOT NULL DEFAULT 3, -- Generate N days before due date

  -- Status
  active BOOLEAN NOT NULL DEFAULT true,

  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_generated_date DATE -- Track when last transaction was generated
);

-- Pending transactions awaiting approval
CREATE TABLE IF NOT EXISTS pending_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  recurring_transaction_id UUID REFERENCES recurring_transactions(id) ON DELETE CASCADE,

  -- Transaction details (can be edited before approval)
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  type TEXT CHECK (type IN ('credit', 'debit')) NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  scheduled_date DATE NOT NULL, -- When this transaction should occur

  -- Status
  status TEXT CHECK (status IN ('pending', 'approved', 'skipped', 'edited')) NOT NULL DEFAULT 'pending',
  transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL, -- Links to approved transaction

  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,

  UNIQUE(recurring_transaction_id, scheduled_date) -- Prevent duplicate generations
);

-- Enable RLS
ALTER TABLE recurring_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for recurring_transactions
DROP POLICY IF EXISTS "own_recurring_transactions_select" ON recurring_transactions;
DROP POLICY IF EXISTS "own_recurring_transactions_crud" ON recurring_transactions;
CREATE POLICY "own_recurring_transactions_select" ON recurring_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own_recurring_transactions_crud" ON recurring_transactions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- RLS Policies for pending_transactions
DROP POLICY IF EXISTS "own_pending_transactions_select" ON pending_transactions;
DROP POLICY IF EXISTS "own_pending_transactions_crud" ON pending_transactions;
CREATE POLICY "own_pending_transactions_select" ON pending_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own_pending_transactions_crud" ON pending_transactions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_recurring_transactions_user_id ON recurring_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_transactions_active ON recurring_transactions(user_id, active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_recurring_transactions_next_gen ON recurring_transactions(user_id, last_generated_date, start_date) WHERE active = true;

CREATE INDEX IF NOT EXISTS idx_pending_transactions_user_id ON pending_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_pending_transactions_status ON pending_transactions(user_id, status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_pending_transactions_date ON pending_transactions(user_id, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_pending_transactions_recurring_id ON pending_transactions(recurring_transaction_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_recurring_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS recurring_transactions_updated_at_trigger ON recurring_transactions;
CREATE TRIGGER recurring_transactions_updated_at_trigger
  BEFORE UPDATE ON recurring_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_recurring_transactions_updated_at();

-- Function to calculate next occurrence date
CREATE OR REPLACE FUNCTION calculate_next_occurrence(
  p_frequency TEXT,
  p_last_date DATE,
  p_start_date DATE,
  p_day_of_month INTEGER,
  p_day_of_week INTEGER
) RETURNS DATE AS $$
DECLARE
  v_next_date DATE;
  v_base_date DATE;
BEGIN
  -- Use last generated date if available, otherwise start date
  v_base_date := COALESCE(p_last_date, p_start_date);

  CASE p_frequency
    WHEN 'daily' THEN
      v_next_date := v_base_date + INTERVAL '1 day';

    WHEN 'weekly' THEN
      -- Find next occurrence of day_of_week
      v_next_date := v_base_date + INTERVAL '1 week';

    WHEN 'biweekly' THEN
      v_next_date := v_base_date + INTERVAL '2 weeks';

    WHEN 'monthly' THEN
      -- Add one month
      v_next_date := v_base_date + INTERVAL '1 month';
      -- Adjust to specific day if provided
      IF p_day_of_month IS NOT NULL THEN
        IF p_day_of_month = -1 THEN
          -- Last day of month
          v_next_date := (DATE_TRUNC('month', v_next_date) + INTERVAL '1 month - 1 day')::DATE;
        ELSE
          -- Specific day of month
          v_next_date := DATE_TRUNC('month', v_next_date) + (p_day_of_month - 1 || ' days')::INTERVAL;
        END IF;
      END IF;

    WHEN 'quarterly' THEN
      v_next_date := v_base_date + INTERVAL '3 months';

    WHEN 'yearly' THEN
      v_next_date := v_base_date + INTERVAL '1 year';

    ELSE
      v_next_date := v_base_date + INTERVAL '1 month';
  END CASE;

  RETURN v_next_date;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to generate pending transactions for active recurring transactions
CREATE OR REPLACE FUNCTION generate_pending_transactions(p_user_id UUID DEFAULT NULL)
RETURNS TABLE(
  recurring_id UUID,
  scheduled_date DATE,
  description TEXT,
  amount NUMERIC
) AS $$
DECLARE
  v_rec RECORD;
  v_next_date DATE;
  v_today DATE := CURRENT_DATE;
  v_user_id UUID;
BEGIN
  -- Use provided user_id or current auth user
  v_user_id := COALESCE(p_user_id, auth.uid());

  -- Loop through all active recurring transactions
  FOR v_rec IN
    SELECT * FROM recurring_transactions
    WHERE user_id = v_user_id
      AND active = true
      AND (end_date IS NULL OR end_date >= v_today)
  LOOP
    -- Calculate next occurrence
    v_next_date := calculate_next_occurrence(
      v_rec.frequency,
      v_rec.last_generated_date,
      v_rec.start_date,
      v_rec.day_of_month,
      v_rec.day_of_week
    );

    -- Check if we should generate (within days_before window)
    IF v_next_date <= v_today + v_rec.days_before THEN
      -- Check if not already generated
      IF NOT EXISTS (
        SELECT 1 FROM pending_transactions
        WHERE recurring_transaction_id = v_rec.id
          AND scheduled_date = v_next_date
      ) THEN
        -- Insert pending transaction
        INSERT INTO pending_transactions (
          user_id,
          recurring_transaction_id,
          description,
          amount,
          type,
          category_id,
          account_id,
          scheduled_date,
          status
        ) VALUES (
          v_user_id,
          v_rec.id,
          v_rec.description,
          v_rec.amount,
          v_rec.type,
          v_rec.category_id,
          v_rec.account_id,
          v_next_date,
          CASE
            WHEN v_rec.auto_create AND NOT v_rec.require_approval THEN 'approved'
            ELSE 'pending'
          END
        );

        -- Update last_generated_date
        UPDATE recurring_transactions
        SET last_generated_date = v_next_date
        WHERE id = v_rec.id;

        -- Return the generated transaction
        RETURN QUERY SELECT
          v_rec.id,
          v_next_date,
          v_rec.description,
          v_rec.amount;
      END IF;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION generate_pending_transactions TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_next_occurrence TO authenticated;

-- View for upcoming recurring transactions
CREATE OR REPLACE VIEW recurring_transactions_upcoming AS
SELECT
  rt.*,
  calculate_next_occurrence(
    rt.frequency,
    rt.last_generated_date,
    rt.start_date,
    rt.day_of_month,
    rt.day_of_week
  ) as next_occurrence_date,
  (
    SELECT COUNT(*)
    FROM pending_transactions pt
    WHERE pt.recurring_transaction_id = rt.id
      AND pt.status = 'pending'
  ) as pending_count
FROM recurring_transactions rt
WHERE rt.active = true;

-- Grant access to the view
GRANT SELECT ON recurring_transactions_upcoming TO authenticated;
ALTER VIEW recurring_transactions_upcoming SET (security_invoker = true);

-- Comments
COMMENT ON TABLE recurring_transactions IS 'Templates for recurring transactions (subscriptions, rent, salary, etc.)';
COMMENT ON TABLE pending_transactions IS 'Auto-generated transactions awaiting user approval';
COMMENT ON COLUMN recurring_transactions.auto_create IS 'If true, automatically create transactions without approval';
COMMENT ON COLUMN recurring_transactions.require_approval IS 'If true, create as pending requiring user review';
COMMENT ON COLUMN recurring_transactions.days_before IS 'Generate pending transaction N days before scheduled date';
COMMENT ON COLUMN recurring_transactions.day_of_month IS 'For monthly: 1-31, or -1 for last day of month';
COMMENT ON FUNCTION generate_pending_transactions IS 'Generate pending transactions for all active recurring transactions';
