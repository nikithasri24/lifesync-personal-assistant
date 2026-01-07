-- NUCLEAR OPTION: Complete Reset of nutrition_goals RLS
-- This will completely reset all security policies and permissions
-- Run this if all other fixes have failed

-- ============================================================================
-- STEP 1: Completely disable RLS temporarily
-- ============================================================================
ALTER TABLE IF EXISTS public.nutrition_goals DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 2: Drop EVERY policy (use dynamic SQL to be thorough)
-- ============================================================================
DO $$ 
DECLARE
  pol record;
BEGIN
  FOR pol IN 
    SELECT schemaname, tablename, policyname
    FROM pg_policies 
    WHERE tablename = 'nutrition_goals'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
      pol.policyname, pol.schemaname, pol.tablename);
    RAISE NOTICE 'Dropped policy: %', pol.policyname;
  END LOOP;
END $$;

-- ============================================================================
-- STEP 3: Grant all permissions explicitly
-- ============================================================================
GRANT ALL ON public.nutrition_goals TO authenticated;
GRANT ALL ON public.nutrition_goals TO anon;
GRANT ALL ON public.nutrition_goals TO postgres;

-- ============================================================================
-- STEP 4: Re-enable RLS
-- ============================================================================
ALTER TABLE public.nutrition_goals ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 5: Create SIMPLE policies with TO clause
-- ============================================================================

-- SELECT policy
CREATE POLICY "nutrition_goals_select"
  ON public.nutrition_goals
  FOR SELECT
  TO public, authenticated, anon
  USING (
    auth.uid() = user_id
  );

-- INSERT policy  
CREATE POLICY "nutrition_goals_insert"
  ON public.nutrition_goals
  FOR INSERT
  TO public, authenticated, anon
  WITH CHECK (
    auth.uid() = user_id
  );

-- UPDATE policy
CREATE POLICY "nutrition_goals_update"
  ON public.nutrition_goals
  FOR UPDATE
  TO public, authenticated, anon
  USING (
    auth.uid() = user_id
  )
  WITH CHECK (
    auth.uid() = user_id
  );

-- DELETE policy
CREATE POLICY "nutrition_goals_delete"
  ON public.nutrition_goals
  FOR DELETE
  TO public, authenticated, anon
  USING (
    auth.uid() = user_id
  );

-- ============================================================================
-- STEP 6: Verify policies were created
-- ============================================================================
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'nutrition_goals'
ORDER BY policyname;

-- Should show 4 policies

-- ============================================================================
-- STEP 7: Test the query
-- ============================================================================
-- This should work now
SELECT 
  id,
  user_id,
  calories_target,
  is_active,
  created_at
FROM public.nutrition_goals
WHERE user_id = auth.uid()
  AND is_active = true
LIMIT 1;

-- ============================================================================
-- STEP 8: Check table permissions
-- ============================================================================
SELECT 
  grantee,
  table_schema,
  table_name,
  privilege_type
FROM information_schema.role_table_grants
WHERE table_name = 'nutrition_goals'
ORDER BY grantee, privilege_type;

-- ============================================================================
-- Expected Results:
-- ============================================================================
-- 1. All old policies dropped
-- 2. 4 new policies created (nutrition_goals_select, insert, update, delete)
-- 3. Permissions granted to authenticated, anon, postgres
-- 4. Test query succeeds (returns 0 or 1 row)
-- 5. Table permissions show SELECT, INSERT, UPDATE, DELETE for authenticated and anon

-- ============================================================================
-- If this STILL doesn't work, the issue is likely:
-- ============================================================================
-- 1. Supabase project-level settings (API settings, CORS, etc.)
-- 2. The table doesn't exist in the public schema
-- 3. There's a trigger or function blocking access
-- 4. The auth.uid() function is not working correctly
-- 5. The Supabase anon key doesn't have the right permissions

