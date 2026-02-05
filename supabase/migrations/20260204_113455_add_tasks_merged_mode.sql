-- =====================================================
-- Add Merged Mode Support for Tasks
-- =====================================================
-- Description: Allows users to view partner's tasks data when both
--              users have set the 'todos' module to 'merged' permission.
-- Author: Claude Code (Automated)
-- Date: 2026-02-04
-- =====================================================

-- Drop existing policies to recreate with merged mode support
DROP POLICY IF EXISTS "Users can view own tasks" ON tasks;
DROP POLICY IF EXISTS "tasks_select_policy" ON tasks;
DROP POLICY IF EXISTS "merged_access_tasks" ON tasks;

-- =====================================================
-- SELECT Policy: View own data + partner's data (if merged)
-- =====================================================
CREATE POLICY "merged_access_tasks" ON tasks
  FOR SELECT
  USING (
    -- Always allow viewing own data
    user_id = auth.uid()
    OR
    -- Allow viewing partner's data if merged mode is enabled
    EXISTS (
      SELECT 1
      FROM profile_connections pc
      JOIN module_permissions mp ON mp.connection_id = pc.id
      WHERE
        -- Match connection in either direction
        (
          (pc.requester_id = auth.uid() AND pc.receiver_id = tasks.user_id) OR
          (pc.receiver_id = auth.uid() AND pc.requester_id = tasks.user_id)
        )
        -- Check module and permission level
        AND mp.module = 'todos'
        AND mp.permission_level = 'merged'
        -- Permission must be set by current user
        AND mp.user_id = auth.uid()
        -- Connection must be active
        AND pc.status = 'active'
    )
  );

-- =====================================================
-- INSERT Policy: Can only create with own user_id
-- =====================================================
DROP POLICY IF EXISTS "Users can insert own tasks" ON tasks;
DROP POLICY IF EXISTS "tasks_insert_policy" ON tasks;

CREATE POLICY "tasks_insert_policy" ON tasks
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- =====================================================
-- UPDATE Policy: Can only update own data
-- =====================================================
-- Note: Even in merged mode, users cannot edit partner's data
--       (unless 'collaborate' permission is added in future)
DROP POLICY IF EXISTS "Users can update own tasks" ON tasks;
DROP POLICY IF EXISTS "tasks_update_policy" ON tasks;

CREATE POLICY "tasks_update_policy" ON tasks
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- =====================================================
-- DELETE Policy: Can only delete own data
-- =====================================================
DROP POLICY IF EXISTS "Users can delete own tasks" ON tasks;
DROP POLICY IF EXISTS "tasks_delete_policy" ON tasks;

CREATE POLICY "tasks_delete_policy" ON tasks
  FOR DELETE
  USING (user_id = auth.uid());

-- =====================================================
-- Add helpful comment for documentation
-- =====================================================
COMMENT ON POLICY "merged_access_tasks" ON tasks IS
  'Merged Mode: Allows viewing own tasks and partners tasks when both users have mutually enabled merged permission for todos module';

COMMENT ON TABLE tasks IS
  'Tasks data with merged mode support. Users can view partners data when merged permission is mutually granted.';
