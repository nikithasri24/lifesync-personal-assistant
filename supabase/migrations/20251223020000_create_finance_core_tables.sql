-- =====================================================
-- FINANCE MODULE - CORE TABLES
-- =====================================================
-- This migration creates the core finance tables:
-- - institutions
-- - categories
-- - accounts
-- - transactions
-- - budgets
-- - budget_templates
-- - goals
-- - goal_progress

-- =====================================================
-- INSTITUTIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS finance_institutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_finance_institutions_user_id ON finance_institutions(user_id);

-- RLS Policies
ALTER TABLE finance_institutions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own institutions" ON finance_institutions;
CREATE POLICY "Users can view their own institutions" ON finance_institutions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own institutions" ON finance_institutions;
CREATE POLICY "Users can insert their own institutions" ON finance_institutions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own institutions" ON finance_institutions;
CREATE POLICY "Users can update their own institutions" ON finance_institutions
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own institutions" ON finance_institutions;
CREATE POLICY "Users can delete their own institutions" ON finance_institutions
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- CATEGORIES
-- =====================================================

CREATE TABLE IF NOT EXISTS finance_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  parent_id UUID REFERENCES finance_categories(id) ON DELETE SET NULL,
  icon TEXT,
  color TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_finance_categories_user_id ON finance_categories(user_id);
CREATE INDEX IF NOT EXISTS idx_finance_categories_parent_id ON finance_categories(parent_id);

-- RLS Policies
ALTER TABLE finance_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own categories" ON finance_categories;
CREATE POLICY "Users can view their own categories" ON finance_categories
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own categories" ON finance_categories;
CREATE POLICY "Users can insert their own categories" ON finance_categories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own categories" ON finance_categories;
CREATE POLICY "Users can update their own categories" ON finance_categories
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own categories" ON finance_categories;
CREATE POLICY "Users can delete their own categories" ON finance_categories
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- ACCOUNTS
-- =====================================================

CREATE TYPE finance_account_type AS ENUM (
  'checking', 'savings', 'credit', 'brokerage', 'loan', 'investment',
  '401k', '403b', 'traditional_ira', 'roth_ira', 'sep_ira', 'simple_ira', 'hsa'
);

CREATE TYPE finance_rewards_type AS ENUM ('points', 'miles', 'cashback');

CREATE TABLE IF NOT EXISTS finance_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  institution_id UUID REFERENCES finance_institutions(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  type finance_account_type NOT NULL,
  balance DECIMAL(15, 2) NOT NULL DEFAULT 0,
  liability BOOLEAN DEFAULT FALSE,
  
  -- Credit card specific fields
  credit_limit DECIMAL(15, 2),
  apr DECIMAL(5, 2),
  payment_due_day INTEGER CHECK (payment_due_day >= 1 AND payment_due_day <= 31),
  minimum_payment DECIMAL(15, 2),
  statement_balance DECIMAL(15, 2),
  statement_date DATE,
  
  -- Rewards fields
  annual_fee DECIMAL(10, 2),
  annual_fee_due_date DATE,
  rewards_balance DECIMAL(15, 2),
  rewards_type finance_rewards_type,
  base_rewards_rate DECIMAL(5, 2),
  
  last_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_finance_accounts_user_id ON finance_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_finance_accounts_institution_id ON finance_accounts(institution_id);
CREATE INDEX IF NOT EXISTS idx_finance_accounts_type ON finance_accounts(type);

-- RLS Policies
ALTER TABLE finance_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own accounts" ON finance_accounts;
CREATE POLICY "Users can view their own accounts" ON finance_accounts
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own accounts" ON finance_accounts;
CREATE POLICY "Users can insert their own accounts" ON finance_accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own accounts" ON finance_accounts;
CREATE POLICY "Users can update their own accounts" ON finance_accounts
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own accounts" ON finance_accounts;
CREATE POLICY "Users can delete their own accounts" ON finance_accounts
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- TRANSACTIONS
-- =====================================================

CREATE TYPE finance_txn_type AS ENUM ('debit', 'credit');

CREATE TABLE IF NOT EXISTS finance_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES finance_accounts(id) ON DELETE CASCADE,
  date TIMESTAMPTZ NOT NULL,
  description TEXT NOT NULL,
  category_id UUID REFERENCES finance_categories(id) ON DELETE SET NULL,
  amount DECIMAL(15, 2) NOT NULL,
  type finance_txn_type NOT NULL,
  notes TEXT,

  -- Categorization support
  merchant_name TEXT,
  confidence_score DECIMAL(3, 2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  suggested_category_id UUID REFERENCES finance_categories(id) ON DELETE SET NULL,
  categorization_rule_id UUID,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_finance_transactions_user_id ON finance_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_finance_transactions_account_id ON finance_transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_finance_transactions_category_id ON finance_transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_finance_transactions_date ON finance_transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_finance_transactions_type ON finance_transactions(type);

-- RLS Policies
ALTER TABLE finance_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own transactions" ON finance_transactions;
CREATE POLICY "Users can view their own transactions" ON finance_transactions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own transactions" ON finance_transactions;
CREATE POLICY "Users can insert their own transactions" ON finance_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own transactions" ON finance_transactions;
CREATE POLICY "Users can update their own transactions" ON finance_transactions
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own transactions" ON finance_transactions;
CREATE POLICY "Users can delete their own transactions" ON finance_transactions
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- BUDGETS
-- =====================================================

CREATE TABLE IF NOT EXISTS finance_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES finance_categories(id) ON DELETE CASCADE,
  month TEXT NOT NULL, -- YYYY-MM format
  limit_amount DECIMAL(15, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, category_id, month)
);

CREATE INDEX IF NOT EXISTS idx_finance_budgets_user_id ON finance_budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_finance_budgets_category_id ON finance_budgets(category_id);
CREATE INDEX IF NOT EXISTS idx_finance_budgets_month ON finance_budgets(month);

-- RLS Policies
ALTER TABLE finance_budgets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own budgets" ON finance_budgets;
CREATE POLICY "Users can view their own budgets" ON finance_budgets
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own budgets" ON finance_budgets;
CREATE POLICY "Users can insert their own budgets" ON finance_budgets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own budgets" ON finance_budgets;
CREATE POLICY "Users can update their own budgets" ON finance_budgets
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own budgets" ON finance_budgets;
CREATE POLICY "Users can delete their own budgets" ON finance_budgets
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- BUDGET TEMPLATES
-- =====================================================

CREATE TABLE IF NOT EXISTS finance_budget_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES finance_categories(id) ON DELETE CASCADE,
  default_amount DECIMAL(15, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, category_id)
);

