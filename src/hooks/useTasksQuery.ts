/**
 * React Query hooks for Tasks and Projects with Merged Mode Support
 *
 * Provides automatic caching, loading states, and cache invalidation
 * for tasks and projects CRUD operations.
 *
 * Merged Mode: When enabled, tasks hooks automatically include partner's tasks.
 */

import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import type { UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import type { TaskData } from '../services/types';
import { queryKeys, queryOptions } from '@/lib/react-query';
import {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  permanentlyDeleteTask,
  restoreTask,
  getTasksMergedConnection,
  getPagedTasks,
} from '@/api/tasksAPI';
import { DEFAULT_PAGE_SIZE, type PaginatedResult } from '@/types/pagination';
import { logger } from '@/services/logger';
// import { recordTaskCompletion } from '@/services/gamification'; // Gamification removed
import { dataEvents } from '@/lib/dataEvents';
import { createNextRecurringTask } from '@/utils/taskRecurrence';
import { getTasksToUnblock } from '@/utils/taskDependencies';

// =====================================================
// MERGED MODE HOOK
// =====================================================

/**
 * Hook to check if tasks merged mode is enabled.
 * Returns connection info if both users have set module to 'merged', null otherwise.
 *
 * @returns Query result with MergedConnectionResult or null
 */
export function useMergedTasksConnectionQuery() {
  return useQuery({
    queryKey: ['tasks', 'mergedConnection'],
    queryFn: getTasksMergedConnection,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    gcTime: 1000 * 60 * 10,   // Keep in cache for 10 minutes
    retry: 1,                   // Only retry once on failure
  });
}

// =====================================================
// TASKS QUERY HOOKS
// =====================================================

export interface TaskFilters {
  status?: TaskData['status'];
  /** Match any of the given statuses. Overrides `status`. */
  statuses?: TaskData['status'][];
  priority?: TaskData['priority'];
  category?: TaskData['category'];
  projectId?: string;
  starred?: boolean;
  archived?: boolean;
  deleted?: boolean;
  dueBefore?: string;
  dueAfter?: string;
  createdAfter?: string;
  createdBefore?: string;
  updatedAfter?: string;
  /** Full-text search on title and description. */
  search?: string;
  /** Override merged-mode owner filter to a specific user_id. */
  ownerUserId?: string;
}

/**
 * Get all tasks with optional filters.
 * Automatically includes partner's tasks if merged mode is enabled.
 *
 * @param filters - Optional filters to apply
 * @returns Query result with array of tasks
 */
export function useTasks(filters?: TaskFilters): UseQueryResult<TaskData[], Error> {
  return useQuery({
    queryKey: queryKeys.tasks.list(filters as Record<string, unknown> | undefined),
    queryFn: () => getTasks(filters),
    ...queryOptions.user,
  });
}

/**
 * Get a paginated page of tasks.
 * Each page is cached separately. Uses keepPreviousData for smooth transitions.
 *
 * @param filters - Optional filters to apply (server-side)
 * @param page - 1-indexed page number (defaults to 1)
 */
export function usePagedTasks(
  filters?: TaskFilters,
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE
): UseQueryResult<PaginatedResult<TaskData>, Error> {
  return useQuery({
    queryKey: queryKeys.tasks.list({ ...filters, page, pageSize } as Record<string, unknown>),
    queryFn: () => getPagedTasks(filters, { page, pageSize }),
    ...queryOptions.user,
    placeholderData: keepPreviousData,
  });
}

/**
 * Get a single task by ID
 */
export function useTask(id: string | null): UseQueryResult<TaskData, Error> {
  return useQuery({
    queryKey: queryKeys.tasks.detail(id ?? ''),
    queryFn: () => getTask(id ?? ''),
    enabled: !!id,
    ...queryOptions.user,
  });
}

// =====================================================
// TASKS MUTATION HOOKS
// =====================================================

/**
 * Create a new task
 */
export function useCreateTask(): UseMutationResult<TaskData, Error, Omit<TaskData, 'id' | 'created_at' | 'updated_at'>, unknown> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: Omit<TaskData, 'id' | 'created_at' | 'updated_at'>) => {
      logger.debug('Tasks', 'Creating task', { title: input.title, priority: input.priority });
      const result = await createTask(input);
      return result;
    },
    onSuccess: (newTask) => {
      logger.info('Tasks', 'Task created successfully', { id: newTask.id, title: newTask.title });

      // Invalidate ALL task queries to ensure all views (Todos, Calendar, etc.) get updated
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });

      // Emit event - DataSyncProvider handles cache invalidation
      dataEvents.emit('task:created', { taskId: newTask.id!, task: newTask });
    },
    onError: (error: Error) => {
      logger.error('Tasks', 'Failed to create task', { error: error.message });
    },
  });
}

