# LifeSync Architecture

This document defines the canonical architecture patterns for the LifeSync application.
All new code should follow these patterns. Existing code should be migrated over time.

## Layered Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         PRESENTATION LAYER                          │
│   src/pages/, src/components/, domain/components/                   │
│   React components, pages, UI logic                                 │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ Uses React Query hooks
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          HOOKS LAYER                                │
│   src/hooks/use*Query.ts                                            │
│   React Query hooks for data fetching, caching, mutations           │
│   CommandBus integration via useCommand()                           │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ Calls API layer / CommandBus
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         SERVICE LAYER                               │
│   src/services/                                                     │
│   Business logic, AI tools, complex operations                      │
│   NO direct Supabase access - uses API layer                        │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ Uses API layer
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                           API LAYER                                 │
│   src/api/*.ts                                                      │
│   ONLY place that talks to Supabase                                 │
│   Pure CRUD functions, no business logic                            │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ Supabase client
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         DATABASE LAYER                              │
│   Supabase (PostgreSQL + RLS)                                       │
│   supabase/migrations/                                              │
└─────────────────────────────────────────────────────────────────────┘
```

## Layer Responsibilities

### 1. API Layer (`src/api/*.ts`)

**Purpose**: Pure data access. CRUD operations only.

**Rules**:
- ✅ Direct Supabase queries
- ✅ Authentication checks (`getUser()`)
- ✅ Type mapping to domain types
- ❌ NO business logic
- ❌ NO cross-entity operations
- ❌ NO side effects

**Pattern**:
```typescript
// src/api/tasksAPI.ts
export async function getTasks(filters?: TaskFilters): Promise<Task[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  
  let query = supabase.from('tasks').select('*').eq('user_id', user.id);
  // Apply filters...
  
  const { data, error } = await query;
  if (error) throw error;
  return data as Task[];
}
```

### 2. Service Layer (`src/services/`)

**Purpose**: Business logic, complex operations, AI tools.

**Rules**:
- ✅ Uses API layer for data access
- ✅ Cross-entity operations
- ✅ Business rule validation
- ✅ AI/ML processing
- ❌ NO direct Supabase access
- ❌ NO React hooks

**Pattern**:
```typescript
// src/services/scheduling/SmartSchedulingService.ts
import { getTasks, updateTask } from '@/api/tasksAPI';
import { getCalendarEvents } from '@/api/calendarAPI';

class SmartSchedulingService {
  async suggestOptimalTime(taskId: string): Promise<Date> {
    const tasks = await getTasks();
    const events = await getCalendarEvents();
    // Business logic here...
    return optimalTime;
  }
}
```

### 3. Hooks Layer (`src/hooks/use*Query.ts`)

**Purpose**: React Query integration, caching, mutations.

**Rules**:
- ✅ Uses API layer for data fetching
- ✅ Uses CommandBus for mutations (via useCommand)
- ✅ Query key management
- ✅ Optimistic updates
- ❌ NO direct Supabase access
- ❌ NO business logic

**Pattern**:
```typescript
// src/hooks/useTasksQuery.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTasks, createTask } from '@/api/tasksAPI';
import { queryKeys } from '@/lib/react-query';

export function useTasksQuery(filters?: TaskFilters) {
  return useQuery({
    queryKey: queryKeys.tasks.list(filters),
    queryFn: () => getTasks(filters),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTask,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all }),
  });
}
```

### 4. CommandBus (`src/lib/commandBus/`)

**Purpose**: Centralized write operations with middleware support.

**When to use**:
- All write operations that modify data
- Operations that need cross-cutting concerns (logging, undo, events)
- AI-initiated actions

**Pattern**:
```typescript
// Dispatching a command
const { mutate } = useCommand();
mutate({
  type: 'CREATE_TASK',
  payload: taskData,
  source: 'voice',
  timestamp: new Date()
});
```

## Directory Structure

```
src/
├── api/                    # API Layer - Supabase access
│   ├── tasksAPI.ts
│   ├── habitsAPI.ts
│   └── index.ts
├── hooks/                  # React Query hooks
│   ├── useTasksQuery.ts
│   ├── useHabitsQuery.ts
│   └── index.ts
├── services/               # Business logic services
│   ├── ai/                 # AI services
│   ├── automation/         # Automation engine
│   └── scheduling/         # Scheduling logic
├── lib/                    # Core infrastructure
│   ├── commandBus/         # Command bus
│   ├── react-query.ts      # Query client & keys
│   └── supabase.ts         # Supabase client
├── components/             # Shared UI components
├── pages/                  # Route pages
├── stores/                 # Zustand (UI state only)
│   └── slices/             # UI-only state slices
└── types/                  # Shared type definitions
```

## Query Keys Convention

All query keys are defined in `src/lib/react-query.ts`:

```typescript
export const queryKeys = {
  tasks: {
    all: ['tasks'] as const,
    lists: () => [...queryKeys.tasks.all, 'list'] as const,
    list: (filters?: QueryFilters) => [...queryKeys.tasks.lists(), filters] as const,
    details: () => [...queryKeys.tasks.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.tasks.details(), id] as const,
  },
  // ... other domains
};
```

## State Management

### Server State → React Query
- All data from Supabase
- Cached automatically
- Invalidated on mutations

### UI State → Zustand
- View modes, filters, modals
- Theme, preferences
- Transient UI state

```typescript
// stores/slices/tasksSlice.ts
export const createTasksSlice = (set) => ({
  // UI state only - no server data!
  activeView: 'list',
  setActiveView: (view) => set({ activeView: view }),
  filterStatus: 'all',
  setFilterStatus: (status) => set({ filterStatus: status }),
});
```

## Provider Abstraction (`src/lib/`)

Cross-platform providers for native capabilities:

```
lib/
├── voice/          # Speech recognition
├── notifications/  # Push notifications
├── health/         # HealthKit/Google Fit
├── location/       # Geolocation
└── platform/       # Platform detection
```

Each provider has:
- `*Provider.ts` - Interface
- `Web*Provider.ts` - Web implementation
- `Native*Provider.ts` - Capacitor implementation
- `*ProviderFactory.ts` - Platform selection

## AI Tools (`src/lib/ai/`)

AI tools follow a standard pattern:

```typescript
// src/lib/ai/intelligenceTools.ts
export const myToolDefinition: ToolDefinition = {
  name: 'my_tool',
  description: 'What this tool does',
  parameters: { /* JSON Schema */ },
};

