-- ==================== MANUAL RUN: Collaborative Travel Setup ====================
-- Run this in Supabase SQL Editor to enable collaborative travel tracking
-- This allows partners to see each other's travel data and track individual vs joint visits

-- Step 1: Add visited_by field to track which users have visited each location
ALTER TABLE visited_locations ADD COLUMN IF NOT EXISTS visited_by JSONB DEFAULT '[]'::jsonb;

-- Step 2: Migrate existing data: set visited_by to array containing the user_id
UPDATE visited_locations 
SET visited_by = jsonb_build_array(user_id::text)
WHERE visited_by = '[]'::jsonb AND user_id IS NOT NULL;

-- Step 3: Create index for efficient lookups by visited_by
CREATE INDEX IF NOT EXISTS idx_visited_locations_visited_by ON visited_locations USING GIN (visited_by);

-- Step 4: Drop old policies if they exist
DROP POLICY IF EXISTS "Users can view own and partner locations in merged mode" ON visited_locations;
DROP POLICY IF EXISTS "Users can insert own and shared locations" ON visited_locations;
DROP POLICY IF EXISTS "Users can update own and shared locations" ON visited_locations;
DROP POLICY IF EXISTS "Users can delete own and shared locations" ON visited_locations;

-- Step 5: Create new RLS policies for collaborative travel

-- SELECT: Users can view their own locations AND their partner's locations
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

-- UPDATE: Users can update their own locations OR locations they've visited
CREATE POLICY "Users can update own and visited travel locations" ON visited_locations
FOR UPDATE USING (
  (auth.uid() = user_id)
  OR
  (visited_by ? auth.uid()::text)
);

-- DELETE: Users can delete their own locations
CREATE POLICY "Users can delete own travel locations" ON visited_locations
FOR DELETE USING (auth.uid() = user_id);

-- Verify the changes
SELECT 
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'visited_locations' 
  AND column_name IN ('user_id', 'connection_id', 'visited_by')
ORDER BY column_name;

