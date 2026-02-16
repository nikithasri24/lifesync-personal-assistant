# Hook Migration Guide

This guide shows how to migrate from old hook patterns to the new standardized patterns defined in CLAUDE.md.

## Migration 1: Modal State Boilerplate → useModalState

### Before (129 lines of boilerplate)

```typescript
// useTaskModals.ts
import { useState } from 'react';

export function useTaskModals() {
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickAddText, setQuickAddText] = useState('');
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [editTaskText, setEditTaskText] = useState('');
  const [activeSubtaskForm, setActiveSubtaskForm] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showProjectSelector, setShowProjectSelector] = useState(false);

  const openQuickAdd = () => setShowQuickAdd(true);
  const closeQuickAdd = () => {
    setShowQuickAdd(false);
    setQuickAddText('');
  };

  const openEditTask = (taskId: string, text: string) => {
    setEditingTask(taskId);
    setEditTaskText(text);
  };
  const closeEditTask = () => {
    setEditingTask(null);
    setEditTaskText('');
  };

  const openSubtaskForm = (taskId: string) => setActiveSubtaskForm(taskId);
  const closeSubtaskForm = () => setActiveSubtaskForm(null);

  const openFilters = () => setShowFilters(true);
  const closeFilters = () => setShowFilters(false);
  const toggleFilters = () => setShowFilters(prev => !prev);

  const openProjectSelector = () => setShowProjectSelector(true);
  const closeProjectSelector = () => setShowProjectSelector(false);

  return {
    // Quick Add
    showQuickAdd,
    quickAddText,
    setQuickAddText,
    openQuickAdd,
    closeQuickAdd,

    // Edit Task
    editingTask,
    editTaskText,
    setEditTaskText,
    openEditTask,
    closeEditTask,

    // Subtask Form
    activeSubtaskForm,
    openSubtaskForm,
    closeSubtaskForm,

    // Filters
    showFilters,
    openFilters,
    closeFilters,
    toggleFilters,

    // Project Selector
    showProjectSelector,
    openProjectSelector,
    closeProjectSelector,
  };
}
```

### After (10 lines with useModalState)

```typescript
// In component file directly (no separate hook needed)
import { useModalState } from '@/hooks/useModalState';

export function TasksPage() {
  const modals = useModalState({
    quickAdd: false,
    quickAddText: '',
    editingTask: null as string | null,
    editTaskText: '',
    activeSubtaskForm: null as string | null,
    showFilters: false,
    showProjectSelector: false,
  });

  // Usage examples:
  return (
    <>
      {/* Quick Add Modal */}
      {modals.state.quickAdd && (
        <QuickAddModal
          text={modals.state.quickAddText}
          onTextChange={(text) => modals.set('quickAddText', text)}
          onClose={() => {
            modals.close('quickAdd');
            modals.set('quickAddText', '');
          }}
        />
      )}

      {/* Edit Task Modal */}
      {modals.state.editingTask && (
        <EditTaskModal
          taskId={modals.state.editingTask}
          text={modals.state.editTaskText}
          onTextChange={(text) => modals.set('editTaskText', text)}
          onClose={() => {
            modals.close('editingTask');
            modals.set('editTaskText', '');
          }}
        />
      )}

      {/* Subtask Form */}
      {modals.state.activeSubtaskForm && (
        <SubtaskForm
          parentTaskId={modals.state.activeSubtaskForm}
          onClose={() => modals.close('activeSubtaskForm')}
        />
      )}

      {/* Buttons */}
      <button onClick={() => modals.open('quickAdd')}>
        Quick Add
      </button>

      <button onClick={() => modals.toggle('showFilters')}>
        {modals.state.showFilters ? 'Hide' : 'Show'} Filters
      </button>

      <button onClick={() => {
        modals.set('editingTask', task.id);
        modals.set('editTaskText', task.title);
      }}>
        Edit Task
      </button>
    </>
  );
}
```

**Savings**: 119 lines removed, better type safety, less boilerplate

---

## Migration 2: Large Query File → Split by Resource

### Before (1,165 lines in one file)

```typescript
// useFinanceQuery.ts (1,165 lines)
export function useFinanceInstitutions() { /* ... */ }
export function useCreateFinanceInstitution() { /* ... */ }
export function useUpdateFinanceInstitution() { /* ... */ }

export function useFinanceAccounts() { /* ... */ }
export function useCreateFinanceAccount() { /* ... */ }
export function useUpdateFinanceAccount() { /* ... */ }

export function useFinanceTransactions() { /* ... */ }
export function useCreateFinanceTransaction() { /* ... */ }
export function useUpdateFinanceTransaction() { /* ... */ }

export function useFinanceBudgets() { /* ... */ }
export function useCreateFinanceBudget() { /* ... */ }

export function useFinanceGoals() { /* ... */ }
export function useFinanceCards() { /* ... */ }
export function useFinanceLoans() { /* ... */ }
export function useFinanceInsurance() { /* ... */ }

// ... 30+ more hooks in same file
```

