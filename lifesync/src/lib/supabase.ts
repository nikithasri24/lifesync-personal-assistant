import { createClient } from '@supabase/supabase-js'

// These would normally be environment variables
// For demo purposes, using placeholder values
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'your-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database Types
export interface Task {
  id: string
  title: string
  description?: string
  project_id?: string
  status: 'todo' | 'done' | 'waiting' | 'scheduled' | 'in_progress'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  estimated_time: number
  actual_time: number
  due_date?: string
  tags: string[]
  created_at: string
  completed_at?: string
  category: 'work' | 'personal' | 'learning' | 'creative' | 'health' | 'other'
  parent_id?: string
  depends_on?: string[]
  follow_up_tasks?: FollowUpTask[]
  is_waiting_for?: string
  trigger_date?: string
  is_blocked?: boolean
  reminder?: string
  notes?: string
  attachments?: string[]
  starred?: boolean
  archived?: boolean
  deleted?: boolean
  deleted_at?: string
  assigned_to?: string
  user_id: string
}

export interface Project {
  id: string
  name: string
  description?: string
  color: string
  status: 'active' | 'completed' | 'on_hold'
  icon: string
  user_id: string
  created_at: string
}

export interface FollowUpTask {
  id: string
  title: string
  description?: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  days_after?: number
  trigger_condition?: 'immediate' | 'delayed' | 'manual'
  category: 'work' | 'personal' | 'learning' | 'creative' | 'health' | 'other'
  estimated_time: number
  tags: string[]
}

// Database Tables Schema (SQL)
/*
-- Tasks table
CREATE TABLE tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
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
  user_id UUID NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Projects table
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT NOT NULL DEFAULT '#6366f1',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'on_hold')),
  icon TEXT DEFAULT '📁',
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_deleted ON tasks(deleted);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_projects_user_id ON projects(user_id);

-- RLS (Row Level Security) policies
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Policies (users can only see their own data)
CREATE POLICY "Users can view own tasks" ON tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tasks" ON tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tasks" ON tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tasks" ON tasks FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own projects" ON projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own projects" ON projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own projects" ON projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own projects" ON projects FOR DELETE USING (auth.uid() = user_id);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
*/