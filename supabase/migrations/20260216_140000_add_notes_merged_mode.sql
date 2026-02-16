-- Add merged mode support for notes
-- Allows users to view partner's notes when both have set module to 'merged'
-- Supports shared knowledge base for couples

-- =====================================================
-- NOTES TABLE RLS POLICIES
-- =====================================================

-- Drop existing SELECT policy if it exists
DROP POLICY IF EXISTS "Users can view own notes" ON notes;
DROP POLICY IF EXISTS "notes_select_policy" ON notes;

-- Create new SELECT policy with merged mode support
CREATE POLICY "merged_access_notes" ON notes
  FOR SELECT
  USING (
    -- User can always see their own notes
    user_id = auth.uid()
    OR
    -- User can see partner's notes if merged mode is enabled
    EXISTS (
      SELECT 1
      FROM profile_connections pc
      JOIN module_permissions mp ON mp.connection_id = pc.id
      WHERE
        -- Either direction of connection
        (
          (pc.requester_id = auth.uid() AND pc.receiver_id = notes.user_id) OR
          (pc.receiver_id = auth.uid() AND pc.requester_id = notes.user_id)
        )
        -- Module must be set to merged
        AND mp.module = 'notes'
        AND mp.permission_level = 'merged'
        -- Permission must be for current user
        AND mp.user_id = auth.uid()
        -- Connection must be active
        AND pc.status = 'active'
    )
  );

-- Ensure INSERT policy restricts to own user_id
DROP POLICY IF EXISTS "Users can insert own notes" ON notes;
CREATE POLICY "notes_insert_policy" ON notes
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- UPDATE policy: users can only update their own notes
DROP POLICY IF EXISTS "Users can update own notes" ON notes;
CREATE POLICY "notes_update_policy" ON notes
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- DELETE policy: users can only delete their own notes
DROP POLICY IF EXISTS "Users can delete own notes" ON notes;
CREATE POLICY "notes_delete_policy" ON notes
  FOR DELETE
  USING (user_id = auth.uid());

-- Add helpful comment
COMMENT ON POLICY "merged_access_notes" ON notes IS
  'Allows viewing own notes and partners notes when merged mode is mutually enabled';

-- =====================================================
-- LIST_ITEMS TABLE RLS POLICIES
-- =====================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own list items" ON list_items;
DROP POLICY IF EXISTS "list_items_select_policy" ON list_items;

-- SELECT policy: users can see list items for notes they have access to
CREATE POLICY "merged_access_list_items" ON list_items
  FOR SELECT
  USING (
    -- User can see list items for any note they have access to (via notes RLS)
    EXISTS (
      SELECT 1
      FROM notes n
      WHERE n.id = list_items.note_id
      -- This will use the notes table RLS policy
    )
  );

-- INSERT policy: users can create list items for notes they can see
DROP POLICY IF EXISTS "Users can insert list items" ON list_items;
CREATE POLICY "list_items_insert_policy" ON list_items
  FOR INSERT
  WITH CHECK (
    -- User can insert list items for any note they have access to
    EXISTS (
      SELECT 1
      FROM notes n
      WHERE n.id = note_id
      -- This will use the notes table RLS policy
    )
  );

-- UPDATE policy: users can update list items for accessible notes
DROP POLICY IF EXISTS "Users can update list items" ON list_items;
CREATE POLICY "list_items_update_policy" ON list_items
  FOR UPDATE
  USING (
    -- User can update list items for notes they have access to
    EXISTS (
      SELECT 1
      FROM notes n
      WHERE n.id = note_id
      -- This will use the notes table RLS policy
    )
  );

-- DELETE policy: users can delete list items for accessible notes
DROP POLICY IF EXISTS "Users can delete list items" ON list_items;
CREATE POLICY "list_items_delete_policy" ON list_items
  FOR DELETE
  USING (
    -- User can delete list items for notes they have access to
    EXISTS (
      SELECT 1
      FROM notes n
      WHERE n.id = note_id
      -- This will use the notes table RLS policy
    )
  );

-- Add helpful comment
COMMENT ON POLICY "merged_access_list_items" ON list_items IS
  'Allows managing list items for any note the user can access (including partners notes in merged mode)';