CREATE INDEX IF NOT EXISTS idx_finance_budget_templates_user_id ON finance_budget_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_finance_budget_templates_category_id ON finance_budget_templates(category_id);

-- RLS Policies
ALTER TABLE finance_budget_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own budget templates" ON finance_budget_templates;
CREATE POLICY "Users can view their own budget templates" ON finance_budget_templates
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own budget templates" ON finance_budget_templates;
CREATE POLICY "Users can insert their own budget templates" ON finance_budget_templates
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own budget templates" ON finance_budget_templates;
CREATE POLICY "Users can update their own budget templates" ON finance_budget_templates
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own budget templates" ON finance_budget_templates;
CREATE POLICY "Users can delete their own budget templates" ON finance_budget_templates
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- GOALS
-- =====================================================

CREATE TYPE finance_goal_type AS ENUM ('savings', 'debt');

CREATE TABLE IF NOT EXISTS finance_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_amount DECIMAL(15, 2) NOT NULL,
  current_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
  starting_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
  due_date TIMESTAMPTZ NOT NULL,
  type finance_goal_type NOT NULL,
  linked_category_id UUID REFERENCES finance_categories(id) ON DELETE SET NULL,
  linked_account_id UUID REFERENCES finance_accounts(id) ON DELETE SET NULL,
  track_networth BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_finance_goals_user_id ON finance_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_finance_goals_type ON finance_goals(type);
CREATE INDEX IF NOT EXISTS idx_finance_goals_status ON finance_goals(status);

-- RLS Policies
ALTER TABLE finance_goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own goals" ON finance_goals;
CREATE POLICY "Users can view their own goals" ON finance_goals
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own goals" ON finance_goals;
CREATE POLICY "Users can insert their own goals" ON finance_goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own goals" ON finance_goals;
CREATE POLICY "Users can update their own goals" ON finance_goals
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own goals" ON finance_goals;
CREATE POLICY "Users can delete their own goals" ON finance_goals
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- GOAL PROGRESS
-- =====================================================

CREATE TABLE IF NOT EXISTS finance_goal_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_id UUID NOT NULL REFERENCES finance_goals(id) ON DELETE CASCADE,
  date TIMESTAMPTZ NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_finance_goal_progress_user_id ON finance_goal_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_finance_goal_progress_goal_id ON finance_goal_progress(goal_id);
CREATE INDEX IF NOT EXISTS idx_finance_goal_progress_date ON finance_goal_progress(date DESC);

-- RLS Policies
ALTER TABLE finance_goal_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own goal progress" ON finance_goal_progress;
CREATE POLICY "Users can view their own goal progress" ON finance_goal_progress
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own goal progress" ON finance_goal_progress;
CREATE POLICY "Users can insert their own goal progress" ON finance_goal_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own goal progress" ON finance_goal_progress;
CREATE POLICY "Users can delete their own goal progress" ON finance_goal_progress
  FOR DELETE USING (auth.uid() = user_id);

