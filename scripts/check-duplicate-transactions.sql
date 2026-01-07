-- Query to check for duplicate transactions in your database
-- Run this in the Supabase SQL Editor before applying the migration

-- =====================================================
-- Find exact duplicates
-- =====================================================

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
  MAX(created_at) as last_created,
  SUM(amount) as total_amount
FROM transactions
GROUP BY user_id, account_id, date, description, amount, type, category_id
HAVING COUNT(*) > 1
ORDER BY date DESC, amount DESC;

-- =====================================================
-- Summary of duplicates by type
-- =====================================================

SELECT
  type,
  COUNT(*) as duplicate_groups,
  SUM(duplicate_count - 1) as extra_transactions,
  SUM((duplicate_count - 1) * amount) as excess_amount
FROM (
  SELECT
    type,
    amount,
    COUNT(*) as duplicate_count
  FROM transactions
  GROUP BY user_id, account_id, date, description, amount, type, category_id
  HAVING COUNT(*) > 1
) AS duplicates
GROUP BY type
ORDER BY type;

-- =====================================================
-- Find your specific salary duplicates
-- =====================================================

SELECT
  id,
  date,
  description,
  amount,
  type,
  category_id,
  created_at,
  account_id
FROM transactions
WHERE type = 'credit'
  AND description ILIKE '%salary%'
  AND user_id = auth.uid()
ORDER BY date DESC, created_at ASC;
