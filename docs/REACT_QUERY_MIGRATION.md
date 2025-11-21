# React Query Migration Guide

## 📋 Overview

This document provides a comprehensive guide to the React Query migration completed for LifeSync. All 10 data domains have been migrated from Zustand to React Query (TanStack Query) for superior server state management.

## 🎯 Migration Goals Achieved

✅ **Separation of Concerns**: Server state (React Query) vs Client state (Zustand)
✅ **Automatic Caching**: Smart caching with configurable stale times
✅ **Optimistic Updates**: Instant UI feedback with error rollback
✅ **Type Safety**: Full TypeScript support throughout
✅ **DevTools Integration**: Visual debugging and inspection
✅ **91% Zustand Reduction**: From 3,121 lines to 284 lines

---

## 📊 Migration Statistics

### Zustand Store Reduction

| Stage | Lines | Reduction |
|-------|-------|-----------|
| Original Store | 3,121 | - |
| After Tasks/Habits/Focus/Notes/Journal/Goals/Finance/Projects | 1,287 | 59% |
| After Meal Planning (Recipes, Meal Plans, Planned Meals, Pantry) | 520 | 83% |
| **Final (After Shopping)** | **284** | **91%** |

### Domains Migrated

All 10 data domains are now managed by React Query:

1. **Tasks/Todos** → `src/tasks/hooks/useTasksQuery.ts`
2. **Habits** → `src/habits/hooks/useHabitsQuery.ts`
3. **Focus Sessions** → `src/focus/hooks/useFocusQuery.ts`
4. **Notes** → `src/notes/hooks/useNotesQuery.ts`
5. **Journal** → `src/journal/hooks/useJournalQuery.ts`
6. **Goals & Dreams** → `src/goals/api/lifeGoalsAPI.ts`
7. **Finance** → `src/finance/hooks/useFinanceQuery.ts`
8. **Projects** → `src/projects/hooks/useProjectsQuery.ts`
9. **Meal Planning** → `src/mealPlanning/hooks/useMealPlanningQuery.ts`
10. **Shopping** → `src/hooks/useShoppingQuery.ts`

---

## 🏗️ Architecture

### Before Migration

```
┌─────────────────────────────────────┐
│       Zustand Store (3,121 lines)   │
│  ┌─────────────────────────────┐    │
│  │ Tasks, Habits, Focus, Notes │    │
│  │ Journal, Goals, Finance     │    │
│  │ Projects, Meal Planning     │    │
│  │ Shopping, UI State, 75 Hard │    │
│  └─────────────────────────────┘    │
│                                     │
│  All mixed together, hard to        │
│  maintain, test, and reason about   │
└─────────────────────────────────────┘
```

### After Migration

```
┌──────────────────────────────────────────────────────────┐
│                    Application State                      │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  ┌────────────────────────────┬──────────────────────┐   │
│  │   React Query (Server)     │  Zustand (Client)    │   │
│  ├────────────────────────────┼──────────────────────┤   │
│  │ • Tasks/Todos              │ • UI State           │   │
│  │ • Habits                   │   - activeView       │   │
│  │ • Focus Sessions           │   - sidebarCollapsed │   │
│  │ • Notes                    │                      │   │
│  │ • Journal                  │ • Global Settings    │   │
│  │ • Goals/Dreams             │   - weekStartsOn     │   │
│  │ • Finance                  │   - mealOptions      │   │
│  │ • Projects                 │                      │   │
│  │ • Meal Planning            │ • Global Utilities   │   │
│  │   - Recipes                │   - globalToast      │   │
│  │   - Meal Plans             │   - userStats        │   │
│  │   - Planned Meals          │                      │   │
│  │   - Pantry Items           │ • 75 Hard Domain     │   │
│  │ • Shopping Lists/Items     │                      │   │
│  │                            │                      │   │
│  │ Data Fetching, Caching     │ UI Preferences       │   │
│  │ Synchronization with API   │ Local State Only     │   │
│  └────────────────────────────┴──────────────────────┘   │
│                                                           │
│         Clear Separation of Concerns                      │
└──────────────────────────────────────────────────────────┘
```

---

## 🔧 Configuration

### React Query Client Setup

Located in `src/lib/react-query.ts`:

```typescript
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,           // 5 minutes
      gcTime: 10 * 60 * 1000,             // 10 minutes
      retry: 1,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      refetchOnMount: true,
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
    },
  },
});
```

### DevTools Configuration

Located in `src/providers/QueryProvider.tsx`:

```typescript
export function QueryProvider({ children }: QueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {import.meta.env.DEV && (
        <ReactQueryDevtools
          initialIsOpen={false}
          buttonPosition="bottom-left"
        />
      )}
    </QueryClientProvider>
  );
}
```

---

