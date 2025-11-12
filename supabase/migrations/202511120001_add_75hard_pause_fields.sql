-- Migration: Add pause/resume tracking fields to 75 Hard challenges
-- Adds columns: paused_at, resumed_at, total_pause_duration, pause_count
-- Purpose: Track when challenges are paused and resumed

-- Add pause tracking columns to sfh_challenges table
ALTER TABLE sfh_challenges
    ADD COLUMN IF NOT EXISTS paused_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS resumed_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS total_pause_duration INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS pause_count INTEGER DEFAULT 0;

-- Add comments for documentation
COMMENT ON COLUMN sfh_challenges.paused_at IS 'Timestamp when the challenge was last paused';
COMMENT ON COLUMN sfh_challenges.resumed_at IS 'Timestamp when the challenge was last resumed';
COMMENT ON COLUMN sfh_challenges.total_pause_duration IS 'Total number of days the challenge has been paused';
COMMENT ON COLUMN sfh_challenges.pause_count IS 'Number of times the challenge has been paused';

-- Add check constraint to ensure pause count is non-negative
ALTER TABLE sfh_challenges
    ADD CONSTRAINT check_pause_count_non_negative
    CHECK (pause_count >= 0);

-- Add check constraint to ensure total pause duration is non-negative
ALTER TABLE sfh_challenges
    ADD CONSTRAINT check_total_pause_duration_non_negative
    CHECK (total_pause_duration >= 0);
