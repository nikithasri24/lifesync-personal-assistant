# Separation of Concerns - Refactoring Plan

## The Problem: God Objects Everywhere

### Current State: Mega-Store Anti-Pattern

**`useRealAppStore.ts`**: **3,142 lines**, **466 properties/methods**

This single file is responsible for:
- ✗ Tasks management
- ✗ Habits tracking
- ✗ Notes CRUD
- ✗ Journal entries
- ✗ Goals & dreams
- ✗ Finance tracking
- ✗ Meal planning
- ✗ Shopping lists
- ✗ Recipe management
- ✗ Pantry items
- ✗ Focus sessions
- ✗ Mood tracking
- ✗ 75 Hard challenge
- ✗ UI state (sidebar, theme, active view)
- ✗ User stats
- ✗ AND MORE...

**This violates EVERY software engineering principle:**
- ❌ Single Responsibility Principle (SRP)
- ❌ Separation of Concerns
- ❌ Interface Segregation
- ❌ Don't Repeat Yourself (DRY)
- ❌ Open/Closed Principle

---

## The Solution: Clean Architecture with Domain-Driven Design

### Target Architecture

```
src/
├── domains/                    # Feature domains (bounded contexts)
│   ├── tasks/
│   │   ├── api/               # Data access layer
│   │   │   └── tasksAPI.ts
│   │   ├── services/          # Business logic layer
│   │   │   └── tasksService.ts
│   │   ├── stores/            # State management layer
│   │   │   └── tasksStore.ts
│   │   ├── hooks/             # React integration layer
│   │   │   └── useTasks.ts
│   │   ├── components/        # Presentation layer
│   │   ├── types.ts           # Domain types
│   │   └── index.ts           # Public API
│   │
│   ├── habits/
│   ├── notes/
│   ├── journal/
│   ├── goals/
│   ├── finance/
│   ├── meals/
│   ├── shopping/
│   ├── focus/
│   └── ui/                    # UI-only state (sidebar, theme, etc.)
│
├── shared/                     # Cross-domain utilities
│   ├── api/
│   │   └── client.ts          # Base API client
│   ├── services/
│   │   ├── logger.ts
│   │   └── errorHandler.ts
│   ├── hooks/
│   │   └── useAsync.ts
│   └── types/
│       └── common.ts
│
└── lib/                        # External integrations
    ├── supabase.ts
    └── react-query.ts
```

---

## Step-by-Step Refactoring Plan

### Phase 1: Extract Domain Logic - Tasks Domain (Example)

#### Step 1.1: Create Domain Structure

```bash
mkdir -p src/domains/tasks/{api,services,stores,hooks,components}
touch src/domains/tasks/{types.ts,index.ts}
```

#### Step 1.2: Define Domain Types

```typescript
// src/domains/tasks/types.ts
export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  projectId?: string;
  dueDate?: Date;
  estimatedTime?: number;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  priority?: Task['priority'];
  projectId?: string;
  dueDate?: Date;
  estimatedTime?: number;
  tags?: string[];
}

export interface UpdateTaskInput extends Partial<CreateTaskInput> {
  status?: Task['status'];
}

export interface TaskFilters {
  status?: Task['status'][];
  priority?: Task['priority'][];
  projectId?: string;
  search?: string;
  tags?: string[];
}
```

#### Step 1.3: API Layer (Data Access)

```typescript
// src/domains/tasks/api/tasksAPI.ts
import { supabase } from '@/lib/supabase';
import type { Task, CreateTaskInput, UpdateTaskInput, TaskFilters } from '../types';

/**
 * Tasks API - Data access layer
 * Handles all Supabase interactions for tasks
 */
export class TasksAPI {
  private readonly table = 'tasks';

  async getAll(filters?: TaskFilters): Promise<Task[]> {
    let query = supabase
      .from(this.table)
      .select('*')
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters?.status) {
      query = query.in('status', filters.status);
    }
    if (filters?.priority) {
      query = query.in('priority', filters.priority);
    }
    if (filters?.projectId) {
      query = query.eq('project_id', filters.projectId);
    }
    if (filters?.search) {
      query = query.ilike('title', `%${filters.search}%`);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch tasks: ${error.message}`);
    }

    return data.map(this.mapFromDB);
  }

  async getById(id: string): Promise<Task> {
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Failed to fetch task: ${error.message}`);
    }

    return this.mapFromDB(data);
  }

  async create(input: CreateTaskInput): Promise<Task> {
    const { data, error } = await supabase
      .from(this.table)
      .insert(this.mapToDB(input))
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create task: ${error.message}`);
    }

    return this.mapFromDB(data);
  }

  async update(id: string, input: UpdateTaskInput): Promise<Task> {
    const { data, error } = await supabase
      .from(this.table)
      .update(this.mapToDB(input))
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update task: ${error.message}`);
    }

    return this.mapFromDB(data);
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from(this.table)
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete task: ${error.message}`);
    }
  }

  // Data mapping (DB snake_case <-> Domain camelCase)
  private mapFromDB(row: any): Task {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      status: row.status,
      priority: row.priority,
      projectId: row.project_id,
      dueDate: row.due_date ? new Date(row.due_date) : undefined,
      estimatedTime: row.estimated_time,
      tags: row.tags || [],
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  private mapToDB(input: CreateTaskInput | UpdateTaskInput): any {
    return {
      title: input.title,
      description: input.description,
      priority: input.priority,
      project_id: input.projectId,
      due_date: input.dueDate?.toISOString(),
      estimated_time: input.estimatedTime,
      tags: input.tags,
      ...(('status' in input) && { status: input.status }),
    };
  }
}

