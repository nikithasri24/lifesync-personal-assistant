-- Fix Nutrition Goals RLS Policies
-- Migration created: 2025-12-23
-- Purpose: Fix 406 Not Acceptable error by recreating RLS policies
-- Issue: Duplicate or conflicting policies causing 406 errors

-- Drop all existing policies for nutrition_goals
DROP POLICY IF EXISTS "Users can view own goals" ON nutrition_goals;
DROP POLICY IF EXISTS "Users can insert own goals" ON nutrition_goals;
DROP POLICY IF EXISTS "Users can update own goals" ON nutrition_goals;
DROP POLICY IF EXISTS "Users can delete own goals" ON nutrition_goals;

-- Recreate policies with correct names
CREATE POLICY "Users can view own nutrition goals"
  ON nutrition_goals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own nutrition goals"
  ON nutrition_goals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own nutrition goals"
  ON nutrition_goals FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own nutrition goals"
  ON nutrition_goals FOR DELETE
  USING (auth.uid() = user_id);

-- Verification
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO policy_count
  FROM pg_policies
  WHERE tablename = 'nutrition_goals';

  IF policy_count = 4 THEN
    RAISE NOTICE '✅ SUCCESS: All 4 RLS policies created for nutrition_goals';
  ELSE
    RAISE WARNING '⚠️ WARNING: Expected 4 policies, found %', policy_count;
  END IF;
END $$;

