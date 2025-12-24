-- =====================================================
-- FINANCE MODULE - CREDIT CARD FEATURES
-- =====================================================
-- This migration creates credit card specific tables:
-- - card_benefits
-- - card_category_bonuses
-- - welcome_bonuses
-- - card_offers
-- - rewards_history
-- - credit_card_statements

-- =====================================================
-- CARD BENEFITS
-- =====================================================

CREATE TYPE finance_benefit_type AS ENUM ('recurring_credit', 'travel_credit', 'protection', 'lounge_access', 'other');
CREATE TYPE finance_benefit_frequency AS ENUM ('annual', 'monthly', 'quarterly', 'once', 'per_use');

CREATE TABLE IF NOT EXISTS finance_card_benefits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES finance_accounts(id) ON DELETE CASCADE,
  benefit_type finance_benefit_type NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  value DECIMAL(10, 2),
  frequency finance_benefit_frequency,
  used_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  reset_date DATE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_finance_card_benefits_user_id ON finance_card_benefits(user_id);
CREATE INDEX IF NOT EXISTS idx_finance_card_benefits_account_id ON finance_card_benefits(account_id);

-- RLS Policies
ALTER TABLE finance_card_benefits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own card benefits" ON finance_card_benefits;
CREATE POLICY "Users can view their own card benefits" ON finance_card_benefits
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own card benefits" ON finance_card_benefits;
CREATE POLICY "Users can insert their own card benefits" ON finance_card_benefits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own card benefits" ON finance_card_benefits;
CREATE POLICY "Users can update their own card benefits" ON finance_card_benefits
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own card benefits" ON finance_card_benefits;
CREATE POLICY "Users can delete their own card benefits" ON finance_card_benefits
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- CARD CATEGORY BONUSES
-- =====================================================

CREATE TYPE finance_spending_category AS ENUM ('dining', 'travel', 'groceries', 'gas', 'online', 'all_other');

CREATE TABLE IF NOT EXISTS finance_card_category_bonuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES finance_accounts(id) ON DELETE CASCADE,
  category finance_spending_category NOT NULL,
  rewards_rate DECIMAL(5, 2) NOT NULL,
  is_rotating BOOLEAN NOT NULL DEFAULT FALSE,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_finance_card_category_bonuses_user_id ON finance_card_category_bonuses(user_id);
CREATE INDEX IF NOT EXISTS idx_finance_card_category_bonuses_account_id ON finance_card_category_bonuses(account_id);

-- RLS Policies
ALTER TABLE finance_card_category_bonuses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own category bonuses" ON finance_card_category_bonuses;
CREATE POLICY "Users can view their own category bonuses" ON finance_card_category_bonuses
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own category bonuses" ON finance_card_category_bonuses;
CREATE POLICY "Users can insert their own category bonuses" ON finance_card_category_bonuses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own category bonuses" ON finance_card_category_bonuses;
CREATE POLICY "Users can update their own category bonuses" ON finance_card_category_bonuses
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own category bonuses" ON finance_card_category_bonuses;
CREATE POLICY "Users can delete their own category bonuses" ON finance_card_category_bonuses
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- WELCOME BONUSES
-- =====================================================

CREATE TABLE IF NOT EXISTS finance_welcome_bonuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES finance_accounts(id) ON DELETE CASCADE,
  bonus_amount DECIMAL(15, 2) NOT NULL,
  required_spend DECIMAL(15, 2) NOT NULL,
  current_spend DECIMAL(15, 2) NOT NULL DEFAULT 0,
  deadline DATE NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_finance_welcome_bonuses_user_id ON finance_welcome_bonuses(user_id);
CREATE INDEX IF NOT EXISTS idx_finance_welcome_bonuses_account_id ON finance_welcome_bonuses(account_id);

-- RLS Policies
ALTER TABLE finance_welcome_bonuses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own welcome bonuses" ON finance_welcome_bonuses;
CREATE POLICY "Users can view their own welcome bonuses" ON finance_welcome_bonuses
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own welcome bonuses" ON finance_welcome_bonuses;
CREATE POLICY "Users can insert their own welcome bonuses" ON finance_welcome_bonuses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own welcome bonuses" ON finance_welcome_bonuses;
CREATE POLICY "Users can update their own welcome bonuses" ON finance_welcome_bonuses
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own welcome bonuses" ON finance_welcome_bonuses;
CREATE POLICY "Users can delete their own welcome bonuses" ON finance_welcome_bonuses
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- CARD OFFERS
-- =====================================================

