-- Migration: Add goals and dreams tables with Supabase persistence
-- Purpose: Migrate goals and dreams from localStorage to database for cross-device sync
-- Date: 2025-11-19

-- Create goals table
CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  target_date DATE,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived', 'on_hold')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create dreams table
CREATE TABLE IF NOT EXISTS dreams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS goals_user_id_created_at_idx ON goals(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS goals_user_id_status_idx ON goals(user_id, status);
CREATE INDEX IF NOT EXISTS goals_user_id_target_date_idx ON goals(user_id, target_date) WHERE target_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS goals_category_idx ON goals(user_id, category) WHERE category IS NOT NULL;

CREATE INDEX IF NOT EXISTS dreams_user_id_created_at_idx ON dreams(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS dreams_user_id_last_updated_idx ON dreams(user_id, last_updated DESC);
CREATE INDEX IF NOT EXISTS dreams_category_idx ON dreams(user_id, category) WHERE category IS NOT NULL;

-- Enable Row Level Security
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE dreams ENABLE ROW LEVEL SECURITY;

-- RLS Policies for goals: Users can only access their own goals
CREATE POLICY "Users can view their own goals"
  ON goals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own goals"
  ON goals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goals"
  ON goals FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own goals"
  ON goals FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for dreams: Users can only access their own dreams
CREATE POLICY "Users can view their own dreams"
  ON dreams FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own dreams"
  ON dreams FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own dreams"
  ON dreams FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own dreams"
  ON dreams FOR DELETE
  USING (auth.uid() = user_id);

-- Auto-update updated_at timestamp for goals
CREATE OR REPLACE FUNCTION update_goals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER goals_updated_at_trigger
  BEFORE UPDATE ON goals
  FOR EACH ROW
  EXECUTE FUNCTION update_goals_updated_at();

-- Auto-update last_updated timestamp for dreams
CREATE OR REPLACE FUNCTION update_dreams_last_updated()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER dreams_last_updated_trigger
  BEFORE UPDATE ON dreams
  FOR EACH ROW
  EXECUTE FUNCTION update_dreams_last_updated();

-- Add helpful comments
COMMENT ON TABLE goals IS 'User goals with progress tracking and target dates';
COMMENT ON COLUMN goals.user_id IS 'Foreign key to auth.users - owner of the goal';
COMMENT ON COLUMN goals.progress IS 'Percentage completion (0-100)';
COMMENT ON COLUMN goals.status IS 'Current status: active, completed, archived, on_hold';
COMMENT ON COLUMN goals.priority IS 'Priority level: low, medium, high';

COMMENT ON TABLE dreams IS 'User dreams and aspirations for long-term planning';
COMMENT ON COLUMN dreams.user_id IS 'Foreign key to auth.users - owner of the dream';
COMMENT ON COLUMN dreams.last_updated IS 'Last time the dream was modified';
