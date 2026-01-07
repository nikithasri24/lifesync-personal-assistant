-- Migration: Add Credit Card Tracking Features
-- Adds fields for credit limits, APR, payment due dates, and utilization tracking

-- Add credit card specific fields to accounts table
ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS credit_limit numeric,
  ADD COLUMN IF NOT EXISTS apr numeric,
  ADD COLUMN IF NOT EXISTS payment_due_day integer,
  ADD COLUMN IF NOT EXISTS minimum_payment numeric,
  ADD COLUMN IF NOT EXISTS statement_balance numeric,
  ADD COLUMN IF NOT EXISTS statement_date date;

-- Add check constraint for payment_due_day (1-31)
ALTER TABLE accounts
  ADD CONSTRAINT payment_due_day_check
  CHECK (payment_due_day IS NULL OR (payment_due_day >= 1 AND payment_due_day <= 31));

-- Add check constraint for APR (0-100%)
ALTER TABLE accounts
  ADD CONSTRAINT apr_check
  CHECK (apr IS NULL OR (apr >= 0 AND apr <= 100));

-- Create credit card statements table for historical tracking
CREATE TABLE IF NOT EXISTS credit_card_statements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  statement_date date NOT NULL,
  due_date date NOT NULL,
  balance numeric NOT NULL,
  minimum_payment numeric NOT NULL,
  apr numeric,
  paid boolean NOT NULL DEFAULT false,
  paid_amount numeric,
  paid_date date,
  created_at timestamptz NOT NULL DEFAULT now(),

  UNIQUE(account_id, statement_date)
);

-- Add RLS policies for credit_card_statements
ALTER TABLE credit_card_statements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_statements_crud" ON credit_card_statements
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "own_statements_select" ON credit_card_statements
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_statements_account_date
  ON credit_card_statements(account_id, statement_date DESC);

-- Create index for due date reminders
CREATE INDEX IF NOT EXISTS idx_statements_due_date
  ON credit_card_statements(user_id, due_date)
  WHERE paid = false;