CREATE TYPE finance_offer_type AS ENUM ('cashback', 'statement_credit', 'bonus_points');

CREATE TABLE IF NOT EXISTS finance_card_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES finance_accounts(id) ON DELETE CASCADE,
  merchant TEXT NOT NULL,
  offer_type finance_offer_type NOT NULL,
  offer_amount DECIMAL(10, 2) NOT NULL,
  required_spend DECIMAL(10, 2),
  expiration_date DATE,
  activated BOOLEAN NOT NULL DEFAULT FALSE,
  activated_date DATE,
  redeemed BOOLEAN NOT NULL DEFAULT FALSE,
  redeemed_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_finance_card_offers_user_id ON finance_card_offers(user_id);
CREATE INDEX IF NOT EXISTS idx_finance_card_offers_account_id ON finance_card_offers(account_id);

-- RLS Policies
ALTER TABLE finance_card_offers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own card offers" ON finance_card_offers;
CREATE POLICY "Users can view their own card offers" ON finance_card_offers
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own card offers" ON finance_card_offers;
CREATE POLICY "Users can insert their own card offers" ON finance_card_offers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own card offers" ON finance_card_offers;
CREATE POLICY "Users can update their own card offers" ON finance_card_offers
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own card offers" ON finance_card_offers;
CREATE POLICY "Users can delete their own card offers" ON finance_card_offers
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- REWARDS HISTORY
-- =====================================================

CREATE TABLE IF NOT EXISTS finance_rewards_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES finance_accounts(id) ON DELETE CASCADE,
  date TIMESTAMPTZ NOT NULL,
  points_earned DECIMAL(15, 2) NOT NULL DEFAULT 0,
  points_redeemed DECIMAL(15, 2) NOT NULL DEFAULT 0,
  balance DECIMAL(15, 2) NOT NULL,
  description TEXT,
  transaction_id UUID REFERENCES finance_transactions(id) ON DELETE SET NULL,
  category TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_finance_rewards_history_user_id ON finance_rewards_history(user_id);
CREATE INDEX IF NOT EXISTS idx_finance_rewards_history_account_id ON finance_rewards_history(account_id);
CREATE INDEX IF NOT EXISTS idx_finance_rewards_history_date ON finance_rewards_history(date DESC);

-- RLS Policies
ALTER TABLE finance_rewards_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own rewards history" ON finance_rewards_history;
CREATE POLICY "Users can view their own rewards history" ON finance_rewards_history
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own rewards history" ON finance_rewards_history;
CREATE POLICY "Users can insert their own rewards history" ON finance_rewards_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own rewards history" ON finance_rewards_history;
CREATE POLICY "Users can delete their own rewards history" ON finance_rewards_history
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- CREDIT CARD STATEMENTS
-- =====================================================

CREATE TABLE IF NOT EXISTS finance_credit_card_statements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES finance_accounts(id) ON DELETE CASCADE,
  statement_date DATE NOT NULL,
  due_date DATE NOT NULL,
  balance DECIMAL(15, 2) NOT NULL,
  minimum_payment DECIMAL(15, 2) NOT NULL,
  apr DECIMAL(5, 2),
  paid BOOLEAN NOT NULL DEFAULT FALSE,
  paid_amount DECIMAL(15, 2),
  paid_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_finance_credit_card_statements_user_id ON finance_credit_card_statements(user_id);
CREATE INDEX IF NOT EXISTS idx_finance_credit_card_statements_account_id ON finance_credit_card_statements(account_id);
CREATE INDEX IF NOT EXISTS idx_finance_credit_card_statements_statement_date ON finance_credit_card_statements(statement_date DESC);

-- RLS Policies
ALTER TABLE finance_credit_card_statements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own statements" ON finance_credit_card_statements;
CREATE POLICY "Users can view their own statements" ON finance_credit_card_statements
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own statements" ON finance_credit_card_statements;
CREATE POLICY "Users can insert their own statements" ON finance_credit_card_statements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own statements" ON finance_credit_card_statements;
CREATE POLICY "Users can update their own statements" ON finance_credit_card_statements
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own statements" ON finance_credit_card_statements;
CREATE POLICY "Users can delete their own statements" ON finance_credit_card_statements
  FOR DELETE USING (auth.uid() = user_id);

