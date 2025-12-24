-- Debug 406 Error - Deep Dive
-- Run each section separately to identify the exact issue

-- ============================================================================
-- SECTION 1: Check if table exists in public schema
-- ============================================================================
SELECT 
  table_schema,
  table_name,
  table_type
FROM information_schema.tables
WHERE table_name = 'nutrition_goals';

-- Expected: Should show 'public' schema

-- ============================================================================
-- SECTION 2: Check ALL policies (including inherited ones)
-- ============================================================================
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
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Look for nutrition_goals policies

-- ============================================================================
-- SECTION 3: Check if RLS is actually enabled
-- ============================================================================
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename = 'nutrition_goals';

-- Expected: rowsecurity = true

-- ============================================================================
-- SECTION 4: Try to disable RLS temporarily to test
-- ============================================================================
-- WARNING: This removes security! Only for testing!
-- DO NOT use in production without re-enabling!

ALTER TABLE public.nutrition_goals DISABLE ROW LEVEL SECURITY;

-- Now try your app - does the 406 go away?
-- If YES, the problem is with RLS policies
-- If NO, the problem is something else (schema, permissions, etc.)

-- ============================================================================
-- SECTION 5: Re-enable RLS and create PERMISSIVE policies
-- ============================================================================
ALTER TABLE public.nutrition_goals ENABLE ROW LEVEL SECURITY;

-- Drop ALL policies (be thorough)
DO $$ 
DECLARE
  pol record;
BEGIN
  FOR pol IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'nutrition_goals'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON nutrition_goals', pol.policyname);
  END LOOP;
END $$;

-- Create simple, permissive policies
CREATE POLICY "nutrition_goals_select_policy"
  ON public.nutrition_goals
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "nutrition_goals_insert_policy"
  ON public.nutrition_goals
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "nutrition_goals_update_policy"
  ON public.nutrition_goals
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "nutrition_goals_delete_policy"
  ON public.nutrition_goals
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================================================
-- SECTION 6: Grant explicit permissions
-- ============================================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON public.nutrition_goals TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.nutrition_goals TO anon;

-- ============================================================================
-- SECTION 7: Verify everything
-- ============================================================================
-- Check policies
SELECT policyname, cmd, roles
FROM pg_policies
WHERE tablename = 'nutrition_goals';

-- Check permissions
SELECT 
  grantee,
  privilege_type
FROM information_schema.role_table_grants
WHERE table_name = 'nutrition_goals';

-- Test query as authenticated user
SELECT COUNT(*) 
FROM public.nutrition_goals
WHERE user_id = auth.uid();

