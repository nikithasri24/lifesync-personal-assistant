-- Migration: Add Insurance Tracking
-- Tracks insurance policies, premiums, coverage, and renewals

-- Create insurance policies table
CREATE TABLE IF NOT EXISTS insurance_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,

  -- Basic policy information
  policy_name text NOT NULL,
  policy_number text,
  provider text NOT NULL,
  type text NOT NULL, -- 'health', 'auto', 'home', 'life', 'disability', 'umbrella', 'pet', 'travel', 'other'
  status text NOT NULL DEFAULT 'active', -- 'active', 'expired', 'cancelled', 'pending'

  -- Coverage details
  coverage_amount numeric,
  deductible numeric,

  -- Premium information
  premium_amount numeric NOT NULL,
  premium_frequency text NOT NULL, -- 'monthly', 'quarterly', 'semi-annual', 'annual'

  -- Dates
  start_date date NOT NULL,
  end_date date,
  renewal_date date,
  next_payment_date date,

  -- Contact information
  agent_name text,
  agent_phone text,
  agent_email text,

  -- Additional details
  notes text,
  documents jsonb, -- Array of document references

  -- Auto-renew settings
  auto_renew boolean DEFAULT false,
  renewal_reminder_days integer DEFAULT 30,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create insurance claims table
CREATE TABLE IF NOT EXISTS insurance_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  policy_id uuid NOT NULL REFERENCES insurance_policies(id) ON DELETE CASCADE,

  -- Claim information
  claim_number text,
  claim_type text NOT NULL, -- 'accident', 'illness', 'property_damage', 'theft', 'natural_disaster', 'other'
  claim_date date NOT NULL,
  incident_date date NOT NULL,

  -- Amount details
  claim_amount numeric NOT NULL,
  approved_amount numeric,
  paid_amount numeric,
  deductible_paid numeric,

  -- Status tracking
  status text NOT NULL DEFAULT 'filed', -- 'filed', 'under_review', 'approved', 'denied', 'paid', 'closed'

  -- Description
  description text NOT NULL,
  notes text,

  -- Contact
  adjuster_name text,
  adjuster_phone text,
  adjuster_email text,

  -- Dates
  filed_date date,
  approved_date date,
  paid_date date,
  closed_date date,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create insurance beneficiaries table
CREATE TABLE IF NOT EXISTS insurance_beneficiaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  policy_id uuid NOT NULL REFERENCES insurance_policies(id) ON DELETE CASCADE,

  -- Beneficiary information
  name text NOT NULL,
  relationship text NOT NULL,
  beneficiary_type text NOT NULL, -- 'primary', 'contingent'
  percentage numeric NOT NULL, -- Percentage of benefit

  -- Contact information
  phone text,
  email text,
  address text,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create insurance premium payments table
CREATE TABLE IF NOT EXISTS insurance_premium_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  policy_id uuid NOT NULL REFERENCES insurance_policies(id) ON DELETE CASCADE,

  -- Payment details
  payment_date date NOT NULL,
  amount numeric NOT NULL,
  payment_method text, -- 'auto_debit', 'credit_card', 'check', 'cash', 'other'

  -- Period covered
  coverage_period_start date,
  coverage_period_end date,

  -- Status
  status text NOT NULL DEFAULT 'completed', -- 'pending', 'completed', 'failed', 'refunded'

  -- Reference
  transaction_id uuid, -- Link to finance transactions if applicable
  confirmation_number text,

  notes text,

  created_at timestamptz NOT NULL DEFAULT now()
);

-- Add RLS policies
ALTER TABLE insurance_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_beneficiaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_premium_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_policies_crud" ON insurance_policies
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "own_claims_crud" ON insurance_claims
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "own_beneficiaries_crud" ON insurance_beneficiaries
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "own_premium_payments_crud" ON insurance_premium_payments
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_policies_user_status
  ON insurance_policies(user_id, status);

CREATE INDEX IF NOT EXISTS idx_policies_renewal_date
  ON insurance_policies(user_id, renewal_date)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_policies_type
  ON insurance_policies(user_id, type, status);

CREATE INDEX IF NOT EXISTS idx_claims_policy
  ON insurance_claims(policy_id, status);

CREATE INDEX IF NOT EXISTS idx_claims_status
  ON insurance_claims(user_id, status);

CREATE INDEX IF NOT EXISTS idx_beneficiaries_policy
  ON insurance_beneficiaries(policy_id);

CREATE INDEX IF NOT EXISTS idx_premium_payments_policy
  ON insurance_premium_payments(policy_id, payment_date DESC);

-- Create triggers for updated_at
CREATE TRIGGER update_insurance_policies_updated_at BEFORE UPDATE ON insurance_policies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_insurance_claims_updated_at BEFORE UPDATE ON insurance_claims
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_insurance_beneficiaries_updated_at BEFORE UPDATE ON insurance_beneficiaries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create view for policy summary
CREATE OR REPLACE VIEW insurance_policy_summary AS
SELECT
  p.*,
  COUNT(DISTINCT c.id) as claim_count,
  SUM(CASE WHEN c.status = 'paid' THEN c.paid_amount ELSE 0 END) as total_claims_paid,
  COUNT(DISTINCT b.id) as beneficiary_count,
  (
    SELECT pp.payment_date
    FROM insurance_premium_payments pp
    WHERE pp.policy_id = p.id
    ORDER BY pp.payment_date DESC
    LIMIT 1
  ) as last_payment_date
FROM insurance_policies p
LEFT JOIN insurance_claims c ON c.policy_id = p.id
LEFT JOIN insurance_beneficiaries b ON b.policy_id = p.id
GROUP BY p.id;

-- Add check constraints
ALTER TABLE insurance_policies
  ADD CONSTRAINT policy_type_check
  CHECK (type IN ('health', 'auto', 'home', 'life', 'disability', 'umbrella', 'pet', 'travel', 'other'));

ALTER TABLE insurance_policies
  ADD CONSTRAINT policy_status_check
  CHECK (status IN ('active', 'expired', 'cancelled', 'pending'));

ALTER TABLE insurance_policies
  ADD CONSTRAINT premium_frequency_check
  CHECK (premium_frequency IN ('monthly', 'quarterly', 'semi-annual', 'annual'));

ALTER TABLE insurance_claims
  ADD CONSTRAINT claim_status_check
  CHECK (status IN ('filed', 'under_review', 'approved', 'denied', 'paid', 'closed'));

ALTER TABLE insurance_beneficiaries
  ADD CONSTRAINT beneficiary_type_check
  CHECK (beneficiary_type IN ('primary', 'contingent'));

ALTER TABLE insurance_premium_payments
  ADD CONSTRAINT payment_status_check
  CHECK (status IN ('pending', 'completed', 'failed', 'refunded'));
