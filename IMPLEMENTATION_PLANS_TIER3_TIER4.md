# Implementation Plans - Tier 3 & Tier 4 Features

**Generated:** 2025-12-07
**Purpose:** Implementation plans for features needing significant work (Tier 3) and minimal features (Tier 4)

---

# Tier 3 Features (Partial → Complete)

## Projects (70% → 100%) - Needs State, API, AI

### Current State
✅ Page: `src/pages/ProjectTracking.tsx`
✅ Tests: 4 test files (good coverage)
✅ Types: Strong TypeScript
✅ Feature directory: `src/projects/`
❌ Zustand slice: None
❌ API layer: None
❌ AI tools: None
🟡 Data: Local storage only

### Implementation Plan

#### Step 1: Create Type Definitions (1 hour)
**File:** `src/services/types.ts` (add to existing)
```typescript
export interface Project {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  status: 'planning' | 'active' | 'on-hold' | 'completed' | 'archived';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  start_date?: string;
  target_date?: string;
  completed_date?: string;
  tags: string[];
  color?: string;
  progress: number; // 0-100
  milestones: ProjectMilestone[];
  team_members?: string[]; // for shared projects
  created_at: string;
  updated_at: string;
}

export interface ProjectMilestone {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  target_date?: string;
  completed: boolean;
  completed_date?: string;
  order: number;
}

export interface ProjectTask {
  id: string;
  project_id: string;
  task_id: string; // reference to tasks table
}
```

#### Step 2: Create Supabase Tables (2 hours)
**SQL Migration:**
```sql
-- Projects table
CREATE TABLE projects (
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
  progress INTEGER DEFAULT 0,
  team_members UUID[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Project milestones
CREATE TABLE project_milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  target_date DATE,
  completed BOOLEAN DEFAULT false,
  completed_date DATE,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Project tasks (links tasks to projects)
CREATE TABLE project_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, task_id)
);

-- Indexes
CREATE INDEX idx_projects_user ON projects(user_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_milestones_project ON project_milestones(project_id);
CREATE INDEX idx_project_tasks_project ON project_tasks(project_id);
CREATE INDEX idx_project_tasks_task ON project_tasks(task_id);

-- RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_tasks ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own projects" ON projects
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = ANY(team_members));
CREATE POLICY "Users can insert their own projects" ON projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own projects" ON projects
  FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = ANY(team_members));
CREATE POLICY "Users can delete their own projects" ON projects
  FOR DELETE USING (auth.uid() = user_id);

-- Similar policies for milestones and project_tasks
```

#### Step 3: Create API Layer (4 hours)
**File:** `src/api/projectsAPI.ts`
```typescript
import { supabase } from '../lib/supabase';
import type { Project, ProjectMilestone } from '../services/types';

export async function getProjects(filters?: {
  status?: string;
  priority?: string;
  tags?: string[];
}): Promise<Project[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  let query = supabase
    .from('projects')
    .select(`
      *,
      milestones:project_milestones(*),
      tasks:project_tasks(task_id)
    `)
    .or(`user_id.eq.${user.id},team_members.cs.{${user.id}}`)
    .order('created_at', { ascending: false });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.priority) {
    query = query.eq('priority', filters.priority);
  }
  if (filters?.tags && filters.tags.length > 0) {
    query = query.contains('tags', filters.tags);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as Project[];
}

export async function createProject(
  project: Omit<Project, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'milestones'>
): Promise<Project> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('projects')
    .insert({ ...project, user_id: user.id })
    .select()
    .single();

  if (error) throw error;
  return data as Project;
}

export async function updateProject(
  id: string,
  updates: Partial<Project>
): Promise<Project> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('projects')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .or(`user_id.eq.${user.id},team_members.cs.{${user.id}}`)
    .select()
    .single();

  if (error) throw error;
  return data as Project;
}

export async function deleteProject(id: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) throw error;
}

// Milestones
export async function createMilestone(
  milestone: Omit<ProjectMilestone, 'id' | 'created_at'>
): Promise<ProjectMilestone> {
  const { data, error } = await supabase
    .from('project_milestones')
    .insert(milestone)
    .select()
    .single();

  if (error) throw error;
  return data as ProjectMilestone;
}

export async function updateMilestone(
  id: string,
  updates: Partial<ProjectMilestone>
): Promise<ProjectMilestone> {
  const { data, error } = await supabase
    .from('project_milestones')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as ProjectMilestone;
}

export async function linkTaskToProject(
  projectId: string,
  taskId: string
): Promise<void> {
  const { error } = await supabase
    .from('project_tasks')
    .insert({ project_id: projectId, task_id: taskId });

  if (error) throw error;
}

export async function unlinkTaskFromProject(
  projectId: string,
  taskId: string
): Promise<void> {
  const { error } = await supabase
    .from('project_tasks')
    .delete()
    .eq('project_id', projectId)
    .eq('task_id', taskId);

  if (error) throw error;
}
```

