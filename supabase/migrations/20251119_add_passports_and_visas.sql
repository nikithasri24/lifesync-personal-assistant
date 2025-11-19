-- Add tables for storing user passports and visas

-- User Passports Table
CREATE TABLE IF NOT EXISTS user_passports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  country_code VARCHAR(2) NOT NULL,
  country_name VARCHAR(255) NOT NULL,
  passport_number VARCHAR(50), -- Optional, encrypted in application layer
  issue_date DATE,
  expiry_date DATE,
  is_primary BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_passport UNIQUE (user_id, country_code)
);

-- User Visas Table
CREATE TABLE IF NOT EXISTS user_visas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  country_code VARCHAR(2) NOT NULL,
  country_name VARCHAR(255) NOT NULL,
  visa_type VARCHAR(100), -- Tourist, Business, H1B, Student, etc.
  issue_date DATE,
  expiry_date DATE NOT NULL,
  multiple_entry BOOLEAN DEFAULT true,
  max_stay_days INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_user_passports_user_id ON user_passports(user_id);
CREATE INDEX IF NOT EXISTS idx_user_passports_is_primary ON user_passports(user_id, is_primary);
CREATE INDEX IF NOT EXISTS idx_user_visas_user_id ON user_visas(user_id);
CREATE INDEX IF NOT EXISTS idx_user_visas_expiry ON user_visas(user_id, expiry_date);

-- Row Level Security (RLS)
ALTER TABLE user_passports ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_visas ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_passports
CREATE POLICY "Users can view their own passports"
  ON user_passports FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own passports"
  ON user_passports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own passports"
  ON user_passports FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own passports"
  ON user_passports FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for user_visas
CREATE POLICY "Users can view their own visas"
  ON user_visas FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own visas"
  ON user_visas FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own visas"
  ON user_visas FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own visas"
  ON user_visas FOR DELETE
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_user_passports_updated_at
  BEFORE UPDATE ON user_passports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_visas_updated_at
  BEFORE UPDATE ON user_visas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
