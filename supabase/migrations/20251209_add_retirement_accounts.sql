-- ============================================================================
-- Migration: Add Retirement Account Tracking
-- Date: 2024-12-09
-- Description: Adds support for 401k, Roth IRA, HSA and other retirement accounts
--              with contribution limits, employer matching, vesting schedules,
--              investment allocation, and performance tracking.
-- ============================================================================

-- ============================================================================
-- PHASE 1: Extend Account Types
-- ============================================================================

-- Add retirement account types to the accounts table type check constraint
ALTER TABLE accounts DROP CONSTRAINT IF EXISTS accounts_type_check;
ALTER TABLE accounts ADD CONSTRAINT accounts_type_check
  CHECK (type IN (
    'checking', 'savings', 'credit', 'brokerage', 'loan', 'investment',
    '401k', '403b', 'traditional_ira', 'roth_ira', 'sep_ira', 'simple_ira', 'hsa'
  ));

-- ============================================================================
-- PHASE 2: Retirement Account Metadata Table
-- ============================================================================

-- Create retirement_accounts table for retirement-specific metadata
CREATE TABLE IF NOT EXISTS retirement_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,

  -- Tax Treatment
  tax_treatment TEXT CHECK (tax_treatment IN ('pre_tax', 'post_tax', 'tax_exempt')) NOT NULL,

  -- Contribution Limits (2024 values, will need annual updates)
  annual_contribution_limit NUMERIC NOT NULL, -- e.g., 23000 for 401k, 7000 for IRA
  catch_up_limit NUMERIC, -- Additional for age 50+ (e.g., 7500 for 401k, 1000 for IRA)
  current_year_contributions NUMERIC NOT NULL DEFAULT 0,
  contribution_year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),

  -- Employer Match (for 401k/403b)
  has_employer_match BOOLEAN NOT NULL DEFAULT false,
  employer_match_percentage NUMERIC, -- e.g., 100 for 100% match
  employer_match_limit NUMERIC, -- e.g., 6 for match up to 6% of salary
  employer_match_type TEXT CHECK (employer_match_type IN ('percentage', 'fixed', 'tiered')),
  employer_contributions_ytd NUMERIC NOT NULL DEFAULT 0,

  -- Vesting
  has_vesting_schedule BOOLEAN NOT NULL DEFAULT false,
  vesting_schedule_type TEXT CHECK (vesting_schedule_type IN ('immediate', 'cliff', 'graded')),
  vesting_cliff_years NUMERIC, -- e.g., 3 for 3-year cliff
  vesting_graded_years NUMERIC, -- e.g., 5 for 5-year graded
  vesting_percentage NUMERIC NOT NULL DEFAULT 100, -- Current vested percentage
  unvested_balance NUMERIC NOT NULL DEFAULT 0,

  -- Investment Allocation (stored as JSONB for flexibility)
  allocation JSONB, -- e.g., {"stocks": 60, "bonds": 30, "cash": 10}

  -- HSA-specific
  is_family_coverage BOOLEAN, -- For HSA family vs individual limits

  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_account_retirement UNIQUE (account_id)
);

-- ============================================================================
-- PHASE 3: Contribution History Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS retirement_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  retirement_account_id UUID NOT NULL REFERENCES retirement_accounts(id) ON DELETE CASCADE,

  contribution_date DATE NOT NULL,
  amount NUMERIC NOT NULL,
  contribution_type TEXT CHECK (contribution_type IN ('employee', 'employer', 'rollover', 'catch_up')) NOT NULL,
  contribution_year INTEGER NOT NULL,

  -- Link to transaction if tracked
  transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,

  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- PHASE 4: Investment Performance Tracking Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS retirement_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  retirement_account_id UUID NOT NULL REFERENCES retirement_accounts(id) ON DELETE CASCADE,

  snapshot_date DATE NOT NULL,
  balance NUMERIC NOT NULL,
  total_contributions NUMERIC NOT NULL,
  total_gains NUMERIC NOT NULL, -- balance - total_contributions
  rate_of_return NUMERIC, -- Annualized return percentage

  -- Optional: breakdown by allocation
  allocation_snapshot JSONB,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_retirement_performance UNIQUE (retirement_account_id, snapshot_date)
);

-- ============================================================================
-- PHASE 5: Row Level Security
-- ============================================================================

ALTER TABLE retirement_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE retirement_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE retirement_performance ENABLE ROW LEVEL SECURITY;

-- Retirement accounts policies
CREATE POLICY "own_retirement_accounts_select" ON retirement_accounts
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own_retirement_accounts_crud" ON retirement_accounts
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Contributions policies
CREATE POLICY "own_retirement_contributions_select" ON retirement_contributions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own_retirement_contributions_crud" ON retirement_contributions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Performance policies
CREATE POLICY "own_retirement_performance_select" ON retirement_performance
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own_retirement_performance_crud" ON retirement_performance
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- PHASE 6: Indexes for Performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_retirement_accounts_user ON retirement_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_retirement_accounts_account ON retirement_accounts(account_id);
CREATE INDEX IF NOT EXISTS idx_retirement_contributions_account ON retirement_contributions(retirement_account_id, contribution_date DESC);
CREATE INDEX IF NOT EXISTS idx_retirement_performance_account ON retirement_performance(retirement_account_id, snapshot_date DESC);

