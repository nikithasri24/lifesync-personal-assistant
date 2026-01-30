-- Migration: Drop legacy goals table
-- Description: Remove the old 'goals' table since all functionality has been migrated to 'life_goals'
-- Date: 2026-01-30

-- First, drop any foreign key constraints that reference the goals table
-- (Check if any exist and drop them)

-- Drop RLS policies on goals table
DROP POLICY IF EXISTS "Users can view their own goals" ON goals;
DROP POLICY IF EXISTS "Users can insert their own goals" ON goals;
DROP POLICY IF EXISTS "Users can update their own goals" ON goals;
DROP POLICY IF EXISTS "Users can delete their own goals" ON goals;
DROP POLICY IF EXISTS "goals_select_policy" ON goals;
DROP POLICY IF EXISTS "goals_insert_policy" ON goals;
DROP POLICY IF EXISTS "goals_update_policy" ON goals;
DROP POLICY IF EXISTS "goals_delete_policy" ON goals;

-- Drop any indexes on the goals table
DROP INDEX IF EXISTS idx_goals_user_id;
DROP INDEX IF EXISTS idx_goals_status;
DROP INDEX IF EXISTS idx_goals_category;
DROP INDEX IF EXISTS goals_user_id_idx;
DROP INDEX IF EXISTS goals_status_idx;
DROP INDEX IF EXISTS goals_category_idx;

-- Drop the goals table
DROP TABLE IF EXISTS goals CASCADE;

-- Note: The CASCADE option will automatically drop any dependent objects
-- (foreign keys, views, etc.) that reference this table

