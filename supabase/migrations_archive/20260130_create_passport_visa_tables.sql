-- Migration: Create User Passports and Visas Tables
-- This creates tables for tracking user passports and visas for travel requirements

-- ==================== Create user_passports Table ====================

CREATE TABLE IF NOT EXISTS user_passports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  country_code TEXT NOT NULL,
  country_name TEXT NOT NULL,
  passport_number TEXT,
  issue_date DATE,
  expiry_date DATE,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT user_passports_country_code_check CHECK (length(country_code) = 2),
  CONSTRAINT user_passports_dates_check CHECK (expiry_date IS NULL OR issue_date IS NULL OR expiry_date > issue_date)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_passports_user_id ON user_passports(user_id);
CREATE INDEX IF NOT EXISTS idx_user_passports_is_primary ON user_passports(user_id, is_primary) WHERE is_primary = true;

-- ==================== Create user_visas Table ====================

CREATE TABLE IF NOT EXISTS user_visas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  country_code TEXT NOT NULL,
  country_name TEXT NOT NULL,
  visa_type TEXT NOT NULL,
  issue_date DATE,
  expiry_date DATE NOT NULL,
  multiple_entry BOOLEAN NOT NULL DEFAULT false,
  max_stay_days INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT user_visas_country_code_check CHECK (length(country_code) = 2),
  CONSTRAINT user_visas_dates_check CHECK (expiry_date > issue_date),
  CONSTRAINT user_visas_max_stay_check CHECK (max_stay_days IS NULL OR max_stay_days > 0)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_visas_user_id ON user_visas(user_id);
CREATE INDEX IF NOT EXISTS idx_user_visas_expiry_date ON user_visas(user_id, expiry_date);

-- ==================== Enable RLS ====================

ALTER TABLE user_passports ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_visas ENABLE ROW LEVEL SECURITY;

-- ==================== RLS Policies for user_passports ====================

-- Users can view their own passports
CREATE POLICY "Users can view own passports"
  ON user_passports
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own passports
CREATE POLICY "Users can insert own passports"
  ON user_passports
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own passports
CREATE POLICY "Users can update own passports"
  ON user_passports
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own passports
CREATE POLICY "Users can delete own passports"
  ON user_passports
  FOR DELETE
  USING (auth.uid() = user_id);

-- ==================== RLS Policies for user_visas ====================

-- Users can view their own visas
CREATE POLICY "Users can view own visas"
  ON user_visas
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own visas
CREATE POLICY "Users can insert own visas"
  ON user_visas
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own visas
CREATE POLICY "Users can update own visas"
  ON user_visas
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own visas
CREATE POLICY "Users can delete own visas"
  ON user_visas
  FOR DELETE
  USING (auth.uid() = user_id);

-- ==================== Triggers for updated_at ====================

-- Create trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for user_passports
DROP TRIGGER IF EXISTS trigger_user_passports_updated_at ON user_passports;
CREATE TRIGGER trigger_user_passports_updated_at
  BEFORE UPDATE ON user_passports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for user_visas
DROP TRIGGER IF EXISTS trigger_user_visas_updated_at ON user_visas;
CREATE TRIGGER trigger_user_visas_updated_at
  BEFORE UPDATE ON user_visas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ==================== Comments ====================

COMMENT ON TABLE user_passports IS 'Stores user passport information for travel requirements calculation';
COMMENT ON TABLE user_visas IS 'Stores user visa information for tracking travel access';
COMMENT ON COLUMN user_passports.is_primary IS 'Indicates the primary passport used for travel calculations';
COMMENT ON COLUMN user_visas.multiple_entry IS 'Whether the visa allows multiple entries';
COMMENT ON COLUMN user_visas.max_stay_days IS 'Maximum number of days allowed per stay';