#### Step 4: Create Zustand Slice (3 hours)
**File:** `src/stores/slices/projectsSlice.ts`
```typescript
import type { StateCreator } from 'zustand';
import type { Project, ProjectMilestone } from '@/services/types';
import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
  createMilestone,
  updateMilestone,
  linkTaskToProject,
  unlinkTaskFromProject
} from '@/api/projectsAPI';

export interface ProjectsSlice {
  projects: Project[];
  projectsLoaded: boolean;
  projectsLoading: boolean;
  projectsError: string | null;

  loadProjects: (filters?: Parameters<typeof getProjects>[0]) => Promise<void>;
  addProject: (project: Omit<Project, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'milestones'>) => Promise<Project>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<Project>;
  deleteProject: (id: string) => Promise<void>;
  addMilestone: (milestone: Omit<ProjectMilestone, 'id' | 'created_at'>) => Promise<ProjectMilestone>;
  updateMilestone: (id: string, updates: Partial<ProjectMilestone>) => Promise<ProjectMilestone>;
  linkTask: (projectId: string, taskId: string) => Promise<void>;
  unlinkTask: (projectId: string, taskId: string) => Promise<void>;
  getProjectById: (id: string) => Project | undefined;
}

export const createProjectsSlice: StateCreator<ProjectsSlice, [], [], ProjectsSlice> = (set, get) => ({
  projects: [],
  projectsLoaded: false,
  projectsLoading: false,
  projectsError: null,

  loadProjects: async (filters) => {
    if (get().projectsLoading) return;
    set({ projectsLoading: true, projectsError: null });
    try {
      const projects = await getProjects(filters);
      set({ projects, projectsLoaded: true, projectsLoading: false });
    } catch (error) {
      set({
        projectsError: error instanceof Error ? error.message : 'Failed to load projects',
        projectsLoading: false
      });
      throw error;
    }
  },

  addProject: async (project) => {
    const created = await createProject(project);
    set((state) => ({ projects: [created, ...state.projects] }));
    return created;
  },

  updateProject: async (id, updates) => {
    const updated = await updateProject(id, updates);
    set((state) => ({
      projects: state.projects.map((p) => (p.id === id ? { ...p, ...updated } : p))
    }));
    return updated;
  },

  deleteProject: async (id) => {
    await deleteProject(id);
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id)
    }));
  },

  addMilestone: async (milestone) => {
    const created = await createMilestone(milestone);
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === milestone.project_id
          ? { ...p, milestones: [...p.milestones, created] }
          : p
      )
    }));
    return created;
  },

  updateMilestone: async (id, updates) => {
    const updated = await updateMilestone(id, updates);
    set((state) => ({
      projects: state.projects.map((p) => ({
        ...p,
        milestones: p.milestones.map((m) => (m.id === id ? { ...m, ...updated } : m))
      }))
    }));
    return updated;
  },

  linkTask: async (projectId, taskId) => {
    await linkTaskToProject(projectId, taskId);
    // Optionally refresh project
  },

  unlinkTask: async (projectId, taskId) => {
    await unlinkTaskFromProject(projectId, taskId);
    // Optionally refresh project
  },

  getProjectById: (id) => get().projects.find((p) => p.id === id)
});
```

#### Step 5: Register Slice in Store (1 hour)
**File:** `src/stores/useAppStore.ts`
```typescript
import { createProjectsSlice, type ProjectsSlice } from './slices/projectsSlice';

type AppStore = /* ... existing slices ... */ & ProjectsSlice;

export const useAppStore = create<AppStore>()((...a) => ({
  ...createProjectsSlice(...a),
  // ... other slices
}));
```

