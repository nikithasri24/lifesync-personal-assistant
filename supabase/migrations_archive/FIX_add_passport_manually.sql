-- Manual fix: Add your passport directly
-- This bypasses the API and adds the passport directly to the database

-- STEP 1: Get your user ID from the auth.users table
-- Look for your email in the results
SELECT id, email, created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;

-- STEP 2: Copy your user ID from the results above and replace 'YOUR_USER_ID_HERE' below
-- Then run this INSERT statement:

-- INSERT INTO user_passports (user_id, country_name, country_code, is_primary)
-- VALUES ('YOUR_USER_ID_HERE', 'India', 'IN', true);

-- STEP 3: Verify it was added (replace YOUR_USER_ID_HERE with your actual ID)
-- SELECT * FROM user_passports WHERE user_id = 'YOUR_USER_ID_HERE';

