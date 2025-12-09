-- Migration: Remove Duplicate Transactions and Add Safeguards
-- Created: 2025-12-09
-- Purpose:
--   1. Find and report duplicate transactions
--   2. Remove duplicate transactions (keeping the oldest one)
--   3. Add a unique constraint to prevent future duplicates

-- =====================================================
-- STEP 1: Create a report of duplicates before removal
-- =====================================================

-- Create a temporary table to store duplicate information
CREATE TEMP TABLE duplicate_transactions_report AS
SELECT
  user_id,
  account_id,
  date,
  description,
  amount,
  type,
  category_id,
  COUNT(*) as duplicate_count,
  ARRAY_AGG(id ORDER BY created_at) as transaction_ids,
  MIN(created_at) as first_created,
  MAX(created_at) as last_created
FROM transactions
GROUP BY user_id, account_id, date, description, amount, type, category_id
HAVING COUNT(*) > 1;

-- Show duplicate report (this will be visible in migration output)
DO $$
DECLARE
  dup_record RECORD;
  total_duplicates INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_duplicates FROM duplicate_transactions_report;

  IF total_duplicates > 0 THEN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'DUPLICATE TRANSACTIONS REPORT';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Found % groups of duplicate transactions', total_duplicates;
    RAISE NOTICE '';

    FOR dup_record IN
      SELECT * FROM duplicate_transactions_report
      ORDER BY user_id, date DESC
    LOOP
      RAISE NOTICE 'Duplicate Group:';
      RAISE NOTICE '  Date: %', dup_record.date;
      RAISE NOTICE '  Description: %', dup_record.description;
      RAISE NOTICE '  Amount: %', dup_record.amount;
      RAISE NOTICE '  Type: %', dup_record.type;
      RAISE NOTICE '  Duplicate Count: %', dup_record.duplicate_count;
      RAISE NOTICE '  Transaction IDs: %', dup_record.transaction_ids;
      RAISE NOTICE '  Will keep: % (oldest)', (dup_record.transaction_ids)[1];
      RAISE NOTICE '';
    END LOOP;
  ELSE
    RAISE NOTICE 'No duplicate transactions found.';
  END IF;
END $$;

-- =====================================================
-- STEP 2: Delete duplicate transactions (keep oldest)
-- =====================================================

-- Delete duplicates, keeping only the first (oldest by created_at) transaction
DELETE FROM transactions t1
USING (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, account_id, date, description, amount, type, category_id
      ORDER BY created_at ASC
    ) as row_num
  FROM transactions
) t2
WHERE t1.id = t2.id
  AND t2.row_num > 1;

-- Report how many duplicates were removed
DO $$
DECLARE
  deleted_count INTEGER;
BEGIN
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Removed % duplicate transaction(s)', deleted_count;
  RAISE NOTICE '========================================';
END $$;

-- =====================================================
-- STEP 3: Add unique constraint to prevent future duplicates
-- =====================================================

-- Create a unique index to prevent duplicate transactions
-- This allows the same transaction details on different accounts or by different users
-- but prevents exact duplicates (same user, account, date, description, amount, type)
CREATE UNIQUE INDEX IF NOT EXISTS transactions_unique_constraint
ON transactions (user_id, account_id, date, description, amount, type, category_id);

-- Add a comment explaining the constraint
COMMENT ON INDEX transactions_unique_constraint IS
  'Prevents duplicate transactions with the same user, account, date, description, amount, type, and category. Added to fix issue where income was being double-counted due to duplicate entries.';

-- =====================================================
-- STEP 4: Create a function to help identify near-duplicates
-- =====================================================

-- Function to find potential duplicate transactions (even if not exact matches)
CREATE OR REPLACE FUNCTION find_potential_duplicate_transactions(
  p_user_id UUID DEFAULT NULL,
  p_days_window INTEGER DEFAULT 3,
  p_amount_tolerance NUMERIC DEFAULT 0
)
RETURNS TABLE (
  transaction1_id UUID,
  transaction2_id UUID,
  date1 DATE,
  date2 DATE,
  description1 TEXT,
  description2 TEXT,
  amount NUMERIC,
  type TEXT,
  similarity_score NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    t1.id as transaction1_id,
    t2.id as transaction2_id,
    t1.date as date1,
    t2.date as date2,
    t1.description as description1,
    t2.description as description2,
    t1.amount,
    t1.type,
    CASE
      WHEN t1.date = t2.date AND t1.description = t2.description THEN 1.0
      WHEN t1.date = t2.date THEN 0.8
      WHEN t1.description = t2.description THEN 0.6
      ELSE 0.4
    END as similarity_score
  FROM transactions t1
  INNER JOIN transactions t2
    ON t1.id < t2.id
    AND t1.user_id = t2.user_id
    AND t1.account_id = t2.account_id
    AND t1.type = t2.type
    AND ABS(t1.amount - t2.amount) <= p_amount_tolerance
    AND ABS(t1.date - t2.date) <= p_days_window
  WHERE (p_user_id IS NULL OR t1.user_id = p_user_id)
    AND (
      t1.date = t2.date
      OR t1.description = t2.description
      OR ABS(t1.date - t2.date) <= 1
    )
  ORDER BY t1.date DESC, similarity_score DESC;
END;
$$;

COMMENT ON FUNCTION find_potential_duplicate_transactions IS
  'Finds potential duplicate transactions within a time window and amount tolerance. Useful for identifying near-duplicates that may have been entered with slight variations.';

-- =====================================================
-- VERIFICATION
-- =====================================================

DO $$
DECLARE
  remaining_duplicates INTEGER;
BEGIN
  -- Check if any duplicates remain
  SELECT COUNT(*) INTO remaining_duplicates
  FROM (
    SELECT user_id, account_id, date, description, amount, type, category_id
    FROM transactions
    GROUP BY user_id, account_id, date, description, amount, type, category_id
    HAVING COUNT(*) > 1
  ) AS dups;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'VERIFICATION';
  RAISE NOTICE '========================================';

  IF remaining_duplicates = 0 THEN
    RAISE NOTICE '✓ No duplicate transactions remaining';
    RAISE NOTICE '✓ Unique constraint added successfully';
    RAISE NOTICE '✓ Helper function created: find_potential_duplicate_transactions()';
  ELSE
    RAISE WARNING '⚠ Warning: % duplicate groups still exist', remaining_duplicates;
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE 'To find potential near-duplicates in the future, run:';
  RAISE NOTICE '  SELECT * FROM find_potential_duplicate_transactions();';
  RAISE NOTICE '';
END $$;
