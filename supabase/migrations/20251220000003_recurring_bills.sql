-- Recurring Bills / Subscription Tracking
-- Track recurring bills, subscriptions, and payment due dates

-- Create recurring_bills table
CREATE TABLE IF NOT EXISTS recurring_bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Bill details
  name TEXT NOT NULL,
  description TEXT,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  
  -- Frequency and timing
  frequency TEXT NOT NULL CHECK (frequency IN ('weekly', 'biweekly', 'monthly', 'quarterly', 'semi_annual', 'annual')),
  due_day INTEGER, -- Day of month (1-31) for monthly, or day of week (0-6) for weekly
  due_date DATE, -- Specific date for non-recurring or next due date
  
  -- Category and organization
  category TEXT DEFAULT 'other' CHECK (category IN (
    'housing', 'utilities', 'insurance', 'subscriptions', 'loans', 
    'credit_cards', 'memberships', 'services', 'other'
  )),
  
  -- Payment info
  is_auto_pay BOOLEAN DEFAULT false,
  payment_method TEXT, -- e.g., 'Chase Visa', 'Bank Account'
  account_number_last4 TEXT, -- Last 4 digits for reference
  
  -- Subscription-specific
  is_subscription BOOLEAN DEFAULT false,
  subscription_service TEXT, -- e.g., 'Netflix', 'Spotify', 'AWS'
  cancellation_url TEXT,
  
  -- Reminders
  reminder_days_before INTEGER[] DEFAULT '{3, 1}', -- Remind 3 days and 1 day before
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create bill_payments table to track payment history
CREATE TABLE IF NOT EXISTS bill_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bill_id UUID NOT NULL REFERENCES recurring_bills(id) ON DELETE CASCADE,
  
  -- Payment details
  amount_paid DECIMAL(10, 2) NOT NULL,
  paid_date DATE NOT NULL,
  due_date DATE NOT NULL,
  
  -- Status
  status TEXT DEFAULT 'paid' CHECK (status IN ('paid', 'pending', 'late', 'skipped')),
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_recurring_bills_user ON recurring_bills(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_bills_due_date ON recurring_bills(due_date) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_recurring_bills_category ON recurring_bills(user_id, category);
CREATE INDEX IF NOT EXISTS idx_bill_payments_user ON bill_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_bill_payments_bill ON bill_payments(bill_id);

-- Enable RLS
ALTER TABLE recurring_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for recurring_bills
CREATE POLICY "Users can view their own bills"
  ON recurring_bills FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bills"
  ON recurring_bills FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bills"
  ON recurring_bills FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bills"
  ON recurring_bills FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for bill_payments
CREATE POLICY "Users can view their own payments"
  ON bill_payments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own payments"
  ON bill_payments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payments"
  ON bill_payments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own payments"
  ON bill_payments FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_recurring_bills_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER recurring_bills_updated_at
  BEFORE UPDATE ON recurring_bills
  FOR EACH ROW
  EXECUTE FUNCTION update_recurring_bills_updated_at();

-- Comments
COMMENT ON TABLE recurring_bills IS 'Recurring bills and subscriptions with due date tracking';
COMMENT ON TABLE bill_payments IS 'Payment history for recurring bills';