export async function executeMyTool(params: MyToolParams): Promise<ToolResult> {
  // Dynamic import to avoid circular dependencies
  const { MyService } = await import('@/services/myDomain');
  // Execute and return
}

export const intelligenceTools = [
  // ... other tools
  { definition: myToolDefinition, execute: executeMyTool },
];
```

## Migration Path

When adding new features or fixing existing code:

1. **API Layer First**: Create/update `src/api/{domain}API.ts`
2. **Service Layer**: If business logic needed, create service in `src/services/`
3. **Hook Layer**: Create React Query hook in `src/hooks/use{Domain}Query.ts`
4. **Components**: Use hooks, never call API directly
5. **CommandBus**: Add command type and handler for write operations

## Anti-Patterns to Avoid

❌ **Don't**: Call Supabase from components or services
```typescript
// BAD - direct supabase in component
const { data } = await supabase.from('tasks').select('*');
```

❌ **Don't**: Store server state in Zustand
```typescript
// BAD - server data in Zustand
tasks: [],
setTasks: (tasks) => set({ tasks }),
```

❌ **Don't**: Mix business logic in API layer
```typescript
// BAD - business logic in API
export async function createTask(task) {
  // sending notifications here is wrong!
  await sendNotification('Task created');
  return supabase.from('tasks').insert(task);
}
```

✅ **Do**: Follow the layer boundaries strictly

## ESLint Enforcement

The architecture is enforced via ESLint rules in `eslint.config.js`:

### Supabase Import Restriction

The `no-restricted-imports` rule prevents direct Supabase client imports outside allowed locations:

**Allowed locations**:
- `src/api/**/*.ts` - API layer (primary data access)
- `src/lib/**/*.ts` - Infrastructure layer
- `src/providers/AuthProvider.tsx` - Auth provider
- `src/components/AuthGate.tsx` - Auth gate

**Exempted (legacy, to be migrated)**:
- `src/goals/api/**/*.ts`
- `src/shared/api/**/*.ts`
- `src/travel/api/**/*.ts`
- `src/shared/services/SharedDataProvider.ts`
- `src/services/nutrition/FoodPhotoService.ts` (uses Supabase Storage)
- `src/hooks/useImportantDateReminders.ts`

**Note**: Type imports (`import type { Task } from '@/lib/supabase'`) are always allowed.

### Current Status

The rule is set to `warn` during migration. Once all violations are fixed, change to `error`:

```javascript
// eslint.config.js
'no-restricted-imports': [
  'error', // Change from 'warn' to 'error' when migration is complete
  { ... }
]
```

## Service Layer Migration Status

Services should use the API layer for data access, not direct Supabase calls.

### ✅ Migrated (Compliant)
- `src/services/analytics.ts` - Uses `analyticsAPI`
- `src/services/pushNotificationService.ts` - Uses `pushSubscriptionsAPI`
- `src/services/ConversationPersistenceService.ts` - Uses `conversationsAPI`
- `src/hooks/useHabitReminders.ts` - Uses `habitsAPI`
- `src/hooks/useTaskReminders.ts` - Uses `tasksAPI`
- `src/hooks/useBillReminders.ts` - Uses `billsAPI`
- `src/hooks/useReminderPreferences.ts` - Uses `userSettingsAPI`

### 🗑️ Deleted (Deprecated)
- `src/services/database.ts` - Replaced by API layer
- `src/hooks/useTasks.ts` - Replaced by `useTasksQuery.ts`
- `src/skincare/data.ts` - Replaced by `skincareAPI.ts`
- `src/travel/data.ts` - Replaced by `travelAPI.ts`

### 🔄 Remaining Violations (To Be Migrated)
The following files still access Supabase directly:

| File | Status | Notes |
|------|--------|-------|
| `src/shared/services/SharedDataProvider.ts` | Exempted | Complex cross-user sharing logic |
| `src/services/nutrition/FoodPhotoService.ts` | Exempted | Uses Supabase Storage (not DB) |
| `src/hooks/useImportantDateReminders.ts` | Exempted | Needs `importantDatesAPI` functions |
| `src/goals/api/lifeGoalsAPI.ts` | Legacy | Should move to `src/api/` |
| `src/shared/api/connectionsAPI.ts` | Legacy | Should move to `src/api/` |
| `src/travel/api/tripAPI.ts` | Legacy | Should move to `src/api/` |
| `src/travel/api/passportAPI.ts` | Legacy | Should move to `src/api/` |

### Migration Pattern

When migrating a service:

1. **Check if API module exists** in `src/api/`
2. **Create API module if needed** with pure CRUD functions
3. **Update service imports** to use API module instead of supabase
4. **Remove supabase import** from service
5. **Test** to ensure functionality is preserved

Example migration:
```typescript
// BEFORE (direct Supabase)
import { supabase } from '@/lib/supabase';