### After (Split into 7 focused files)

```
src/hooks/api/finance/
├── useFinanceAccountsQuery.ts      (150 lines)
├── useFinanceTransactionsQuery.ts  (200 lines)
├── useFinanceBudgetsQuery.ts       (150 lines)
├── useFinanceGoalsQuery.ts         (120 lines)
├── useFinanceCardsQuery.ts         (180 lines)
├── useFinanceLoansQuery.ts         (165 lines)
└── useFinanceInsuranceQuery.ts     (140 lines)
```

```typescript
// useFinanceAccountsQuery.ts (150 lines - focused)
export function useFinanceInstitutions() { /* ... */ }
export function useCreateFinanceInstitution() { /* ... */ }
export function useUpdateFinanceInstitution() { /* ... */ }
export function useDeleteFinanceInstitution() { /* ... */ }

export function useFinanceAccounts() { /* ... */ }
export function useCreateFinanceAccount() { /* ... */ }
export function useUpdateFinanceAccount() { /* ... */ }
export function useDeleteFinanceAccount() { /* ... */ }
```

```typescript
// useFinanceTransactionsQuery.ts (200 lines - focused)
export function useFinanceTransactions(filters?: TransactionFilters) { /* ... */ }
export function useCreateFinanceTransaction() { /* ... */ }
export function useUpdateFinanceTransaction() { /* ... */ }
export function useDeleteFinanceTransaction() { /* ... */ }

export function useRecurringTransactions() { /* ... */ }
export function useUpcomingRecurringTransactions() { /* ... */ }
```

**Update imports in consuming components**:

```typescript
// Before
import {
  useFinanceInstitutions,
  useFinanceAccounts,
  useFinanceTransactions,
  useFinanceBudgets,
} from '@/hooks/useFinanceQuery';

// After
import { useFinanceInstitutions, useFinanceAccounts } from '@/hooks/api/finance/useFinanceAccountsQuery';
import { useFinanceTransactions } from '@/hooks/api/finance/useFinanceTransactionsQuery';
import { useFinanceBudgets } from '@/hooks/api/finance/useFinanceBudgetsQuery';
```

**Benefits**:
- Each file < 200 lines (maintainable)
- Clear separation of concerns
- Easier to find specific functionality
- Better tree-shaking in production builds

---

## Migration 3: Business Logic in Hook → Utils

### Before (700 lines mixed)

```typescript
// useTasksQuery.ts (700 lines with mixed concerns)
export function useTasksQuery(filters?: TaskFilters) {
  return useQuery({
    queryKey: queryKeys.tasks.list(filters),
    queryFn: () => fetchTasks(filters),
  });
}

export function useCompleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskId: string) => {
      const task = await getTask(taskId);

      // Business logic embedded in hook (BAD)
      if (task.recurrence_pattern && task.recurrence_pattern !== 'none') {
        const nextOccurrence = calculateNextOccurrence(task);
        if (nextOccurrence) {
          await createNextRecurringTask(task, nextOccurrence);
        }
      }

      const tasksToUnblock = getTasksToUnblock(taskId);
      for (const blockedTask of tasksToUnblock) {
        await updateTask(blockedTask.id, { blocked: false });
      }

      return completeTask(taskId);
    },
    onSuccess: () => void queryClient.invalidateQueries(queryKeys.tasks.all),
  });
}

// Business logic functions (should be in utils)
function calculateNextOccurrence(task: TaskData): string | null {
  if (!task.recurrence_pattern || task.recurrence_pattern === 'none') return null;

  const baseDate = task.due_date ? parseISO(task.due_date) : new Date();

  switch (task.recurrence_pattern) {
    case 'daily':
      return addDays(baseDate, 1).toISOString();
    case 'weekly':
      return addWeeks(baseDate, 1).toISOString();
    // ... 30+ lines of date logic
  }
}

function createNextRecurringTask(task: TaskData, nextDate: string): Promise<TaskData> {
  // ... 50+ lines of business logic
}

function getTasksToUnblock(taskId: string): TaskData[] {
  // ... 30+ lines of business logic
}
```

### After (Split into hook + utils)

