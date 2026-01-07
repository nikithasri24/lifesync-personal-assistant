-- Complete Fix for Nutrition Goals 406 Error
-- Run this in Supabase SQL Editor

-- ============================================================================
-- STEP 1: Drop the problematic UNIQUE constraint
-- ============================================================================
-- The UNIQUE(user_id, is_active) constraint can cause 406 errors
-- We'll replace it with a partial unique index

ALTER TABLE nutrition_goals 
DROP CONSTRAINT IF EXISTS nutrition_goals_user_id_is_active_key;

-- ============================================================================
-- STEP 2: Create a partial unique index instead
-- ============================================================================
-- This only enforces uniqueness when is_active = true
-- Multiple false values are allowed

DROP INDEX IF EXISTS idx_nutrition_goals_active_unique;

CREATE UNIQUE INDEX idx_nutrition_goals_active_unique 
ON nutrition_goals(user_id) 
WHERE is_active = true;

-- ============================================================================
-- STEP 3: Drop all existing RLS policies
-- ============================================================================
DROP POLICY IF EXISTS "Users can view own goals" ON nutrition_goals;
DROP POLICY IF EXISTS "Users can insert own goals" ON nutrition_goals;
DROP POLICY IF EXISTS "Users can update own goals" ON nutrition_goals;
DROP POLICY IF EXISTS "Users can delete own goals" ON nutrition_goals;
DROP POLICY IF EXISTS "Users can view own nutrition goals" ON nutrition_goals;
DROP POLICY IF EXISTS "Users can insert own nutrition goals" ON nutrition_goals;
DROP POLICY IF EXISTS "Users can update own nutrition goals" ON nutrition_goals;
DROP POLICY IF EXISTS "Users can delete own nutrition goals" ON nutrition_goals;

-- ============================================================================
-- STEP 4: Ensure RLS is enabled
-- ============================================================================
ALTER TABLE nutrition_goals ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 5: Create new RLS policies
-- ============================================================================

-- Allow users to view their own nutrition goals
CREATE POLICY "Users can view own nutrition goals"
  ON nutrition_goals 
  FOR SELECT
  USING (auth.uid() = user_id);

-- Allow users to insert their own nutrition goals
CREATE POLICY "Users can insert own nutrition goals"
  ON nutrition_goals 
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own nutrition goals
CREATE POLICY "Users can update own nutrition goals"
  ON nutrition_goals 
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own nutrition goals
CREATE POLICY "Users can delete own nutrition goals"
  ON nutrition_goals 
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- STEP 6: Verify the fix
-- ============================================================================

-- Check RLS is enabled
SELECT 
  tablename,
  rowsecurity as "RLS Enabled"
FROM pg_tables
WHERE tablename = 'nutrition_goals';

-- Check policies exist
SELECT 
  policyname,
  cmd as "Type"
FROM pg_policies
WHERE tablename = 'nutrition_goals'
ORDER BY policyname;

-- Check the unique index
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'nutrition_goals'
  AND indexname = 'idx_nutrition_goals_active_unique';

-- ============================================================================
-- STEP 7: Test query (should work now)
-- ============================================================================
SELECT 
  id,
  user_id,
  calories_target,
  protein_target_g,
  carbs_target_g,
  fat_target_g,
  is_active
FROM nutrition_goals
WHERE user_id = auth.uid() 
  AND is_active = true;

-- If this returns results or "no rows", the fix worked!
-- If it errors, there's still an issue.

-- ============================================================================
-- Expected Results:
-- ============================================================================
-- 1. RLS Enabled: true
-- 2. 4 policies created (SELECT, INSERT, UPDATE, DELETE)
-- 3. Unique index created
-- 4. Test query succeeds (returns 0 or more rows)

