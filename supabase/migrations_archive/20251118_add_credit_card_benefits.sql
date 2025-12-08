-- Migration: Add Credit Card Benefits and Rewards Tracking
-- Inspired by CardPointers and MaxRewards features

-- Add benefits fields to accounts table
ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS annual_fee numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS annual_fee_due_date date,
  ADD COLUMN IF NOT EXISTS rewards_balance numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rewards_type text, -- 'points', 'miles', 'cashback'
  ADD COLUMN IF NOT EXISTS base_rewards_rate numeric DEFAULT 0; -- Base earning rate (e.g., 1.0 for 1%)

-- Add check constraint for rewards_type
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'rewards_type_check'
  ) THEN
    ALTER TABLE accounts
      ADD CONSTRAINT rewards_type_check
      CHECK (rewards_type IS NULL OR rewards_type IN ('points', 'miles', 'cashback'));
  END IF;
END $$;

-- Create card benefits table for tracking all perks and credits
CREATE TABLE IF NOT EXISTS card_benefits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  benefit_type text NOT NULL, -- 'recurring_credit', 'travel_credit', 'protection', 'lounge_access', 'other'
  name text NOT NULL,
  description text,
  value numeric, -- Dollar value if applicable
  frequency text, -- 'annual', 'monthly', 'quarterly', 'once', 'per_use'
  used_amount numeric DEFAULT 0, -- How much has been used
  reset_date date, -- When the benefit resets
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create category bonuses table for tracking earning rates by category
CREATE TABLE IF NOT EXISTS card_category_bonuses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  category text NOT NULL, -- 'dining', 'travel', 'groceries', 'gas', 'online', 'all_other'
  rewards_rate numeric NOT NULL, -- e.g., 3.0 for 3x points
  is_rotating boolean DEFAULT false, -- For quarterly rotating categories
  start_date date,
  end_date date,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create welcome bonuses table
CREATE TABLE IF NOT EXISTS card_welcome_bonuses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  bonus_amount numeric NOT NULL, -- Points/miles/cashback amount
  required_spend numeric NOT NULL, -- Minimum spend requirement
  current_spend numeric DEFAULT 0, -- Current progress
  deadline date NOT NULL, -- When you need to meet the requirement
  completed boolean DEFAULT false,
  completed_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create card offers table (like Amex Offers, Chase Offers)
CREATE TABLE IF NOT EXISTS card_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  merchant text NOT NULL,
  offer_type text NOT NULL, -- 'cashback', 'statement_credit', 'bonus_points'
  offer_amount numeric NOT NULL,
  required_spend numeric,
  expiration_date date,
  activated boolean DEFAULT false,
  activated_date date,
  redeemed boolean DEFAULT false,
  redeemed_date date,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Add RLS policies
ALTER TABLE card_benefits ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_category_bonuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_welcome_bonuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_benefits_crud" ON card_benefits
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "own_category_bonuses_crud" ON card_category_bonuses
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "own_welcome_bonuses_crud" ON card_welcome_bonuses
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "own_offers_crud" ON card_offers
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_card_benefits_account ON card_benefits(account_id, active);
CREATE INDEX IF NOT EXISTS idx_category_bonuses_account ON card_category_bonuses(account_id);
CREATE INDEX IF NOT EXISTS idx_welcome_bonuses_account ON card_welcome_bonuses(account_id, completed);
CREATE INDEX IF NOT EXISTS idx_offers_account ON card_offers(account_id, activated, redeemed);
CREATE INDEX IF NOT EXISTS idx_offers_expiration ON card_offers(user_id, expiration_date) WHERE redeemed = false;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_card_benefits_updated_at BEFORE UPDATE ON card_benefits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_welcome_bonuses_updated_at BEFORE UPDATE ON card_welcome_bonuses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
