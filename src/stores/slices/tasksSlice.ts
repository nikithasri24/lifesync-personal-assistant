/**
 * Tasks Zustand Slice - UI STATE ONLY
 *
 * ⚠️ DEPRECATED: Server state removed - use React Query hooks instead
 * 
 * This slice now contains ONLY UI state (view modes, filters, etc.)
 * All server data (tasks, loading states, CRUD operations) should use React Query.
 *
 * ✅ Use React Query hooks from @/hooks/useTasksQuery.ts:
 * - useTasks() - Get all tasks
 * - useTask(id) - Get single task
 * - useCreateTaskMutation() - Create task
 * - useUpdateTaskMutation() - Update task
 * - useDeleteTaskMutation() - Delete task
 * - useRestoreTaskMutation() - Restore task
 * - usePermanentlyDeleteTaskMutation() - Permanently delete task
 *
 * Benefits of React Query:
 * - Automatic caching and background refetching
 * - Optimistic updates with automatic rollback on error
 * - Better loading and error states
 * - Automatic request deduplication
 * - Proper separation: Server state (React Query) vs UI state (Zustand)
 */

import type { StateCreator } from 'zustand';

export interface TasksSlice {
  // UI State only - no server data!
  tasksViewMode: 'list' | 'kanban' | 'calendar';
  tasksFilterStatus: 'all' | 'active' | 'completed' | 'deleted';
  tasksFilterPriority: 'all' | 'low' | 'medium' | 'high';
  tasksSortBy: 'due_date' | 'priority' | 'created_at' | 'title';
  tasksSortOrder: 'asc' | 'desc';
  tasksShowArchived: boolean;
  tasksShowStarred: boolean;
  tasksSelectedCategory: string | null;
  tasksSelectedProject: string | null;

  // UI Actions
  setTasksViewMode: (mode: 'list' | 'kanban' | 'calendar') => void;
  setTasksFilterStatus: (status: 'all' | 'active' | 'completed' | 'deleted') => void;
  setTasksFilterPriority: (priority: 'all' | 'low' | 'medium' | 'high') => void;
  setTasksSortBy: (sortBy: 'due_date' | 'priority' | 'created_at' | 'title') => void;
  setTasksSortOrder: (order: 'asc' | 'desc') => void;
  setTasksShowArchived: (show: boolean) => void;
  setTasksShowStarred: (show: boolean) => void;
  setTasksSelectedCategory: (category: string | null) => void;
  setTasksSelectedProject: (projectId: string | null) => void;
  resetTasksFilters: () => void;
}

export const createTasksSlice: StateCreator<TasksSlice, [], [], TasksSlice> = (set) => ({
  // Initial UI state
  tasksViewMode: 'list',
  tasksFilterStatus: 'all',
  tasksFilterPriority: 'all',
  tasksSortBy: 'due_date',
  tasksSortOrder: 'asc',
  tasksShowArchived: false,
  tasksShowStarred: false,
  tasksSelectedCategory: null,
  tasksSelectedProject: null,

  // UI Actions
  setTasksViewMode: (mode) => set({ tasksViewMode: mode }),
  setTasksFilterStatus: (status) => set({ tasksFilterStatus: status }),
  setTasksFilterPriority: (priority) => set({ tasksFilterPriority: priority }),
  setTasksSortBy: (sortBy) => set({ tasksSortBy: sortBy }),
  setTasksSortOrder: (order) => set({ tasksSortOrder: order }),
  setTasksShowArchived: (show) => set({ tasksShowArchived: show }),
  setTasksShowStarred: (show) => set({ tasksShowStarred: show }),
  setTasksSelectedCategory: (category) => set({ tasksSelectedCategory: category }),
  setTasksSelectedProject: (projectId) => set({ tasksSelectedProject: projectId }),
  resetTasksFilters: () =>
    set({
      tasksFilterStatus: 'all',
      tasksFilterPriority: 'all',
      tasksShowArchived: false,
      tasksShowStarred: false,
      tasksSelectedCategory: null,
      tasksSelectedProject: null,
    }),
});