/**
 * Update an existing task
 */
export function useUpdateTask(): UseMutationResult<
  TaskData,
  Error,
  { id: string; updates: Partial<TaskData> },
  { previousTask?: TaskData; wasCompleted?: boolean }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<TaskData> }) => {
      logger.debug('Tasks', 'Updating task', { id, updates });
      const result = await updateTask(id, updates);
      return result;
    },
    // Optimistic update - happens BEFORE API call
    onMutate: async ({ id, updates }) => {
      logger.debug('Tasks', 'Optimistic update: updating task', { id, updates });

      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: queryKeys.tasks.all });

      // Snapshot the previous task for rollback
      const previousTask = queryClient.getQueryData<TaskData>(queryKeys.tasks.detail(id));

      // Track if this is a completion (status changing to 'done')
      const wasCompleted = updates.status === 'done' && previousTask?.status !== 'done';

      // Invalidate all task queries - they'll refetch with updated data
      // This ensures Calendar, Todos, and all other views stay in sync
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });

      // Return context with previous values for rollback
      return { previousTask, wasCompleted };
    },
    onSuccess: (updatedTask, _variables, context) => {
      logger.info('Tasks', 'Task updated successfully', { id: updatedTask.id, title: updatedTask.title });

      // Record gamification points if task was just completed
      if (context?.wasCompleted && updatedTask.id) {
        // Map task priority to gamification priority (high/urgent/important -> high)
        const taskPriority = updatedTask.priority;
        const gamificationPriority: 'low' | 'medium' | 'high' =
          taskPriority === 'high' || taskPriority === 'urgent' || taskPriority === 'important'
            ? 'high'
            : taskPriority === 'low'
              ? 'low'
              : 'medium';

        // Gamification removed
        // recordTaskCompletion(updatedTask.id, gamificationPriority).catch((err) => {
        //   logger.error('Gamification', err instanceof Error ? err : new Error(String(err)));
        // });

        // Check for tasks that are now unblocked and move them to todo
        const allTasks = queryClient.getQueryData<TaskData[]>(queryKeys.tasks.lists()) || [];

        // Debug: Log all tasks with dependencies
        const tasksWithDeps = allTasks.filter(t => t.depends_on && t.depends_on.length > 0);
        logger.info('Tasks', 'DEBUG: Tasks with dependencies', {
          completedTaskId: updatedTask.id,
          tasksWithDeps: tasksWithDeps.map(t => ({
            id: t.id,
            title: t.title,
            depends_on: t.depends_on,
            status: t.status,
            includesCompletedTask: t.depends_on?.includes(updatedTask.id!)
          }))
        });

        const unblockedTasks = getTasksToUnblock(updatedTask.id, allTasks);
        logger.info('Tasks', 'DEBUG: Unblocked tasks found', { count: unblockedTasks.length, tasks: unblockedTasks.map(t => t.title) });

        if (unblockedTasks.length > 0) {
          logger.info('Tasks', 'Tasks unblocked by completion', {
            completedTask: updatedTask.title,
            unblockedTasks: unblockedTasks.map(t => t.title)
          });

          // Update unblocked tasks to 'todo' status so they appear in backlog/todo
          unblockedTasks.forEach(unblockedTask => {
            logger.info('Tasks', 'DEBUG: Processing unblocked task', {
              id: unblockedTask.id,
              title: unblockedTask.title,
              currentStatus: unblockedTask.status
            });

            if (unblockedTask.id) {
              // Update in database - always update to ensure is_blocked is false
              updateTask(unblockedTask.id, {
                status: 'todo',
                is_blocked: false
              }).then(() => {
                logger.info('Tasks', `Task "${unblockedTask.title}" moved to todo after being unblocked`);
                // Invalidate to refresh
                queryClient.invalidateQueries({ queryKey: queryKeys.tasks.lists() });
              }).catch(err => {
                logger.error('Tasks', `Failed to update unblocked task: ${err}`);
              });
            }
          });

          // Optimistically update the cache
          queryClient.setQueryData<TaskData[]>(
            queryKeys.tasks.lists(),
            (old) => {
              if (!old) return old;
              return old.map(task => {
                const isUnblocked = unblockedTasks.some(ut => ut.id === task.id);
                if (isUnblocked) {
                  return { ...task, status: 'todo' as const, is_blocked: false };
                }
                return task;
              });
            }
          );
        }

        // Handle recurring tasks - create next occurrence
        if (updatedTask.recurrence_pattern && updatedTask.recurrence_pattern !== 'none') {
          createNextRecurringTask(updatedTask, createTask).then(nextTask => {
            if (nextTask) {
              // Add the new task to the cache
              queryClient.setQueryData<TaskData[]>(
                queryKeys.tasks.lists(),
                (old) => old ? [...old, nextTask] : [nextTask]
              );
              // Invalidate to refresh from server
              queryClient.invalidateQueries({ queryKey: queryKeys.tasks.lists() });
            }
          });
        }
      }

      // Update with server response (in case server modified the data)
      queryClient.setQueryData(
        queryKeys.tasks.detail(updatedTask.id ?? ''),
        updatedTask
      );

      queryClient.setQueryData<TaskData[]>(
        queryKeys.tasks.lists(),
        (old) => {
          return old?.map((task) =>
            task.id === updatedTask.id ? updatedTask : task
          );
        }
      );

      // Emit appropriate event based on what changed
      if (context?.wasCompleted) {
        dataEvents.emit('task:completed', {
          taskId: updatedTask.id!,
          task: updatedTask,
          changes: _variables.updates,
        });
      } else {
        dataEvents.emit('task:updated', {
          taskId: updatedTask.id!,
          task: updatedTask,
          changes: _variables.updates,
        });
      }
    },
    onError: (error: Error, { id }, context) => {
      logger.error('Tasks', 'Failed to update task - invalidating cache', { error: error.message, id });

      // Invalidate all task queries to refetch fresh data from server
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
    },
  });
}

