-- Quick Fix: Add status column to sfh_challenges table
-- This is a minimal version that just adds the critical missing column
-- Run this via Supabase Dashboard → SQL Editor

-- Add status column
ALTER TABLE sfh_challenges
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';

-- Add check constraint for valid statuses
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'sfh_challenges_status_check'
        AND conrelid = 'sfh_challenges'::regclass
    ) THEN
        ALTER TABLE sfh_challenges
        ADD CONSTRAINT sfh_challenges_status_check
        CHECK (status IN ('active', 'paused', 'completed', 'failed'));
    END IF;
END $$;

-- Update existing records to have correct status
UPDATE sfh_challenges
SET status = CASE
    WHEN is_active = true THEN 'active'
    WHEN is_active = false AND paused_at IS NOT NULL THEN 'paused'
    ELSE 'active'
END
WHERE status IS NULL OR status = '';

-- Verify the column was added
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'sfh_challenges'
        AND column_name = 'status'
    ) THEN
        RAISE NOTICE '✅ Status column added successfully!';
    ELSE
        RAISE EXCEPTION '❌ Failed to add status column';
    END IF;
END $$;
