-- Fix Credit Card Liability Flag
-- This sets the liability flag to true for all credit card accounts

-- First, check which accounts need to be fixed
SELECT
  id,
  name,
  type,
  balance,
  liability,
  CASE
    WHEN type = 'credit' AND liability = false THEN '❌ NEEDS FIX'
    WHEN type = 'credit' AND liability = true THEN '✅ Already correct'
    ELSE 'ℹ️ Not a credit card'
  END as status
FROM accounts
WHERE user_id = auth.uid()
ORDER BY type, name;

-- Update all credit card accounts to have liability = true
UPDATE accounts
SET liability = true
WHERE user_id = auth.uid()
  AND type = 'credit'
  AND liability = false;

-- Verify the fix
SELECT
  id,
  name,
  type,
  balance,
  liability,
  '✅ Fixed!' as status
FROM accounts
WHERE user_id = auth.uid()
  AND type = 'credit'
ORDER BY name;
