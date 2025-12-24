-- Migration: Add status column to goals table
-- Purpose: Fix 400 Bad Request error when filtering goals by status
-- The finance goals table was missing the status column that the API expects

-- Add status column to goals table
ALTER TABLE goals 
ADD COLUMN IF NOT EXISTS status TEXT 
DEFAULT 'active' 
CHECK (status IN ('active', 'completed', 'archived', 'on_hold', 'paused'));

-- Add comment for documentation
COMMENT ON COLUMN goals.status IS 'Current status of the financial goal';

-- Create index for faster queries on status
CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(status);

-- Update existing rows to have 'active' status if NULL
UPDATE goals 
SET status = 'active' 
WHERE status IS NULL;

-- Verification
DO $$
DECLARE
  col_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'goals' 
    AND column_name = 'status'
  ) INTO col_exists;

  IF col_exists THEN
    RAISE NOTICE '✅ SUCCESS: status column added to goals table';
  ELSE
    RAISE WARNING '⚠️ WARNING: status column was not added to goals table';
  END IF;
END $$;

