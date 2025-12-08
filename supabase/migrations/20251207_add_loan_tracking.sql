-- Loan Tracking Tables

-- Main loans table
CREATE TABLE IF NOT EXISTS loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  loan_name TEXT NOT NULL,
  loan_type TEXT CHECK (loan_type IN ('auto', 'mortgage', 'personal', 'student', 'business', 'other')) NOT NULL,
  status TEXT CHECK (status IN ('active', 'paid_off', 'deferred', 'defaulted')) NOT NULL DEFAULT 'active',
  principal_amount NUMERIC NOT NULL,
  current_balance NUMERIC NOT NULL,
  interest_rate NUMERIC NOT NULL, -- Annual percentage rate
  monthly_payment NUMERIC NOT NULL,
  extra_payment NUMERIC NOT NULL DEFAULT 0,
  target_payoff_date DATE NOT NULL,
  start_date DATE NOT NULL,
  first_payment_date DATE NOT NULL,
  lender TEXT,
  loan_number TEXT,
  term_months INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Loan payments history table
CREATE TABLE IF NOT EXISTS loan_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  loan_id UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  payment_date DATE NOT NULL,
  amount NUMERIC NOT NULL,
  principal_amount NUMERIC NOT NULL,
  interest_amount NUMERIC NOT NULL,
  extra_amount NUMERIC NOT NULL DEFAULT 0,
  balance_after NUMERIC NOT NULL,
  transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for loans
DROP POLICY IF EXISTS "own_loans_select" ON loans;
DROP POLICY IF EXISTS "own_loans_crud" ON loans;
CREATE POLICY "own_loans_select" ON loans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own_loans_crud" ON loans FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- RLS Policies for loan_payments
DROP POLICY IF EXISTS "own_loan_payments_select" ON loan_payments;
DROP POLICY IF EXISTS "own_loan_payments_crud" ON loan_payments;
CREATE POLICY "own_loan_payments_select" ON loan_payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own_loan_payments_crud" ON loan_payments FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_loans_user_id ON loans(user_id);
CREATE INDEX IF NOT EXISTS idx_loans_status ON loans(user_id, status);
CREATE INDEX IF NOT EXISTS idx_loans_account_id ON loans(account_id) WHERE account_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_loan_payments_loan_id ON loan_payments(loan_id, payment_date DESC);
CREATE INDEX IF NOT EXISTS idx_loan_payments_user_id ON loan_payments(user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_loans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS loans_updated_at_trigger ON loans;
CREATE TRIGGER loans_updated_at_trigger
  BEFORE UPDATE ON loans
  FOR EACH ROW
  EXECUTE FUNCTION update_loans_updated_at();

-- View with calculated fields
CREATE OR REPLACE VIEW loans_with_stats AS
SELECT
  l.*,
  COALESCE(SUM(lp.amount), 0) as total_paid,
  COALESCE(SUM(lp.interest_amount), 0) as interest_paid,
  COALESCE(SUM(lp.principal_amount), 0) as principal_paid,
  COUNT(lp.id) as payment_count,
  CASE
    WHEN l.monthly_payment + l.extra_payment > 0 THEN
      CEIL(l.current_balance / (l.monthly_payment + l.extra_payment))
    ELSE NULL
  END as remaining_payments,
  CASE
    WHEN l.monthly_payment + l.extra_payment > 0 THEN
      (CURRENT_DATE + (CEIL(l.current_balance / (l.monthly_payment + l.extra_payment)) || ' months')::INTERVAL)::DATE
    ELSE NULL
  END as projected_payoff_date
FROM loans l
LEFT JOIN loan_payments lp ON l.id = lp.loan_id
GROUP BY l.id;

-- Grant access to the view
GRANT SELECT ON loans_with_stats TO authenticated;

-- Add RLS to view
ALTER VIEW loans_with_stats SET (security_invoker = true);
