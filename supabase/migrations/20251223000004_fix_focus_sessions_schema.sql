-- Fix Focus Sessions Schema
-- Migration created: 2025-12-23
-- Purpose: Add missing columns and rename columns to match API expectations
-- Fixes: 400 Bad Request error due to column name mismatches

-- Add user_id column if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'focus_sessions' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE focus_sessions ADD COLUMN user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE;
    RAISE NOTICE 'Added user_id column';
  END IF;
END $$;

-- Rename start_time to started_at if needed
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'focus_sessions' AND column_name = 'start_time'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'focus_sessions' AND column_name = 'started_at'
  ) THEN
    ALTER TABLE focus_sessions RENAME COLUMN start_time TO started_at;
    RAISE NOTICE 'Renamed start_time to started_at';
  END IF;
END $$;

-- Rename end_time to completed_at if needed
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'focus_sessions' AND column_name = 'end_time'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'focus_sessions' AND column_name = 'completed_at'
  ) THEN
    ALTER TABLE focus_sessions RENAME COLUMN end_time TO completed_at;
    RAISE NOTICE 'Renamed end_time to completed_at';
  END IF;
END $$;

-- Rename preset to type if needed
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'focus_sessions' AND column_name = 'preset'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'focus_sessions' AND column_name = 'type'
  ) THEN
    ALTER TABLE focus_sessions RENAME COLUMN preset TO type;
    RAISE NOTICE 'Renamed preset to type';
  END IF;
END $$;

-- Rename duration to duration_minutes if needed
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'focus_sessions' AND column_name = 'duration'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'focus_sessions' AND column_name = 'duration_minutes'
  ) THEN
    ALTER TABLE focus_sessions RENAME COLUMN duration TO duration_minutes;
    RAISE NOTICE 'Renamed duration to duration_minutes';
  END IF;
END $$;

-- Rename actual_duration to actual_duration_seconds if needed
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'focus_sessions' AND column_name = 'actual_duration'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'focus_sessions' AND column_name = 'actual_duration_seconds'
  ) THEN
    ALTER TABLE focus_sessions RENAME COLUMN actual_duration TO actual_duration_seconds;
    RAISE NOTICE 'Renamed actual_duration to actual_duration_seconds';
  END IF;
END $$;

-- Update status CHECK constraint to match new values
DO $$
BEGIN
  -- Drop old constraint if exists
  ALTER TABLE focus_sessions DROP CONSTRAINT IF EXISTS focus_sessions_status_check;
  
  -- Add new constraint
  ALTER TABLE focus_sessions ADD CONSTRAINT focus_sessions_status_check 
    CHECK (status IN ('in-progress', 'completed', 'abandoned', 'active', 'cancelled', 'paused'));
  
  RAISE NOTICE 'Updated status CHECK constraint';
END $$;

-- Update type CHECK constraint
DO $$
BEGIN
  -- Drop old constraint if exists
  ALTER TABLE focus_sessions DROP CONSTRAINT IF EXISTS focus_sessions_type_check;
  
  -- Add new constraint
  ALTER TABLE focus_sessions ADD CONSTRAINT focus_sessions_type_check 
    CHECK (type IN ('pomodoro', 'deep-work', 'custom'));
  
  RAISE NOTICE 'Updated type CHECK constraint';
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_focus_sessions_user_id ON focus_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_task_id ON focus_sessions(task_id);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_started_at ON focus_sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_status ON focus_sessions(status);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_type ON focus_sessions(type);

-- Enable Row Level Security
ALTER TABLE focus_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view their own focus sessions" ON focus_sessions;
CREATE POLICY "Users can view their own focus sessions"
  ON focus_sessions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own focus sessions" ON focus_sessions;
CREATE POLICY "Users can create their own focus sessions"
  ON focus_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own focus sessions" ON focus_sessions;
CREATE POLICY "Users can update their own focus sessions"
  ON focus_sessions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own focus sessions" ON focus_sessions;
CREATE POLICY "Users can delete their own focus sessions"
  ON focus_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- Verification
DO $$
DECLARE
  col_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO col_count
  FROM information_schema.columns
  WHERE table_name = 'focus_sessions'
    AND column_name IN ('user_id', 'started_at', 'completed_at', 'type', 'duration_minutes');

  IF col_count = 5 THEN
    RAISE NOTICE '✅ SUCCESS: All required columns exist in focus_sessions table';
  ELSE
    RAISE WARNING '⚠️ WARNING: Expected 5 columns, found %', col_count;
  END IF;
END $$;