class MyService {
  async getData() {
    const { data } = await supabase.from('my_table').select('*');
    return data;
  }
}

// AFTER (using API layer)
import { getMyData } from '@/api/myAPI';

class MyService {
  async getData() {
    return getMyData();
  }
}
```

## Type Definitions

### Type Layers

The codebase uses two layers of types to separate database concerns from UI concerns:

```
┌─────────────────────────────────────────────────────────────────────┐
│                         UI LAYER TYPES                              │
│   src/types/*.ts                                                    │
│   - camelCase naming (TypeScript convention)                        │
│   - Date objects for dates                                          │
│   - Required booleans with defaults                                 │
│   - Non-nullable arrays                                             │
└──────────────────────────────────────────────────────────────────────┘
                               ▲
                               │ Mapped by hooks/services
                               │
┌─────────────────────────────────────────────────────────────────────┐
│                         DB LAYER TYPES                              │
│   src/services/types.ts                                             │
│   - snake_case naming (PostgreSQL convention)                       │
│   - ISO strings for dates                                           │
│   - Optional fields with null                                       │
│   - Matches Supabase schema exactly                                 │
└─────────────────────────────────────────────────────────────────────┘
```

### Type File Locations

| Location | Purpose | Naming |
|----------|---------|--------|
| `src/services/types.ts` | Database/API layer types | snake_case, `*Data` suffix |
| `src/types/*.ts` | UI layer types | camelCase |
| `src/types/task.ts` | Canonical Task type | UI layer |
| `src/types/index.ts` | Re-exports and shared types | UI layer |
| `src/lib/commandBus/types.ts` | Command/Event types | Domain-specific |
| `src/lib/location/types.ts` | Location provider types | Provider-specific |

### Type Naming Conventions

- **DB types**: `TaskData`, `HabitData`, `ProjectData` (snake_case fields)
- **UI types**: `Task`, `Habit`, `Project` (camelCase fields)
- **Input types**: `TaskInput`, `ProjectInput` (for create operations)
- **Update types**: `TaskUpdate`, `ProjectUpdate` (for update operations)
- **Filter types**: `TaskFilters`, `HabitFilters` (for query parameters)

### Example: Task Types

```typescript
// src/services/types.ts - DB layer
export interface TaskData {
  id?: string;
  user_id?: string;
  title: string;
  due_date?: string | null;  // ISO string
  created_at?: string;
}

// src/types/task.ts - UI layer
export interface Task {
  id: string;
  title: string;
  dueDate?: Date;           // Date object
  createdAt: Date;
}
```

### Domain-Specific Types

Some domains have their own type files for complex types:

- `src/components/focus/tasks/types.ts` - TaskView, ProjectView (view models)
- `src/services/gamification/types.ts` - Achievement, Level definitions
- `src/services/scheduling/types.ts` - TimeSlot, SchedulePreferences

These are acceptable when:
1. Types are only used within that domain
2. Types are view models specific to a component
3. Types are internal implementation details
```

