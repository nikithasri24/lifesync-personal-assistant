-- Migration: Add merge support for Visa Calculator
-- This allows connected users to share passport and visa data when both set their permission to "merged"
-- Following the same pattern as travel and goals
--
-- Visa Types:
-- 1. Personal passports/visas (connection_id = NULL) - Only owner sees their data
-- 2. Shared passports/visas (connection_id set) - Both partners see the same data

-- ==================== Add connection_id to user_passports ====================

ALTER TABLE user_passports ADD COLUMN IF NOT EXISTS connection_id UUID REFERENCES profile_connections(id) ON DELETE CASCADE;

-- Create index for efficient lookups by connection
CREATE INDEX IF NOT EXISTS idx_user_passports_connection_id ON user_passports(connection_id);

-- ==================== Add connection_id to user_visas ====================

ALTER TABLE user_visas ADD COLUMN IF NOT EXISTS connection_id UUID REFERENCES profile_connections(id) ON DELETE CASCADE;

-- Create index for efficient lookups by connection
CREATE INDEX IF NOT EXISTS idx_user_visas_connection_id ON user_visas(connection_id);

-- ==================== Update RLS Policies for user_passports ====================

-- Drop existing policy
DROP POLICY IF EXISTS "Users can view their own passports" ON user_passports;

-- Create new policy that allows:
-- 1. Viewing own passports (personal or shared)
-- 2. Viewing partner's passports when both have merged permission
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
  -- Partner's personal passports in merged mode:
  -- The passport belongs to a partner (user_id != me) AND connection_id IS NULL (personal passport)
  -- AND both users have 'merged' permission for 'visa' module
  (connection_id IS NULL AND user_id IN (
    SELECT 
      CASE 
        WHEN pc.requester_id = auth.uid() THEN pc.receiver_id
        ELSE pc.requester_id
      END as partner_id
    FROM profile_connections pc
    WHERE (pc.requester_id = auth.uid() OR pc.receiver_id = auth.uid())
    AND pc.status = 'active'
    -- Check that BOTH users have merged permission for visa
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

-- ==================== Update RLS Policies for user_visas ====================

-- Drop existing policy
DROP POLICY IF EXISTS "Users can view their own visas" ON user_visas;

-- Create new policy that allows:
-- 1. Viewing own visas (personal or shared)
-- 2. Viewing partner's visas when both have merged permission
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
  -- Partner's personal visas in merged mode:
  -- The visa belongs to a partner (user_id != me) AND connection_id IS NULL (personal visa)
  -- AND both users have 'merged' permission for 'visa' module
  (connection_id IS NULL AND user_id IN (
    SELECT 
      CASE 
        WHEN pc.requester_id = auth.uid() THEN pc.receiver_id
        ELSE pc.requester_id
      END as partner_id
    FROM profile_connections pc
    WHERE (pc.requester_id = auth.uid() OR pc.receiver_id = auth.uid())
    AND pc.status = 'active'
    -- Check that BOTH users have merged permission for visa
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

-- Add comments for documentation
COMMENT ON COLUMN user_passports.connection_id IS 'If set, this passport is shared between connected users. NULL = personal passport.';
COMMENT ON COLUMN user_visas.connection_id IS 'If set, this visa is shared between connected users. NULL = personal visa.';

