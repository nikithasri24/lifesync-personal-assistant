-- ============================================================================
-- VERIFICATION SCRIPT FOR RECURRING TRANSACTIONS MIGRATION
-- ============================================================================
-- Run this after applying the migrations to verify everything is set up correctly

-- 1. Check tables exist
SELECT
  'Tables Created' as check_name,
  COUNT(*) as count,
  CASE
    WHEN COUNT(*) = 2 THEN '✅ PASS'
    ELSE '❌ FAIL - Expected 2 tables'
  END as status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('recurring_transactions', 'pending_transactions');

-- 2. Check RLS is enabled
SELECT
  'RLS Enabled' as check_name,
  COUNT(*) as count,
  CASE
    WHEN COUNT(*) = 2 THEN '✅ PASS'
    ELSE '❌ FAIL - Expected RLS on 2 tables'
  END as status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('recurring_transactions', 'pending_transactions')
  AND rowsecurity = true;

-- 3. Check RLS policies exist
SELECT
  'RLS Policies' as check_name,
  COUNT(*) as count,
  CASE
    WHEN COUNT(*) = 8 THEN '✅ PASS'
    ELSE '❌ FAIL - Expected 8 policies (4 per table)'
  END as status
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('recurring_transactions', 'pending_transactions');

-- 4. Check indexes exist
SELECT
  'Indexes Created' as check_name,
  COUNT(*) as count,
  CASE
    WHEN COUNT(*) >= 8 THEN '✅ PASS'
    ELSE '❌ FAIL - Expected at least 8 indexes'
  END as status
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('recurring_transactions', 'pending_transactions');

-- 5. Check trigger exists
SELECT
  'Triggers' as check_name,
  COUNT(*) as count,
  CASE
    WHEN COUNT(*) >= 1 THEN '✅ PASS'
    ELSE '❌ FAIL - Expected update trigger'
  END as status
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND event_object_table = 'recurring_transactions'
  AND trigger_name = 'update_recurring_transactions_updated_at';

-- 6. List all policies for review
SELECT
  tablename,
  policyname,
  cmd as operation
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('recurring_transactions', 'pending_transactions')
ORDER BY tablename, cmd;

-- 7. List all indexes for review
SELECT
  indexname,
  tablename
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('recurring_transactions', 'pending_transactions')
ORDER BY tablename, indexname;

-- ============================================================================
-- If all checks show ✅ PASS, the migration was successful!
-- ============================================================================
