# React Query Quick Reference Guide

Quick reference for using the new React Query hooks in LifeSync.

---

## Tasks

### Import
```typescript
import {
  useTasksQuery,
  useTaskQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
  useRestoreTaskMutation,
  useTaskAnalyticsQuery,
  useStarredTasks,
  useOverdueTasks,
} from '@/tasks/hooks/useTasksQuery';
```

### Common Patterns

#### Fetch all tasks
```typescript
const { data: tasks = [], isLoading, error } = useTasksQuery();
```

#### Fetch with filters
```typescript
const { data: tasks = [] } = useTasksQuery({
  status: 'todo',
  priority: 'high',
  starred: true,
});
```

#### Create task
```typescript
const createTask = useCreateTaskMutation();

createTask.mutate({
  title: 'New Task',
  priority: 'high',
  status: 'todo',
});
```

#### Update task
```typescript
const updateTask = useUpdateTaskMutation();

updateTask.mutate({
  taskId: 'task-123',
  updates: { status: 'done', completedAt: new Date() },
});
```

#### Get analytics
```typescript
const { data: analytics } = useTaskAnalyticsQuery();
// analytics.total, analytics.byStatus, analytics.overdue, etc.
```

---

## Habits

### Import
```typescript
import {
  useHabitsQuery,
  useHabitQuery,
  useCreateHabitMutation,
  useLogHabitMutation,
  useHabitEntriesQuery,
  useHabitAnalyticsQuery,
  useActiveHabits,
} from '@/habits/hooks/useHabitsQuery';
```

### Common Patterns

#### Fetch all habits
```typescript
const { data: habits = [], isLoading } = useHabitsQuery();
```

#### Fetch active habits
```typescript
const { data: activeHabits = [] } = useActiveHabits();
```

#### Create habit
```typescript
const createHabit = useCreateHabitMutation();

createHabit.mutate({
  name: 'Morning Exercise',
  frequency: 'daily',
  targetValue: 30,
  unit: 'minutes',
});
```

#### Log habit entry
```typescript
const logHabit = useLogHabitMutation();

logHabit.mutate({
  habitId: 'habit-123',
  date: new Date(),
  value: 30,
  notes: 'Felt great!',
});
```

#### Get habit entries
```typescript
const { data: entries = [] } = useHabitEntriesQuery('habit-123');
```

#### Get analytics
```typescript
const { data: analytics } = useHabitAnalyticsQuery();
// analytics.totalStreaks, analytics.completionRate, etc.
```

---

## Projects

### Import
```typescript
import {
  useProjectsQuery,
  useProjectQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
  useProjectAnalyticsQuery,
  useProjectsByStatus,
} from '@/projects/hooks/useProjectsQuery';
```

### Common Patterns

#### Fetch all projects
```typescript
const { data: projects = [], isLoading } = useProjectsQuery();
```

#### Fetch single project
```typescript
const { data: project } = useProjectQuery('project-123');
```

#### Create project
```typescript
const createProject = useCreateProjectMutation();

createProject.mutate({
  name: 'New Project',
  status: 'active',
  color: '#6366f1',
  icon: '🚀',
});
```

#### Update project
```typescript
const updateProject = useUpdateProjectMutation();

updateProject.mutate({
  projectId: 'project-123',
  updates: { status: 'completed' },
});
```

#### Get active projects
```typescript
const { data: activeProjects } = useProjectsByStatus('active');
```

---

## Goals

### Import
```typescript
import {
  useGoalsQuery,
  useGoalQuery,
  useCreateGoalMutation,
  useUpdateGoalMutation,
  useUpdateGoalProgressMutation,
  useGoalStatsQuery,
  useActiveGoals,
  useOverdueGoals,
} from '@/goals/hooks/useGoalsQuery';
```

### Common Patterns

#### Fetch all goals
```typescript
const { data: goals = [], isLoading } = useGoalsQuery();
```

#### Fetch with filters
```typescript
const { data: goals = [] } = useGoalsQuery({
  status: 'in-progress',
  category: 'health',
  priority: 'high',
});
```

#### Create goal
```typescript
const createGoal = useCreateGoalMutation();

createGoal.mutate({
  title: 'Run Marathon',
  category: 'fitness',
  priority: 'high',
  targetValue: 42.2,
  unit: 'km',
  targetDate: '2025-06-01',
});
```

#### Update goal progress
```typescript
const updateProgress = useUpdateGoalProgressMutation();

updateProgress.mutate({
  goalId: 'goal-123',
  progress: 75,
  currentValue: 31.5,
});
```

#### Get goal statistics
```typescript
const { data: stats } = useGoalStatsQuery();
// stats.total, stats.completed, stats.completionRate, etc.
```

---

## Advanced Life Goals Features

### Import
```typescript
import {
  useLifeGoalQuery,
  useAddMilestoneMutation,
  useCreateCheckinMutation,
  useRecordStreakMutation,
  useGoalTemplatesQuery,
} from '@/goals/hooks/useLifeGoalsQuery';
```

### Add milestone
```typescript
const addMilestone = useAddMilestoneMutation();

addMilestone.mutate({
  goalId: 'goal-123',
  title: 'Complete 5K',
  description: 'First milestone',
  orderIndex: 1,
  targetDate: '2025-03-01',
});
```

### Create check-in
```typescript
const createCheckin = useCreateCheckinMutation();

createCheckin.mutate({
  goalId: 'goal-123',
  progressUpdate: 10,
  notes: 'Great progress this week',
  mood: 'good',
  wins: 'Ran 3 times',
});
```

