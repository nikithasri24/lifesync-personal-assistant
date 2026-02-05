-- Fix Bad Transaction Dates
-- Problem: Transactions showing "0049-12" instead of "2025-12"
-- Cause: Year was entered as 49 instead of 2025

-- Step 1: Find all transactions with bad years (year < 2000)
SELECT
  id,
  date,
  description,
  amount,
  type,
  EXTRACT(YEAR FROM date) as current_year,
  date + INTERVAL '1976 years' as corrected_date  -- 49 + 1976 = 2025
FROM finance_transactions
WHERE EXTRACT(YEAR FROM date) < 2000
ORDER BY date;

-- Step 2: Fix year 0049 → 2025 (adds 1976 years)
-- Uncomment the line below to apply the fix:
-- UPDATE finance_transactions SET date = date + INTERVAL '1976 years' WHERE EXTRACT(YEAR FROM date) = 49;

-- Step 3: Fix year 0050 → 2025 (adds 1975 years)
-- Uncomment the line below if you have year 50 entries:
-- UPDATE finance_transactions SET date = date + INTERVAL '1975 years' WHERE EXTRACT(YEAR FROM date) = 50;

-- Step 4: Verify no more bad dates exist
-- SELECT COUNT(*) FROM finance_transactions WHERE EXTRACT(YEAR FROM date) < 2000;