/**
 * Delete a task (soft delete)
 */
export function useDeleteTask(): UseMutationResult<void, Error, string, unknown> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      logger.debug('Tasks', 'Deleting task (soft delete)', { id });
      const result = await deleteTask(id);
      return result;
    },
    onSuccess: (_data, deletedId) => {
      logger.info('Tasks', 'Task deleted successfully', { id: deletedId });

      // Mark as deleted in cache (soft delete) for immediate UI response
      queryClient.setQueryData<TaskData[]>(
        queryKeys.tasks.lists(),
        (old) => {
          return old?.map((task) =>
            task.id === deletedId
              ? { ...task, deleted: true, deleted_at: new Date().toISOString() }
              : task
          );
        }
      );

      // Emit event - DataSyncProvider handles cache invalidation
      dataEvents.emit('task:deleted', { taskId: deletedId, permanent: false });
    },
    onError: (error: Error, id) => {
      logger.error('Tasks', 'Failed to delete task', { error: error.message, id });
    },
  });
}

/**
 * Permanently delete a task
 */
export function usePermanentlyDeleteTask(): UseMutationResult<void, Error, string, unknown> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      logger.debug('Tasks', 'Permanently deleting task', { id });
      const result = await permanentlyDeleteTask(id);
      return result;
    },
    onSuccess: (_data, deletedId) => {
      logger.info('Tasks', 'Task permanently deleted', { id: deletedId });

      // Remove from cache
      queryClient.removeQueries({ queryKey: queryKeys.tasks.detail(deletedId) });

      // Optimistically remove from list caches for immediate UI response
      queryClient.setQueryData<TaskData[]>(
        queryKeys.tasks.lists(),
        (old) => {
          return old?.filter((task) => task.id !== deletedId);
        }
      );

      // Emit event - DataSyncProvider handles cache invalidation
      dataEvents.emit('task:deleted', { taskId: deletedId, permanent: true });
    },
    onError: (error: Error, id) => {
      logger.error('Tasks', 'Failed to permanently delete task', { error: error.message, id });
    },
  });
}

/**
 * Restore a deleted task
 */
export function useRestoreTask(): UseMutationResult<TaskData, Error, string, unknown> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      logger.debug('Tasks', 'Restoring task', { id });
      const result = await restoreTask(id);
      return result;
    },
    onSuccess: (restoredTask) => {
      logger.info('Tasks', 'Task restored successfully', { id: restoredTask.id, title: restoredTask.title });

      // Update in cache for immediate UI response
      queryClient.setQueryData<TaskData[]>(
        queryKeys.tasks.lists(),
        (old) => {
          return old?.map((task) =>
            task.id === restoredTask.id ? restoredTask : task
          );
        }
      );

      // Emit event - DataSyncProvider handles cache invalidation
      dataEvents.emit('task:restored', { taskId: restoredTask.id!, task: restoredTask });
    },
    onError: (error: Error, id) => {
      logger.error('Tasks', 'Failed to restore task', { error: error.message, id });
    },
  });
}

// Project hooks live in useProjectsQuery.ts.
// Legacy names re-exported here for backward compatibility.
export {
  useProjects,
  useProject,
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
} from './useProjectsQuery';