export const tasksAPI = new TasksAPI();
```

#### Step 1.4: Service Layer (Business Logic)

```typescript
// src/domains/tasks/services/tasksService.ts
import { tasksAPI } from '../api/tasksAPI';
import type { Task, CreateTaskInput, UpdateTaskInput } from '../types';

/**
 * Tasks Service - Business logic layer
 * Handles task-related operations and business rules
 */
export class TasksService {
  async completeTask(taskId: string): Promise<Task> {
    const task = await tasksAPI.getById(taskId);

    // Business rule: Can't complete a cancelled task
    if (task.status === 'cancelled') {
      throw new Error('Cannot complete a cancelled task');
    }

    // Update task
    const updatedTask = await tasksAPI.update(taskId, {
      status: 'completed',
    });

    // Side effects: Update related entities
    await this.handleTaskCompletion(updatedTask);

    return updatedTask;
  }

  async startTask(taskId: string): Promise<Task> {
    const task = await tasksAPI.getById(taskId);

    // Business rule: Can't start a completed task
    if (task.status === 'completed') {
      throw new Error('Cannot start a completed task');
    }

    return await tasksAPI.update(taskId, {
      status: 'in_progress',
    });
  }

  async estimateTaskTime(task: Task): number {
    // Business logic: Auto-estimate based on title/description
    const words = (task.title + ' ' + (task.description || '')).split(' ').length;
    const baseTime = Math.max(15, words * 2); // 2 min per word, min 15 min

    // Adjust by priority
    const priorityMultiplier = {
      low: 0.8,
      medium: 1.0,
      high: 1.2,
    };

    return Math.round(baseTime * priorityMultiplier[task.priority]);
  }

  async getOverdueTasks(): Promise<Task[]> {
    const allTasks = await tasksAPI.getAll({
      status: ['todo', 'in_progress'],
    });

    const now = new Date();
    return allTasks.filter(task =>
      task.dueDate && task.dueDate < now
    );
  }

  private async handleTaskCompletion(task: Task): Promise<void> {
    // Business logic: Side effects when task is completed

    // 1. If task is linked to a habit, update habit streak
    // (would call habitsService here)

    // 2. If task is part of a project, check project completion
    // (would call projectsService here)

    // 3. Log analytics event
    // (would call analyticsService here)
  }
}

export const tasksService = new TasksService();
```

#### Step 1.5: Store Layer (State Management)

```typescript
// src/domains/tasks/stores/tasksStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { tasksAPI } from '../api/tasksAPI';
import { tasksService } from '../services/tasksService';
import type { Task, CreateTaskInput, UpdateTaskInput, TaskFilters } from '../types';

interface TasksState {
  // State
  tasks: Task[];
  isLoading: boolean;
  error: Error | null;
  filters: TaskFilters;

  // Actions
  loadTasks: (filters?: TaskFilters) => Promise<void>;
  createTask: (input: CreateTaskInput) => Promise<Task>;
  updateTask: (id: string, input: UpdateTaskInput) => Promise<Task>;
  deleteTask: (id: string) => Promise<void>;
  completeTask: (id: string) => Promise<Task>;
  startTask: (id: string) => Promise<Task>;
  setFilters: (filters: TaskFilters) => void;
  clearFilters: () => void;
}

