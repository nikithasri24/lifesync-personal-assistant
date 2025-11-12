-- Migration: Improve 75 Hard schema with best practices
-- Adds: unique constraints, indexes, check constraints, and optimizations
-- Version: 2025-11-12

-- ==================== Add Missing Columns ====================

-- Add status column for discriminated union support
ALTER TABLE sfh_challenges
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'failed'));

-- Add completed_at for completed challenges
ALTER TABLE sfh_challenges
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- Add failed_at for failed challenges
ALTER TABLE sfh_challenges
ADD COLUMN IF NOT EXISTS failed_at TIMESTAMP WITH TIME ZONE;

-- Add failure_reason for failed challenges
ALTER TABLE sfh_challenges
ADD COLUMN IF NOT EXISTS failure_reason TEXT;

-- Add updated_at to track last modification
ALTER TABLE sfh_entries
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- ==================== Add Unique Constraints ====================

-- Prevent duplicate challenges (same user, name, start_date)
-- Drop existing constraint if it exists
DO $$
BEGIN
    ALTER TABLE sfh_challenges DROP CONSTRAINT IF EXISTS sfh_challenges_unique_challenge;
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

-- Add the unique constraint
ALTER TABLE sfh_challenges
ADD CONSTRAINT sfh_challenges_unique_challenge
UNIQUE (user_id, name, start_date);

-- Ensure only one entry per challenge per day
-- Drop existing constraint if it exists
DO $$
BEGIN
    ALTER TABLE sfh_entries DROP CONSTRAINT IF EXISTS sfh_entries_unique_entry;
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

-- Recreate with better name
ALTER TABLE sfh_entries
ADD CONSTRAINT sfh_entries_unique_day
UNIQUE (challenge_id, day);

-- ==================== Add Check Constraints ====================

-- Ensure logical consistency for status
ALTER TABLE sfh_challenges
ADD CONSTRAINT sfh_challenges_check_status_active
CHECK (
  (status = 'active' AND is_active = true AND paused_at IS NULL AND completed_at IS NULL AND failed_at IS NULL)
  OR
  (status = 'paused' AND is_active = false AND paused_at IS NOT NULL AND completed_at IS NULL AND failed_at IS NULL)
  OR
  (status = 'completed' AND is_active = false AND completed_at IS NOT NULL AND failed_at IS NULL)
  OR
  (status = 'failed' AND is_active = false AND failed_at IS NOT NULL AND completed_at IS NULL)
);

-- Ensure end_date is always 74 days after start_date (75 days total)
ALTER TABLE sfh_challenges
ADD CONSTRAINT sfh_challenges_check_duration
CHECK (end_date = start_date + INTERVAL '74 days');

-- Ensure current_day is within valid range
ALTER TABLE sfh_challenges
DROP CONSTRAINT IF EXISTS check_current_day_positive;

ALTER TABLE sfh_challenges
ADD CONSTRAINT sfh_challenges_check_current_day_range
CHECK (current_day >= 1 AND current_day <= 75);

-- Ensure pause_count matches logical constraints
ALTER TABLE sfh_challenges
ADD CONSTRAINT sfh_challenges_check_pause_count
CHECK (
  (paused_at IS NULL AND pause_count IS NULL AND total_pause_duration IS NULL)
  OR
  (paused_at IS NOT NULL AND pause_count >= 1 AND total_pause_duration >= 0)
);

-- Ensure entry day is within valid range
ALTER TABLE sfh_entries
DROP CONSTRAINT IF EXISTS check_day_positive;

ALTER TABLE sfh_entries
ADD CONSTRAINT sfh_entries_check_day_range
CHECK (day >= 1 AND day <= 75);

-- Ensure entry date matches challenge timeline
-- This is a bit complex, so we'll handle it in application logic
-- But we can at least ensure date is not before challenge start
-- We'll add this as a trigger instead

-- ==================== Add Performance Indexes ====================

-- Index for finding active challenges quickly
CREATE INDEX IF NOT EXISTS idx_sfh_challenges_user_status
ON sfh_challenges(user_id, status) WHERE status = 'active';

-- Index for finding challenges by status
CREATE INDEX IF NOT EXISTS idx_sfh_challenges_status
ON sfh_challenges(status);

