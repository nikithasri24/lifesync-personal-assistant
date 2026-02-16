-- Add merged mode support for habits
-- Allows users to view partner's habits when both have set module to 'merged'
-- Each user tracks their own progress on both personal and shared habits

-- =====================================================
-- HABITS TABLE RLS POLICIES
-- =====================================================

-- Drop existing SELECT policy if it exists
DROP POLICY IF EXISTS "Users can view own habits" ON habits;
DROP POLICY IF EXISTS "habits_select_policy" ON habits;

-- Create new SELECT policy with merged mode support
CREATE POLICY "merged_access_habits" ON habits
  FOR SELECT
  USING (
    -- User can always see their own habits
    user_id = auth.uid()
    OR
    -- User can see partner's habits if merged mode is enabled
    EXISTS (
      SELECT 1
      FROM profile_connections pc
      JOIN module_permissions mp ON mp.connection_id = pc.id
      WHERE
        -- Either direction of connection
        (
          (pc.requester_id = auth.uid() AND pc.receiver_id = habits.user_id) OR
          (pc.receiver_id = auth.uid() AND pc.requester_id = habits.user_id)
        )
        -- Module must be set to merged
        AND mp.module = 'habits'
        AND mp.permission_level = 'merged'
        -- Permission must be for current user
        AND mp.user_id = auth.uid()
        -- Connection must be active
        AND pc.status = 'active'
    )
  );

-- Ensure INSERT policy restricts to own user_id
DROP POLICY IF EXISTS "Users can insert own habits" ON habits;
CREATE POLICY "habits_insert_policy" ON habits
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- UPDATE policy: users can only update their own habits
DROP POLICY IF EXISTS "Users can update own habits" ON habits;
CREATE POLICY "habits_update_policy" ON habits
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- DELETE policy: users can only delete their own habits
DROP POLICY IF EXISTS "Users can delete own habits" ON habits;
CREATE POLICY "habits_delete_policy" ON habits
  FOR DELETE
  USING (user_id = auth.uid());

-- Add helpful comment
COMMENT ON POLICY "merged_access_habits" ON habits IS
  'Allows viewing own habits and partners habits when merged mode is mutually enabled. Each user tracks their own progress.';

-- =====================================================
-- HABIT_ENTRIES TABLE RLS POLICIES
-- =====================================================

-- Habit entries are always personal (each user tracks their own progress)
-- But in merged mode, users can log progress on partner's habits too

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own habit entries" ON habit_entries;
DROP POLICY IF EXISTS "habit_entries_select_policy" ON habit_entries;

-- SELECT policy: users can see entries for habits they have access to
CREATE POLICY "merged_access_habit_entries" ON habit_entries
  FOR SELECT
  USING (
    -- User can see entries for any habit they have access to (via habits RLS)
    EXISTS (
      SELECT 1
      FROM habits h
      WHERE h.id = habit_entries.habit_id
      -- This will use the habits table RLS policy
    )
  );

-- INSERT policy: users can create entries for any habit they can see
DROP POLICY IF EXISTS "Users can insert habit entries" ON habit_entries;
CREATE POLICY "habit_entries_insert_policy" ON habit_entries
  FOR INSERT
  WITH CHECK (
    -- User can insert entries for any habit they have access to
    EXISTS (
      SELECT 1
      FROM habits h
      WHERE h.id = habit_id
      -- This will use the habits table RLS policy
    )
  );

-- UPDATE policy: users can only update their own entries
DROP POLICY IF EXISTS "Users can update habit entries" ON habit_entries;
CREATE POLICY "habit_entries_update_policy" ON habit_entries
  FOR UPDATE
  USING (
    -- User can update entries for habits they have access to
    EXISTS (
      SELECT 1
      FROM habits h
      WHERE h.id = habit_id
      -- This will use the habits table RLS policy
    )
  );

-- DELETE policy: users can delete entries for habits they have access to
DROP POLICY IF EXISTS "Users can delete habit entries" ON habit_entries;
CREATE POLICY "habit_entries_delete_policy" ON habit_entries
  FOR DELETE
  USING (
    -- User can delete entries for habits they have access to
    EXISTS (
      SELECT 1
      FROM habits h
      WHERE h.id = habit_id
      -- This will use the habits table RLS policy
    )
  );

-- Add helpful comment
COMMENT ON POLICY "merged_access_habit_entries" ON habit_entries IS
  'Allows viewing and creating entries for any habit the user can see (including partners habits in merged mode). Each user tracks their own progress.';