```typescript
// useTasksQuery.ts (300 lines - React Query only)
import { calculateNextOccurrence, createNextRecurringTask } from '@/utils/taskRecurrence';
import { getTasksToUnblock } from '@/utils/taskDependencies';

export function useTasksQuery(filters?: TaskFilters) {
  return useQuery({
    queryKey: queryKeys.tasks.list(filters),
    queryFn: () => fetchTasks(filters),
  });
}

export function useCompleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskId: string) => {
      const task = await getTask(taskId);

      // Use utility functions
      if (task.recurrence_pattern && task.recurrence_pattern !== 'none') {
        const nextOccurrence = calculateNextOccurrence(task);
        if (nextOccurrence) {
          await createNextRecurringTask(task, nextOccurrence);
        }
      }

      const tasksToUnblock = getTasksToUnblock(taskId);
      for (const blockedTask of tasksToUnblock) {
        await updateTask(blockedTask.id, { blocked: false });
      }

      return completeTask(taskId);
    },
    onSuccess: () => void queryClient.invalidateQueries(queryKeys.tasks.all),
  });
}
```

```typescript
// utils/taskRecurrence.ts (100 lines - pure functions, testable)
import { parseISO, addDays, addWeeks, addMonths, addYears } from 'date-fns';

/**
 * Calculate the next occurrence date for a recurring task
 * @param task - Task with recurrence pattern
 * @returns ISO date string for next occurrence, or null if not recurring
 */
export function calculateNextOccurrence(task: TaskData): string | null {
  if (!task.recurrence_pattern || task.recurrence_pattern === 'none') {
    return null;
  }

  const baseDate = task.due_date ? parseISO(task.due_date) : new Date();

  switch (task.recurrence_pattern) {
    case 'daily':
      return addDays(baseDate, 1).toISOString();
    case 'weekly':
      return addWeeks(baseDate, 1).toISOString();
    case 'monthly':
      return addMonths(baseDate, 1).toISOString();
    case 'yearly':
      return addYears(baseDate, 1).toISOString();
    default:
      return null;
  }
}

/**
 * Create a new recurring task instance
 * @param completedTask - The completed recurring task
 * @param nextDate - ISO date string for the new instance
 * @returns The newly created task
 */
export function createNextRecurringTask(
  completedTask: TaskData,
  nextDate: string
): Promise<TaskData> {
  return createTask({
    ...completedTask,
    id: undefined, // Generate new ID
    completed: false,
    completed_at: null,
    due_date: nextDate,
    parent_task_id: completedTask.id, // Link to original
  });
}
```

```typescript
// utils/taskDependencies.ts (50 lines - pure functions, testable)
/**
 * Get all tasks that are blocked by the specified task
 * @param completedTaskId - ID of the completed task
 * @param allTasks - All tasks in the system
 * @returns Array of tasks that should be unblocked
 */
export function getTasksToUnblock(
  completedTaskId: string,
  allTasks: TaskData[]
): TaskData[] {
  return allTasks.filter(task =>
    task.dependencies?.includes(completedTaskId)
  );
}
```

**Benefits**:
- Business logic is independently testable
- Can be reused outside React components
- Hooks focus only on React Query integration
- Easier to maintain and debug

---

## Migration Checklist

When migrating hooks, follow this checklist:

- [ ] Identify hooks > 150 lines (candidates for splitting)
- [ ] Extract business logic to `src/utils/`
- [ ] Convert modal boilerplate to `useModalState`
- [ ] Split large query files by resource type
- [ ] Update imports in consuming components
- [ ] Add JSDoc comments to new utility functions
- [ ] Write unit tests for extracted utilities
- [ ] Verify all functionality still works
- [ ] Update documentation

---

## Common Patterns to Look For

### Pattern: Duplicated Modal State

**Look for**: Multiple `useState` + `open/close` functions
**Replace with**: `useModalState`

### Pattern: Giant Query File

**Look for**: Files > 400 lines with many exports
**Replace with**: Multiple focused files (one per resource type)

### Pattern: Business Logic in Hooks

**Look for**: Complex functions with no React dependencies inside hook files
**Replace with**: Utils in `src/utils/` folder

### Pattern: Thin Wrapper Hooks

**Look for**: Hooks that just call `useQuery` with no added logic
**Replace with**: Direct `useQuery` calls in components

---

## Need Help?

If you're unsure how to migrate a specific hook:

1. Check `CLAUDE.md` for hook patterns
2. Look at `src/hooks/useModalState.ts` as a reference implementation
3. Review this migration guide for similar patterns
4. Ask for code review before merging large refactors
