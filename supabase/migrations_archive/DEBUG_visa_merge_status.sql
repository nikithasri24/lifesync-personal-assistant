-- Debug script to check visa merge mode status
-- Run this in Supabase SQL Editor to see your current setup

-- 1. Check your active connections
SELECT 
  pc.id as connection_id,
  pc.status,
  CASE 
    WHEN pc.requester_id = auth.uid() THEN 'You are requester'
    ELSE 'You are receiver'
  END as your_role,
  CASE 
    WHEN pc.requester_id = auth.uid() THEN pc.receiver_id
    ELSE pc.requester_id
  END as partner_id,
  CASE 
    WHEN pc.requester_id = auth.uid() THEN (SELECT full_name FROM profiles WHERE id = pc.receiver_id)
    ELSE (SELECT full_name FROM profiles WHERE id = pc.requester_id)
  END as partner_name
FROM profile_connections pc
WHERE (pc.requester_id = auth.uid() OR pc.receiver_id = auth.uid())
AND pc.status = 'active';

-- 2. Check module permissions for visa
SELECT 
  mp.connection_id,
  mp.user_id,
  CASE 
    WHEN mp.user_id = auth.uid() THEN 'You'
    ELSE 'Partner'
  END as who,
  mp.module,
  mp.permission_level,
  (SELECT full_name FROM profiles WHERE id = mp.user_id) as user_name
FROM module_permissions mp
WHERE mp.module = 'visa'
AND mp.connection_id IN (
  SELECT id FROM profile_connections
  WHERE (requester_id = auth.uid() OR receiver_id = auth.uid())
  AND status = 'active'
)
ORDER BY mp.connection_id, who;

-- 3. Check your passports
SELECT 
  id,
  user_id,
  CASE 
    WHEN user_id = auth.uid() THEN 'Your passport'
    ELSE 'Partner passport'
  END as ownership,
  country_name,
  country_code,
  is_primary,
  connection_id,
  created_at
FROM user_passports
ORDER BY is_primary DESC, created_at DESC;

-- 4. Check your visas
SELECT 
  id,
  user_id,
  CASE 
    WHEN user_id = auth.uid() THEN 'Your visa'
    ELSE 'Partner visa'
  END as ownership,
  country_name,
  country_code,
  expiry_date,
  CASE 
    WHEN expiry_date >= CURRENT_DATE THEN 'Valid'
    ELSE 'Expired'
  END as status,
  connection_id,
  created_at
FROM user_visas
ORDER BY expiry_date DESC;

-- 5. Check if merged mode is enabled (should return 1 row if both have merged)
SELECT 
  pc.id as connection_id,
  (SELECT full_name FROM profiles WHERE id = 
    CASE 
      WHEN pc.requester_id = auth.uid() THEN pc.receiver_id
      ELSE pc.requester_id
    END
  ) as partner_name,
  'MERGED MODE ENABLED' as status
FROM profile_connections pc
WHERE (pc.requester_id = auth.uid() OR pc.receiver_id = auth.uid())
AND pc.status = 'active'
AND EXISTS (
  SELECT 1 FROM module_permissions mp1
  WHERE mp1.connection_id = pc.id
  AND mp1.module = 'visa'
  AND mp1.user_id = auth.uid()
  AND mp1.permission_level = 'merged'
)
AND EXISTS (
  SELECT 1 FROM module_permissions mp2
  WHERE mp2.connection_id = pc.id
  AND mp2.module = 'visa'
  AND mp2.user_id = (
    CASE 
      WHEN pc.requester_id = auth.uid() THEN pc.receiver_id
      ELSE pc.requester_id
    END
  )
  AND mp2.permission_level = 'merged'
);

