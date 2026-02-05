-- Fix transactions with year 0049 (should be 2025)
-- This likely happened due to a date parsing error

-- Update year 49 to 2025 (adds 1976 years: 49 + 1976 = 2025)
UPDATE finance_transactions
SET date = date + INTERVAL '1976 years'
WHERE EXTRACT(YEAR FROM date) = 49;

-- Also fix year 0050 if any (adds 1975 years: 50 + 1975 = 2025)
UPDATE finance_transactions
SET date = date + INTERVAL '1975 years'
WHERE EXTRACT(YEAR FROM date) = 50;