-- Index for date range queries
CREATE INDEX IF NOT EXISTS idx_sfh_challenges_date_range
ON sfh_challenges(user_id, start_date, end_date);

-- Index for entries by challenge and day (for quick lookups)
CREATE INDEX IF NOT EXISTS idx_sfh_entries_challenge_day
ON sfh_entries(challenge_id, day);

-- Index for entries by date (for calendar views)
CREATE INDEX IF NOT EXISTS idx_sfh_entries_user_date
ON sfh_entries(user_id, date);

-- ==================== Add Triggers ====================

-- Trigger to automatically update updated_at on sfh_entries
DROP TRIGGER IF EXISTS update_sfh_entries_updated_at ON sfh_entries;
CREATE TRIGGER update_sfh_entries_updated_at
    BEFORE UPDATE ON sfh_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger to auto-update status based on is_active and timestamps
CREATE OR REPLACE FUNCTION sync_sfh_challenge_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Auto-set status based on other fields
    IF NEW.failed_at IS NOT NULL THEN
        NEW.status := 'failed';
        NEW.is_active := false;
    ELSIF NEW.completed_at IS NOT NULL THEN
        NEW.status := 'completed';
        NEW.is_active := false;
    ELSIF NEW.paused_at IS NOT NULL AND NEW.is_active = false THEN
        NEW.status := 'paused';
    ELSIF NEW.is_active = true THEN
        NEW.status := 'active';
        NEW.paused_at := NULL; -- Clear paused_at if becoming active
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_sfh_challenge_status_trigger ON sfh_challenges;
CREATE TRIGGER sync_sfh_challenge_status_trigger
    BEFORE INSERT OR UPDATE ON sfh_challenges
    FOR EACH ROW
    EXECUTE FUNCTION sync_sfh_challenge_status();

-- Trigger to validate entry date is within challenge range
CREATE OR REPLACE FUNCTION validate_sfh_entry_date()
RETURNS TRIGGER AS $$
DECLARE
    challenge_start_date DATE;
    challenge_end_date DATE;
BEGIN
    -- Get challenge dates
    SELECT start_date, end_date
    INTO challenge_start_date, challenge_end_date
    FROM sfh_challenges
    WHERE id = NEW.challenge_id;

    -- Validate date is within range
    IF NEW.date < challenge_start_date THEN
        RAISE EXCEPTION 'Entry date % is before challenge start date %', NEW.date, challenge_start_date;
    END IF;

    IF NEW.date > challenge_end_date THEN
        RAISE EXCEPTION 'Entry date % is after challenge end date %', NEW.date, challenge_end_date;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS validate_sfh_entry_date_trigger ON sfh_entries;
CREATE TRIGGER validate_sfh_entry_date_trigger
    BEFORE INSERT OR UPDATE ON sfh_entries
    FOR EACH ROW
    EXECUTE FUNCTION validate_sfh_entry_date();

-- ==================== Add Comments for Documentation ====================

COMMENT ON COLUMN sfh_challenges.status IS
'Challenge status: active (in progress), paused (temporarily stopped), completed (finished 75 days), failed (permanently stopped)';

COMMENT ON COLUMN sfh_challenges.current_day IS
'Current day number (1-75). For paused challenges, this is the day it was paused at. For active challenges, calculated from start_date.';

COMMENT ON COLUMN sfh_challenges.completed_at IS
'Timestamp when challenge was completed (reached day 75)';

COMMENT ON COLUMN sfh_challenges.failed_at IS
'Timestamp when challenge was marked as failed';

COMMENT ON COLUMN sfh_challenges.failure_reason IS
'Optional reason why challenge failed';

COMMENT ON CONSTRAINT sfh_challenges_unique_challenge ON sfh_challenges IS
'Prevents duplicate challenges with same name and start date for a user';

COMMENT ON CONSTRAINT sfh_challenges_check_status_active ON sfh_challenges IS
'Ensures status field matches the state of is_active, paused_at, completed_at, and failed_at fields';

COMMENT ON CONSTRAINT sfh_challenges_check_duration ON sfh_challenges IS
'Ensures challenge is always exactly 75 days (start_date to end_date)';

-- ==================== Migrate Existing Data ====================

-- Update existing challenges to have correct status
UPDATE sfh_challenges
SET status = CASE
    WHEN is_active = true THEN 'active'
    WHEN is_active = false AND paused_at IS NOT NULL THEN 'paused'
    ELSE 'active' -- Default for old data
