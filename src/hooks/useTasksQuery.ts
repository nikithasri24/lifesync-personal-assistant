/**
 * React Query hooks for Tasks and Projects
 *
 * Provides automatic caching, loading states, and cache invalidation
 * for tasks and projects CRUD operations.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import type { TaskData, ProjectData } from '../services/types';
import { queryKeys, queryOptions } from '@/lib/react-query';
import {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  permanentlyDeleteTask,
  restoreTask,
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
} from '@/api/tasksAPI';
import { logger } from '@/services/logger';

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
 * Get all tasks with optional filters
 */
export function useTasks(filters?: TaskFilters): UseQueryResult<TaskData[], Error> {
  return useQuery({
    queryKey: queryKeys.tasks.list(filters),
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
      logger.debug('Creating task', { title: input.title, priority: input.priority });
      const result = await createTask(input);
      return result;
    },
    onSuccess: (newTask) => {
      logger.info('Task created successfully', { id: newTask.id, title: newTask.title });

      // Invalidate all task lists
      void queryClient.invalidateQueries({ queryKey: queryKeys.tasks.lists() });

      // Optimistically add to cache
      queryClient.setQueryData<TaskData[]>(
        queryKeys.tasks.lists(),
        (old) => {
          return old ? [newTask, ...old] : [newTask];
        }
      );
    },
    onError: (error: Error) => {
      logger.error('Failed to create task', { error: error.message });
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
  { previousTasks?: TaskData[]; previousTask?: TaskData }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<TaskData> }) => {
      logger.debug('Updating task', { id, updates });
      const result = await updateTask(id, updates);
      return result;
    },
    // Optimistic update - happens BEFORE API call
    onMutate: async ({ id, updates }) => {
      logger.debug('Optimistic update: updating task', { id, updates });

      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: queryKeys.tasks.lists() });
      await queryClient.cancelQueries({ queryKey: queryKeys.tasks.detail(id) });

      // Snapshot the previous values for rollback
      const previousTasks = queryClient.getQueryData<TaskData[]>(queryKeys.tasks.lists());
      const previousTask = queryClient.getQueryData<TaskData>(queryKeys.tasks.detail(id));

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
      return { previousTasks, previousTask };
    },
    onSuccess: (updatedTask) => {
      logger.info('Task updated successfully', { id: updatedTask.id, title: updatedTask.title });

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
    },
    onError: (error: Error, { id }, context) => {
      logger.error('Failed to update task - rolling back', { error: error.message, id });

      // Rollback to previous state on error
      if (context?.previousTasks) {
        queryClient.setQueryData(queryKeys.tasks.lists(), context.previousTasks);
      }
      if (context?.previousTask) {
        queryClient.setQueryData(queryKeys.tasks.detail(id), context.previousTask);
      }
    },
    // Always refetch after success or error to ensure we're in sync with server
    onSettled: (_data, _error, { id }) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.tasks.lists() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.tasks.detail(id) });
    },
  });
}

/**
 * Delete a task (soft delete)
 */
export function useDeleteTask(): UseMutationResult<TaskData, Error, string, unknown> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      logger.debug('Deleting task (soft delete)', { id });
      const result = await deleteTask(id);
      return result;
    },
    onSuccess: (_data, deletedId) => {
      logger.info('Task deleted successfully', { id: deletedId });

      // Invalidate all task lists
      void queryClient.invalidateQueries({ queryKey: queryKeys.tasks.lists() });

      // Mark as deleted in cache (soft delete)
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
    },
    onError: (error: Error, id) => {
      logger.error('Failed to delete task', { error: error.message, id });
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
      logger.debug('Permanently deleting task', { id });
      const result = await permanentlyDeleteTask(id);
      return result;
    },
    onSuccess: (_data, deletedId) => {
      logger.info('Task permanently deleted', { id: deletedId });

      // Invalidate all task lists
      void queryClient.invalidateQueries({ queryKey: queryKeys.tasks.lists() });

      // Remove from cache
      queryClient.removeQueries({ queryKey: queryKeys.tasks.detail(deletedId) });

      // Optimistically remove from list caches
      queryClient.setQueryData<TaskData[]>(
        queryKeys.tasks.lists(),
        (old) => {
          return old?.filter((task) => task.id !== deletedId);
        }
      );
    },
    onError: (error: Error, id) => {
      logger.error('Failed to permanently delete task', { error: error.message, id });
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
      logger.debug('Restoring task', { id });
      const result = await restoreTask(id);
      return result;
    },
    onSuccess: (restoredTask) => {
      logger.info('Task restored successfully', { id: restoredTask.id, title: restoredTask.title });

      // Invalidate all task lists
      void queryClient.invalidateQueries({ queryKey: queryKeys.tasks.lists() });

      // Update in cache
      queryClient.setQueryData<TaskData[]>(
        queryKeys.tasks.lists(),
        (old) => {
          return old?.map((task) =>
            task.id === restoredTask.id ? restoredTask : task
          );
        }
      );
    },
    onError: (error: Error, id) => {
      logger.error('Failed to restore task', { error: error.message, id });
    },
  });
}

