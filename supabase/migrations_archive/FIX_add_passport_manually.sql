-- Manual fix: Add your passport directly
-- This bypasses the API and adds the passport directly to the database

-- First, check your user ID
SELECT auth.uid() as your_user_id;

-- Then, add your India passport
-- Replace the user_id with your actual user ID from the query above if needed
INSERT INTO user_passports (user_id, country_name, country_code, is_primary)
VALUES (auth.uid(), 'India', 'IN', true)
ON CONFLICT DO NOTHING;

-- Verify it was added
SELECT * FROM user_passports WHERE user_id = auth.uid();

