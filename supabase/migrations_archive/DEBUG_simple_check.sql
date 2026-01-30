-- Simple debug queries - run these one at a time

-- 1. Check your user ID
SELECT auth.uid() as my_user_id;

-- 2. Check ALL passports (without RLS)
SELECT 
  id,
  user_id,
  country_name,
  country_code,
  is_primary,
  connection_id,
  created_at
FROM user_passports;

-- 3. Check if you have any passports
SELECT COUNT(*) as passport_count
FROM user_passports
WHERE user_id = auth.uid();

-- 4. Check ALL visas (without RLS)
SELECT 
  id,
  user_id,
  country_name,
  expiry_date,
  connection_id
FROM user_visas;

-- 5. Check your connections
SELECT 
  id,
  requester_id,
  receiver_id,
  status,
  created_at
FROM profile_connections
WHERE requester_id = auth.uid() OR receiver_id = auth.uid();

-- 6. Check visa module permissions
SELECT 
  connection_id,
  user_id,
  module,
  permission_level
FROM module_permissions
WHERE module = 'visa';

