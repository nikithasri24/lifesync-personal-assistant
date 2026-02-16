-- Create recurring_transactions table
CREATE TABLE IF NOT EXISTS recurring_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('credit', 'debit')),
  category_id UUID REFERENCES finance_categories(id) ON DELETE SET NULL,
  account_id UUID REFERENCES finance_accounts(id) ON DELETE SET NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly')),
  start_date DATE NOT NULL,
  end_date DATE,
  day_of_month INTEGER CHECK (day_of_month >= -1 AND day_of_month <= 31),
  day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6),
  auto_create BOOLEAN NOT NULL DEFAULT false,
  require_approval BOOLEAN NOT NULL DEFAULT true,
  days_before INTEGER NOT NULL DEFAULT 3 CHECK (days_before >= 0 AND days_before <= 30),
  active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  last_generated_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,

  -- Constraints
  CONSTRAINT valid_end_date CHECK (end_date IS NULL OR end_date >= start_date)
);

-- Create pending_transactions table
CREATE TABLE IF NOT EXISTS pending_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recurring_transaction_id UUID REFERENCES recurring_transactions(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('credit', 'debit')),
  category_id UUID REFERENCES finance_categories(id) ON DELETE SET NULL,
  account_id UUID REFERENCES finance_accounts(id) ON DELETE SET NULL,
  scheduled_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'skipped', 'edited')),
  transaction_id UUID REFERENCES finance_transactions(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,

  -- Prevent duplicate pending transactions for same recurring transaction and date
  CONSTRAINT unique_recurring_date UNIQUE (recurring_transaction_id, scheduled_date)
);

-- Create indexes for better query performance (idempotent)
DO $$
BEGIN
  -- Recurring transactions indexes
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_recurring_transactions_user_id') THEN
    CREATE INDEX idx_recurring_transactions_user_id ON recurring_transactions(user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_recurring_transactions_active') THEN
    CREATE INDEX idx_recurring_transactions_active ON recurring_transactions(active) WHERE active = true;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_recurring_transactions_frequency') THEN
    CREATE INDEX idx_recurring_transactions_frequency ON recurring_transactions(frequency);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_recurring_transactions_next_gen') THEN
    CREATE INDEX idx_recurring_transactions_next_gen ON recurring_transactions(last_generated_date, active);
  END IF;

  -- Pending transactions indexes
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_pending_transactions_user_id') THEN
    CREATE INDEX idx_pending_transactions_user_id ON pending_transactions(user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_pending_transactions_status') THEN
    CREATE INDEX idx_pending_transactions_status ON pending_transactions(status);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_pending_transactions_scheduled_date') THEN
    CREATE INDEX idx_pending_transactions_scheduled_date ON pending_transactions(scheduled_date);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_pending_transactions_recurring_id') THEN
    CREATE INDEX idx_pending_transactions_recurring_id ON pending_transactions(recurring_transaction_id);
  END IF;
END $$;

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate trigger to ensure it's up to date
DROP TRIGGER IF EXISTS update_recurring_transactions_updated_at ON recurring_transactions;
CREATE TRIGGER update_recurring_transactions_updated_at
  BEFORE UPDATE ON recurring_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE recurring_transactions IS 'Stores recurring transaction templates that generate pending transactions';
COMMENT ON TABLE pending_transactions IS 'Stores pending transactions awaiting review/approval';

COMMENT ON COLUMN recurring_transactions.frequency IS 'How often the transaction recurs: daily, weekly, biweekly, monthly, quarterly, yearly';
COMMENT ON COLUMN recurring_transactions.day_of_month IS 'For monthly/quarterly/yearly: 1-31 for specific day, -1 for last day of month';
COMMENT ON COLUMN recurring_transactions.day_of_week IS 'For weekly/biweekly: 0=Sunday, 1=Monday, ..., 6=Saturday';
COMMENT ON COLUMN recurring_transactions.auto_create IS 'If true, automatically creates transactions without approval';
COMMENT ON COLUMN recurring_transactions.require_approval IS 'If true, creates pending transactions for review';
COMMENT ON COLUMN recurring_transactions.days_before IS 'How many days before scheduled date to generate pending transaction';
COMMENT ON COLUMN recurring_transactions.last_generated_date IS 'Last date for which a pending/actual transaction was generated';

COMMENT ON COLUMN pending_transactions.status IS 'pending: awaiting review, approved: converted to transaction, skipped: user chose to skip, edited: user modified before approving';
COMMENT ON COLUMN pending_transactions.transaction_id IS 'Links to the actual transaction if approved';
