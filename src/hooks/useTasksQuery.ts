/**
 * React Query hooks for Tasks and Projects with Merged Mode Support
 *
 * Provides automatic caching, loading states, and cache invalidation
 * for tasks and projects CRUD operations.
 *
 * Merged Mode: When enabled, tasks hooks automatically include partner's tasks.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import type { TaskData, Project } from '../services/types';
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
} from '@/api/tasksAPI';
import {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
} from '@/api/projectsAPI';
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
  priority?: TaskData['priority'];
  category?: TaskData['category'];
  projectId?: string;
  starred?: boolean;
  archived?: boolean;
  deleted?: boolean;
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

      // Optimistically add to cache for immediate UI response
      queryClient.setQueryData<TaskData[]>(
        queryKeys.tasks.lists(),
        (old) => {
          return old ? [newTask, ...old] : [newTask];
        }
      );

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
  { previousTasks?: TaskData[]; previousTask?: TaskData; wasCompleted?: boolean }
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
      await queryClient.cancelQueries({ queryKey: queryKeys.tasks.lists() });
      await queryClient.cancelQueries({ queryKey: queryKeys.tasks.detail(id) });

      // Snapshot the previous values for rollback
      const previousTasks = queryClient.getQueryData<TaskData[]>(queryKeys.tasks.lists());
      const previousTask = queryClient.getQueryData<TaskData>(queryKeys.tasks.detail(id));

      // Track if this is a completion (status changing to 'done')
      const wasCompleted = updates.status === 'done' && previousTask?.status !== 'done';

      // Optimistically update task lists
      queryClient.setQueryData<TaskData[]>(
        queryKeys.tasks.lists(),
        (old) => {
          return old?.map((task) =>
            task.id === id ? { ...task, ...updates } : task
          );
        }
      );

      // Optimistically update task detail
      if (previousTask) {
        queryClient.setQueryData(
          queryKeys.tasks.detail(id),
          { ...previousTask, ...updates }
        );
      }

      // Return context with previous values for rollback
      return { previousTasks, previousTask, wasCompleted };
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
      logger.error('Tasks', 'Failed to update task - rolling back', { error: error.message, id });

      // Rollback to previous state on error
      if (context?.previousTasks) {
        queryClient.setQueryData(queryKeys.tasks.lists(), context.previousTasks);
      }
      if (context?.previousTask) {
        queryClient.setQueryData(queryKeys.tasks.detail(id), context.previousTask);
      }
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

// =====================================================
// PROJECTS QUERY HOOKS
// =====================================================

export interface ProjectFilters {
  status?: Project['status'];
  priority?: Project['priority'];
  tags?: string[];
}

/**
 * Get all projects with optional filters
 */
export function useProjects(filters?: ProjectFilters): UseQueryResult<Project[], Error> {
  return useQuery({
    queryKey: [...queryKeys.tasks.all, 'projects', filters] as const,
    queryFn: () => getProjects(filters),
    ...queryOptions.user,
  });
}

/**
 * Get a single project by ID
 */
export function useProject(id: string | null): UseQueryResult<Project, Error> {
  return useQuery({
    queryKey: [...queryKeys.tasks.all, 'projects', 'detail', id] as const,
    queryFn: () => getProject(id ?? ''),
    enabled: !!id,
    ...queryOptions.user,
  });
}

// =====================================================
// PROJECTS MUTATION HOOKS
// =====================================================

type CreateProjectInput = Omit<Project, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'milestones'>;
type UpdateProjectInput = Partial<Omit<Project, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'milestones'>>;

/**
 * Create a new project
 */
export function useCreateProject(): UseMutationResult<Project, Error, CreateProjectInput, unknown> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateProjectInput) => {
      logger.debug('Projects', 'Creating project', { name: input.name, status: input.status });
      const result = await createProject(input);
      return result;
    },
    onSuccess: (newProject) => {
      logger.info('Projects', 'Project created successfully', { id: newProject.id, name: newProject.name });

      // Invalidate all project queries
      void queryClient.invalidateQueries({ queryKey: [...queryKeys.tasks.all, 'projects'] });

      // Optimistically add to cache
      queryClient.setQueryData<Project[]>(
        [...queryKeys.tasks.all, 'projects', undefined] as const,
        (old) => {
          return old ? [newProject, ...old] : [newProject];
        }
      );
    },
    onError: (error: Error) => {
      logger.error('Projects', 'Failed to create project', { error: error.message });
    },
  });
}

/**
 * Update an existing project
 */
export function useUpdateProject(): UseMutationResult<Project, Error, { id: string; updates: UpdateProjectInput }, unknown> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateProjectInput }) => {
      logger.debug('Projects', 'Updating project', { id, updates });
      const result = await updateProject(id, updates);
      return result;
    },
    onMutate: ({ id, updates }) => {
      logger.debug('Projects', 'Optimistic update: updating project', { id, updates });
    },
    onSuccess: (updatedProject) => {
      logger.info('Projects', 'Project updated successfully', { id: updatedProject.id, name: updatedProject.name });

      // Invalidate all project queries
      void queryClient.invalidateQueries({ queryKey: [...queryKeys.tasks.all, 'projects'] });

      // Update the specific project detail cache
      queryClient.setQueryData(
        [...queryKeys.tasks.all, 'projects', 'detail', updatedProject.id] as const,
        updatedProject
      );

      // Optimistically update in list caches
      queryClient.setQueryData<Project[]>(
        [...queryKeys.tasks.all, 'projects', undefined] as const,
        (old) => {
          return old?.map((project) =>
            project.id === updatedProject.id ? updatedProject : project
          );
        }
      );
    },
    onError: (error: Error, { id }) => {
      logger.error('Projects', 'Failed to update project', { error: error.message, id });
    },
  });
}

/**
 * Delete a project
 */
export function useDeleteProject(): UseMutationResult<void, Error, string, unknown> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      logger.debug('Projects', 'Deleting project', { id });
      const result = await deleteProject(id);
      return result;
    },
    onSuccess: (_data, deletedId) => {
      logger.info('Projects', 'Project deleted successfully', { id: deletedId });

      // Invalidate all project queries
      void queryClient.invalidateQueries({ queryKey: [...queryKeys.tasks.all, 'projects'] });

      // Remove from cache
      queryClient.removeQueries({ queryKey: [...queryKeys.tasks.all, 'projects', 'detail', deletedId] });

      // Optimistically remove from list caches
      queryClient.setQueryData<Project[]>(
        [...queryKeys.tasks.all, 'projects', undefined] as const,
        (old) => {
          return old?.filter((project) => project.id !== deletedId);
        }
      );
    },
    onError: (error: Error, id) => {
      logger.error('Projects', 'Failed to delete project', { error: error.message, id });
    },
  });
}
