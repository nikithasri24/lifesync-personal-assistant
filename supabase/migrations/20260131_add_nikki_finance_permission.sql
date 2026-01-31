-- Migration: Add missing finance merge permission for Nikki
-- Description: Adds the merged permission for Nikki so both users can see each other's accounts
-- Date: 2026-01-31

-- Add merged permission for Nikki (nikitha.lisi@gmail.com)
-- This ensures BOTH users have merged permission, which is required by the RLS policy
INSERT INTO module_permissions (connection_id, module, permission_level, user_id)
SELECT
  '7c61034d-5b49-4b48-9f4a-ea90cee473ae' as connection_id,
  'finances' as module,
  'merged' as permission_level,
  id as user_id
FROM auth.users
WHERE email = 'nikitha.lisi@gmail.com'
ON CONFLICT (connection_id, module, user_id)
DO UPDATE SET permission_level = 'merged';

-- Verify both users now have merged permission
SELECT
  mp.id,
  mp.connection_id,
  mp.module,
  mp.permission_level,
  u.email as user_email
FROM module_permissions mp
JOIN auth.users u ON u.id = mp.user_id
WHERE mp.connection_id = '7c61034d-5b49-4b48-9f4a-ea90cee473ae'
  AND mp.module = 'finances'
ORDER BY u.email;