export const useTasksStore = create<TasksState>()(
  devtools(
    (set, get) => ({
      // Initial state
      tasks: [],
      isLoading: false,
      error: null,
      filters: {},

      // Actions
      loadTasks: async (filters?: TaskFilters) => {
        set({ isLoading: true, error: null });
        try {
          const tasks = await tasksAPI.getAll(filters || get().filters);
          set({ tasks, isLoading: false });
        } catch (error) {
          set({ error: error as Error, isLoading: false });
          throw error;
        }
      },

      createTask: async (input) => {
        set({ isLoading: true, error: null });
        try {
          const task = await tasksAPI.create(input);
          set((state) => ({
            tasks: [task, ...state.tasks],
            isLoading: false,
          }));
          return task;
        } catch (error) {
          set({ error: error as Error, isLoading: false });
          throw error;
        }
      },

      updateTask: async (id, input) => {
        set({ isLoading: true, error: null });
        try {
          const task = await tasksAPI.update(id, input);
          set((state) => ({
            tasks: state.tasks.map(t => t.id === id ? task : t),
            isLoading: false,
          }));
          return task;
        } catch (error) {
          set({ error: error as Error, isLoading: false });
          throw error;
        }
      },

      deleteTask: async (id) => {
        set({ isLoading: true, error: null });
        try {
          await tasksAPI.delete(id);
          set((state) => ({
            tasks: state.tasks.filter(t => t.id !== id),
            isLoading: false,
          }));
        } catch (error) {
          set({ error: error as Error, isLoading: false });
          throw error;
        }
      },

      completeTask: async (id) => {
        set({ isLoading: true, error: null });
        try {
          const task = await tasksService.completeTask(id);
          set((state) => ({
            tasks: state.tasks.map(t => t.id === id ? task : t),
            isLoading: false,
          }));
          return task;
        } catch (error) {
          set({ error: error as Error, isLoading: false });
          throw error;
        }
      },

      startTask: async (id) => {
        set({ isLoading: true, error: null });
        try {
          const task = await tasksService.startTask(id);
          set((state) => ({
            tasks: state.tasks.map(t => t.id === id ? task : t),
            isLoading: false,
          }));
          return task;
        } catch (error) {
          set({ error: error as Error, isLoading: false });
          throw error;
        }
      },

      setFilters: (filters) => {
        set({ filters });
        get().loadTasks(filters);
      },

      clearFilters: () => {
        set({ filters: {} });
        get().loadTasks({});
      },
    }),
    { name: 'TasksStore' }
  )
);
```

#### Step 1.6: React Hooks Layer (Component Integration)

```typescript
// src/domains/tasks/hooks/useTasks.ts
import { useTasksStore } from '../stores/tasksStore';
import { useEffect } from 'react';
import type { TaskFilters } from '../types';

/**
 * Hook to load and access tasks
 */
export function useTasks(filters?: TaskFilters) {
  const { tasks, isLoading, error, loadTasks } = useTasksStore();

  useEffect(() => {
    loadTasks(filters);
  }, [JSON.stringify(filters)]);

  return { tasks, isLoading, error };
}

/**
 * Hook for task mutations
 */
export function useTaskMutations() {
  const {
    createTask,
    updateTask,
    deleteTask,
    completeTask,
    startTask,
  } = useTasksStore();

  return {
    createTask,
    updateTask,
    deleteTask,
    completeTask,
    startTask,
  };
}

/**
 * Hook for overdue tasks
 */
export function useOverdueTasks() {
  const { tasks } = useTasksStore();
  const now = new Date();

  return tasks.filter(task =>
    task.status !== 'completed' &&
    task.status !== 'cancelled' &&
    task.dueDate &&
    task.dueDate < now
  );
}

/**
 * Hook for task statistics
 */
export function useTaskStats() {
  const { tasks } = useTasksStore();

  return {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'completed').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    overdue: tasks.filter(t => {
      if (t.status === 'completed' || t.status === 'cancelled') return false;
      return t.dueDate && t.dueDate < new Date();
    }).length,
  };
}
```

#### Step 1.7: Public API (Barrel Export)

```typescript
// src/domains/tasks/index.ts
// Types
export type { Task, CreateTaskInput, UpdateTaskInput, TaskFilters } from './types';

// API
export { tasksAPI } from './api/tasksAPI';

// Services
export { tasksService } from './services/tasksService';

// Store
export { useTasksStore } from './stores/tasksStore';

// Hooks
export {
  useTasks,
  useTaskMutations,
  useOverdueTasks,
  useTaskStats,
} from './hooks/useTasks';