#### Step 6: Create AI Tools (4 hours)
**File:** `src/projects/tools.ts`
```typescript
import type { Tool, ToolDefinition, ToolResult } from '@/lib/ai/toolRegistry';
import { createProject, getProjects, updateProject, createMilestone } from '@/api/projectsAPI';

// Tool 1: Create Project
const createProjectDefinition: ToolDefinition = {
  type: 'function',
  function: {
    name: 'create_project',
    description: 'Create a new project. Requires name (string). Optional: description, status, priority, start_date, target_date, tags.',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Project name - required' },
        description: { type: 'string', description: 'Project description - optional' },
        status: {
          type: 'string',
          enum: ['planning', 'active', 'on-hold', 'completed', 'archived'],
          description: 'Project status - optional'
        },
        priority: {
          type: 'string',
          enum: ['low', 'medium', 'high', 'urgent'],
          description: 'Project priority - optional'
        },
        start_date: { type: 'string', description: 'Start date (YYYY-MM-DD) - optional' },
        target_date: { type: 'string', description: 'Target completion date (YYYY-MM-DD) - optional' },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Tags for categorization - optional'
        }
      },
      required: ['name']
    }
  }
};

// Tool 2: Get Projects
const getProjectsDefinition: ToolDefinition = {
  type: 'function',
  function: {
    name: 'get_projects',
    description: 'Get all projects. Optional filters: status, priority, tags.',
    parameters: {
      type: 'object',
      properties: {
        status: { type: 'string', description: 'Filter by status - optional' },
        priority: { type: 'string', description: 'Filter by priority - optional' },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Filter by tags - optional'
        }
      }
    }
  }
};

// Tool 3: Update Project Progress
const updateProjectProgressDefinition: ToolDefinition = {
  type: 'function',
  function: {
    name: 'update_project_progress',
    description: 'Update project progress. Requires project_name or project_id, and progress (0-100).',
    parameters: {
      type: 'object',
      properties: {
        project_name: { type: 'string', description: 'Project name to update' },
        project_id: { type: 'string', description: 'Project ID to update' },
        progress: {
          type: 'number',
          minimum: 0,
          maximum: 100,
          description: 'Progress percentage (0-100) - required'
        }
      },
      required: ['progress']
    }
  }
};

// Tool 4: Add Milestone
const addMilestoneDefinition: ToolDefinition = {
  type: 'function',
  function: {
    name: 'add_project_milestone',
    description: 'Add a milestone to a project. Requires project_name or project_id, and milestone title.',
    parameters: {
      type: 'object',
      properties: {
        project_name: { type: 'string', description: 'Project name' },
        project_id: { type: 'string', description: 'Project ID' },
        title: { type: 'string', description: 'Milestone title - required' },
        description: { type: 'string', description: 'Milestone description - optional' },
        target_date: { type: 'string', description: 'Target date (YYYY-MM-DD) - optional' }
      },
      required: ['title']
    }
  }
};

// Tool 5: Get Project Status
const getProjectStatusDefinition: ToolDefinition = {
  type: 'function',
  function: {
    name: 'get_project_status',
    description: 'Get detailed status of a specific project. Requires project_name or project_id.',
    parameters: {
      type: 'object',
      properties: {
        project_name: { type: 'string', description: 'Project name' },
        project_id: { type: 'string', description: 'Project ID' }
      }
    }
  }
};

// Implement execution functions...

export const projectTools: Tool[] = [
  { definition: createProjectDefinition, execute: executeCreateProject },
  { definition: getProjectsDefinition, execute: executeGetProjects },
  { definition: updateProjectProgressDefinition, execute: executeUpdateProgress },
  { definition: addMilestoneDefinition, execute: executeAddMilestone },
  { definition: getProjectStatusDefinition, execute: executeGetStatus }
];
```

#### Step 7: Register Tools (1 hour)
Update `src/services/conversationEngine.ts` to include project tools

#### Step 8: Update Page Component (2 hours)
Update `src/pages/ProjectTracking.tsx` to use Zustand store instead of local state

#### Step 9: Data Migration (2 hours)
Create script to migrate existing localStorage data to Supabase

**Total Time:** ~20 hours (2.5-3 days)

---

## Focus (70% → 100%) - Needs State, AI, Tests

### Current State
✅ API layer: `src/api/focusAPI.ts`
✅ Page: `src/pages/Focus.tsx`
✅ Types: Strong TypeScript
❌ Zustand slice: None (uses local state/hooks)
❌ AI tools: None
❌ Tests: None
🟡 Data: Local storage

