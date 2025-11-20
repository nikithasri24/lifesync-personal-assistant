# Project Tracking Tab Analysis

**Date**: 2025-11-19
**Component**: Project Tracking (`/src/pages/ProjectTracking.tsx`)

---

## Overview

The Project Tracking tab is currently a **placeholder** with no active functionality. However, the infrastructure exists throughout the codebase:

- ✅ Database table (`projects`)
- ✅ Type definitions (multiple files)
- ✅ API hooks (`useTasks` includes project operations)
- ✅ Multiple implementation attempts (Debug, Test, Minimal versions)
- ❌ No production UI implementation

**Current State**: The tab displays a message saying features are "on the roadmap" and directs users to use Tasks and Goals instead.

---

## Current Implementation

### ProjectTracking.tsx (Active)

```typescript
const ProjectTracking: React.FC = () => {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 p-6 text-center">
      <h1 className="text-2xl font-semibold text-slate-900">Project tracking</h1>
      <p className="text-sm text-slate-600">
        A slimmer project view is on the roadmap. For now, keep task-level progress flowing
        from the Tasks and Goals sections—those feed the dashboard summaries automatically.
      </p>
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-12 text-slate-500">
        Kanban lanes, swimlanes, and dependency visualisation will return once the database
        schema is finalised.
      </div>
    </div>
  );
};
```

**Key Messages**:
- "A slimmer project view is on the roadmap"
- "Kanban lanes, swimlanes, and dependency visualisation will return"
- Database schema needs to be finalized (but it actually IS finalized!)

---

## Database Schema

### `projects` Table (EXISTS!)

```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  color TEXT NOT NULL DEFAULT '#6366f1',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'on_hold')),
  icon TEXT DEFAULT '📁',
  user_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_projects_user_id ON projects(user_id);

-- Constraints
CHECK (status IN ('active', 'completed', 'on_hold'))

-- Foreign Keys
Referenced by: tasks.project_id

-- Triggers
update_projects_updated_at (auto-updates updated_at column)
```

**Schema Status**: ✅ FULLY IMPLEMENTED AND READY

---

## Type Definitions

### Main Type (`src/types/index.ts`)

```typescript
export interface Project {
  id: string
  name: string
  description?: string
  color: string
  status: 'active' | 'completed' | 'on_hold'
  icon: string
  createdAt: Date
  updatedAt?: Date
}
```

### Database Type (`src/services/types.ts`)

```typescript
export interface ProjectData {
  id?: string;
  user_id?: string;
  name: string;
  description?: string | null;
  color?: string | null;
  status?: 'active' | 'completed' | 'on_hold';
  icon?: string | null;
  created_at?: string;
  updated_at?: string;
}
```

### Enhanced Type (`src/types/focusEnhanced.ts`)

```typescript
export interface Project {
  id: string;
  name: string;
  description?: string;
  color: string;
  status: 'active' | 'completed' | 'on_hold' | 'cancelled';
  startDate: Date;
  endDate?: Date;
  estimatedHours: number;
  actualHours: number;
  tasks: string[]; // task IDs
  team?: string[]; // user IDs
  progress: number; // 0-100
  category: string;
}
```

**Type Inconsistencies**: The enhanced type has additional fields not in the database schema.

---

## API Layer

### Database Service (`src/services/database.ts`)

```typescript
class Database {
  async getProjects(userId: string): Promise<Project[]> {
    const { data, error } = await this.client
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async createProject(project: Omit<Project, 'id' | 'created_at'>): Promise<Project> {
    const { data, error } = await this.client
      .from('projects')
      .insert([project])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Similar methods for update, delete
}
```

### useTasks Hook (`src/hooks/useTasks.ts`)

```typescript
export const useTasks = (): UseTasksReturn => {
  const [tasks, setTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<Project[]>([])

  // Project operations
  createProject: async (project) => { ... }
  updateProject: async (id, updates) => { ... }
  deleteProject: async (id) => { ... }

  // Real-time subscriptions for project changes
  useEffect(() => {
    const projectSub = db.subscribeToProjects(TEMP_USER_ID, handleProjectChange)
    return () => projectSub.unsubscribe()
  }, [])
}
```

**Current Usage**: Projects are integrated into the Tasks system but not exposed in a dedicated UI.

---

## Relationship to Tasks

### Tasks Table Schema

```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo',
  priority TEXT NOT NULL DEFAULT 'medium',
  project_id UUID REFERENCES projects(id), -- Link to projects!
  due_date TIMESTAMPTZ,
  tags TEXT[],
  completed_at TIMESTAMPTZ,
  deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Integration**: Tasks can be assigned to projects via `project_id` foreign key.

### Current UI Integration (TodosWorkingFollowUp.tsx)

The Tasks page DOES have project support:

```typescript
// Project filtering
const [selectedProject, setSelectedProject] = useState<string>('all');

// Project form
const [showProjectForm, setShowProjectForm] = useState(false);
const [newProjectData, setNewProjectData] = useState({
  name: '',
  description: '',
  color: '#6366f1',
  icon: '📁'
});

