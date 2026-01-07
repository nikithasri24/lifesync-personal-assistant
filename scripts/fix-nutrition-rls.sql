-- Fix Nutrition Goals RLS Policies
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/YOUR_PROJECT/sql

-- Step 1: Drop all existing policies for nutrition_goals
DROP POLICY IF EXISTS "Users can view own goals" ON nutrition_goals;
DROP POLICY IF EXISTS "Users can insert own goals" ON nutrition_goals;
DROP POLICY IF EXISTS "Users can update own goals" ON nutrition_goals;
DROP POLICY IF EXISTS "Users can delete own goals" ON nutrition_goals;
DROP POLICY IF EXISTS "Users can view own nutrition goals" ON nutrition_goals;
DROP POLICY IF EXISTS "Users can insert own nutrition goals" ON nutrition_goals;
DROP POLICY IF EXISTS "Users can update own nutrition goals" ON nutrition_goals;
DROP POLICY IF EXISTS "Users can delete own nutrition goals" ON nutrition_goals;

-- Step 2: Recreate policies with correct names
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

-- Step 3: Verify policies were created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'nutrition_goals'
ORDER BY policyname;

-- Expected output: 4 policies
-- If you see 4 policies listed, the fix was successful!

