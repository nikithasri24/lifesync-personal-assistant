-- =====================================================
-- FINANCE MODULE - LOANS & RECURRING TRANSACTIONS
-- =====================================================
-- This migration creates:
-- - loans
-- - loan_payments
-- - recurring_transactions
-- - pending_transactions

-- =====================================================
-- LOANS
-- =====================================================

CREATE TYPE finance_loan_type AS ENUM ('auto', 'mortgage', 'personal', 'student', 'business', 'other');
CREATE TYPE finance_loan_status AS ENUM ('active', 'paid_off', 'deferred', 'defaulted');

CREATE TABLE IF NOT EXISTS finance_loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID REFERENCES finance_accounts(id) ON DELETE SET NULL,
  loan_name TEXT NOT NULL,
  loan_type finance_loan_type NOT NULL,
  status finance_loan_status NOT NULL DEFAULT 'active',
  principal_amount DECIMAL(15, 2) NOT NULL,
  current_balance DECIMAL(15, 2) NOT NULL,
  interest_rate DECIMAL(5, 2) NOT NULL,
  monthly_payment DECIMAL(15, 2) NOT NULL,
  extra_payment DECIMAL(15, 2) NOT NULL DEFAULT 0,
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

CREATE INDEX IF NOT EXISTS idx_finance_loans_user_id ON finance_loans(user_id);
CREATE INDEX IF NOT EXISTS idx_finance_loans_account_id ON finance_loans(account_id);
CREATE INDEX IF NOT EXISTS idx_finance_loans_status ON finance_loans(status);

-- RLS Policies
ALTER TABLE finance_loans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own loans" ON finance_loans;
CREATE POLICY "Users can view their own loans" ON finance_loans
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own loans" ON finance_loans;
CREATE POLICY "Users can insert their own loans" ON finance_loans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own loans" ON finance_loans;
CREATE POLICY "Users can update their own loans" ON finance_loans
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own loans" ON finance_loans;
CREATE POLICY "Users can delete their own loans" ON finance_loans
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- LOAN PAYMENTS
-- =====================================================

CREATE TABLE IF NOT EXISTS finance_loan_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  loan_id UUID NOT NULL REFERENCES finance_loans(id) ON DELETE CASCADE,
  payment_date DATE NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  principal_amount DECIMAL(15, 2) NOT NULL,
  interest_amount DECIMAL(15, 2) NOT NULL,
  extra_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
  balance_after DECIMAL(15, 2) NOT NULL,
  transaction_id UUID REFERENCES finance_transactions(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_finance_loan_payments_user_id ON finance_loan_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_finance_loan_payments_loan_id ON finance_loan_payments(loan_id);
CREATE INDEX IF NOT EXISTS idx_finance_loan_payments_payment_date ON finance_loan_payments(payment_date DESC);

-- RLS Policies
ALTER TABLE finance_loan_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own loan payments" ON finance_loan_payments;
CREATE POLICY "Users can view their own loan payments" ON finance_loan_payments
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own loan payments" ON finance_loan_payments;
CREATE POLICY "Users can insert their own loan payments" ON finance_loan_payments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own loan payments" ON finance_loan_payments;
CREATE POLICY "Users can update their own loan payments" ON finance_loan_payments
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own loan payments" ON finance_loan_payments;
CREATE POLICY "Users can delete their own loan payments" ON finance_loan_payments
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- RECURRING TRANSACTIONS
-- =====================================================

CREATE TYPE finance_recurring_frequency AS ENUM ('daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly');

CREATE TABLE IF NOT EXISTS finance_recurring_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  type finance_txn_type NOT NULL,
  category_id UUID REFERENCES finance_categories(id) ON DELETE SET NULL,
  account_id UUID REFERENCES finance_accounts(id) ON DELETE SET NULL,
  frequency finance_recurring_frequency NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  day_of_month INTEGER CHECK (day_of_month >= -1 AND day_of_month <= 31),
  day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6),
  auto_create BOOLEAN NOT NULL DEFAULT FALSE,
  require_approval BOOLEAN NOT NULL DEFAULT TRUE,
  days_before INTEGER NOT NULL DEFAULT 3,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  notes TEXT,
  last_generated_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_finance_recurring_transactions_user_id ON finance_recurring_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_finance_recurring_transactions_active ON finance_recurring_transactions(active);

-- RLS Policies
ALTER TABLE finance_recurring_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own recurring transactions" ON finance_recurring_transactions;
CREATE POLICY "Users can view their own recurring transactions" ON finance_recurring_transactions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own recurring transactions" ON finance_recurring_transactions;
CREATE POLICY "Users can insert their own recurring transactions" ON finance_recurring_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own recurring transactions" ON finance_recurring_transactions;
CREATE POLICY "Users can update their own recurring transactions" ON finance_recurring_transactions
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own recurring transactions" ON finance_recurring_transactions;
CREATE POLICY "Users can delete their own recurring transactions" ON finance_recurring_transactions
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- PENDING TRANSACTIONS
-- =====================================================

CREATE TYPE finance_pending_status AS ENUM ('pending', 'approved', 'skipped', 'edited');

CREATE TABLE IF NOT EXISTS finance_pending_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recurring_transaction_id UUID REFERENCES finance_recurring_transactions(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  type finance_txn_type NOT NULL,
  category_id UUID REFERENCES finance_categories(id) ON DELETE SET NULL,
  account_id UUID REFERENCES finance_accounts(id) ON DELETE SET NULL,
  scheduled_date DATE NOT NULL,
  status finance_pending_status NOT NULL DEFAULT 'pending',
  transaction_id UUID REFERENCES finance_transactions(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_finance_pending_transactions_user_id ON finance_pending_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_finance_pending_transactions_recurring_id ON finance_pending_transactions(recurring_transaction_id);
CREATE INDEX IF NOT EXISTS idx_finance_pending_transactions_status ON finance_pending_transactions(status);
CREATE INDEX IF NOT EXISTS idx_finance_pending_transactions_scheduled_date ON finance_pending_transactions(scheduled_date);

-- RLS Policies
ALTER TABLE finance_pending_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own pending transactions" ON finance_pending_transactions;
CREATE POLICY "Users can view their own pending transactions" ON finance_pending_transactions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own pending transactions" ON finance_pending_transactions;
CREATE POLICY "Users can insert their own pending transactions" ON finance_pending_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own pending transactions" ON finance_pending_transactions;
CREATE POLICY "Users can update their own pending transactions" ON finance_pending_transactions
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own pending transactions" ON finance_pending_transactions;
CREATE POLICY "Users can delete their own pending transactions" ON finance_pending_transactions
  FOR DELETE USING (auth.uid() = user_id);