### Record streak
```typescript
const recordStreak = useRecordStreakMutation();

recordStreak.mutate({
  goalId: 'goal-123',
  date: '2025-12-07',
  completed: true,
  notes: 'Completed daily goal',
});
```

---

## Common Patterns Across All Features

### Loading States
```typescript
const { data, isLoading, error } = useQuery();

if (isLoading) return <LoadingSpinner />;
if (error) return <ErrorMessage error={error} />;
return <DataDisplay data={data} />;
```

### Mutation States
```typescript
const mutation = useMutation();

const handleSubmit = () => {
  mutation.mutate(data, {
    onSuccess: () => {
      toast.success('Success!');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
};

return (
  <Button
    onClick={handleSubmit}
    disabled={mutation.isPending}
  >
    {mutation.isPending ? 'Saving...' : 'Save'}
  </Button>
);
```

### Optimistic Updates (Automatic)
All mutations include optimistic updates by default:
```typescript
// UI updates immediately when you call mutate()
mutation.mutate(data); // UI updates instantly!
// If the API call fails, changes are automatically rolled back
```

### Manual Cache Invalidation
```typescript
import { useQueryClient } from '@tanstack/react-query';
import { tasksKeys } from '@/tasks/hooks/useTasksQuery';

const queryClient = useQueryClient();

// Invalidate specific query
queryClient.invalidateQueries({ queryKey: tasksKeys.list() });

// Invalidate all task queries
queryClient.invalidateQueries({ queryKey: tasksKeys.all });
```

---

## Performance Tips

### 1. Use filters to reduce data
```typescript
// Bad - fetches all tasks
const { data: allTasks } = useTasksQuery();
const todoTasks = allTasks.filter(t => t.status === 'todo');

// Good - filters on server
const { data: todoTasks } = useTasksQuery({ status: 'todo' });
```

### 2. Use helper hooks
```typescript
// Bad
const { data: tasks } = useTasksQuery();
const starred = tasks.filter(t => t.starred);

// Good
const { data: starred } = useStarredTasks();
```

### 3. Disable queries when not needed
```typescript
const { data } = useTaskQuery(taskId, {
  enabled: !!taskId, // Only fetch when taskId exists
});
```

### 4. Adjust stale time for static data
```typescript
const { data } = useGoalTemplatesQuery({
  staleTime: 1000 * 60 * 60, // 1 hour (templates rarely change)
});
```

---

## Debugging

### React Query DevTools
```typescript
// Add to your app (development only)
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

function App() {
  return (
    <>
      <YourApp />
      <ReactQueryDevtools initialIsOpen={false} />
    </>
  );
}
```

### Query Keys
All query keys are exported for debugging:
```typescript
import { tasksKeys, habitsKeys, projectsKeys, goalsKeys } from '@/*/hooks/*';

console.log(tasksKeys.list({ status: 'todo' }));
// ['tasks', 'list', { filters: { status: 'todo' } }]
```

---

## Migration from Zustand

### Before (Zustand)
```typescript
const { tasks, loadTasks, addTask, updateTask } = useStore();

useEffect(() => {
  loadTasks();
}, []);

const handleCreate = async () => {
  try {
    await addTask(taskData);
  } catch (error) {
    // Handle error
  }
};
```

### After (React Query)
```typescript
const { data: tasks = [] } = useTasksQuery(); // Auto-loads!
const createTask = useCreateTaskMutation();

const handleCreate = () => {
  createTask.mutate(taskData); // Optimistic update + auto error handling!
};
```

---

## Type Safety

All hooks are fully typed:
```typescript
import type { Task, TaskInput, TaskUpdate } from '@/tasks/hooks/useTasksQuery';

const task: Task = { /* fully typed */ };
const input: TaskInput = { /* required fields only */ };
const update: TaskUpdate = { /* all fields optional */ };
```

---

## Error Handling

### Global Error Handling
```typescript
import { QueryClient } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      onError: (error) => {
        toast.error('Failed to fetch data');
        logger.error('Query error', error);
      },
    },
    mutations: {
      onError: (error) => {
        toast.error('Failed to save changes');
        logger.error('Mutation error', error);
      },
    },
  },
});
```

### Per-Query Error Handling
```typescript
const { data, error } = useTasksQuery();

if (error) {
  return <ErrorMessage error={error.message} />;
}
```

---

## Best Practices

1. **Always provide default values**
   ```typescript
   const { data: tasks = [] } = useTasksQuery();
   ```

2. **Use helper hooks when available**
   ```typescript
   const { data } = useStarredTasks(); // Better than filtering manually
   ```

3. **Handle loading states**
   ```typescript
   if (isLoading) return <Skeleton />;
   ```

4. **Use mutation callbacks**
   ```typescript
   mutation.mutate(data, {
     onSuccess: () => toast.success('Saved!'),
     onError: (err) => toast.error(err.message),
   });
   ```

5. **Leverage automatic features**
   - Optimistic updates (built-in)
   - Automatic retries (built-in)
   - Background refetching (built-in)
   - Request deduplication (built-in)

---

## Resources

- **Migration Summary:** `/REACT_QUERY_MIGRATION_SUMMARY.md`
- **Meal Planning Pattern:** `/src/mealPlanning/hooks/useMealPlanningQuery.ts`
- **React Query Docs:** https://tanstack.com/query/latest
- **TypeScript Guide:** https://tanstack.com/query/latest/docs/react/typescript

---

**Last Updated:** December 7, 2025
**Status:** Production Ready