### Implementation Plan

#### Step 1: Migrate Focus API to Supabase (3 hours)
Create Supabase tables for focus sessions:
```sql
CREATE TABLE focus_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL, -- 'pomodoro', 'deep-work', 'custom'
  duration_minutes INTEGER NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'in-progress', -- 'in-progress', 'completed', 'abandoned'
  task_id UUID REFERENCES tasks(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_focus_sessions_user ON focus_sessions(user_id);
CREATE INDEX idx_focus_sessions_date ON focus_sessions(started_at DESC);
```

#### Step 2: Create Zustand Slice (3 hours)
**File:** `src/stores/slices/focusSlice.ts`

#### Step 3: Create AI Tools (4 hours)
**File:** `src/focus/tools.ts`
```typescript
// Tools:
// - start_focus_session
// - complete_focus_session
// - get_focus_stats
// - get_focus_history
```

#### Step 4: Add Tests (6 hours)
- Session creation tests
- Timer functionality tests
- Statistics tests

**Total Time:** ~16 hours (2 days)

---

## 75 Hard (75% → 100%) - Needs State, API, AI

### Current State
✅ Page: `src/pages/SeventyFiveHard/index.tsx`
✅ Components: Good component structure
✅ Tests: 2 test files
✅ Types: Strong TypeScript
❌ Zustand slice: None
❌ API layer: None
❌ AI tools: None
🟡 Data: Local storage

### Implementation Plan

#### Step 1: Create Supabase Tables (2 hours)
```sql
CREATE TABLE seventy_five_hard_challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  start_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'completed', 'failed'
  current_day INTEGER DEFAULT 1,
  diet_choice TEXT NOT NULL,
  workout_1_type TEXT,
  workout_2_type TEXT,
  book_title TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE seventy_five_hard_daily_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  challenge_id UUID REFERENCES seventy_five_hard_challenges(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  day_number INTEGER NOT NULL,
  workout_1_completed BOOLEAN DEFAULT false,
  workout_2_completed BOOLEAN DEFAULT false,
  diet_followed BOOLEAN DEFAULT false,
  water_intake_completed BOOLEAN DEFAULT false,
  reading_completed BOOLEAN DEFAULT false,
  progress_photo_taken BOOLEAN DEFAULT false,
  photo_url TEXT,
  weight DECIMAL(5, 2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(challenge_id, date)
);
```

#### Step 2: Create API Layer (3 hours)
**File:** `src/api/seventyFiveHardAPI.ts`

#### Step 3: Create Zustand Slice (3 hours)
**File:** `src/stores/slices/seventyFiveHardSlice.ts`

#### Step 4: Create AI Tools (3 hours)
**File:** `src/seventyFiveHard/tools.ts`
```typescript
// Tools:
// - start_75_hard_challenge
// - log_daily_progress
// - get_challenge_status
// - complete_daily_task
```

#### Step 5: Add More Tests (4 hours)
Expand existing 2 tests to cover new functionality

**Total Time:** ~15 hours (2 days)

---

## Task Scheduler (60% → 100%) - Needs Full Stack

### Current State
✅ Page: `src/pages/TaskScheduler.tsx`
✅ Feature directory: `src/scheduler/`
❌ Zustand slice: None
❌ API layer: None
❌ AI tools: None
❌ Tests: None
🟡 Types: Moderate
🟡 Data: Local storage

### Implementation Plan

#### Step 1: Define Types (1 hour)
**File:** `src/services/types.ts`
```typescript
export interface ScheduleBlock {
  id: string;
  user_id: string;
  date: string;
  start_time: string; // HH:MM format
  end_time: string;
  task_id?: string;
  title?: string; // for non-task events
  type: 'task' | 'event' | 'focus' | 'break';
  is_recurring: boolean;
  recurrence_rule?: string; // RRULE format
  color?: string;
  created_at: string;
}
```

#### Step 2: Create Supabase Tables (2 hours)
```sql
CREATE TABLE schedule_blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  title TEXT,
  type TEXT NOT NULL,
  is_recurring BOOLEAN DEFAULT false,
  recurrence_rule TEXT,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_schedule_blocks_user_date ON schedule_blocks(user_id, date);
```

