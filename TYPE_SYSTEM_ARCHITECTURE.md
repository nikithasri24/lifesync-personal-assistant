# Type System Architecture: Current State

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CURRENT TYPE SYSTEM                          │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────┐                                    ┌──────────────┐
│              │                                    │              │
│  PostgreSQL  │◄──────────── snake_case ─────────►│   Supabase   │
│   Database   │              ISO strings          │   Backend    │
│              │                                    │              │
└──────┬───────┘                                    └──────┬───────┘
       │                                                   │
       │ Store/Retrieve                                    │
       │                                                   │
       ▼                                                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                         TaskData Type                            │
│  Location: src/services/types.ts                                │
│  Usage: 132 occurrences (89% of codebase)                       │
│                                                                  │
│  interface TaskData {                                            │
│    id?: string                                                   │
│    user_id?: string              ◄── snake_case                 │
│    title: string                                                 │
│    due_date?: string | null      ◄── ISO string                 │
│    created_at?: string           ◄── ISO string                 │
│    status?: 'todo' | 'done' | ...                               │
│    priority?: 'low' | 'medium' | ...                            │
│  }                                                                │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ mapTaskDataToTask()
                         │ • snake_case → camelCase
                         │ • ISO string → Date objects
                         │ • null → undefined
                         │ • Set defaults
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                          Task Type (Modern)                      │
│  Location: src/tasks/hooks/useTasksQuery.ts                     │
│  Status: ✅ Canonical for UI                                     │
│                                                                  │
│  interface Task {                                                │
│    id: string                                                    │
│    title: string                                                 │
│    projectId?: string            ◄── camelCase                  │
│    dueDate?: Date                ◄── Date object                │
│    createdAt: Date               ◄── Date object                │
│    status: 'todo' | 'done' | ...                                │
│    starred: boolean              ◄── Required, not nullable     │
│    tags: string[]                ◄── Required, not nullable     │
│  }                                                                │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ Used by
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      React Components                            │
│                                                                  │
│  • TaskScheduler                                                 │
│  • Dashboard                                                     │
│  • TaskBoard                                                     │
│  • etc.                                                          │
│                                                                  │
│  All work with Task (camelCase, Date objects)                   │
└─────────────────────────────────────────────────────────────────┘


┌──────────────────────────────────────────────────────────────────┐
│                    LEGACY TYPES (To Remove)                       │
└──────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      TodoItem Type (LEGACY)                      │
│  Location: src/types/index.ts                                   │
│  Usage: 16 occurrences (11% of codebase)                        │
│  Status: ❌ TO BE REMOVED                                        │
│                                                                  │
│  interface TodoItem {                                            │
│    id: string                                                    │
│    title: string                                                 │
│    dueDate?: Date                ◄── Date object                │
│    completed: boolean            ◄── Redundant!                 │
│    status: TaskStatus                                            │
│    // ... similar to Task but older                             │
│  }                                                                │
│                                                                  │
│  Used by (6 files):                                              │
│  • src/projects/services/projectHelpers.ts                      │
│  • src/components/focus/tasks/utils/taskTransformers.ts         │
│  • src/components/focus/tasks/utils/statusMappers.ts            │
│  • src/components/focus/tasks/TaskFocusIntegration.tsx          │
│  • src/components/focus/tasks/types.ts                          │
│  • src/pages/ProjectTracking.tsx                                │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                   Task Type (DUPLICATE - Todos)                  │
│  Location: src/todos/types.ts                                   │
│  Status: ⚠️ DUPLICATE DEFINITION                                 │
│                                                                  │
│  interface Task {                                                │
│    id: string                                                    │
│    title: string                                                 │
│    status: 'todo' | 'done'       ◄── Only 2 statuses!          │
│    // ... simplified version                                    │
│  }                                                                │
│                                                                  │
│  Problem: Same name, different shape!                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Migration Path

```
PHASE 1: Consolidate Task Types
┌──────────────────────────────────────────────┐
│ 1. Create src/types/task.ts                 │
│    - Export canonical Task interface        │
│    - Export TaskInput, TaskUpdate types     │
│    - Export TaskFilters, TaskAnalytics      │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│ 2. Update imports                            │
│    - src/tasks/hooks/useTasksQuery.ts       │
│      import from '@/types/task'             │
│    - src/todos/types.ts                     │
│      import from '@/types/task'             │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│ 3. Remove duplicate definitions              │
│    - Delete from useTasksQuery.ts           │
│    - Delete from todos/types.ts             │
└──────────────────────────────────────────────┘


PHASE 2: Eliminate TodoItem (16 usages)
┌──────────────────────────────────────────────┐
│ 1. Update focus components (4 files)        │
│    - taskTransformers.ts                    │
│    - statusMappers.ts                       │
│    - TaskFocusIntegration.tsx               │
│    - types.ts                               │
│    Replace: TodoItem → Task                 │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│ 2. Update project helpers                   │
│    - projectHelpers.ts                      │
│    Replace: TodoItem → Task                 │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│ 3. Update ProjectTracking page              │
│    - ProjectTracking.tsx                    │
│    Replace: TodoItem → Task                 │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│ 4. Remove TodoItem from src/types/index.ts  │
└──────────────────────────────────────────────┘


PHASE 3: Verification
┌──────────────────────────────────────────────┐
│ 1. npm run typecheck                        │
│    Expect: 0 errors                         │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│ 2. Search for TodoItem references           │
│    grep -r "TodoItem" src/                  │
│    Expect: 0 results (except comments)      │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│ 3. Verify mapper still works                │
│    Test: Create/update/delete tasks         │
│    Verify: Data flows correctly             │
└──────────────────────────────────────────────┘
```

---

## Final Architecture (Post-Migration)

```
┌─────────────────────────────────────────────────────────────────┐
│                      CLEAN TYPE SYSTEM                           │
└─────────────────────────────────────────────────────────────────┘

Database Layer                Mapping Layer             UI Layer
───────────────              ───────────────           ──────────
                                                        
TaskData                     mapTaskDataToTask()      Task
(snake_case,        ─────►   (converter)      ─────►  (camelCase,
 ISO strings,                                          Date objects,
 nullable)                                             defaults)
                                                        
src/services/types.ts        src/tasks/hooks/          src/types/task.ts
132 usages                   useTasksQuery.ts          Single source
                                                       of truth

                             ▲
                             │
                             │ All components import from here
                             │
                             │
        ┌────────────────────┴────────────────────┐
        │                                         │
        ▼                                         ▼
  React Components                          React Query Hooks
  (use Task type)                          (convert TaskData → Task)
```

---

## Metrics

### Before Migration Complete
- TodoItem: 16 usages (11%)
- Task (modern): Growing
- Task (duplicate): 1 definition
- TaskData: 132 usages (89%)
- **Total types: 4** (confusing!)

### After Migration Complete
- TodoItem: **0 usages** ✅
- Task: **Single canonical definition** ✅
- TaskData: **132+ usages** ✅
- **Total types: 2** (clean!)

### Benefits
- 50% reduction in task-related types
- No duplicate definitions
- Clear separation of concerns
- Type-safe data flow
- Easier onboarding for new developers

