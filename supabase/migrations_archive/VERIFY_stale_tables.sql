-- Verification Script: Check Stale Tables Before Dropping
-- Run this BEFORE running 20260130_drop_stale_tables.sql
-- This will show you if any of the stale tables contain data

-- ==================== Check Legacy Finance Tables ====================

-- Check transactions table
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'transactions') THEN
        RAISE NOTICE '=== TRANSACTIONS TABLE ===';
        EXECUTE 'SELECT COUNT(*) as row_count FROM transactions';
    ELSE
        RAISE NOTICE 'transactions table does not exist';
    END IF;
END $$;

-- Check accounts table
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'accounts') THEN
        RAISE NOTICE '=== ACCOUNTS TABLE ===';
        EXECUTE 'SELECT COUNT(*) as row_count FROM accounts';
    ELSE
        RAISE NOTICE 'accounts table does not exist';
    END IF;
END $$;

-- Check categories table
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'categories') THEN
        RAISE NOTICE '=== CATEGORIES TABLE ===';
        EXECUTE 'SELECT COUNT(*) as row_count FROM categories';
    ELSE
        RAISE NOTICE 'categories table does not exist';
    END IF;
END $$;

-- Check financial_accounts table
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'financial_accounts') THEN
        RAISE NOTICE '=== FINANCIAL_ACCOUNTS TABLE ===';
        EXECUTE 'SELECT COUNT(*) as row_count FROM financial_accounts';
    ELSE
        RAISE NOTICE 'financial_accounts table does not exist';
    END IF;
END $$;

-- Check financial_transactions table
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'financial_transactions') THEN
        RAISE NOTICE '=== FINANCIAL_TRANSACTIONS TABLE ===';
        EXECUTE 'SELECT COUNT(*) as row_count FROM financial_transactions';
    ELSE
        RAISE NOTICE 'financial_transactions table does not exist';
    END IF;
END $$;

-- ==================== Check Unclear Tables ====================

-- Check achievements table
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'achievements') THEN
        RAISE NOTICE '=== ACHIEVEMENTS TABLE ===';
        EXECUTE 'SELECT COUNT(*) as row_count FROM achievements';
    ELSE
        RAISE NOTICE 'achievements table does not exist';
    END IF;
END $$;

-- Check _sql table
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '_sql') THEN
        RAISE NOTICE '=== _SQL TABLE ===';
        EXECUTE 'SELECT COUNT(*) as row_count FROM _sql';
    ELSE
        RAISE NOTICE '_sql table does not exist';
    END IF;
END $$;

-- ==================== Summary ====================

SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
  AND table_name IN ('transactions', 'accounts', 'categories', 'financial_accounts', 'financial_transactions', 'achievements', '_sql')
ORDER BY table_name;