#### Step 3: Create API, Slice, Tools (12 hours)
- API layer with CRUD operations
- Zustand slice
- AI tools for scheduling
- Integration with tasks

#### Step 4: Add Tests (5 hours)

**Total Time:** ~20 hours (2.5 days)

---

## Analytics (60% → 100%) - Needs Enhancement

### Current State
✅ Page: `src/pages/Analytics.tsx`
❌ Zustand slice: None (aggregator only)
❌ API layer: None (computed data)
❌ AI tools: None
❌ Tests: None
🟡 Types: Moderate

### Implementation Plan

#### Step 1: Create Analytics Service (4 hours)
**File:** `src/services/analytics.ts`
```typescript
// Aggregate data from multiple features
export async function getProductivityAnalytics(dateRange: {
  startDate: string;
  endDate: string;
}): Promise<{
  tasksCompleted: number;
  habitsCompleted: number;
  focusMinutes: number;
  journalEntries: number;
  projectsProgressed: number;
}> {
  // Query all features and compute metrics
}

export async function getFinanceAnalytics(dateRange: {
  startDate: string;
  endDate: string;
}): Promise<{
  totalSpending: number;
  totalIncome: number;
  spendingByCategory: Record<string, number>;
  budgetCompliance: number;
}> {
  // Query finance data and compute
}

export async function getWellbeingAnalytics(dateRange: {
  startDate: string;
  endDate: string;
}): Promise<{
  averageMood: number;
  moodTrend: Array<{ date: string; mood: number }>;
  wellbeingScore: number;
}> {
  // Query journal moods and compute
}
```

#### Step 2: Create AI Tools (3 hours)
**File:** `src/analytics/tools.ts`
```typescript
// Tools:
// - get_productivity_summary
// - get_finance_summary
// - get_wellbeing_insights
// - get_weekly_report
// - get_monthly_report
```

#### Step 3: Enhanced Visualizations (6 hours)
- Add more chart types
- Better data visualization
- Exportable reports

#### Step 4: Add Tests (4 hours)

**Total Time:** ~17 hours (2 days)

---

## Life Goals (50% → 100%) - Needs Full Stack

### Current State
✅ Page: `src/pages/LifeGoals.tsx`
❌ Zustand slice: None
❌ API layer: None
❌ AI tools: None
❌ Tests: None
🟡 Types: Moderate
🟡 Data: Local storage

### Implementation Plan

#### Step 1: Clarify Difference from Goals Feature (1 hour)
**Decision:** Life Goals should be for long-term life planning (5-10+ years), while Goals are for shorter-term objectives (weeks-months-years)

**Life Goals Categories:**
- Career milestones
- Financial independence (FIRE, retirement)
- Family goals
- Life experiences (travel the world, etc.)
- Legacy goals

#### Step 2: Create Type Definitions (1 hour)
```typescript
export interface LifeGoal {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: 'career' | 'financial' | 'family' | 'experiences' | 'legacy' | 'health' | 'personal-growth';
  target_age?: number;
  target_year?: number;
  priority: 'must-have' | 'important' | 'nice-to-have';
  status: 'dreaming' | 'planning' | 'in-progress' | 'achieved';
  achievement_date?: string;
  related_goal_ids: string[]; // link to shorter-term goals
  milestones: string[];
  created_at: string;
  updated_at: string;
}
```

#### Step 3: Full Stack Implementation (15 hours)
- Supabase tables
- API layer
- Zustand slice
- AI tools
- Tests

**Total Time:** ~17 hours (2 days)

---

## Calendar (50% → 100%) - Needs Full Stack

### Current State
✅ Page: `src/pages/Calendar.tsx`
❌ Zustand slice: None
❌ API layer: None
❌ AI tools: None
❌ Tests: None
🟡 Types: Moderate
🟡 Data: Local storage

### Implementation Plan

#### Step 1: Create Type Definitions (1 hour)
```typescript
export interface CalendarEvent {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  start_date: string;
  start_time?: string;
  end_date: string;
  end_time?: string;
  all_day: boolean;
  location?: string;
  type: 'event' | 'meeting' | 'reminder' | 'birthday' | 'holiday';
  color?: string;
  is_recurring: boolean;
  recurrence_rule?: string;
  reminder_minutes?: number;
  attendees?: string[];
  task_id?: string; // link to tasks
  project_id?: string; // link to projects
  created_at: string;
  updated_at: string;
}
```

