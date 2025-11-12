-- Migration: Create 75 Hard Challenge tables
-- Creates tables: sfh_challenges, sfh_entries
-- Purpose: Store 75 Hard challenge tracking data with JSON-backed structure

-- Ensure uuid extension exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: sfh_challenges
-- Stores 75 Hard challenge definitions
CREATE TABLE IF NOT EXISTS sfh_challenges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    current_day INTEGER DEFAULT 1,
    rules JSONB NOT NULL DEFAULT '[]',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: sfh_entries
-- Stores daily entries for 75 Hard challenges
CREATE TABLE IF NOT EXISTS sfh_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    challenge_id UUID NOT NULL REFERENCES sfh_challenges(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    day INTEGER NOT NULL,
    rule_completions JSONB NOT NULL DEFAULT '[]',
    notes TEXT,
    progress_photo_url TEXT,
    weight DECIMAL(6,2),
    measurements JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(challenge_id, date)
);

-- Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_sfh_challenges_user_id ON sfh_challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_sfh_challenges_is_active ON sfh_challenges(is_active);
CREATE INDEX IF NOT EXISTS idx_sfh_challenges_start_date ON sfh_challenges(start_date);
CREATE INDEX IF NOT EXISTS idx_sfh_challenges_created_at ON sfh_challenges(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sfh_entries_user_id ON sfh_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_sfh_entries_challenge_id ON sfh_entries(challenge_id);
CREATE INDEX IF NOT EXISTS idx_sfh_entries_date ON sfh_entries(date);
CREATE INDEX IF NOT EXISTS idx_sfh_entries_challenge_date ON sfh_entries(challenge_id, date);

-- Row Level Security (RLS) Policies
ALTER TABLE sfh_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE sfh_entries ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own challenges
CREATE POLICY "Users can view own sfh_challenges"
    ON sfh_challenges FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own challenges
CREATE POLICY "Users can insert own sfh_challenges"
    ON sfh_challenges FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own challenges
CREATE POLICY "Users can update own sfh_challenges"
    ON sfh_challenges FOR UPDATE
    USING (auth.uid() = user_id);

-- Policy: Users can delete their own challenges
CREATE POLICY "Users can delete own sfh_challenges"
    ON sfh_challenges FOR DELETE
    USING (auth.uid() = user_id);

-- Policy: Users can only see their own entries
CREATE POLICY "Users can view own sfh_entries"
    ON sfh_entries FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own entries
CREATE POLICY "Users can insert own sfh_entries"
    ON sfh_entries FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own entries
CREATE POLICY "Users can update own sfh_entries"
    ON sfh_entries FOR UPDATE
    USING (auth.uid() = user_id);

-- Policy: Users can delete their own entries
CREATE POLICY "Users can delete own sfh_entries"
    ON sfh_entries FOR DELETE
    USING (auth.uid() = user_id);

-- Trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add update triggers
DROP TRIGGER IF EXISTS update_sfh_challenges_updated_at ON sfh_challenges;
CREATE TRIGGER update_sfh_challenges_updated_at
    BEFORE UPDATE ON sfh_challenges
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sfh_entries_updated_at ON sfh_entries;
CREATE TRIGGER update_sfh_entries_updated_at
    BEFORE UPDATE ON sfh_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add constraints for data validation
ALTER TABLE sfh_challenges
    ADD CONSTRAINT check_end_date_after_start_date
    CHECK (end_date >= start_date);

ALTER TABLE sfh_challenges
    ADD CONSTRAINT check_current_day_positive
    CHECK (current_day >= 1);

ALTER TABLE sfh_entries
    ADD CONSTRAINT check_day_positive
    CHECK (day >= 1);

ALTER TABLE sfh_entries
    ADD CONSTRAINT check_weight_reasonable
    CHECK (weight IS NULL OR (weight > 0 AND weight < 1000));