## 📚 Domain Hooks Reference

### 1. Tasks Domain

**File**: `src/tasks/hooks/useTasksQuery.ts`

```typescript
// Queries
useTasksQuery(options?: { filter?: 'active' | 'completed'; limit?: number })
useTaskQuery(taskId: string | undefined)

// Mutations
useCreateTaskMutation()
useUpdateTaskMutation()
useToggleTaskMutation()
useDeleteTaskMutation()
useDeleteAllTasksMutation()

// Helpers
useTasksByProject(projectId?: string)
useTaskStats()
```

**Stale Time**: 5 minutes
**Features**: Optimistic updates, error rollback, automatic invalidation

---

### 2. Habits Domain

**File**: `src/habits/hooks/useHabitsQuery.ts`

```typescript
// Queries
useHabitsQuery()
useHabitQuery(habitId: string | undefined)
useHabitCheckInsQuery(habitId: string, options?: { startDate?: Date; endDate?: Date })

// Mutations
useCreateHabitMutation()
useUpdateHabitMutation()
useDeleteHabitMutation()
useToggleHabitCheckInMutation()
useDeleteAllHabitsMutation()

// Helpers
useHabitStats()
useHabitStreak(habitId: string)
```

**Stale Time**: 5 minutes
**Features**: Check-in tracking, streak calculation, bulk operations

---

### 3. Focus Sessions Domain

**File**: `src/focus/hooks/useFocusQuery.ts`

```typescript
// Queries
useFocusSessionsQuery(options?: { startDate?: Date; endDate?: Date })
useFocusSessionQuery(sessionId: string | undefined)

// Mutations
useCreateFocusSessionMutation()
useUpdateFocusSessionMutation()
useCompleteFocusSessionMutation()
useDeleteFocusSessionMutation()

// Helpers
useFocusStats(period?: 'day' | 'week' | 'month')
useActiveFocusSession()
```

**Stale Time**: 3 minutes
**Features**: Session tracking, productivity metrics, active session management

---

### 4. Notes Domain

**File**: `src/notes/hooks/useNotesQuery.ts`

```typescript
// Queries
useNotesQuery(options?: { tags?: string[]; search?: string })
useNoteQuery(noteId: string | undefined)

// Mutations
useCreateNoteMutation()
useUpdateNoteMutation()
useDeleteNoteMutation()

// Helpers
useNotesByTags(tags: string[])
useNotesSearch(query: string)
```

**Stale Time**: 10 minutes
**Features**: Tag filtering, full-text search, auto-save support

---

### 5. Journal Domain

**File**: `src/journal/hooks/useJournalQuery.ts`

```typescript
// Queries
useJournalEntriesQuery(options?: { startDate?: Date; endDate?: Date })
useJournalEntryQuery(entryId: string | undefined)
useJournalEntryForDate(date: Date)

// Mutations
useCreateJournalEntryMutation()
useUpdateJournalEntryMutation()
useDeleteJournalEntryMutation()

// Helpers
useJournalStats(period?: 'week' | 'month' | 'year')
useJournalStreaks()
```

**Stale Time**: 5 minutes
**Features**: Date-based queries, mood tracking, streak calculation

---

### 6. Goals & Dreams Domain

**File**: `src/goals/api/lifeGoalsAPI.ts`

```typescript
// Queries
useLifeGoalsQuery()
useLifeGoalQuery(goalId: string | undefined)

// Mutations
useCreateLifeGoalMutation()
useUpdateLifeGoalMutation()
useDeleteLifeGoalMutation()
useToggleLifeGoalMutation()

// Helpers
useGoalsByStatus(status: 'active' | 'completed' | 'archived')
useGoalsProgress()
```

**Stale Time**: 10 minutes
**Features**: Progress tracking, status management, achievement metrics

---

### 7. Finance Domain

**File**: `src/finance/hooks/useFinanceQuery.ts`

```typescript
// Queries
useTransactionsQuery(options?: { startDate?: Date; endDate?: Date; limit?: number })
useCategoriesQuery()
useAccountsQuery()
useBudgetsQuery()

// Mutations
useCreateTransactionMutation()
useUpdateTransactionMutation()
useDeleteTransactionMutation()
useCreateCategoryMutation()
useUpdateCategoryMutation()
useDeleteCategoryMutation()
useCreateAccountMutation()
useUpdateAccountMutation()
useDeleteAccountMutation()

// Helpers
useFinanceMetrics(options)
useTransactionsByCategory(categoryId: string)
useAccountBalance(accountId: string)
```

**Stale Time**: 5 minutes
**Features**: Transaction filtering, category aggregation, budget tracking

---

### 8. Projects Domain

**File**: `src/projects/hooks/useProjectsQuery.ts`