// =====================================================
// PROJECTS QUERY HOOKS
// =====================================================

export interface ProjectFilters {
  status?: ProjectData['status'];
}

/**
 * Get all projects with optional filters
 */
export function useProjects(filters?: ProjectFilters): UseQueryResult<ProjectData[], Error> {
  return useQuery({
    queryKey: [...queryKeys.tasks.all, 'projects', filters] as const,
    queryFn: () => getProjects(filters),
    ...queryOptions.user,
  });
}

/**
 * Get a single project by ID
 */
export function useProject(id: string | null): UseQueryResult<ProjectData, Error> {
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

/**
 * Create a new project
 */
export function useCreateProject(): UseMutationResult<ProjectData, Error, Omit<ProjectData, 'id' | 'created_at' | 'updated_at'>, unknown> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: Omit<ProjectData, 'id' | 'created_at' | 'updated_at'>) => {
      logger.debug('Creating project', { name: input.name, status: input.status });
      const result = await createProject(input);
      return result;
    },
    onSuccess: (newProject) => {
      logger.info('Project created successfully', { id: newProject.id, name: newProject.name });

      // Invalidate all project queries
      void queryClient.invalidateQueries({ queryKey: [...queryKeys.tasks.all, 'projects'] });

      // Optimistically add to cache
      queryClient.setQueryData<ProjectData[]>(
        [...queryKeys.tasks.all, 'projects', undefined] as const,
        (old) => {
          return old ? [newProject, ...old] : [newProject];
        }
      );
    },
    onError: (error: Error) => {
      logger.error('Failed to create project', { error: error.message });
    },
  });
}

/**
 * Update an existing project
 */
export function useUpdateProject(): UseMutationResult<ProjectData, Error, { id: string; updates: Partial<ProjectData> }, unknown> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ProjectData> }) => {
      logger.debug('Updating project', { id, updates });
      const result = await updateProject(id, updates);
      return result;
    },
    onMutate: ({ id, updates }) => {
      logger.debug('Optimistic update: updating project', { id, updates });
    },
    onSuccess: (updatedProject) => {
      logger.info('Project updated successfully', { id: updatedProject.id, name: updatedProject.name });

      // Invalidate all project queries
      void queryClient.invalidateQueries({ queryKey: [...queryKeys.tasks.all, 'projects'] });

      // Update the specific project detail cache
      queryClient.setQueryData(
        [...queryKeys.tasks.all, 'projects', 'detail', updatedProject.id] as const,
        updatedProject
      );

      // Optimistically update in list caches
      queryClient.setQueryData<ProjectData[]>(
        [...queryKeys.tasks.all, 'projects', undefined] as const,
        (old) => {
          return old?.map((project) =>
            project.id === updatedProject.id ? updatedProject : project
          );
        }
      );
    },
    onError: (error: Error, { id }) => {
      logger.error('Failed to update project', { error: error.message, id });
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
      logger.debug('Deleting project', { id });
      const result = await deleteProject(id);
      return result;
    },
    onSuccess: (_data, deletedId) => {
      logger.info('Project deleted successfully', { id: deletedId });

      // Invalidate all project queries
      void queryClient.invalidateQueries({ queryKey: [...queryKeys.tasks.all, 'projects'] });

      // Remove from cache
      queryClient.removeQueries({ queryKey: [...queryKeys.tasks.all, 'projects', 'detail', deletedId] });

      // Optimistically remove from list caches
      queryClient.setQueryData<ProjectData[]>(
        [...queryKeys.tasks.all, 'projects', undefined] as const,
        (old) => {
          return old?.filter((project) => project.id !== deletedId);
        }
      );
    },
    onError: (error: Error, id) => {
      logger.error('Failed to delete project', { error: error.message, id });
    },
  });
}
