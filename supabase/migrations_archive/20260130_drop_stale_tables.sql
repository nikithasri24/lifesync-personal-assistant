-- Migration: Drop Stale/Duplicate Tables
-- This removes legacy and duplicate tables from the database
-- Tables to drop: transactions, accounts, categories, financial_accounts, financial_transactions, achievements, _sql

-- ==================== Drop Legacy Finance Tables ====================

-- Drop old transactions table (replaced by finance_transactions)
DROP TABLE IF EXISTS transactions CASCADE;

-- Drop old accounts table (replaced by finance_accounts)
DROP TABLE IF EXISTS accounts CASCADE;

-- Drop old categories table (replaced by finance_categories)
DROP TABLE IF EXISTS categories CASCADE;

-- Drop duplicate financial_accounts table (use finance_accounts instead)
DROP TABLE IF EXISTS financial_accounts CASCADE;

-- Drop duplicate financial_transactions table (use finance_transactions instead)
DROP TABLE IF EXISTS financial_transactions CASCADE;

-- ==================== Drop Unclear/Unknown Tables ====================

-- Drop achievements table if it's a duplicate of achievement_definitions
-- NOTE: Verify this is not being used before running!
DROP TABLE IF EXISTS achievements CASCADE;

-- Drop _sql table (unknown purpose, likely migration artifact)
DROP TABLE IF EXISTS _sql CASCADE;

-- ==================== Drop Related Functions/Triggers ====================

-- Drop any triggers related to old finance tables
DROP TRIGGER IF EXISTS trigger_transactions_updated_at ON transactions;
DROP TRIGGER IF EXISTS trigger_accounts_updated_at ON accounts;
DROP TRIGGER IF EXISTS trigger_categories_updated_at ON categories;
DROP TRIGGER IF EXISTS trigger_financial_accounts_updated_at ON financial_accounts;
DROP TRIGGER IF EXISTS trigger_financial_transactions_updated_at ON financial_transactions;

-- Drop any functions related to old finance tables
DROP FUNCTION IF EXISTS update_transactions_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_accounts_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_categories_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_financial_accounts_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_financial_transactions_updated_at() CASCADE;

-- ==================== Notes ====================
-- This migration removes legacy/duplicate tables from finance module refactoring
-- Active tables remain:
--   - finance_transactions (replaces transactions, financial_transactions)
--   - finance_accounts (replaces accounts, financial_accounts)
--   - finance_categories (replaces categories)
--   - achievement_definitions (replaces achievements)
--
-- IMPORTANT: Before running this migration, verify:
-- 1. All data has been migrated from old tables to new tables
-- 2. No active code references these old tables
-- 3. Run these queries first to check for data:
--    SELECT COUNT(*) FROM transactions;
--    SELECT COUNT(*) FROM accounts;
--    SELECT COUNT(*) FROM categories;
--    SELECT COUNT(*) FROM financial_accounts;
--    SELECT COUNT(*) FROM financial_transactions;
--    SELECT COUNT(*) FROM achievements;