END
WHERE status IS NULL OR status = 'active';

-- Ensure current_day is at least 1
UPDATE sfh_challenges
SET current_day = GREATEST(current_day, 1)
WHERE current_day < 1;

-- ==================== Create View for Active Challenges ====================

-- Materialized view for quick access to active challenges with stats
CREATE OR REPLACE VIEW v_active_challenges AS
SELECT
    c.*,
    COUNT(DISTINCT e.id) as total_entries,
    COUNT(DISTINCT e.day) as completed_days,
    ROUND(
        (COUNT(DISTINCT e.day)::DECIMAL / NULLIF(c.current_day, 0)) * 100,
        2
    ) as completion_percentage,
    (
        SELECT COUNT(*)
        FROM sfh_entries e2
        WHERE e2.challenge_id = c.id
        AND e2.date >= CURRENT_DATE - INTERVAL '7 days'
    ) as entries_last_7_days
FROM sfh_challenges c
LEFT JOIN sfh_entries e ON e.challenge_id = c.id
WHERE c.status = 'active'
GROUP BY c.id;

COMMENT ON VIEW v_active_challenges IS
'Optimized view of active challenges with computed statistics';

-- ==================== Create Indexes on JSONB Columns ====================

-- Index for searching within rules JSONB
CREATE INDEX IF NOT EXISTS idx_sfh_challenges_rules_gin
ON sfh_challenges USING GIN (rules);

-- Index for searching within rule_completions JSONB
CREATE INDEX IF NOT EXISTS idx_sfh_entries_completions_gin
ON sfh_entries USING GIN (rule_completions);

-- ==================== Add Audit Trail ====================

-- Create audit log table for important changes
CREATE TABLE IF NOT EXISTS sfh_challenge_audit (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    challenge_id UUID NOT NULL REFERENCES sfh_challenges(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL, -- 'created', 'paused', 'resumed', 'completed', 'failed', 'updated'
    previous_state JSONB,
    new_state JSONB,
    metadata JSONB, -- Additional context
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for audit queries
CREATE INDEX IF NOT EXISTS idx_sfh_audit_challenge
ON sfh_challenge_audit(challenge_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sfh_audit_user
ON sfh_challenge_audit(user_id, created_at DESC);

-- RLS for audit table
ALTER TABLE sfh_challenge_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own audit logs"
ON sfh_challenge_audit FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own audit logs"
ON sfh_challenge_audit FOR INSERT
WITH CHECK (auth.uid() = user_id);

COMMENT ON TABLE sfh_challenge_audit IS
'Audit trail for all important challenge state changes';

-- ==================== Add Statistics Function ====================

CREATE OR REPLACE FUNCTION get_user_75hard_stats(p_user_id UUID)
RETURNS TABLE (
    total_challenges BIGINT,
    active_challenges BIGINT,
    paused_challenges BIGINT,
    completed_challenges BIGINT,
    failed_challenges BIGINT,
    total_days_logged BIGINT,
    longest_streak INTEGER,
    completion_rate DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::BIGINT as total_challenges,
        COUNT(*) FILTER (WHERE status = 'active')::BIGINT as active_challenges,
        COUNT(*) FILTER (WHERE status = 'paused')::BIGINT as paused_challenges,
        COUNT(*) FILTER (WHERE status = 'completed')::BIGINT as completed_challenges,
        COUNT(*) FILTER (WHERE status = 'failed')::BIGINT as failed_challenges,
        (
            SELECT COUNT(DISTINCT (challenge_id, day))::BIGINT
            FROM sfh_entries
            WHERE user_id = p_user_id
        ) as total_days_logged,
        -- Longest streak calculation would be complex, placeholder for now
        0 as longest_streak,
        CASE
            WHEN COUNT(*) FILTER (WHERE status IN ('completed', 'failed')) = 0 THEN 0
            ELSE ROUND(
                COUNT(*) FILTER (WHERE status = 'completed')::DECIMAL /
                NULLIF(COUNT(*) FILTER (WHERE status IN ('completed', 'failed')), 0) * 100,
                2
            )
        END as completion_rate
    FROM sfh_challenges
    WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_user_75hard_stats IS
'Calculate comprehensive statistics for a user''s 75 Hard challenges';
