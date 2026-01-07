-- Enhanced Projects System Migration
-- Created: 2025-12-07
-- Purpose: Add comprehensive project tracking with milestones and task linking

-- =====================================================
-- DROP EXISTING TABLES IF THEY EXIST (CAREFUL!)
-- =====================================================
-- Uncomment these lines if you need to completely reset the schema:
-- DROP TABLE IF EXISTS project_tasks CASCADE;
-- DROP TABLE IF EXISTS project_milestones CASCADE;
-- DROP TABLE IF EXISTS projects CASCADE;

-- =====================================================
-- PROJECTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'planning',
  priority TEXT NOT NULL DEFAULT 'medium',
  start_date DATE,
  target_date DATE,
  completed_date DATE,
  tags TEXT[] DEFAULT '{}',
  color TEXT,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  team_members UUID[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_status CHECK (status IN ('planning', 'active', 'on-hold', 'completed', 'archived')),
  CONSTRAINT valid_priority CHECK (priority IN ('low', 'medium', 'high', 'urgent'))
);

-- =====================================================
-- PROJECT MILESTONES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS project_milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  target_date DATE,
  completed BOOLEAN DEFAULT false,
  completed_date DATE,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- PROJECT TASKS TABLE (Links tasks to projects)
-- =====================================================
CREATE TABLE IF NOT EXISTS project_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, task_id)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_projects_user ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_priority ON projects(priority);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_milestones_project ON project_milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_milestones_order ON project_milestones(project_id, order_index);

CREATE INDEX IF NOT EXISTS idx_project_tasks_project ON project_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_project_tasks_task ON project_tasks(task_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_tasks ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES - PROJECTS
-- =====================================================
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own projects" ON projects;
DROP POLICY IF EXISTS "Users can insert their own projects" ON projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON projects;

-- Create new policies
CREATE POLICY "Users can view their own projects" ON projects
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = ANY(team_members));

CREATE POLICY "Users can insert their own projects" ON projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects" ON projects
  FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = ANY(team_members));

CREATE POLICY "Users can delete their own projects" ON projects
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- RLS POLICIES - PROJECT MILESTONES
-- =====================================================
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view milestones of their projects" ON project_milestones;
DROP POLICY IF EXISTS "Users can insert milestones to their projects" ON project_milestones;
DROP POLICY IF EXISTS "Users can update milestones of their projects" ON project_milestones;
DROP POLICY IF EXISTS "Users can delete milestones of their projects" ON project_milestones;

-- Create new policies
CREATE POLICY "Users can view milestones of their projects" ON project_milestones
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_milestones.project_id
      AND (projects.user_id = auth.uid() OR auth.uid() = ANY(projects.team_members))
    )
  );

CREATE POLICY "Users can insert milestones to their projects" ON project_milestones
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_milestones.project_id
      AND (projects.user_id = auth.uid() OR auth.uid() = ANY(projects.team_members))
    )
  );

CREATE POLICY "Users can update milestones of their projects" ON project_milestones
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_milestones.project_id
      AND (projects.user_id = auth.uid() OR auth.uid() = ANY(projects.team_members))
    )
  );

CREATE POLICY "Users can delete milestones of their projects" ON project_milestones
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_milestones.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- =====================================================
-- RLS POLICIES - PROJECT TASKS
-- =====================================================
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view project tasks of their projects" ON project_tasks;
DROP POLICY IF EXISTS "Users can insert project tasks to their projects" ON project_tasks;
DROP POLICY IF EXISTS "Users can delete project tasks from their projects" ON project_tasks;

-- Create new policies
CREATE POLICY "Users can view project tasks of their projects" ON project_tasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_tasks.project_id
      AND (projects.user_id = auth.uid() OR auth.uid() = ANY(projects.team_members))
    )
  );

CREATE POLICY "Users can insert project tasks to their projects" ON project_tasks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_tasks.project_id
      AND (projects.user_id = auth.uid() OR auth.uid() = ANY(projects.team_members))
    )
    AND EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = project_tasks.task_id
      AND tasks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete project tasks from their projects" ON project_tasks
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_tasks.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- =====================================================
-- TRIGGER: Update updated_at on projects
-- =====================================================
CREATE OR REPLACE FUNCTION update_projects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS projects_updated_at ON projects;
CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_projects_updated_at();

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================
COMMENT ON TABLE projects IS 'Enhanced project tracking with status, priority, progress, and team collaboration';
COMMENT ON TABLE project_milestones IS 'Milestones within projects to track major achievements';
COMMENT ON TABLE project_tasks IS 'Links regular tasks to projects for better organization';

COMMENT ON COLUMN projects.status IS 'Current project status: planning, active, on-hold, completed, archived';
COMMENT ON COLUMN projects.priority IS 'Project priority level: low, medium, high, urgent';
COMMENT ON COLUMN projects.progress IS 'Overall project completion percentage (0-100)';
COMMENT ON COLUMN projects.team_members IS 'Array of user IDs who can access and collaborate on this project';
COMMENT ON COLUMN project_milestones.order_index IS 'Display order for milestones within a project';
