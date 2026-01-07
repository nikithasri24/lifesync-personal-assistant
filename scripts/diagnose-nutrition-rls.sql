-- Diagnostic Script for Nutrition Goals 406 Error
-- Run this in Supabase SQL Editor to diagnose the issue

-- ============================================================================
-- STEP 1: Check if table exists and RLS is enabled
-- ============================================================================
SELECT 
  schemaname,
  tablename,
  rowsecurity as "RLS Enabled",
  tableowner
FROM pg_tables
WHERE tablename = 'nutrition_goals';

-- Expected: Should show 1 row with rowsecurity = true

-- ============================================================================
-- STEP 2: Check current policies
-- ============================================================================
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd as "Command Type",
  qual as "USING clause",
  with_check as "WITH CHECK clause"
FROM pg_policies
WHERE tablename = 'nutrition_goals'
ORDER BY policyname;

-- Expected: Should show 4 policies (SELECT, INSERT, UPDATE, DELETE)

-- ============================================================================
-- STEP 3: Check table structure
-- ============================================================================
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'nutrition_goals'
ORDER BY ordinal_position;

-- Expected: Should show columns including user_id, is_active, etc.

-- ============================================================================
-- STEP 4: Check constraints (especially UNIQUE constraint)
-- ============================================================================
SELECT
  conname as "Constraint Name",
  contype as "Type",
  pg_get_constraintdef(oid) as "Definition"
FROM pg_constraint
WHERE conrelid = 'nutrition_goals'::regclass;

-- Expected: Should show UNIQUE(user_id, is_active) constraint

-- ============================================================================
-- STEP 5: Test if current user can query the table
-- ============================================================================
-- This will show if RLS is blocking the query
SELECT 
  id,
  user_id,
  calories_target,
  is_active,
  created_at
FROM nutrition_goals
WHERE user_id = auth.uid()
LIMIT 5;

-- If this fails, RLS policies are blocking access

-- ============================================================================
-- STEP 6: Check if there are any rows in the table
-- ============================================================================
SELECT COUNT(*) as "Total Rows"
FROM nutrition_goals;

-- This uses service role, so it bypasses RLS

