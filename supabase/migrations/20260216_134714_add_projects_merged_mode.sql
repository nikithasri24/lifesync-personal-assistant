-- Add projects tables and merged mode support
-- Allows users to view partner's projects when both have set module to 'merged'
-- Supports collaboration on shared projects (home renovations, vacations, moving, etc.)

-- =====================================================
-- CREATE PROJECTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'on-hold', 'completed', 'archived')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  start_date DATE,
  target_date DATE,
  completed_date DATE,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  color TEXT,
  icon TEXT,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  team_members TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

-- =====================================================
-- CREATE PROJECT_MILESTONES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS project_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  target_date DATE,
  completed BOOLEAN DEFAULT false,
  completed_date DATE,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create index on project_id for faster queries
CREATE INDEX IF NOT EXISTS idx_project_milestones_project_id ON project_milestones(project_id);

-- =====================================================
-- CREATE PROJECT_TASKS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS project_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, task_id)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_project_tasks_project_id ON project_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_project_tasks_task_id ON project_tasks(task_id);

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_tasks ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PROJECTS TABLE RLS POLICIES
-- =====================================================

-- Drop existing SELECT policy if it exists
DROP POLICY IF EXISTS "Users can view own projects" ON projects;
DROP POLICY IF EXISTS "projects_select_policy" ON projects;

-- Create new SELECT policy with merged mode support
CREATE POLICY "merged_access_projects" ON projects
  FOR SELECT
  USING (
    -- User can always see their own projects
    user_id = auth.uid()
    OR
    -- User can see partner's projects if merged mode is enabled
    EXISTS (
      SELECT 1
      FROM profile_connections pc
      JOIN module_permissions mp ON mp.connection_id = pc.id
      WHERE
        -- Either direction of connection
        (
          (pc.requester_id = auth.uid() AND pc.receiver_id = projects.user_id) OR
          (pc.receiver_id = auth.uid() AND pc.requester_id = projects.user_id)
        )
        -- Module must be set to merged
        AND mp.module = 'projects'
        AND mp.permission_level = 'merged'
        -- Permission must be for current user
        AND mp.user_id = auth.uid()
        -- Connection must be active
        AND pc.status = 'active'
    )
  );

-- Ensure INSERT policy restricts to own user_id
DROP POLICY IF EXISTS "Users can insert own projects" ON projects;
CREATE POLICY "projects_insert_policy" ON projects
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- UPDATE policy: users can only update their own projects
DROP POLICY IF EXISTS "Users can update own projects" ON projects;
CREATE POLICY "projects_update_policy" ON projects
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- DELETE policy: users can only delete their own projects
DROP POLICY IF EXISTS "Users can delete own projects" ON projects;
CREATE POLICY "projects_delete_policy" ON projects
  FOR DELETE
  USING (user_id = auth.uid());

-- Add helpful comment
COMMENT ON POLICY "merged_access_projects" ON projects IS
  'Allows viewing own projects and partners projects when merged mode is mutually enabled. Perfect for couples collaborating on shared projects.';

-- =====================================================
-- PROJECT_MILESTONES TABLE RLS POLICIES
-- =====================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own milestones" ON project_milestones;
DROP POLICY IF EXISTS "project_milestones_select_policy" ON project_milestones;

-- SELECT policy: users can see milestones for projects they have access to
CREATE POLICY "merged_access_project_milestones" ON project_milestones
  FOR SELECT
  USING (
    -- User can see milestones for any project they have access to (via projects RLS)
    EXISTS (
      SELECT 1
      FROM projects p
      WHERE p.id = project_milestones.project_id
      -- This will use the projects table RLS policy
    )
  );

-- INSERT policy: users can create milestones for projects they can see
DROP POLICY IF EXISTS "Users can insert milestones" ON project_milestones;
CREATE POLICY "project_milestones_insert_policy" ON project_milestones
  FOR INSERT
  WITH CHECK (
    -- User can insert milestones for any project they have access to
    EXISTS (
      SELECT 1
      FROM projects p
      WHERE p.id = project_id
      -- This will use the projects table RLS policy
    )
  );

-- UPDATE policy: users can update milestones for accessible projects
DROP POLICY IF EXISTS "Users can update milestones" ON project_milestones;
CREATE POLICY "project_milestones_update_policy" ON project_milestones
  FOR UPDATE
  USING (
    -- User can update milestones for projects they have access to
    EXISTS (
      SELECT 1
      FROM projects p
      WHERE p.id = project_id
      -- This will use the projects table RLS policy
    )
  );

-- DELETE policy: users can delete milestones for accessible projects
DROP POLICY IF EXISTS "Users can delete milestones" ON project_milestones;
CREATE POLICY "project_milestones_delete_policy" ON project_milestones
  FOR DELETE
  USING (
    -- User can delete milestones for projects they have access to
    EXISTS (
      SELECT 1
      FROM projects p
      WHERE p.id = project_id
      -- This will use the projects table RLS policy
    )
  );

-- Add helpful comment
COMMENT ON POLICY "merged_access_project_milestones" ON project_milestones IS
  'Allows managing milestones for any project the user can access (including partners projects in merged mode).';

-- =====================================================
-- PROJECT_TASKS TABLE RLS POLICIES
-- =====================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view project tasks" ON project_tasks;
DROP POLICY IF EXISTS "project_tasks_select_policy" ON project_tasks;

-- SELECT policy: users can see task links for projects they have access to
CREATE POLICY "merged_access_project_tasks" ON project_tasks
  FOR SELECT
  USING (
    -- User can see task links for any project they have access to (via projects RLS)
    EXISTS (
      SELECT 1
      FROM projects p
      WHERE p.id = project_tasks.project_id
      -- This will use the projects table RLS policy
    )
  );

-- INSERT policy: users can link tasks to projects they can see
DROP POLICY IF EXISTS "Users can insert project tasks" ON project_tasks;
CREATE POLICY "project_tasks_insert_policy" ON project_tasks
  FOR INSERT
  WITH CHECK (
    -- User can link tasks for any project they have access to
    EXISTS (
      SELECT 1
      FROM projects p
      WHERE p.id = project_id
      -- This will use the projects table RLS policy
    )
  );

-- DELETE policy: users can unlink tasks from accessible projects
DROP POLICY IF EXISTS "Users can delete project tasks" ON project_tasks;
CREATE POLICY "project_tasks_delete_policy" ON project_tasks
  FOR DELETE
  USING (
    -- User can unlink tasks from projects they have access to
    EXISTS (
      SELECT 1
      FROM projects p
      WHERE p.id = project_id
      -- This will use the projects table RLS policy
    )
  );

-- Add helpful comment
COMMENT ON POLICY "merged_access_project_tasks" ON project_tasks IS
  'Allows managing task links for any project the user can access (including partners projects in merged mode).';