-- ============================================================================
-- PHASE 7: Helper Functions
-- ============================================================================

-- Function to calculate remaining contribution room
CREATE OR REPLACE FUNCTION calculate_contribution_room(p_retirement_account_id UUID, p_annual_income NUMERIC)
RETURNS TABLE (
  employee_room NUMERIC,
  employer_room NUMERIC,
  total_limit NUMERIC,
  is_over_50 BOOLEAN
) AS $$
DECLARE
  v_account RECORD;
  v_age INTEGER;
BEGIN
  SELECT * INTO v_account FROM retirement_accounts WHERE id = p_retirement_account_id;

  -- Calculate age (simplified - would need user birthdate)
  v_age := 30; -- Placeholder

  RETURN QUERY
  SELECT
    GREATEST(0, v_account.annual_contribution_limit - v_account.current_year_contributions)::NUMERIC,
    CASE
      WHEN v_account.has_employer_match THEN
        GREATEST(0, (p_annual_income * v_account.employer_match_limit / 100) - v_account.employer_contributions_ytd)::NUMERIC
      ELSE 0::NUMERIC
    END,
    (v_account.annual_contribution_limit + COALESCE(v_account.catch_up_limit, 0))::NUMERIC,
    v_age >= 50;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate vested balance
CREATE OR REPLACE FUNCTION calculate_vested_balance(p_retirement_account_id UUID, p_employment_years NUMERIC)
RETURNS NUMERIC AS $$
DECLARE
  v_account RECORD;
  v_vesting_pct NUMERIC;
BEGIN
  SELECT * INTO v_account FROM retirement_accounts WHERE id = p_retirement_account_id;

  IF NOT v_account.has_vesting_schedule THEN
    RETURN 0; -- No unvested balance
  END IF;

  -- Calculate vesting percentage based on schedule type
  IF v_account.vesting_schedule_type = 'immediate' THEN
    v_vesting_pct := 100;
  ELSIF v_account.vesting_schedule_type = 'cliff' THEN
    v_vesting_pct := CASE WHEN p_employment_years >= v_account.vesting_cliff_years THEN 100 ELSE 0 END;
  ELSIF v_account.vesting_schedule_type = 'graded' THEN
    -- Standard 5-year graded: 20% per year
    v_vesting_pct := LEAST(100, (p_employment_years / v_account.vesting_graded_years) * 100);
  END IF;

  RETURN (v_account.unvested_balance * v_vesting_pct / 100);
END;
$$ LANGUAGE plpgsql;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_retirement_accounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER retirement_accounts_updated_at_trigger
  BEFORE UPDATE ON retirement_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_retirement_accounts_updated_at();

-- ============================================================================
-- PHASE 8: View with Calculated Fields
-- ============================================================================

CREATE OR REPLACE VIEW retirement_accounts_with_stats AS
SELECT
  ra.*,
  a.name as account_name,
  a.balance as account_balance,

  -- Contribution calculations
  (ra.annual_contribution_limit - ra.current_year_contributions) as remaining_employee_room,
  (ra.current_year_contributions + ra.employer_contributions_ytd) as total_ytd_contributions,

  -- Vesting calculations
  (a.balance - ra.unvested_balance) as vested_balance,

  -- Performance metrics from latest snapshot
  (SELECT total_gains FROM retirement_performance
   WHERE retirement_account_id = ra.id
   ORDER BY snapshot_date DESC LIMIT 1) as latest_gains,
  (SELECT rate_of_return FROM retirement_performance
   WHERE retirement_account_id = ra.id
   ORDER BY snapshot_date DESC LIMIT 1) as latest_return_rate

FROM retirement_accounts ra
JOIN accounts a ON ra.account_id = a.id;

-- Grant access to authenticated users
GRANT SELECT ON retirement_accounts_with_stats TO authenticated;
ALTER VIEW retirement_accounts_with_stats SET (security_invoker = true);

-- ============================================================================
-- PHASE 9: Documentation
-- ============================================================================

COMMENT ON TABLE retirement_accounts IS '
Retirement account metadata with contribution limits, employer match, and vesting.
2024 Contribution Limits:
- 401(k)/403(b): $23,000 ($30,500 with catch-up)
- Traditional/Roth IRA: $7,000 ($8,000 with catch-up)
- HSA Individual: $4,150 ($5,150 with catch-up)
- HSA Family: $8,300 ($9,300 with catch-up)
- SEP IRA: $69,000 or 25% of compensation
- SIMPLE IRA: $16,000 ($19,500 with catch-up)
';

COMMENT ON TABLE retirement_contributions IS 'Historical record of all contributions to retirement accounts';
COMMENT ON TABLE retirement_performance IS 'Periodic snapshots of retirement account balances and performance metrics';
COMMENT ON VIEW retirement_accounts_with_stats IS 'Retirement accounts with joined account data and calculated statistics';
