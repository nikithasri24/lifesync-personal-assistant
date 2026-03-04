-- Migration: Fix RLS Policy Completeness
-- Date: 2026-03-04
--
-- Issues fixed:
--   1. tasks, habits         — RLS disabled (policies exist but not enforced)
--   2. users                 — RLS disabled (exposes email + password_hash)
--   3. user_settings         — RLS disabled (exposes all user key/value settings)
--   4. user_profiles         — RLS disabled (exposes XP, streaks, bio)
--   5. task_comments         — RLS disabled, no policies
--   6. task_dependencies     — RLS disabled, no policies
--   7. financial_categories  — RLS disabled (has user_id)
--   8. achievement_definitions, products — RLS disabled (global lookup tables)
--   9. habit_entries         — 3 overly-broad _policy variants leak all entries
--  10. notes                 — missing merged-mode partner SELECT policy

BEGIN;

-- ============================================================
-- 1. tasks — policies already exist, RLS just never enabled
-- ============================================================
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- 2. habits — policies already exist, RLS just never enabled
-- ============================================================
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- 3. users — contains email + password_hash; strict own-only access
-- ============================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own"
  ON users FOR SELECT
  USING (auth.uid()::text = id::text);

CREATE POLICY "users_update_own"
  ON users FOR UPDATE
  USING (auth.uid()::text = id::text)
  WITH CHECK (auth.uid()::text = id::text);


-- ============================================================
-- 4. user_settings — per-user key/value preferences
-- ============================================================
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_settings_own"
  ON user_settings FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ============================================================
-- 5. user_profiles — gamification data (XP, streaks, bio)
--    Own: full CRUD
--    Partner: SELECT only (needed for Together/challenges)
-- ============================================================
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_profiles_own"
  ON user_profiles FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_profiles_partner_select"
  ON user_profiles FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profile_connections pc
    WHERE (
        (pc.requester_id = auth.uid() AND pc.receiver_id = user_profiles.user_id)
      OR (pc.receiver_id = auth.uid() AND pc.requester_id = user_profiles.user_id)
    )
    AND pc.status = 'active'
  ));


-- ============================================================
-- 6. task_comments — own comments + view comments on accessible tasks
-- ============================================================
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "task_comments_select_own"
  ON task_comments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "task_comments_select_merged"
  ON task_comments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM tasks t
    WHERE t.id = task_comments.task_id
      AND EXISTS (
        SELECT 1 FROM profile_connections pc
        JOIN module_permissions mp ON mp.connection_id = pc.id
        WHERE (
            (pc.requester_id = auth.uid() AND pc.receiver_id = t.user_id)
          OR (pc.receiver_id = auth.uid() AND pc.requester_id = t.user_id)
        )
        AND mp.module = 'todos'::shareable_module
        AND mp.permission_level = 'merged'::module_permission_level
        AND mp.user_id = auth.uid()
        AND pc.status = 'active'
      )
  ));

CREATE POLICY "task_comments_insert_own"
  ON task_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "task_comments_update_own"
  ON task_comments FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "task_comments_delete_own"
  ON task_comments FOR DELETE
  USING (auth.uid() = user_id);


-- ============================================================
-- 7. task_dependencies — no user_id; access via task ownership
-- ============================================================
ALTER TABLE task_dependencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "task_dependencies_select"
  ON task_dependencies FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM tasks t
    WHERE t.id = task_dependencies.task_id AND t.user_id = auth.uid()
  ));

CREATE POLICY "task_dependencies_insert"
  ON task_dependencies FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM tasks t
    WHERE t.id = task_dependencies.task_id AND t.user_id = auth.uid()
  ));

CREATE POLICY "task_dependencies_update"
  ON task_dependencies FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM tasks t
    WHERE t.id = task_dependencies.task_id AND t.user_id = auth.uid()
  ));

CREATE POLICY "task_dependencies_delete"
  ON task_dependencies FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM tasks t
    WHERE t.id = task_dependencies.task_id AND t.user_id = auth.uid()
  ));


-- ============================================================
-- 8. financial_categories — legacy table with user_id
-- ============================================================
ALTER TABLE financial_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "financial_categories_own"
  ON financial_categories FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ============================================================
-- 9. achievement_definitions — global lookup table (no user_id)
--    Any authenticated user can read; only service role can write
-- ============================================================
ALTER TABLE achievement_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "achievement_definitions_select_all"
  ON achievement_definitions FOR SELECT
  USING (true);


-- ============================================================
-- 10. products — global product lookup table (no user_id)
-- ============================================================
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "products_select_all"
  ON products FOR SELECT
  USING (true);


-- ============================================================
-- 11. habit_entries — clean up overly-broad policies
--
--  Problem: Three `_policy` variants use:
--    EXISTS (SELECT 1 FROM habits h WHERE h.id = habit_entries.habit_id)
--  This has NO user check, so any authenticated user can access
--  any habit entry once habits has RLS enabled (and pre-RLS it
--  granted access to all rows unconditionally).
--
--  Fix: Drop all three, replace merged_access with a proper check.
--  The remaining "own" policies (auth.uid() = user_id, and the
--  habit_id IN (...) variant) remain and are correct.
-- ============================================================

-- Drop the 3 overly-broad _policy variants
DROP POLICY IF EXISTS habit_entries_delete_policy ON habit_entries;
DROP POLICY IF EXISTS habit_entries_insert_policy ON habit_entries;
DROP POLICY IF EXISTS habit_entries_update_policy ON habit_entries;

-- Replace the overly-broad merged_access_habit_entries with a proper check
DROP POLICY IF EXISTS merged_access_habit_entries ON habit_entries;

CREATE POLICY "merged_access_habit_entries"
  ON habit_entries FOR SELECT
  USING (habit_id IN (
    SELECT h.id FROM habits h
    WHERE EXISTS (
      SELECT 1 FROM profile_connections pc
      JOIN module_permissions mp ON mp.connection_id = pc.id
      WHERE (
          (pc.requester_id = auth.uid() AND pc.receiver_id = h.user_id)
        OR (pc.receiver_id = auth.uid() AND pc.requester_id = h.user_id)
      )
      AND mp.module = 'habits'::shareable_module
      AND mp.permission_level = 'merged'::module_permission_level
      AND mp.user_id = auth.uid()
      AND pc.status = 'active'
    )
  ));


-- ============================================================
-- 12. notes — add missing merged-mode partner SELECT policy
--
--  Currently only "Users can view their own notes" exists.
--  In merged mode, partner's notes were silently blocked at DB level.
-- ============================================================
CREATE POLICY "notes_select_merged_partner"
  ON notes FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profile_connections pc
    JOIN module_permissions mp ON mp.connection_id = pc.id
    WHERE (
        (pc.requester_id = auth.uid() AND pc.receiver_id = notes.user_id)
      OR (pc.receiver_id = auth.uid() AND pc.requester_id = notes.user_id)
    )
    AND mp.module = 'notes'::shareable_module
    AND mp.permission_level = 'merged'::module_permission_level
    AND mp.user_id = auth.uid()
    AND pc.status = 'active'
  ));

COMMIT;
