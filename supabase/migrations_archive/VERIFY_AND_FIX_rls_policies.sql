-- ==================== VERIFY AND FIX RLS POLICIES ====================
-- Run this in Supabase SQL Editor to check and fix RLS policies for user_passports and user_visas
-- This ensures the policies support both personal and merged mode correctly

-- ==================== STEP 1: Check Current Policies ====================

SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd,
  qual
FROM pg_policies
WHERE tablename IN ('user_passports', 'user_visas')
ORDER BY tablename, policyname;

-- ==================== STEP 2: Fix user_passports RLS Policies ====================

-- Drop all existing SELECT policies
DROP POLICY IF EXISTS "Users can view own passports" ON user_passports;
DROP POLICY IF EXISTS "Users can view own and merged passports" ON user_passports;
DROP POLICY IF EXISTS "Users can view their own passports" ON user_passports;

-- Create the correct SELECT policy
CREATE POLICY "Users can view own and merged passports" ON user_passports
FOR SELECT
USING (
  -- Own passports (personal or shared)
  user_id = auth.uid()
  OR
  -- Shared passports in this connection (connection_id is set)
  (connection_id IS NOT NULL AND connection_id IN (
    SELECT id FROM profile_connections
    WHERE (requester_id = auth.uid() OR receiver_id = auth.uid())
    AND status = 'active'
  ))
  OR
  -- Partner's personal passports in merged mode
  (connection_id IS NULL AND user_id IN (
    SELECT 
      CASE 
        WHEN pc.requester_id = auth.uid() THEN pc.receiver_id
        ELSE pc.requester_id
      END as partner_id
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
    )
  ))
);

-- ==================== STEP 3: Fix user_visas RLS Policies ====================

-- Drop all existing SELECT policies
DROP POLICY IF EXISTS "Users can view own visas" ON user_visas;
DROP POLICY IF EXISTS "Users can view own and merged visas" ON user_visas;
DROP POLICY IF EXISTS "Users can view their own visas" ON user_visas;

-- Create the correct SELECT policy
CREATE POLICY "Users can view own and merged visas" ON user_visas
FOR SELECT
USING (
  -- Own visas (personal or shared)
  user_id = auth.uid()
  OR
  -- Shared visas in this connection (connection_id is set)
  (connection_id IS NOT NULL AND connection_id IN (
    SELECT id FROM profile_connections
    WHERE (requester_id = auth.uid() OR receiver_id = auth.uid())
    AND status = 'active'
  ))
  OR
  -- Partner's personal visas in merged mode
  (connection_id IS NULL AND user_id IN (
    SELECT 
      CASE 
        WHEN pc.requester_id = auth.uid() THEN pc.receiver_id
        ELSE pc.requester_id
      END as partner_id
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
    )
  ))
);

-- ==================== STEP 4: Verify Policies Were Created ====================

SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd
FROM pg_policies
WHERE tablename IN ('user_passports', 'user_visas')
AND policyname LIKE '%view%'
ORDER BY tablename, policyname;

-- ==================== SUCCESS MESSAGE ====================
-- If you see the policies listed above, the fix was successful!
-- The policies now support:
-- 1. Viewing your own passports/visas (personal or shared)
-- 2. Viewing shared passports/visas in active connections
-- 3. Viewing partner's personal passports/visas in merged mode

