-- Update account ownership and strip names from account names
-- Accounts with "nikki" in the name -> owned by nikitha.lisi@gmail.com
-- Accounts with "kaush" in the name -> owned by srinikithakalidindi@gmail.com
-- Strip "nikki" and "kaush" from account names

-- Get user IDs
DO $$
DECLARE
  nikki_user_id UUID;
  sri_user_id UUID;
BEGIN
  -- Get Nikki's user ID
  SELECT id INTO nikki_user_id
  FROM auth.users
  WHERE email = 'nikitha.lisi@gmail.com';

  -- Get Sri's user ID
  SELECT id INTO sri_user_id
  FROM auth.users
  WHERE email = 'srinikithakalidindi@gmail.com';

  -- Update accounts with "nikki" in the name
  -- Set ownership to Nikki and strip "nikki" from the name
  UPDATE finance_accounts
  SET 
    user_id = nikki_user_id,
    name = TRIM(REGEXP_REPLACE(name, 'nikki', '', 'gi'))
  WHERE LOWER(name) LIKE '%nikki%';

  -- Update accounts with "kaush" in the name
  -- Set ownership to Sri and strip "kaush" from the name
  UPDATE finance_accounts
  SET 
    user_id = sri_user_id,
    name = TRIM(REGEXP_REPLACE(name, 'kaush', '', 'gi'))
  WHERE LOWER(name) LIKE '%kaush%';

  -- Log the changes
  RAISE NOTICE 'Updated accounts with "nikki" to be owned by nikitha.lisi@gmail.com';
  RAISE NOTICE 'Updated accounts with "kaush" to be owned by srinikithakalidindi@gmail.com';
  RAISE NOTICE 'Stripped "nikki" and "kaush" from account names';
END $$;

-- Verify the changes
SELECT 
  id, 
  name, 
  (SELECT email FROM auth.users WHERE id = fa.user_id) as owner_email
FROM finance_accounts fa
ORDER BY name;