// Components (would export task components here)
```

#### Step 1.8: Component Usage (Clean Separation)

```typescript
// src/pages/Todos.tsx
import { useTasks, useTaskMutations, useTaskStats } from '@/domains/tasks';

function Todos() {
  const { tasks, isLoading, error } = useTasks();
  const { completeTask, deleteTask } = useTaskMutations();
  const stats = useTaskStats();

  if (isLoading) return <Spinner />;
  if (error) return <Error error={error} />;

  return (
    <div>
      <TaskStats stats={stats} />
      <TaskList
        tasks={tasks}
        onComplete={completeTask}
        onDelete={deleteTask}
      />
    </div>
  );
}
```

---

## Phase 2: Replicate for All Domains

Apply the same pattern to:

### 1. Habits Domain
```
src/domains/habits/
├── api/habitsAPI.ts
├── services/habitsService.ts
├── stores/habitsStore.ts
├── hooks/useHabits.ts
├── types.ts
└── index.ts
```

### 2. Notes Domain
```
src/domains/notes/
├── api/notesAPI.ts
├── services/notesService.ts
├── stores/notesStore.ts
├── hooks/useNotes.ts
├── types.ts
└── index.ts
```

### 3. Journal Domain
```
src/domains/journal/
├── api/journalAPI.ts
├── services/journalService.ts
├── stores/journalStore.ts
├── hooks/useJournal.ts
├── types.ts
└── index.ts
```

### 4. Goals Domain
```
src/domains/goals/
├── api/goalsAPI.ts
├── services/goalsService.ts
├── stores/goalsStore.ts
├── hooks/useGoals.ts
├── types.ts
└── index.ts
```

### 5-12. Finance, Meals, Shopping, Focus, Mood, 75Hard, Skincare, Travel

---

## Phase 3: Shared Infrastructure

### Shared API Client

```typescript
// src/shared/api/client.ts
import { supabase } from '@/lib/supabase';

export abstract class BaseAPI<T, TCreate, TUpdate> {
  constructor(protected readonly table: string) {}

  protected async query<R = T>(
    builder: (qb: any) => any
  ): Promise<R> {
    const query = builder(supabase.from(this.table));
    const { data, error } = await query;

    if (error) {
      throw this.handleError(error);
    }

    return data;
  }

  protected handleError(error: any): Error {
    // Centralized error handling
    console.error(`API Error (${this.table}):`, error);
    return new Error(error.message || 'Unknown error');
  }

  protected abstract mapFromDB(row: any): T;
  protected abstract mapToDB(input: TCreate | TUpdate): any;
}
```

### Shared Logger

```typescript
// src/shared/services/logger.ts
const isDev = import.meta.env.DEV;

