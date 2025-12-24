-- =====================================================
-- FINANCE MODULE - RETIREMENT ACCOUNTS
-- =====================================================
-- This migration creates retirement account tracking tables:
-- - retirement_account_metadata
-- - retirement_contributions
-- - retirement_performance

-- =====================================================
-- RETIREMENT ACCOUNT METADATA
-- =====================================================

CREATE TYPE finance_tax_treatment AS ENUM ('pre_tax', 'post_tax', 'tax_exempt');
CREATE TYPE finance_vesting_schedule_type AS ENUM ('immediate', 'cliff', 'graded');
CREATE TYPE finance_employer_match_type AS ENUM ('percentage', 'fixed', 'tiered');
CREATE TYPE finance_contribution_type AS ENUM ('employee', 'employer', 'rollover', 'catch_up');

CREATE TABLE IF NOT EXISTS finance_retirement_account_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES finance_accounts(id) ON DELETE CASCADE,
  
  -- Tax Treatment
  tax_treatment finance_tax_treatment NOT NULL,
  
  -- Contribution Limits
  annual_contribution_limit DECIMAL(15, 2) NOT NULL,
  catch_up_limit DECIMAL(15, 2),
  current_year_contributions DECIMAL(15, 2) NOT NULL DEFAULT 0,
  contribution_year INTEGER NOT NULL,
  
  -- Employer Match
  has_employer_match BOOLEAN NOT NULL DEFAULT FALSE,
  employer_match_percentage DECIMAL(5, 2),
  employer_match_limit DECIMAL(5, 2),
  employer_match_type finance_employer_match_type,
  employer_contributions_ytd DECIMAL(15, 2) NOT NULL DEFAULT 0,
  
  -- Vesting
  has_vesting_schedule BOOLEAN NOT NULL DEFAULT FALSE,
  vesting_schedule_type finance_vesting_schedule_type,
  vesting_cliff_years INTEGER,
  vesting_graded_years INTEGER,
  vesting_percentage DECIMAL(5, 2) NOT NULL DEFAULT 100,
  unvested_balance DECIMAL(15, 2) NOT NULL DEFAULT 0,
  
  -- Investment Allocation (JSONB)
  allocation JSONB,
  
  -- HSA-specific
  is_family_coverage BOOLEAN,
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(user_id, account_id)
);

CREATE INDEX IF NOT EXISTS idx_finance_retirement_metadata_user_id ON finance_retirement_account_metadata(user_id);
CREATE INDEX IF NOT EXISTS idx_finance_retirement_metadata_account_id ON finance_retirement_account_metadata(account_id);

-- RLS Policies
ALTER TABLE finance_retirement_account_metadata ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own retirement metadata" ON finance_retirement_account_metadata;
CREATE POLICY "Users can view their own retirement metadata" ON finance_retirement_account_metadata
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own retirement metadata" ON finance_retirement_account_metadata;
CREATE POLICY "Users can insert their own retirement metadata" ON finance_retirement_account_metadata
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own retirement metadata" ON finance_retirement_account_metadata;
CREATE POLICY "Users can update their own retirement metadata" ON finance_retirement_account_metadata
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own retirement metadata" ON finance_retirement_account_metadata;
CREATE POLICY "Users can delete their own retirement metadata" ON finance_retirement_account_metadata
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- RETIREMENT CONTRIBUTIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS finance_retirement_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  retirement_account_id UUID NOT NULL REFERENCES finance_retirement_account_metadata(id) ON DELETE CASCADE,
  contribution_date DATE NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  contribution_type finance_contribution_type NOT NULL,
  contribution_year INTEGER NOT NULL,
  transaction_id UUID REFERENCES finance_transactions(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_finance_retirement_contributions_user_id ON finance_retirement_contributions(user_id);
CREATE INDEX IF NOT EXISTS idx_finance_retirement_contributions_account_id ON finance_retirement_contributions(retirement_account_id);
CREATE INDEX IF NOT EXISTS idx_finance_retirement_contributions_date ON finance_retirement_contributions(contribution_date DESC);

-- RLS Policies
ALTER TABLE finance_retirement_contributions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own retirement contributions" ON finance_retirement_contributions;
CREATE POLICY "Users can view their own retirement contributions" ON finance_retirement_contributions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own retirement contributions" ON finance_retirement_contributions;
CREATE POLICY "Users can insert their own retirement contributions" ON finance_retirement_contributions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own retirement contributions" ON finance_retirement_contributions;
CREATE POLICY "Users can update their own retirement contributions" ON finance_retirement_contributions
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own retirement contributions" ON finance_retirement_contributions;
CREATE POLICY "Users can delete their own retirement contributions" ON finance_retirement_contributions
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- RETIREMENT PERFORMANCE
-- =====================================================

CREATE TABLE IF NOT EXISTS finance_retirement_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  retirement_account_id UUID NOT NULL REFERENCES finance_retirement_account_metadata(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  balance DECIMAL(15, 2) NOT NULL,
  total_contributions DECIMAL(15, 2) NOT NULL,
  total_gains DECIMAL(15, 2) NOT NULL,
  rate_of_return DECIMAL(5, 2),
  allocation_snapshot JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_finance_retirement_performance_user_id ON finance_retirement_performance(user_id);
CREATE INDEX IF NOT EXISTS idx_finance_retirement_performance_account_id ON finance_retirement_performance(retirement_account_id);
CREATE INDEX IF NOT EXISTS idx_finance_retirement_performance_date ON finance_retirement_performance(snapshot_date DESC);

-- RLS Policies
ALTER TABLE finance_retirement_performance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own retirement performance" ON finance_retirement_performance;
CREATE POLICY "Users can view their own retirement performance" ON finance_retirement_performance
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own retirement performance" ON finance_retirement_performance;
CREATE POLICY "Users can insert their own retirement performance" ON finance_retirement_performance
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own retirement performance" ON finance_retirement_performance;
CREATE POLICY "Users can delete their own retirement performance" ON finance_retirement_performance
  FOR DELETE USING (auth.uid() = user_id);

