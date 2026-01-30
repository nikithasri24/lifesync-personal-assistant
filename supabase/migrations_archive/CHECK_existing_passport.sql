-- Check your existing passport
-- Your user ID: 86a4967b-bd37-42c2-9beb-7a0cbf47640c

SELECT 
  id,
  user_id,
  country_name,
  country_code,
  is_primary,
  passport_number,
  issue_date,
  expiry_date,
  connection_id,
  created_at,
  updated_at
FROM user_passports 
WHERE user_id = '86a4967b-bd37-42c2-9beb-7a0cbf47640c';

-- Also check all passports to see if there are any
SELECT 
  id,
  user_id,
  country_name,
  country_code,
  is_primary,
  connection_id
FROM user_passports
ORDER BY created_at DESC;

