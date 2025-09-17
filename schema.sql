-- LifeSync Database Schema
-- This creates all tables and configuration for the task management system

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT NOT NULL DEFAULT '#6366f1',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'on_hold')),
  icon TEXT DEFAULT '📁',
  user_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  project_id UUID REFERENCES projects(id),
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'done', 'waiting', 'scheduled', 'in_progress')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  estimated_time INTEGER DEFAULT 25,
  actual_time INTEGER DEFAULT 0,
  due_date TIMESTAMPTZ,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  category TEXT NOT NULL DEFAULT 'other' CHECK (category IN ('work', 'personal', 'learning', 'creative', 'health', 'other')),
  parent_id UUID REFERENCES tasks(id),
  depends_on UUID[],
  follow_up_tasks JSONB,
  is_waiting_for TEXT,
  trigger_date TIMESTAMPTZ,
  is_blocked BOOLEAN DEFAULT FALSE,
  reminder TIMESTAMPTZ,
  notes TEXT,
  attachments TEXT[],
  starred BOOLEAN DEFAULT FALSE,
  archived BOOLEAN DEFAULT FALSE,
  deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  assigned_to TEXT,
  user_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_deleted ON tasks(deleted);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);

-- Updated at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some initial projects
INSERT INTO projects (id, name, description, color, icon, status) VALUES 
('11111111-1111-1111-1111-111111111111', 'Personal', 'Personal tasks and goals', '#6366f1', '👤', 'active'),
('22222222-2222-2222-2222-222222222222', 'Work', 'Work-related tasks', '#10b981', '💼', 'active'),
('33333333-3333-3333-3333-333333333333', 'Learning', 'Learning and development', '#f59e0b', '📚', 'active'),
('44444444-4444-4444-4444-444444444444', 'Health', 'Health and wellness', '#ef4444', '❤️', 'active')
ON CONFLICT (id) DO NOTHING;

-- Insert some sample tasks
INSERT INTO tasks (id, title, description, project_id, status, priority, estimated_time, due_date, tags, category, is_waiting_for, starred) VALUES 
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Setup development environment', 'Configure all tools and dependencies for the project', '22222222-2222-2222-2222-222222222222', 'done', 'high', 60, NOW() - INTERVAL '1 day', ARRAY['setup', 'development'], 'work', NULL, false),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Review project requirements', 'Go through all requirements and create task breakdown', '22222222-2222-2222-2222-222222222222', 'todo', 'medium', 45, NOW() + INTERVAL '2 days', ARRAY['planning', 'requirements'], 'work', NULL, true),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Morning workout', '30 minute cardio session', '44444444-4444-4444-4444-444444444444', 'todo', 'low', 30, NOW(), ARRAY['exercise', 'morning'], 'health', NULL, false),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Read React documentation', 'Study new React 18 features and concurrent rendering', '33333333-3333-3333-3333-333333333333', 'in_progress', 'medium', 90, NOW() + INTERVAL '3 days', ARRAY['react', 'documentation'], 'learning', NULL, false)
ON CONFLICT (id) DO NOTHING;

-- Show created tables
\dt