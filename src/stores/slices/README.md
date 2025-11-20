# Store Slices Pattern

This directory contains feature-specific store slices that compose into the main application store.

## Architecture

Instead of one massive store (`useRealAppStore.ts` - 3,142 lines), we break state management into focused slices:

```
useComposedStore (composed)
├── uiSlice.ts (~150 lines)
├── notesSlice.ts (~100 lines)
├── journalSlice.ts (~120 lines)
├── goalsSlice.ts (~180 lines)
└── [more slices...]
```

## Benefits

| Aspect | Mega-Store | Slices Pattern |
|--------|------------|----------------|
| Lines per file | 3,142 | ~100-200 |
| Testability | Hard | Easy |
| Type safety | Weak | Strong |
| Re-renders | Global | Granular |
| Maintainability | Poor | Excellent |
| Onboarding | Weeks | Days |

## Creating a New Slice

### 1. Create Slice File

```typescript
// src/stores/slices/tasksSlice.ts
import { StateCreator } from 'zustand';
import type { Task, TaskInput } from '@/api/tasksAPI';

export interface TasksSlice {
  // State
  tasks: Task[];
  tasksLoaded: boolean;
  tasksLoading: boolean;

  // Actions
  loadTasks: () => Promise<void>;
  addTask: (input: TaskInput) => Promise<Task>;
  updateTask: (id: string, updates: Partial<TaskInput>) => Promise<Task>;
  deleteTask: (id: string) => Promise<void>;
}

export const createTasksSlice: StateCreator<TasksSlice, [], [], TasksSlice> = (
  set,
  get
) => ({
  // Initial state
  tasks: [],
  tasksLoaded: false,
  tasksLoading: false,

  // Actions
  loadTasks: async () => {
    if (get().tasksLoaded || get().tasksLoading) return;

    set({ tasksLoading: true });
    try {
      const { getTasks } = await import('@/api/tasksAPI');
      const tasks = await getTasks();
      set({ tasks, tasksLoaded: true, tasksLoading: false });
    } catch (error) {
      console.error('Error loading tasks:', error);
      set({ tasksLoading: false });
      throw error;
    }
  },

  addTask: async (input) => {
    try {
      const { createTask } = await import('@/api/tasksAPI');
      const task = await createTask(input);
      set((state) => ({ tasks: [...state.tasks, task] }));
      return task;
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  },

  // ... other actions
});
```

### 2. Add to Composed Store

```typescript
// src/stores/useComposedStore.ts
import { createTasksSlice, type TasksSlice } from './slices/tasksSlice';

export type ComposedStore =
  & UISlice
  & NotesSlice
  & TasksSlice  // Add here
  // ... other slices

export const useComposedStore = create<ComposedStore>()(
  devtools(
    persist(
      (...a) => ({
        ...createUISlice(...a),
        ...createNotesSlice(...a),
        ...createTasksSlice(...a),  // Add here
        // ... other slices
      }),
      // ... persist config
    ),
    { name: 'ComposedStore' }
  )
);

// Add selector
export const selectTasks = (state: ComposedStore) => ({
  tasks: state.tasks,
  tasksLoaded: state.tasksLoaded,
  tasksLoading: state.tasksLoading,
  loadTasks: state.loadTasks,
  addTask: state.addTask,
  updateTask: state.updateTask,
  deleteTask: state.deleteTask,
});
```

### 3. Use in Components

```typescript
// Before (mega-store)
import { useAppStore } from '@/stores/useRealAppStore';

function TaskList() {
  const { tasks, loadTasks, addTask } = useAppStore();
  // ... component re-renders on ANY store change
}

// After (slices with selector)
import { useComposedStore, selectTasks } from '@/stores';

function TaskList() {
  const { tasks, loadTasks, addTask } = useComposedStore(selectTasks);
  // ... component only re-renders on tasks changes
}
```

## Pattern Guidelines

### State Naming Convention

- **Data arrays**: Plural (e.g., `tasks`, `notes`, `goals`)
- **Loading flags**: `{feature}Loading` (e.g., `tasksLoading`)
- **Loaded flags**: `{feature}Loaded` (e.g., `tasksLoaded`)