// Project operations from API
const {
  projects: apiProjects,
  createProject: apiCreateProject,
  updateProject: apiUpdateProject,
  deleteProject: apiDeleteProject,
} = useTasks();
```

**Key Discovery**: Projects ARE being created and managed through the Tasks page, not a dedicated Projects tab!

---

## Alternative Implementations Found

### 1. ProjectTrackingDebug.tsx

**Features**:
- Drag-and-drop Kanban board (@dnd-kit)
- Multi-project support with color coding
- Feature/task cards within columns
- Custom column definitions per project
- Priority badges (low, medium, high, critical)
- Category tags

**Interface**:
```typescript
interface ProjectColumn {
  id: string;
  name: string;
  color: string;
  order: number;
}

interface Feature {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  icon?: React.ReactNode;
  projectId: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
  features: Feature[];
  columns?: ProjectColumn[];
}
```

**Status**: ❌ Not used in production

### 2. ProjectTrackingMinimal.tsx

Simpler version with less complexity.

**Status**: ❌ Not used in production

### 3. ProjectTrackingTest.tsx

Test implementation for development.

**Status**: ❌ Not used in production

### 4. ProjectTrackingImportTest.tsx

Import/export testing.

**Status**: ❌ Not used in production

---

## Test Coverage

Extensive test files exist:

1. `ProjectTracking.test.tsx` - Basic functionality tests
2. `ProjectTracking.advanced.test.tsx` - Advanced feature tests
3. `ProjectTracking.dragdrop.test.tsx` - Drag-and-drop tests
4. `ProjectTracking.e2e.test.tsx` - End-to-end tests

**Implication**: Significant development effort was invested, but feature was shelved.

---

## Connections Module Integration

From `src/shared/types/connections.ts`:

```typescript
projects: {
  module: 'projects',
  label: 'Projects',
  description: 'Project tracking and management',
  icon: 'FolderOpen',
  defaultLevel: 'none',
  supportedLevels: ['none', 'view', 'collaborate'],
  hasSettings: false,
}
```

**Shareable**: Projects are designed to be shareable between connected users with 3 permission levels:
- `none` - Private
- `view` - Read-only access
- `collaborate` - Edit shared projects

---

## Current User Flow

### How Users Work with Projects TODAY:

1. Navigate to **Tasks** tab
2. Click "Add Project" (if UI supports it)
3. Create project with name, description, color, icon
4. Assign tasks to project via `project_id`
5. Filter tasks by project
6. (No visual project overview or Kanban view)

**Problem**: Projects are a second-class citizen - managed through Tasks rather than having their own dedicated space.

---

## What's Missing

### UI Features (Not Implemented):

1. **Kanban Board**
   - Customizable columns (Ideas, Working, Pending, Complete)
   - Drag-and-drop task management
   - Swimlanes per project
   - Visual progress indicators

2. **Project Dashboard**
   - Project list/grid view
   - Status overview (active, completed, on_hold)
   - Progress metrics
   - Task count by status
   - Time tracking summary

3. **Project Detail View**
   - Project metadata editor
   - Task list specific to project
   - Timeline/Gantt chart
   - Team member assignments
   - File attachments

4. **Dependency Visualization**
   - Task dependencies graph
   - Critical path highlighting
   - Blocked tasks indicator

5. **Templates**
   - Pre-defined project templates
   - Quick project creation from templates
   - Custom template creation

6. **Bulk Operations**
   - Bulk task creation
   - Bulk status updates
   - Bulk project assignment

7. **Analytics**
   - Burn-down charts
   - Velocity tracking
   - Completion forecasting
   - Time vs. estimates

---

## Comparison to Other LifeSync Features

| Feature | Database | API Layer | UI | Tests | Status |
|---------|----------|-----------|-----|-------|--------|
| **Projects** | ✅ Full | ✅ Full | ❌ Placeholder | ✅ Extensive | NOT ACTIVE |
| Journal | ✅ Full | ✅ Full | ✅ Enhanced | ❌ None | ACTIVE |
| Travel | ✅ Full | ✅ Full | ✅ Advanced | ❌ None | ACTIVE |
| Finances | ✅ Full | ✅ Full | ✅ Advanced | ❌ None | ACTIVE |
| 75 Hard | ✅ Full | ✅ Full | ✅ Advanced | ❌ None | ACTIVE |
| Shared | ✅ Full | ✅ Full | ✅ Complete | ❌ None | ACTIVE |

**Anomaly**: Projects is the ONLY feature with full backend + extensive tests but NO production UI.

---

## Why Was It Shelved?

Based on the placeholder message and file evidence:

1. **Feature Complexity**: Kanban boards, drag-and-drop, dependencies are complex
2. **UX Decisions**: Uncertainty about the right interface
3. **Overlap Concerns**: Tasks already handle much of project management
4. **Development Priority**: Other features took precedence
5. **Database Schema Concerns**: Message mentions "once database schema is finalised" but schema IS finalized

**Hypothesis**: The feature was partially built, tested, but never deemed "ready" for production. Decision was made to keep it on roadmap rather than ship incomplete version.

---

## Technical Debt

1. **Multiple Unused Implementations**: 4 alternative implementations exist but aren't cleaned up
2. **Test Files Without Feature**: Tests exist for non-existent functionality
3. **Type Inconsistencies**: Multiple Project type definitions with conflicting fields
4. **Dead Code**: Database service methods, hooks, types that aren't used
5. **Misleading Placeholder**: Says "schema needs finalizing" when it's already done

---

## Recommended Approaches

### Option 1: Full Kanban Implementation

**Pros**:
- Leverages existing backend
- Provides visual project management
- Differentiated from Tasks tab
- Tests already exist

**Cons**:
- High development effort
- Complexity in UX
- May duplicate Tasks functionality

**Estimated Effort**: 3-5 days

### Option 2: Simple Project Dashboard

**Pros**:
- Quick to implement
- Focuses on overview/metrics
- Complements Tasks tab
- Lower complexity

**Cons**:
- Less feature-rich
- May not justify separate tab

**Estimated Effort**: 1-2 days

### Option 3: Merge into Tasks Tab

**Pros**:
- Eliminates redundancy
- Users already create projects there
- Simpler mental model

**Cons**:
- Tasks tab becomes more complex
- No dedicated project view

**Estimated Effort**: 1 day (refactor/cleanup)

### Option 4: Enhanced Tasks Tab with Project View Mode

**Pros**:
- Single source of truth
- Toggle between task/project views
- Reuses existing infrastructure
- Maintains simplicity

**Cons**:
- UI toggle complexity
- Mixed concerns in one tab

**Estimated Effort**: 2-3 days

---

## Recommended Implementation (Option 4)

### Enhanced Tasks Tab with Dual View Mode

**Concept**: Add a view toggle to Tasks tab: "List View" (current) vs. "Project View" (new)

#### Project View Features:

1. **Project Cards Grid**
   - Card per project
   - Color-coded
   - Show: name, description, task count, progress %
   - Status badge (active/completed/on_hold)

2. **Expandable Project Details**
   - Click card to expand
   - Shows task list for that project
   - Inline task creation
   - Quick filters (by status, priority)

3. **Project Creation Form**
   - Already exists in Tasks tab
   - Just make more prominent in Project View

4. **Metrics Dashboard**
   - Total projects count
   - Completion percentage
   - Most active project
   - Upcoming deadlines

5. **Quick Actions**
   - Archive completed projects
   - Duplicate project structure
   - Export project tasks

#### Why This Approach:

- ✅ Leverages ALL existing backend
- ✅ Minimal new code
- ✅ Doesn't duplicate functionality
- ✅ Gives projects their own space
- ✅ Maintains task-project relationship
- ✅ Can iterate to Kanban later if needed

---

## Migration Strategy

If implementing a proper Projects tab:

1. **Phase 1**: Simple project grid view
   - List all projects
   - Create/edit/delete
   - View tasks per project

2. **Phase 2**: Metrics and insights
   - Progress tracking
   - Task completion stats
   - Time estimates

3. **Phase 3**: Kanban board (optional)
   - Drag-and-drop
   - Custom columns
   - Advanced features

---

## Code References

### Key Files:

**Active**:
- `src/pages/ProjectTracking.tsx` - Placeholder (19 lines)
- `src/pages/TodosWorkingFollowUp.tsx:80-350` - Project integration in Tasks
- `src/hooks/useTasks.ts:22-24` - Project CRUD operations
- `src/services/database.ts:107-150` - Database service methods

**Inactive (but complete)**:
- `src/pages/ProjectTrackingDebug.tsx` - Full Kanban implementation (700+ lines)
- `src/pages/ProjectTrackingMinimal.tsx` - Simpler version
- `src/pages/__tests__/ProjectTracking*.test.tsx` - Comprehensive tests

### Database Queries:

```typescript
// Get all projects for user
SELECT * FROM projects WHERE user_id = $1 ORDER BY created_at DESC;

// Get project with tasks
SELECT p.*,
       json_agg(t.*) as tasks
FROM projects p
LEFT JOIN tasks t ON t.project_id = p.id
WHERE p.user_id = $1
GROUP BY p.id;

// Get project completion stats
SELECT
  COUNT(*) FILTER (WHERE status = 'active') as active_count,
  COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
  COUNT(*) FILTER (WHERE status = 'on_hold') as on_hold_count
FROM projects
WHERE user_id = $1;
```

---

## Conclusion

The Project Tracking tab is a **ghost feature** - all infrastructure exists, but no production UI. Projects ARE being used through the Tasks tab, but without a dedicated visual interface.

**Current State**: Functional backend, no frontend.

**User Impact**: Low - users can manage projects through Tasks, just without dedicated views.

**Technical Debt**: Moderate - multiple unused implementations and tests for non-existent features.

**Recommended Path**: Implement Option 4 (Enhanced Tasks with Project View toggle) to activate this feature without major complexity.

**Time to Implement**: 2-3 days for a production-ready project view within Tasks tab.
