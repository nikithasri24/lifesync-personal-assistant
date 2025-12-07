# Migrate Feature from Zustand to React Query

Migrate a feature's server state from Zustand stores to React Query hooks while preserving all existing UI functionality.

## Process:

1. **Identify the feature** (e.g., tasks, habits, finance, shopping)
   - Ask which feature if not specified

2. **Read existing implementation:**
   - Store slice: `src/stores/slices/{feature}Slice.ts`
   - API layer: `src/api/{feature}API.ts` or `src/{feature}/api/`
   - Components using the store
   - Current patterns in the codebase

3. **Analyze what to migrate:**
   - **Server state** (data from Supabase) → Move to React Query
   - **UI state** (filters, modals, view modes) → Keep in Zustand
   - Identify all data fetching and mutations

4. **Create React Query hooks:**
   - Location: `src/{feature}/hooks/use{Feature}Query.ts`
   - Or: `src/hooks/use{Feature}Query.ts` (match existing pattern)
   - Query hooks for fetching data
   - Mutation hooks for create/update/delete
   - Use existing API functions (don't rewrite!)

5. **Update Zustand slice:**
   - Remove server state (data arrays/objects from Supabase)
   - Remove data fetching actions
   - KEEP UI state (activeView, filters, modals, etc.)
   - Slim down to only client-side state

6. **Update components:**
   - Replace Zustand store calls with React Query hooks
   - Update imports
   - Preserve all UI behavior
   - Maintain loading/error states
   - Keep optimistic updates where needed

7. **Update tests:**
   - Update mocks to use React Query
   - Ensure all existing tests still pass
   - Update test utilities if needed

8. **Verify functionality:**
   - Manual smoke test
   - All CRUD operations work
   - Loading states display correctly
   - Error handling works
   - No regressions

## Example Migration:

### Before (Zustand):
```typescript
// src/stores/slices/tasksSlice.ts
export const createTasksSlice = (set, get) => ({
  tasks: [],
  isLoading: false,
  error: null,

  fetchTasks: async () => {
    set({ isLoading: true })
    const tasks = await getTasks()
    set({ tasks, isLoading: false })
  },

  // UI state - KEEP THIS
  activeView: 'list',
  setActiveView: (view) => set({ activeView: view })
})

// Component
const { tasks, fetchTasks, activeView } = useTaskStore()
```

### After (React Query + Zustand):
```typescript
// src/tasks/hooks/useTasksQuery.ts
export function useTasksQuery() {
  return useQuery({
    queryKey: ['tasks'],
    queryFn: getTasks,
    staleTime: 1000 * 60 * 5
  })
}

export function useCreateTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    }
  })
}

// src/stores/slices/tasksSlice.ts (UI state only)
export const createTasksSlice = (set) => ({
  // UI state only
  activeView: 'list',
  setActiveView: (view) => set({ activeView: view }),

  filterStatus: 'all',
  setFilterStatus: (status) => set({ filterStatus: status })
})

// Component
const { data: tasks, isLoading } = useTasksQuery()
const { activeView } = useTaskStore()
const createMutation = useCreateTask()
```

## Query Configuration:

```typescript
// Use these defaults
export function use{Feature}Query(filters?) {
  return useQuery({
    queryKey: ['{feature}', filters], // Include filters in key
    queryFn: () => get{Features}(filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
    retry: 3
  })
}
```

## Mutation Configuration:

```typescript
export function useCreate{Feature}() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: create{Feature},
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['{feature}'] })
    },
    onError: (error) => {
      logger.error('{Feature}Mutation', error as Error)
      // Show toast notification
    }
  })
}

export function useUpdate{Feature}() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }) => update{Feature}(id, updates),
    onMutate: async ({ id, updates }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['{feature}'] })
      const previous = queryClient.getQueryData(['{feature}'])

      queryClient.setQueryData(['{feature}'], (old) => {
        // Update optimistically
        return old.map(item => item.id === id ? { ...item, ...updates } : item)
      })

      return { previous }
    },
    onError: (err, variables, context) => {
      // Rollback on error
      queryClient.setQueryData(['{feature}'], context.previous)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['{feature}'] })
    }
  })
}
```

## Important Rules:

- ❌ DO NOT rebuild UI components
- ❌ DO NOT change visual behavior
- ❌ DO NOT break existing tests
- ❌ DO NOT remove UI state from Zustand
- ✅ DO preserve all functionality
- ✅ DO keep optimistic updates
- ✅ DO maintain loading/error states
- ✅ DO use existing API functions
- ✅ DO run all tests after migration
- ✅ DO manual smoke test

## What Stays in Zustand:

- activeView, currentTab, viewMode
- sidebarCollapsed, panelOpen
- filterOptions, sortOptions
- modalStates (isCreateModalOpen, etc.)
- selectedItems, draggedItem
- UI preferences (dateFormat, theme)
- Toast notifications
- Temporary form state (if needed)

## What Moves to React Query:

- All data from Supabase (tasks, habits, etc.)
- Data fetching logic
- Create/update/delete operations
- Loading states for server operations
- Error states for server operations
- Cache management

## Testing Strategy:

1. **Before migration:**
   - Run all existing tests
   - Document current passing tests
   - Take screenshots of UI

2. **After migration:**
   - All previous tests still pass
   - UI looks identical
   - All operations work
   - Loading states work
   - Error handling works

3. **Regression testing:**
   - Create operation
   - Read/fetch operation
   - Update operation
   - Delete operation
   - Filters and sorting
   - Pagination (if applicable)
   - Optimistic updates

## Component Update Example:

### Before:
```typescript
function TasksPage() {
  const { tasks, isLoading, fetchTasks, createTask } = useTaskStore()

  useEffect(() => {
    fetchTasks()
  }, [])

  const handleCreate = async (task) => {
    await createTask(task)
  }

  if (isLoading) return <Loading />

  return <TaskList tasks={tasks} onCreate={handleCreate} />
}
```

### After:
```typescript
function TasksPage() {
  const { data: tasks, isLoading } = useTasksQuery()
  const createMutation = useCreateTask()

  const handleCreate = (task) => {
    createMutation.mutate(task)
  }

  if (isLoading) return <Loading />

  return <TaskList tasks={tasks} onCreate={handleCreate} />
}
```

## Definition of Done:

- [ ] React Query hooks created for all data operations
- [ ] Zustand slice updated (UI state only)
- [ ] All components updated to use React Query
- [ ] Loading states preserved
- [ ] Error handling preserved
- [ ] Optimistic updates work (if applicable)
- [ ] All existing tests pass
- [ ] Manual smoke test completed
- [ ] No console errors
- [ ] TypeScript compiles
- [ ] No `any` types
- [ ] Performance is same or better
- [ ] Cache invalidation works correctly
