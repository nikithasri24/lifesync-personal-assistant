-- Migration tracking table
-- Tracks which data migrations have been completed for each user

CREATE TABLE IF NOT EXISTS migration_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  migration_name TEXT NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  migrated_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Ensure each migration runs only once per user
  UNIQUE(user_id, migration_name)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_migration_tracking_user_id
  ON migration_tracking(user_id);

-- Enable RLS
ALTER TABLE migration_tracking ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own migration records
CREATE POLICY "Users can view own migrations"
  ON migration_tracking
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own migration records
CREATE POLICY "Users can insert own migrations"
  ON migration_tracking
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Comment
COMMENT ON TABLE migration_tracking IS 'Tracks completion status of one-time data migrations for each user';