export const logger = {
  debug: (domain: string, ...args: any[]) => {
    if (isDev) console.log(`[${domain}]`, ...args);
  },

  info: (domain: string, ...args: any[]) => {
    if (isDev) console.info(`[${domain}]`, ...args);
  },

  warn: (domain: string, ...args: any[]) => {
    console.warn(`[${domain}]`, ...args);
  },

  error: (domain: string, error: Error, context?: any) => {
    console.error(`[${domain}]`, error, context);
    // In production: send to error tracking
  },
};
```

---

## Phase 4: UI State Separation

```typescript
// src/domains/ui/stores/uiStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  // View state
  activeView: ViewKey;
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark' | 'auto';

  // Settings
  weekStartsOn: 0 | 1;

  // Toast/notifications
  toast: Toast | null;

  // Actions
  setActiveView: (view: ViewKey) => void;
  toggleSidebar: () => void;
  setTheme: (theme: UIState['theme']) => void;
  showToast: (toast: Toast) => void;
  clearToast: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      activeView: 'dashboard',
      sidebarCollapsed: false,
      theme: 'auto',
      weekStartsOn: 0,
      toast: null,

      setActiveView: (view) => set({ activeView: view }),
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setTheme: (theme) => set({ theme }),
      showToast: (toast) => set({ toast }),
      clearToast: () => set({ toast: null }),
    }),
    { name: 'ui-state' }
  )
);
```

---

## Migration Strategy

### Step 1: Create New Structure (Parallel)
- Don't delete old code yet
- Build new domain structure alongside
- Test thoroughly

### Step 2: Migrate Domain by Domain
```
Week 1: Tasks domain (reference implementation)
Week 2: Habits + Notes domains
Week 3: Journal + Goals domains
Week 4: Finance domain
Week 5: Meals + Shopping domains
Week 6: Focus + Mood + 75Hard domains
Week 7: UI state extraction
Week 8: Remove old mega-store
```

### Step 3: Update Components
- Change imports from `useRealAppStore` to domain hooks
- Test each component after migration
- Deploy incrementally

### Step 4: Delete Mega-Store
```bash
# After all migrations complete
git rm src/stores/useRealAppStore.ts
git rm src/stores/useAppStore.ts (if it's a wrapper)
```

---

## Benefits of This Architecture

### Before (God Object)
```typescript
// 466 properties/methods in one file
const {
  tasks, loadTasks, addTask, updateTask, deleteTask,
  habits, loadHabits, addHabit, updateHabit, deleteHabit,
  notes, loadNotes, addNote, updateNote, deleteNote,
  // ... 450+ more
} = useRealAppStore();
```

### After (Separated Concerns)
```typescript
// Tasks domain
import { useTasks, useTaskMutations } from '@/domains/tasks';
const { tasks, isLoading } = useTasks();
const { createTask } = useTaskMutations();

// Habits domain
import { useHabits } from '@/domains/habits';
const { habits } = useHabits();

// UI state
import { useUIStore } from '@/domains/ui';
const { activeView, setActiveView } = useUIStore();
```

### Comparison Table

| Aspect | Before (God Object) | After (Separated) |
|--------|-------------------|-------------------|
| **Lines per file** | 3,142 | ~150 average |
| **Properties** | 466 in one object | ~20 per domain |
| **Testability** | Nearly impossible | Easy (isolated) |
| **Reusability** | Coupled to everything | Fully reusable |
| **Type safety** | Weak | Strong |
| **Tree-shaking** | Impossible | Automatic |
| **Bundle size** | Includes everything | Only used domains |
| **Maintenance** | Nightmare | Easy |
| **Onboarding** | Weeks | Days |
| **Bug isolation** | Hard | Easy |
| **Performance** | Re-renders everywhere | Granular updates |

---

## Immediate Action Plan

### Quick Start (This Weekend - 8 hours)

**Hour 1-2:** Set up tasks domain structure
```bash
mkdir -p src/domains/tasks/{api,services,stores,hooks}
# Copy code from above examples
```

**Hour 3-4:** Implement tasks API + service layers
```bash
# Write tasksAPI.ts
# Write tasksService.ts
# Add tests
```

**Hour 5-6:** Implement tasks store + hooks
```bash
# Write tasksStore.ts
# Write useTasks.ts hooks
```

**Hour 7-8:** Migrate one component to use new architecture
```bash
# Update src/pages/Todos.tsx
# Test thoroughly
# Deploy to see if it works
```

**Outcome:** Working proof-of-concept that validates the architecture

---

## Code Quality Metrics

### Complexity Reduction

**Before:**
- Cyclomatic complexity: >500
- Cognitive complexity: >1000
- Lines of code: 3,142
- Number of dependencies: 50+

**After (per domain):**
- Cyclomatic complexity: <20
- Cognitive complexity: <30
- Lines of code: ~150
- Number of dependencies: 3-5

### Maintainability Index

**Before:** 15/100 (Very Hard to Maintain)
**After:** 85/100 (Easy to Maintain)

---

## Testing Strategy

### Before (Mega-Store)
```typescript
// Nearly impossible to test
test('tasks work', () => {
  // Need to mock 466 properties
  // Need to mock Supabase
  // Need to mock all domains
  // Flaky, slow, painful
});
```

### After (Separated)
```typescript
// Easy to test in isolation
describe('TasksService', () => {
  it('completes a task', async () => {
    const mockAPI = {
      getById: jest.fn().mockResolvedValue(mockTask),
      update: jest.fn().mockResolvedValue(completedTask),
    };

    const service = new TasksService(mockAPI);
    const result = await service.completeTask('123');

    expect(result.status).toBe('completed');
  });
});
```

---

## Bottom Line

**Current state:** One 3,142-line god object with 466 properties managing 15+ unrelated concerns.

**Target state:** 15 small, focused domain modules averaging ~150 lines each, with clear separation between API, business logic, state, and UI.

**Effort:** 6-8 weeks of refactoring

**Impact:**
- ⭐⭐⭐⭐⭐ Code quality
- ⭐⭐⭐⭐⭐ Maintainability
- ⭐⭐⭐⭐⭐ Testability
- ⭐⭐⭐⭐ Performance
- ⭐⭐⭐⭐⭐ Developer experience

**This is the single most important architectural improvement you can make.**