### Action Naming Convention

- **Load data**: `load{Feature}` (e.g., `loadTasks`)
- **Create**: `add{Entity}` (e.g., `addTask`)
- **Update**: `update{Entity}` (e.g., `updateTask`)
- **Delete**: `delete{Entity}` (e.g., `deleteTask`)
- **Search/Filter**: `search{Entities}` (e.g., `searchTasks`)
- **Getters**: `get{Entity}By{Prop}` (e.g., `getTaskById`)

### Lazy Loading Pattern

Always implement lazy loading with caching:

```typescript
loadTasks: async () => {
  // Check if already loaded or loading
  if (get().tasksLoaded || get().tasksLoading) return;

  set({ tasksLoading: true });
  try {
    const tasks = await fetchTasks();
    set({ tasks, tasksLoaded: true, tasksLoading: false });
  } catch (error) {
    console.error('Error loading tasks:', error);
    set({ tasksLoading: false });
    throw error;
  }
}
```

### Dynamic Imports

Use dynamic imports to avoid circular dependencies:

```typescript
const { createTask } = await import('@/api/tasksAPI');
```

## Migration from Mega-Store

### Step 1: Identify Feature Domain

Extract related state and actions from `useRealAppStore.ts`:

```typescript
// Find in useRealAppStore.ts:
tasks: Task[]
tasksLoaded: boolean
tasksLoading: boolean
loadTasks: () => Promise<void>
addTask: (input) => Promise<Task>
// ... etc
```

### Step 2: Create Slice

Move to dedicated slice file with proper types.

### Step 3: Add to Composed Store

Import and compose into `useComposedStore.ts`.

### Step 4: Migrate Components

Update imports:

```typescript
// Before
import { useAppStore } from '@/stores/useRealAppStore';

// After
import { useComposedStore, selectTasks } from '@/stores';
```

### Step 5: Test

Verify no regressions, then remove from mega-store.

## Slices Roadmap

- ✅ `uiSlice.ts` - UI state (activeView, sidebar, theme)
- ✅ `notesSlice.ts` - Notes management
- ✅ `journalSlice.ts` - Journal entries
- ✅ `goalsSlice.ts` - Goals and dreams
- ⏳ `tasksSlice.ts` - Tasks management (TODO)
- ⏳ `habitsSlice.ts` - Habits tracking (TODO)
- ⏳ `mealsSlice.ts` - Meal planning (TODO)
- ⏳ `shoppingSlice.ts` - Shopping lists (TODO)
- ⏳ `financeSlice.ts` - Financial tracking (TODO)
- ⏳ `travelSlice.ts` - Travel tracking (TODO)
- ⏳ `focusSlice.ts` - Focus sessions (TODO)

## Testing Slices

```typescript
// test/stores/tasksSlice.test.ts
import { create } from 'zustand';
import { createTasksSlice } from '@/stores/slices/tasksSlice';

describe('TasksSlice', () => {
  let store: ReturnType<typeof create<TasksSlice>>;

  beforeEach(() => {
    store = create(createTasksSlice);
  });

  it('should load tasks', async () => {
    await store.getState().loadTasks();
    expect(store.getState().tasksLoaded).toBe(true);
    expect(store.getState().tasks).toHaveLength(3);
  });

  it('should add a task', async () => {
    const task = await store.getState().addTask({ title: 'Test' });
    expect(store.getState().tasks).toContain(task);
  });
});
```

## Performance Benefits

### Before (Mega-Store)

```typescript
function TaskList() {
  const { tasks } = useAppStore();
  // Re-renders when notes, goals, finances, etc. change too!
}
```

### After (Slices with Selector)

```typescript
function TaskList() {
  const { tasks } = useComposedStore(selectTasks);
  // Only re-renders when tasks change!
}
```

## Next Steps

1. Create remaining slices for all features
2. Migrate components incrementally (feature by feature)
3. Test each migration thoroughly
4. Delete `useRealAppStore.ts` once all features migrated
5. Celebrate 🎉
