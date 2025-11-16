-- Cleanup Old 75 Hard Tables
-- This script removes the old schema after successful migration to new tables
--
-- IMPORTANT: Only run this after verifying new tables work correctly!
--
-- Tables to drop:
-- - sfh_challenges (plural) -> migrated to sfh_challenge (singular)
-- - sfh_entries -> migrated to sfh_daily_checkins
-- - sfh_challenge_audit (if exists)
--
-- Related objects:
-- - Views
-- - Functions
-- - Triggers

DO $$
BEGIN
    RAISE NOTICE '🗑️  Dropping old 75 Hard schema objects...';

    -- Drop audit table if exists
    DROP TABLE IF EXISTS sfh_challenge_audit CASCADE;
    RAISE NOTICE '✅ Dropped sfh_challenge_audit';

    -- Drop old entries table
    DROP TABLE IF EXISTS sfh_entries CASCADE;
    RAISE NOTICE '✅ Dropped sfh_entries';

    -- Drop old challenges table
    DROP TABLE IF EXISTS sfh_challenges CASCADE;
    RAISE NOTICE '✅ Dropped sfh_challenges';

    -- Drop old views if they exist
    DROP VIEW IF EXISTS v_active_challenges CASCADE;
    RAISE NOTICE '✅ Dropped old views';

    -- Drop old functions if they exist
    DROP FUNCTION IF EXISTS get_user_75hard_stats CASCADE;
    DROP FUNCTION IF EXISTS sync_sfh_challenge_status CASCADE;
    DROP FUNCTION IF EXISTS validate_sfh_entry_date CASCADE;
    RAISE NOTICE '✅ Dropped old functions';

    RAISE NOTICE '';
    RAISE NOTICE '====================================';
    RAISE NOTICE '✅ Cleanup completed successfully!';
    RAISE NOTICE '====================================';
    RAISE NOTICE 'Old tables removed:';
    RAISE NOTICE '  - sfh_challenges';
    RAISE NOTICE '  - sfh_entries';
    RAISE NOTICE '  - sfh_challenge_audit';
    RAISE NOTICE '';
    RAISE NOTICE 'New tables in use:';
    RAISE NOTICE '  - sfh_challenge (singular)';
    RAISE NOTICE '  - sfh_daily_checkins';
END $$;

-- Verify cleanup
SELECT
    tablename,
    schemaname
FROM pg_tables
WHERE tablename LIKE 'sfh_%'
ORDER BY tablename;