#### Step 2: Create Supabase Tables (2 hours)
```sql
CREATE TABLE calendar_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  start_time TIME,
  end_date DATE NOT NULL,
  end_time TIME,
  all_day BOOLEAN DEFAULT false,
  location TEXT,
  type TEXT NOT NULL,
  color TEXT,
  is_recurring BOOLEAN DEFAULT false,
  recurrence_rule TEXT,
  reminder_minutes INTEGER,
  attendees TEXT[],
  task_id UUID REFERENCES tasks(id),
  project_id UUID REFERENCES projects(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_calendar_events_user_date ON calendar_events(user_id, start_date);
```

#### Step 3: Full Stack Implementation (18 hours)
- API layer with CRUD + recurring events logic
- Zustand slice
- AI tools (create event, get schedule, find free time, etc.)
- Enhanced calendar UI
- Tests

**Total Time:** ~21 hours (2.5-3 days)

---

# Tier 4 Features (Minimal → Complete)

## Skincare (30% → 100%) - Needs Complete Rebuild

### Current State
✅ Page: `src/pages/Skincare.tsx` (minimal)
✅ Feature directory: `src/skincare/`
❌ Everything else missing

### Implementation Plan

#### Step 1: Define Feature Scope (2 hours)
**Skincare Tracking Should Include:**
- Product inventory (what you own)
- Routine tracking (AM/PM routines)
- Product usage tracking
- Skin condition logging
- Product recommendations
- Ingredient analysis
- Routine reminders

#### Step 2: Create Type Definitions (2 hours)
```typescript
export interface SkincareProduct {
  id: string;
  user_id: string;
  name: string;
  brand: string;
  category: 'cleanser' | 'toner' | 'serum' | 'moisturizer' | 'sunscreen' | 'treatment' | 'mask' | 'exfoliant';
  ingredients: string[];
  key_ingredients: string[]; // active ingredients
  open_date?: string;
  expiry_date?: string;
  purchase_date?: string;
  price?: number;
  rating?: number;
  notes?: string;
  in_use: boolean;
  created_at: string;
}

export interface SkincareRoutine {
  id: string;
  user_id: string;
  name: string; // "Morning Routine", "Evening Routine"
  time_of_day: 'am' | 'pm' | 'both';
  steps: SkincareRoutineStep[];
  active: boolean;
  created_at: string;
}

export interface SkincareRoutineStep {
  id: string;
  routine_id: string;
  order: number;
  product_id?: string;
  step_type: string; // "cleanse", "tone", "treat", "moisturize", "protect"
  instructions?: string;
}

export interface SkinConditionLog {
  id: string;
  user_id: string;
  date: string;
  overall_condition: 1 | 2 | 3 | 4 | 5; // 1=terrible, 5=excellent
  concerns: string[]; // "acne", "dryness", "redness", "sensitivity"
  notes?: string;
  photo_url?: string;
  created_at: string;
}
```

#### Step 3: Create Supabase Tables (3 hours)
Full SQL schema for products, routines, logs

#### Step 4: Create API Layer (6 hours)
**File:** `src/api/skincareAPI.ts`
Complete CRUD for all entities

#### Step 5: Create Zustand Slice (4 hours)
**File:** `src/stores/slices/skincareSlice.ts`

#### Step 6: Create AI Tools (5 hours)
**File:** `src/skincare/tools.ts`
```typescript
// Tools:
// - add_skincare_product
// - log_skin_condition
// - get_routine_suggestion
// - track_product_usage
// - get_skincare_stats
```

#### Step 7: Build UI Components (12 hours)
- Product inventory list
- Routine builder
- Condition logging form
- Analytics/trends view
- Product recommendations

#### Step 8: Add Tests (6 hours)

**Total Time:** ~40 hours (5 days)

---

## Travel (40% → 100%) - Needs Full Stack

### Current State
✅ Page: `src/pages/Travel.tsx` (basic visa calculator)
✅ Feature directory: `src/travel/`
❌ Zustand slice: None
❌ API layer: None
❌ AI tools: None
❌ Tests: None
🟡 Types: Moderate
🟡 Data: Local storage

### Implementation Plan

#### Step 1: Expand Feature Scope (2 hours)
**Travel Planning Should Include:**
- Trip planning (itineraries)
- Visa requirements tracking
- Packing lists
- Travel documents
- Expense tracking while traveling
- Photo/memory journal
- Travel bucket list

