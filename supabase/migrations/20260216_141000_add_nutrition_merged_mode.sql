-- Add merged mode support for nutrition (food tracking)
-- Allows users to view partner's food logs when both have set module to 'merged'
-- Supports shared nutrition tracking and accountability for couples

-- =====================================================
-- FOOD_LOG TABLE RLS POLICIES
-- =====================================================

-- Drop existing SELECT policy if it exists
DROP POLICY IF EXISTS "Users can view own food log" ON food_log;
DROP POLICY IF EXISTS "food_log_select_policy" ON food_log;

-- Create new SELECT policy with merged mode support
CREATE POLICY "merged_access_food_log" ON food_log
  FOR SELECT
  USING (
    -- User can always see their own food logs
    user_id = auth.uid()
    OR
    -- User can see partner's food logs if merged mode is enabled
    EXISTS (
      SELECT 1
      FROM profile_connections pc
      JOIN module_permissions mp ON mp.connection_id = pc.id
      WHERE
        -- Either direction of connection
        (
          (pc.requester_id = auth.uid() AND pc.receiver_id = food_log.user_id) OR
          (pc.receiver_id = auth.uid() AND pc.requester_id = food_log.user_id)
        )
        -- Module must be set to merged
        AND mp.module = 'nutrition'
        AND mp.permission_level = 'merged'
        -- Permission must be for current user
        AND mp.user_id = auth.uid()
        -- Connection must be active
        AND pc.status = 'active'
    )
  );

-- Ensure INSERT policy restricts to own user_id
DROP POLICY IF EXISTS "Users can insert own food log" ON food_log;
CREATE POLICY "food_log_insert_policy" ON food_log
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- UPDATE policy: users can only update their own food logs
DROP POLICY IF EXISTS "Users can update own food log" ON food_log;
CREATE POLICY "food_log_update_policy" ON food_log
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- DELETE policy: users can only delete their own food logs
DROP POLICY IF EXISTS "Users can delete own food log" ON food_log;
CREATE POLICY "food_log_delete_policy" ON food_log
  FOR DELETE
  USING (user_id = auth.uid());

-- Add helpful comment
COMMENT ON POLICY "merged_access_food_log" ON food_log IS
  'Allows viewing own food logs and partners food logs when merged mode is mutually enabled for nutrition tracking and accountability';
