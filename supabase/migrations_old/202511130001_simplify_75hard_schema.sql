-- Migration: Simplify 75 Hard to Clean Architecture
-- Version: 2025-11-13
-- Purpose: Create simplified schema with ONE challenge, editable tasks, auto-reset
--
-- IMPORTANT: This migration creates NEW tables alongside old ones
-- Run the data migration script BEFORE dropping old tables
-- Old tables: sfh_challenges, sfh_entries
-- New tables: sfh_challenge, sfh_daily_checkins

-- ==================== Create New Simplified Tables ====================

-- Table: sfh_challenge (singular - only ONE active challenge allowed)
-- Stores the user's single 75 Hard challenge with customizable tasks
CREATE TABLE IF NOT EXISTS sfh_challenge (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Core fields
    start_date DATE NOT NULL,
    current_day INT NOT NULL CHECK (current_day >= 1 AND current_day <= 75),
    status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'completed')),

    -- Tasks (locked once challenge starts)
    -- Array of {id: string, title: string, description?: string, order: number}
    tasks JSONB NOT NULL,

    -- Completion
    completed_at TIMESTAMP WITH TIME ZONE,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- CRITICAL CONSTRAINT: Only ONE active challenge per user at a time
-- This prevents the "multiple active challenges" bug permanently
-- Using partial unique index instead of table constraint
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_active_challenge_per_user
ON sfh_challenge(user_id)
WHERE (status = 'active');

-- Validate tasks JSONB structure
ALTER TABLE sfh_challenge
ADD CONSTRAINT check_tasks_array_valid
CHECK (
    jsonb_typeof(tasks) = 'array'
    AND jsonb_array_length(tasks) >= 1
    AND jsonb_array_length(tasks) <= 20
);

-- Ensure completed challenges have completed_at timestamp
ALTER TABLE sfh_challenge
ADD CONSTRAINT check_completed_has_timestamp
CHECK (
    (status = 'completed' AND completed_at IS NOT NULL)
    OR (status = 'active' AND completed_at IS NULL)
);

-- Table: sfh_daily_checkins
-- Stores daily task completions (one per day)
CREATE TABLE IF NOT EXISTS sfh_daily_checkins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    challenge_id UUID NOT NULL REFERENCES sfh_challenge(id) ON DELETE CASCADE,

    -- Which day
    date DATE NOT NULL,
    day_number INT NOT NULL CHECK (day_number >= 1 AND day_number <= 75),

    -- Task completions (dynamic based on challenge.tasks)
    -- Array of {taskId: string, completed: boolean, completedAt?: timestamp}
    task_completions JSONB NOT NULL DEFAULT '[]'::jsonb,

    -- Optional data
    photo TEXT,
    weight DECIMAL(5,2) CHECK (weight IS NULL OR (weight > 0 AND weight < 1000)),
    notes TEXT CHECK (char_length(notes) <= 1000),

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- CONSTRAINT: One check-in per day per challenge
    CONSTRAINT one_checkin_per_day UNIQUE (challenge_id, date)
);

-- Validate task_completions JSONB structure
ALTER TABLE sfh_daily_checkins
ADD CONSTRAINT check_task_completions_array
CHECK (jsonb_typeof(task_completions) = 'array');

-- ==================== Indexes for Performance ====================

-- Index for finding active challenge quickly (most common query)
CREATE INDEX IF NOT EXISTS idx_sfh_challenge_user_status
ON sfh_challenge(user_id, status)
WHERE status = 'active';

-- Index for historical queries (completed challenges)
CREATE INDEX IF NOT EXISTS idx_sfh_challenge_completed
ON sfh_challenge(user_id, completed_at DESC)
WHERE status = 'completed';

-- Index for check-ins by challenge and date (for daily lookup and recent check-ins)
CREATE INDEX IF NOT EXISTS idx_sfh_checkins_challenge_date
ON sfh_daily_checkins(challenge_id, date DESC);

-- GIN index for searching within tasks JSONB
CREATE INDEX IF NOT EXISTS idx_sfh_challenge_tasks_gin
ON sfh_challenge USING GIN (tasks);

-- GIN index for searching within task_completions JSONB
CREATE INDEX IF NOT EXISTS idx_sfh_checkins_completions_gin
ON sfh_daily_checkins USING GIN (task_completions);

-- ==================== Row Level Security (RLS) ====================

ALTER TABLE sfh_challenge ENABLE ROW LEVEL SECURITY;
ALTER TABLE sfh_daily_checkins ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own challenge
CREATE POLICY "Users manage own challenge"
    ON sfh_challenge FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only access their own check-ins
CREATE POLICY "Users manage own checkins"
    ON sfh_daily_checkins FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM sfh_challenge
            WHERE id = challenge_id AND user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM sfh_challenge
            WHERE id = challenge_id AND user_id = auth.uid()
        )
    );

-- ==================== Triggers ====================

