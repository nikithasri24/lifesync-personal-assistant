-- ================================================
-- Focus Sessions Enhancement
-- ================================================
-- Ensures focus_sessions table exists with proper schema
-- for tracking Pomodoro, deep work, and custom focus sessions

-- Create focus_sessions table if not exists
CREATE TABLE IF NOT EXISTS focus_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    type VARCHAR(50) DEFAULT 'pomodoro' CHECK (type IN ('pomodoro', 'deep-work', 'custom')),
    duration_minutes INTEGER NOT NULL, -- planned duration in minutes
    actual_duration_seconds INTEGER, -- actual duration in seconds
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'in-progress' CHECK (status IN ('in-progress', 'completed', 'abandoned')),
    breaks_taken INTEGER DEFAULT 0,
    distractions INTEGER DEFAULT 0,
    mood_before VARCHAR(50),
    mood_after VARCHAR(50),
    productivity_score INTEGER CHECK (productivity_score >= 1 AND productivity_score <= 10),
    notes TEXT,
    environment_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add user_id column if missing (for legacy tables)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'focus_sessions' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE focus_sessions ADD COLUMN user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Migrate old column names if they exist
DO $$
BEGIN
    -- preset -> type
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'focus_sessions' AND column_name = 'preset'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'focus_sessions' AND column_name = 'type'
    ) THEN
        ALTER TABLE focus_sessions RENAME COLUMN preset TO type;
    END IF;

    -- duration -> duration_minutes
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'focus_sessions' AND column_name = 'duration'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'focus_sessions' AND column_name = 'duration_minutes'
    ) THEN
        ALTER TABLE focus_sessions RENAME COLUMN duration TO duration_minutes;
    END IF;

    -- actual_duration -> actual_duration_seconds
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'focus_sessions' AND column_name = 'actual_duration'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'focus_sessions' AND column_name = 'actual_duration_seconds'
    ) THEN
        ALTER TABLE focus_sessions RENAME COLUMN actual_duration TO actual_duration_seconds;
    END IF;

    -- start_time -> started_at
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'focus_sessions' AND column_name = 'start_time'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'focus_sessions' AND column_name = 'started_at'
    ) THEN
        ALTER TABLE focus_sessions RENAME COLUMN start_time TO started_at;
    END IF;

    -- end_time -> completed_at
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'focus_sessions' AND column_name = 'end_time'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'focus_sessions' AND column_name = 'completed_at'
    ) THEN
        ALTER TABLE focus_sessions RENAME COLUMN end_time TO completed_at;
    END IF;

    -- Update status values: 'active' -> 'in-progress', 'cancelled' -> 'abandoned', 'paused' -> 'in-progress'
    UPDATE focus_sessions SET status = 'in-progress' WHERE status IN ('active', 'paused');
    UPDATE focus_sessions SET status = 'abandoned' WHERE status = 'cancelled';
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_focus_sessions_user_id ON focus_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_task_id ON focus_sessions(task_id);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_started_at ON focus_sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_status ON focus_sessions(status);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_type ON focus_sessions(type);

-- Enable Row Level Security
ALTER TABLE focus_sessions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own focus sessions" ON focus_sessions;
DROP POLICY IF EXISTS "Users can create their own focus sessions" ON focus_sessions;
DROP POLICY IF EXISTS "Users can update their own focus sessions" ON focus_sessions;
DROP POLICY IF EXISTS "Users can delete their own focus sessions" ON focus_sessions;

-- RLS Policies
CREATE POLICY "Users can view their own focus sessions"
    ON focus_sessions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own focus sessions"
    ON focus_sessions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own focus sessions"
    ON focus_sessions FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own focus sessions"
    ON focus_sessions FOR DELETE
    USING (auth.uid() = user_id);

-- Trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_focus_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_focus_sessions_updated_at ON focus_sessions;
CREATE TRIGGER trigger_focus_sessions_updated_at
    BEFORE UPDATE ON focus_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_focus_sessions_updated_at();