#### Step 2: Create Type Definitions (2 hours)
```typescript
export interface Trip {
  id: string;
  user_id: string;
  name: string;
  destination_countries: string[];
  start_date: string;
  end_date: string;
  status: 'planning' | 'booked' | 'in-progress' | 'completed';
  budget?: number;
  actual_cost?: number;
  travelers: string[]; // names
  itinerary: TripDay[];
  documents: TravelDocument[];
  packing_list_id?: string;
  created_at: string;
  updated_at: string;
}

export interface TripDay {
  id: string;
  trip_id: string;
  date: string;
  location: string;
  activities: string[];
  accommodations?: string;
  transportation?: string;
  notes?: string;
}

export interface TravelDocument {
  id: string;
  trip_id?: string; // optional, for general docs
  user_id: string;
  type: 'passport' | 'visa' | 'ticket' | 'booking' | 'insurance' | 'vaccination';
  name: string;
  document_number?: string;
  issue_date?: string;
  expiry_date?: string;
  file_url?: string;
  notes?: string;
  created_at: string;
}

export interface PackingList {
  id: string;
  trip_id?: string;
  user_id: string;
  name: string;
  items: PackingItem[];
  created_at: string;
}

export interface PackingItem {
  id: string;
  list_id: string;
  name: string;
  category: 'clothing' | 'toiletries' | 'electronics' | 'documents' | 'misc';
  quantity: number;
  packed: boolean;
}

export interface VisaRequirement {
  id: string;
  user_id: string;
  passport_country: string;
  destination_country: string;
  visa_required: boolean;
  visa_type?: string;
  max_stay_days?: number;
  notes?: string;
  last_updated: string;
}
```

#### Step 3: Create Supabase Tables (4 hours)
Full schema for trips, documents, packing lists, visa requirements

#### Step 4: Create API Layer (8 hours)
**File:** `src/api/travelAPI.ts`
Complete CRUD operations

#### Step 5: Create Zustand Slice (5 hours)
**File:** `src/stores/slices/travelSlice.ts`

#### Step 6: Create AI Tools (6 hours)
**File:** `src/travel/tools.ts`
```typescript
// Tools:
// - create_trip
// - add_to_itinerary
// - check_visa_requirements
// - create_packing_list
// - add_travel_document
// - get_trip_budget_summary
```

#### Step 7: Build Enhanced UI (15 hours)
- Trip planning dashboard
- Itinerary builder
- Document vault
- Packing list manager
- Visa calculator (enhance existing)
- Budget tracker

#### Step 8: Add Tests (6 hours)

**Total Time:** ~48 hours (6 days)

---

# Summary

## Time Estimates by Tier

### Tier 2 (5 features):
- Goals: 16 hours
- Journal: 16 hours
- Notes: 18 hours
- Meal Planning: 16 hours
- Finances: 25 hours
**Total: ~91 hours (11-12 days)**

### Tier 3 (7 features):
- Projects: 20 hours
- Focus: 16 hours
- 75 Hard: 15 hours
- Task Scheduler: 20 hours
- Analytics: 17 hours
- Life Goals: 17 hours
- Calendar: 21 hours
**Total: ~126 hours (16 days)**

### Tier 4 (2 features):
- Skincare: 40 hours
- Travel: 48 hours
**Total: ~88 hours (11 days)**

## Grand Total
**~305 hours (38 working days / ~8 weeks)**

## Recommended Execution Strategy

### Phase 1: Quick Wins (2 weeks)
Complete all Tier 2 features (91 hours)
- High ROI (already 80%+ complete)
- Brings 5 features to 100%
- Establishes testing culture

### Phase 2: Core Infrastructure (3 weeks)
Complete Tier 3 features (126 hours)
- Standardizes architecture across the board
- Adds significant functionality
- 7 more features to 100%

### Phase 3: Feature Expansion (2 weeks)
Complete Tier 4 features (88 hours)
- Fully functional Skincare & Travel
- Rounds out the complete life management suite

### Phase 4: Polish & Integration (1 week)
- Cross-feature integrations
- Performance optimization
- Documentation
- User guides

**Total Project Duration: ~8 weeks**

---

**Document Version:** 1.0
**Last Updated:** 2025-12-07