```typescript
// Queries
useProjectsQuery()
useProjectQuery(projectId: string | undefined)

// Mutations
useCreateProjectMutation()
useUpdateProjectMutation()
useDeleteProjectMutation()

// Helpers
useProjectsByStatus(status?: 'active' | 'completed' | 'on_hold')
useProjectStats()
```

**Stale Time**: 5 minutes
**Features**: Status filtering, progress tracking, task integration

---

### 9. Meal Planning Domain

**File**: `src/mealPlanning/hooks/useMealPlanningQuery.ts`

#### Recipes
```typescript
useRecipesQuery(options?: { enabled?: boolean })
useRecipeQuery(recipeId: string | undefined)
useCreateRecipeMutation()
useUpdateRecipeMutation()
useDeleteRecipeMutation()
useDeleteAllRecipesMutation()
useFilteredRecipes(options?: { tags?: string[]; favoritesOnly?: boolean })
```

#### Meal Plans
```typescript
useMealPlansQuery(options?: { enabled?: boolean })
useMealPlanQuery(mealPlanId: string | undefined)
useMealPlanForWeek(weekStartDate: Date, weekStartsOn: 0 | 1)
useCreateMealPlanMutation()
useUpdateMealPlanMutation()
useDeleteMealPlanMutation()
```

#### Planned Meals
```typescript
useCreatePlannedMealMutation()
useUpdatePlannedMealMutation()
useDeletePlannedMealMutation()
```

#### Pantry Items
```typescript
usePantryItemsQuery(options?: { enabled?: boolean })
useCreatePantryItemMutation()
useUpdatePantryItemMutation()
useDeletePantryItemMutation()
useFilteredPantryItems(options?: { category?: string; lowStockOnly?: boolean })
```

**Stale Time**: 5-10 minutes
**Features**: Lazy loading, week-based planning, concurrency handling, bulk operations

---

### 10. Shopping Domain

**File**: `src/hooks/useShoppingQuery.ts`

```typescript
// Queries
useShoppingLists()
useShoppingItems(listId: string | null)

// Mutations
useCreateShoppingList()
useCreateShoppingItem()
useUpdateShoppingItem()
useDeleteShoppingItem()

// Helpers
useActiveShoppingList()
```

**Stale Time**: 5 minutes
**Features**: List management, item tracking, purchase status

---

## 🎨 Common Patterns

### Pattern 1: Basic Query

```typescript
function MyComponent() {
  const { data: items = [], isLoading, error } = useItemsQuery();

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return <ItemList items={items} />;
}
```

### Pattern 2: Optimistic Mutation

```typescript
function useCreateItemMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input) => {
      const created = await api.createItem(input);
      return mapToItem(created);
    },
    onMutate: async (input) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: keys.list() });

      // Snapshot previous value
      const previous = queryClient.getQueryData(keys.list());

      // Optimistically update
      const optimistic = { id: `temp-${Date.now()}`, ...input };
      queryClient.setQueryData(keys.list(), (old) => [...(old || []), optimistic]);

      return { previous };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previous) {
        queryClient.setQueryData(keys.list(), context.previous);
      }
    },
    onSuccess: (newItem) => {
      // Replace temp with real data
      queryClient.setQueryData(keys.list(), (old) =>
        (old || []).map((item) => (item.id.startsWith('temp-') ? newItem : item))
      );
    },
  });
}
```

### Pattern 3: Dependent Queries

```typescript
function MyComponent({ userId }: Props) {
  const { data: user } = useUserQuery(userId);
  const { data: posts } = useUserPostsQuery(user?.id, {
    enabled: !!user?.id, // Only fetch when user ID is available
  });

  return <PostList posts={posts} />;
}
```

### Pattern 4: Lazy Loading

```typescript
function MyComponent() {
  const [enabled, setEnabled] = useState(false);
  const { data, isLoading } = useItemsQuery({ enabled });

  const loadItems = () => setEnabled(true);

  return (
    <div>
      <button onClick={loadItems}>Load Items</button>
      {enabled && (isLoading ? <Spinner /> : <Items data={data} />)}
    </div>
  );
}
```

---

## 🔑 Query Keys Strategy

### Hierarchical Structure

```typescript
export const itemKeys = {
  all: ['items'] as const,
  lists: () => [...itemKeys.all, 'list'] as const,
  list: (filters?) => [...itemKeys.lists(), filters] as const,
  details: () => [...itemKeys.all, 'detail'] as const,
  detail: (id: string) => [...itemKeys.details(), id] as const,
};
```

### Benefits

1. **Type-safe invalidation**: `queryClient.invalidateQueries({ queryKey: itemKeys.all })`
2. **Granular control**: Invalidate all lists vs specific detail
3. **Automatic refetching**: Related queries refetch when needed
4. **DevTools visibility**: Easy to inspect in React Query DevTools

