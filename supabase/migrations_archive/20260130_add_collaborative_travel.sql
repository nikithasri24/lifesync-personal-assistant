-- ==================== Collaborative Travel: Individual Tracking with Shared Visibility ====================
-- This migration adds support for tracking who visited each location (individual or joint visits)
-- while allowing partners to see each other's travel data.

-- Add visited_by field to track which users have visited each location
ALTER TABLE visited_locations ADD COLUMN IF NOT EXISTS visited_by JSONB DEFAULT '[]'::jsonb;

-- Migrate existing data: set visited_by to array containing the user_id
UPDATE visited_locations 
SET visited_by = jsonb_build_array(user_id::text)
WHERE visited_by = '[]'::jsonb AND user_id IS NOT NULL;

-- Create index for efficient lookups by visited_by
CREATE INDEX IF NOT EXISTS idx_visited_locations_visited_by ON visited_locations USING GIN (visited_by);

-- ==================== RLS Policies for Collaborative Travel ====================

-- Drop old policies if they exist
DROP POLICY IF EXISTS "Users can view own and partner locations in merged mode" ON visited_locations;
DROP POLICY IF EXISTS "Users can insert own and shared locations" ON visited_locations;
DROP POLICY IF EXISTS "Users can update own and shared locations" ON visited_locations;
DROP POLICY IF EXISTS "Users can delete own and shared locations" ON visited_locations;

-- SELECT: Users can view their own locations AND their partner's locations (if travel permission is 'view' or 'collaborate')
CREATE POLICY "Users can view own and partner travel locations" ON visited_locations
FOR SELECT USING (
  -- Own locations
  (auth.uid() = user_id)
  OR
  -- Partner's locations (if they have granted view/collaborate permission for travel)
  (user_id IN (
    SELECT CASE
      WHEN requester_id = auth.uid() THEN receiver_id
      WHEN receiver_id = auth.uid() THEN requester_id
    END
    FROM profile_connections pc
    WHERE (requester_id = auth.uid() OR receiver_id = auth.uid())
      AND pc.status = 'active'
      AND EXISTS (
        SELECT 1 FROM module_permissions mp
        WHERE mp.connection_id = pc.id
          AND mp.module = 'travel'
          AND mp.permission_level IN ('view', 'collaborate', 'merged')
          AND mp.user_id = (
            CASE
              WHEN pc.requester_id = auth.uid() THEN pc.receiver_id
              ELSE pc.requester_id
            END
          )
      )
  ))
  OR
  -- Shared locations via connection_id (for backward compatibility)
  (connection_id IS NOT NULL AND connection_id IN (
    SELECT id FROM profile_connections
    WHERE (requester_id = auth.uid() OR receiver_id = auth.uid())
    AND status = 'active'
  ))
);

-- INSERT: Users can insert their own locations
CREATE POLICY "Users can insert own travel locations" ON visited_locations
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can update their own locations OR locations they've visited (in visited_by array)
CREATE POLICY "Users can update own and visited travel locations" ON visited_locations
FOR UPDATE USING (
  (auth.uid() = user_id)
  OR
  (visited_by ? auth.uid()::text)
);

-- DELETE: Users can delete their own locations
CREATE POLICY "Users can delete own travel locations" ON visited_locations
FOR DELETE USING (auth.uid() = user_id);

-- ==================== Helper Functions ====================

-- Function to check if a user has visited a location
CREATE OR REPLACE FUNCTION has_visited_location(location_visited_by jsonb, user_uuid uuid)
RETURNS boolean AS $$
BEGIN
  RETURN location_visited_by ? user_uuid::text;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to add a user to visited_by array
CREATE OR REPLACE FUNCTION add_visitor_to_location(location_visited_by jsonb, user_uuid uuid)
RETURNS jsonb AS $$
BEGIN
  IF location_visited_by ? user_uuid::text THEN
    RETURN location_visited_by;
  ELSE
    RETURN location_visited_by || jsonb_build_array(user_uuid::text);
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to remove a user from visited_by array
CREATE OR REPLACE FUNCTION remove_visitor_from_location(location_visited_by jsonb, user_uuid uuid)
RETURNS jsonb AS $$
DECLARE
  result jsonb := '[]'::jsonb;
  visitor jsonb;
BEGIN
  FOR visitor IN SELECT * FROM jsonb_array_elements(location_visited_by)
  LOOP
    IF visitor::text != ('"' || user_uuid::text || '"') THEN
      result := result || visitor;
    END IF;
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

