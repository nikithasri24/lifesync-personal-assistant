-- Migration: Add merge support for Travel
-- This allows connected users to share travel data when both set their permission to "merged"
-- Following the same pattern as meal_plans and life_goals
--
-- Travel Types:
-- 1. Personal travel (connection_id = NULL) - Only owner sees their visited locations
-- 2. Shared travel (connection_id set) - Both partners see the same visited locations

-- ==================== Add connection_id to visited_locations ====================

ALTER TABLE visited_locations ADD COLUMN IF NOT EXISTS connection_id UUID REFERENCES profile_connections(id) ON DELETE CASCADE;

-- Make user_id nullable to support shared locations (where user_id is NULL and connection_id is set)
ALTER TABLE visited_locations ALTER COLUMN user_id DROP NOT NULL;

-- Create index for efficient lookups by connection
CREATE INDEX IF NOT EXISTS idx_visited_locations_connection_id ON visited_locations(connection_id);

-- Drop existing RLS policies to handle re-runs
DROP POLICY IF EXISTS "Users can view their own visited locations" ON visited_locations;
DROP POLICY IF EXISTS "Users can insert their own visited locations" ON visited_locations;
DROP POLICY IF EXISTS "Users can update their own visited locations" ON visited_locations;
DROP POLICY IF EXISTS "Users can delete their own visited locations" ON visited_locations;

-- RLS Policy: Users can view own locations, shared locations, and partner's locations in merged mode
CREATE POLICY "Users can view own and partner locations in merged mode" ON visited_locations
FOR SELECT USING (
  -- Own locations
  (auth.uid() = user_id)
  OR
  -- Shared locations (connection_id is set and user is part of that connection)
  (connection_id IS NOT NULL AND connection_id IN (
    SELECT id FROM profile_connections 
    WHERE (requester_id = auth.uid() OR receiver_id = auth.uid())
    AND status = 'active'
  ))
  OR
  -- Partner's personal locations in merged mode:
  -- The location belongs to a partner (user_id != me) AND connection_id IS NULL (personal location)
  -- AND both users have 'merged' permission for 'travel' module
  (connection_id IS NULL AND user_id IN (
    SELECT 
      CASE 
        WHEN pc.requester_id = auth.uid() THEN pc.receiver_id
        ELSE pc.requester_id
      END as partner_id
    FROM profile_connections pc
    WHERE (pc.requester_id = auth.uid() OR pc.receiver_id = auth.uid())
    AND pc.status = 'active'
    -- Check that BOTH users have merged permission for travel
    AND EXISTS (
      SELECT 1 FROM module_permissions mp1
      WHERE mp1.connection_id = pc.id
      AND mp1.module = 'travel'
      AND mp1.user_id = auth.uid()
      AND mp1.permission_level = 'merged'
    )
    AND EXISTS (
      SELECT 1 FROM module_permissions mp2
      WHERE mp2.connection_id = pc.id
      AND mp2.module = 'travel'
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

-- RLS Policy: Users can insert their own locations or shared locations
CREATE POLICY "Users can insert own and shared locations" ON visited_locations
FOR INSERT WITH CHECK (
  -- Own locations
  (auth.uid() = user_id AND connection_id IS NULL)
  OR
  -- Shared locations (connection_id is set and user is part of that connection)
  (connection_id IS NOT NULL AND connection_id IN (
    SELECT id FROM profile_connections 
    WHERE (requester_id = auth.uid() OR receiver_id = auth.uid())
    AND status = 'active'
  ))
);

-- RLS Policy: Users can update their own locations or shared locations
CREATE POLICY "Users can update own and shared locations" ON visited_locations
FOR UPDATE USING (
  -- Own locations
  (auth.uid() = user_id)
  OR
  -- Shared locations (connection_id is set and user is part of that connection)
  (connection_id IS NOT NULL AND connection_id IN (
    SELECT id FROM profile_connections 
    WHERE (requester_id = auth.uid() OR receiver_id = auth.uid())
    AND status = 'active'
  ))
);

-- RLS Policy: Users can delete their own locations or shared locations
CREATE POLICY "Users can delete own and shared locations" ON visited_locations
FOR DELETE USING (
  -- Own locations
  (auth.uid() = user_id)
  OR
  -- Shared locations (connection_id is set and user is part of that connection)
  (connection_id IS NOT NULL AND connection_id IN (
    SELECT id FROM profile_connections 
    WHERE (requester_id = auth.uid() OR receiver_id = auth.uid())
    AND status = 'active'
  ))
);

-- Add comment for documentation
COMMENT ON COLUMN visited_locations.connection_id IS 'When set, this location is shared between connected users. When NULL, it is a personal location.';