---

## ⚡ Performance Optimizations

### Stale Time Configuration

Different domains have different stale times based on data volatility:

| Domain | Stale Time | Reason |
|--------|-----------|--------|
| Focus Sessions | 3 minutes | Real-time tracking |
| Tasks, Habits, Shopping | 5 minutes | Moderate updates |
| Notes, Projects, Finance | 5-10 minutes | Less frequent changes |
| Recipes, Meal Plans | 10 minutes | Rarely change |
| Settings, Categories | 1 hour | Static data |

### Lazy Loading

Domains that use lazy loading:
- **Recipes**: Loaded only when visiting Meal Planning page
- **Meal Plans**: Loaded only when visiting Meal Planning page
- **Pantry Items**: Loaded only when visiting Meal Planning page

### Cache-First Strategies

- `useMealPlanForWeek`: Checks cache before API call
- `useProjectQuery`: Uses list cache if available
- `useRecipeQuery`: Uses list cache if available

---

## 🐛 Error Handling

### Global Error Boundaries

```typescript
<QueryErrorResetBoundary>
  {({ reset }) => (
    <ErrorBoundary
      onReset={reset}
      fallbackRender={({ error, resetErrorBoundary }) => (
        <ErrorFallback error={error} reset={resetErrorBoundary} />
      )}
    >
      <App />
    </ErrorBoundary>
  )}
</QueryErrorResetBoundary>
```

### Mutation Error Handling

```typescript
const mutation = useCreateItemMutation();

try {
  await mutation.mutateAsync(data);
} catch (error) {
  showToast('Failed to create item', 'error');
  console.error('[CreateItem] Error:', error);
}
```

---

## 🧪 Testing

### Mocking Queries

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

function wrapper({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

test('fetches items', async () => {
  const { result } = renderHook(() => useItemsQuery(), { wrapper });
  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(result.current.data).toHaveLength(10);
});
```

---

## 📖 Best Practices

### 1. Always Provide Loading States

```typescript
const { data, isLoading } = useItemsQuery();

if (isLoading) return <Skeleton />;
return <Items data={data} />;
```

### 2. Use Optimistic Updates Wisely

Only use optimistic updates when:
- The operation is likely to succeed
- You can easily rollback on error
- Immediate feedback improves UX

### 3. Invalidate Related Queries

```typescript
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: itemKeys.all });
  queryClient.invalidateQueries({ queryKey: relatedKeys.all });
}
```

### 4. Handle Errors Gracefully

```typescript
const { error } = useItemsQuery();

if (error) {
  return <ErrorState message={error.message} retry={() => refetch()} />;
}
```

### 5. Use Proper Key Hierarchies

```typescript
// Good: Hierarchical
['items', 'list', { status: 'active' }]

// Bad: Flat
['active-items']
```

---

## 🎯 Migration Checklist

When migrating a new domain:

- [ ] Create hooks file in domain folder
- [ ] Define query keys factory
- [ ] Define type interfaces
- [ ] Create mapper functions (API → Domain)
- [ ] Create payload builders (Domain → API)
- [ ] Implement query hooks
- [ ] Implement mutation hooks with optimistic updates
- [ ] Add helper hooks (filters, stats, etc.)
- [ ] Update pages to use new hooks
- [ ] Remove from Zustand store
- [ ] Test loading, error, and success states
- [ ] Verify TypeScript compilation
- [ ] Test optimistic updates and rollback
- [ ] Update documentation

---

## 🔮 Future Enhancements

### Prefetching on Hover

```typescript
const prefetchItem = (id: string) => {
  queryClient.prefetchQuery({
    queryKey: itemKeys.detail(id),
    queryFn: () => api.getItem(id),
  });
};

<Link onMouseEnter={() => prefetchItem(id)}>View Item</Link>
```

### Infinite Queries for Long Lists

```typescript
export function useInfiniteItemsQuery() {
  return useInfiniteQuery({
    queryKey: itemKeys.lists(),
    queryFn: ({ pageParam = 0 }) => api.getItems({ offset: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
}
```

### Real-time Subscriptions

```typescript
export function useRealtimeItems() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const subscription = supabase
      .channel('items')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'items' }, () => {
        queryClient.invalidateQueries({ queryKey: itemKeys.all });
      })
      .subscribe();

    return () => subscription.unsubscribe();
  }, []);
}
```

---

## 📝 Summary

**Migration Complete**: All 10 data domains migrated to React Query
**Zustand Reduced**: 91% reduction (3,121 → 284 lines)
**Architecture**: Clear separation between server state and client state
**Developer Experience**: DevTools, optimistic updates, automatic caching
**Type Safety**: Full TypeScript support throughout

React Query is now the single source of truth for all server state management in LifeSync! 🚀
