-- Migration: Remove Goals Gamification System
-- Purpose: Clean up XP, streaks, badges, and gamification features from life goals
-- Date: 2026-02-10

-- ============================================================================
-- PART 1: Drop Streak History Table
-- ============================================================================

-- Drop the entire streak history table
DROP TABLE IF EXISTS life_goal_streak_history CASCADE;

-- ============================================================================
-- PART 2: Remove Gamification Columns from life_goals
-- ============================================================================

-- Remove difficulty tracking
ALTER TABLE life_goals DROP COLUMN IF EXISTS difficulty CASCADE;

-- Remove XP reward
ALTER TABLE life_goals DROP COLUMN IF EXISTS xp_reward CASCADE;

-- Remove streak tracking columns
ALTER TABLE life_goals DROP COLUMN IF EXISTS streak_days CASCADE;
ALTER TABLE life_goals DROP COLUMN IF EXISTS longest_streak CASCADE;
ALTER TABLE life_goals DROP COLUMN IF EXISTS current_streak CASCADE;
ALTER TABLE life_goals DROP COLUMN IF EXISTS streak_enabled CASCADE;
ALTER TABLE life_goals DROP COLUMN IF EXISTS streak_frequency CASCADE;
ALTER TABLE life_goals DROP COLUMN IF EXISTS streak_target CASCADE;
ALTER TABLE life_goals DROP COLUMN IF EXISTS last_streak_update CASCADE;

-- ============================================================================
-- PART 3: Remove XP Reward from life_goal_milestones
-- ============================================================================

ALTER TABLE life_goal_milestones DROP COLUMN IF EXISTS xp_reward CASCADE;

-- ============================================================================
-- PART 4: Drop Related Indexes (if they exist)
-- ============================================================================

DROP INDEX IF EXISTS idx_life_goal_streak_history_goal_id;
DROP INDEX IF EXISTS idx_life_goal_streak_history_date;

-- ============================================================================
-- PART 5: Verification
-- ============================================================================

DO $$
DECLARE
  streak_table_exists BOOLEAN;
  difficulty_col_exists BOOLEAN;
  xp_col_exists BOOLEAN;
BEGIN
  -- Check if streak history table was dropped
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'life_goal_streak_history'
  ) INTO streak_table_exists;

  IF NOT streak_table_exists THEN
    RAISE NOTICE 'SUCCESS: life_goal_streak_history table dropped';
  ELSE
    RAISE WARNING 'WARNING: life_goal_streak_history table still exists';
  END IF;

  -- Check if difficulty column was removed
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'life_goals' AND column_name = 'difficulty'
  ) INTO difficulty_col_exists;

  IF NOT difficulty_col_exists THEN
    RAISE NOTICE 'SUCCESS: difficulty column removed from life_goals';
  ELSE
    RAISE WARNING 'WARNING: difficulty column still exists in life_goals';
  END IF;

  -- Check if xp_reward column was removed
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'life_goals' AND column_name = 'xp_reward'
  ) INTO xp_col_exists;

  IF NOT xp_col_exists THEN
    RAISE NOTICE 'SUCCESS: xp_reward column removed from life_goals';
  ELSE
    RAISE WARNING 'WARNING: xp_reward column still exists in life_goals';
  END IF;

  -- Display remaining columns for verification
  RAISE NOTICE 'Remaining life_goals columns:';
END $$;

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'life_goals'
ORDER BY ordinal_position;

-- ============================================================================
-- Migration Complete
-- ============================================================================
-- This migration removes:
-- - life_goal_streak_history table
-- - difficulty, xp_reward, streak_* columns from life_goals
-- - xp_reward column from life_goal_milestones
-- - Related indexes
-- ============================================================================