-- Trigger: Auto-update updated_at timestamp on sfh_challenge
DROP TRIGGER IF EXISTS update_sfh_challenge_updated_at ON sfh_challenge;
CREATE TRIGGER update_sfh_challenge_updated_at
    BEFORE UPDATE ON sfh_challenge
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Auto-update updated_at timestamp on sfh_daily_checkins
DROP TRIGGER IF EXISTS update_sfh_checkins_updated_at ON sfh_daily_checkins;
CREATE TRIGGER update_sfh_checkins_updated_at
    BEFORE UPDATE ON sfh_daily_checkins
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Validate check-in date is not in the future
CREATE OR REPLACE FUNCTION validate_checkin_date()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.date > CURRENT_DATE THEN
        RAISE EXCEPTION 'Cannot create check-in for future date: %', NEW.date;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS validate_checkin_date_trigger ON sfh_daily_checkins;
CREATE TRIGGER validate_checkin_date_trigger
    BEFORE INSERT OR UPDATE ON sfh_daily_checkins
    FOR EACH ROW
    EXECUTE FUNCTION validate_checkin_date();

-- ==================== Helper Functions ====================

-- Function: Get active challenge for user (most common query)
CREATE OR REPLACE FUNCTION get_active_challenge(p_user_id UUID)
RETURNS TABLE (
    id UUID,
    start_date DATE,
    current_day INT,
    tasks JSONB,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.id,
        c.start_date,
        c.current_day,
        c.tasks,
        c.created_at
    FROM sfh_challenge c
    WHERE c.user_id = p_user_id
    AND c.status = 'active'
    LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Get today's check-in for challenge
CREATE OR REPLACE FUNCTION get_today_checkin(p_challenge_id UUID)
RETURNS TABLE (
    id UUID,
    task_completions JSONB,
    photo TEXT,
    weight DECIMAL,
    notes TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.id,
        c.task_completions,
        c.photo,
        c.weight,
        c.notes
    FROM sfh_daily_checkins c
    WHERE c.challenge_id = p_challenge_id
    AND c.date = CURRENT_DATE
    LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Check if all tasks completed for a check-in
CREATE OR REPLACE FUNCTION are_all_tasks_complete(p_task_completions JSONB)
RETURNS BOOLEAN AS $$
DECLARE
    task JSONB;
BEGIN
    -- Iterate through task completions
    FOR task IN SELECT * FROM jsonb_array_elements(p_task_completions)
    LOOP
        -- If any task is not completed, return false
        IF (task->>'completed')::BOOLEAN = false THEN
            RETURN false;
        END IF;
    END LOOP;

    -- All tasks completed
    RETURN true;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ==================== Documentation ====================

COMMENT ON TABLE sfh_challenge IS
'Simplified 75 Hard challenge - ONE active challenge per user with customizable tasks';

COMMENT ON COLUMN sfh_challenge.tasks IS
'Array of task objects: [{id, title, description, order}]. Locked after challenge starts.';

COMMENT ON COLUMN sfh_challenge.status IS
'Only two states: active (in progress) or completed (finished 75 days)';

COMMENT ON COLUMN sfh_challenge.current_day IS
'Current day number (1-75). Auto-increments when all tasks completed.';

COMMENT ON INDEX idx_one_active_challenge_per_user IS
'CRITICAL: Prevents multiple active challenges - enforces ONE challenge rule';

COMMENT ON TABLE sfh_daily_checkins IS
'Daily check-ins with task completions. One per day per challenge.';

COMMENT ON COLUMN sfh_daily_checkins.task_completions IS
'Array of {taskId, completed, completedAt}. Matches challenge.tasks.';

COMMENT ON COLUMN sfh_daily_checkins.date IS
'Calendar date of this check-in. Cannot be in the future.';

COMMENT ON FUNCTION get_active_challenge IS
'Fast lookup for user''s active challenge. Returns null if no active challenge.';

COMMENT ON FUNCTION get_today_checkin IS
'Fast lookup for today''s check-in. Returns null if not yet created.';

COMMENT ON FUNCTION are_all_tasks_complete IS
'Helper to check if all tasks in task_completions array are marked complete';

-- ==================== Migration Notes ====================

-- NOTE: This migration creates NEW tables alongside the old ones.
--
-- NEXT STEPS:
-- 1. Run the data migration script: src/scripts/migrate75HardData.ts
-- 2. Verify data migrated correctly
-- 3. Run this to drop old tables (AFTER successful migration):
--
--    DROP TABLE IF EXISTS sfh_challenge_audit CASCADE;
--    DROP TABLE IF EXISTS sfh_entries CASCADE;
--    DROP TABLE IF EXISTS sfh_challenges CASCADE;
--    DROP VIEW IF EXISTS v_active_challenges CASCADE;
--    DROP FUNCTION IF EXISTS get_user_75hard_stats CASCADE;
--    DROP FUNCTION IF EXISTS sync_sfh_challenge_status CASCADE;
--    DROP FUNCTION IF EXISTS validate_sfh_entry_date CASCADE;
--
-- OLD TABLES: sfh_challenges (plural), sfh_entries
-- NEW TABLES: sfh_challenge (singular), sfh_daily_checkins
