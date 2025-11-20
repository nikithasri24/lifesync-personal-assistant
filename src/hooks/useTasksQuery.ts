/**
 * React Query hooks for Tasks and Projects
 *
 * Provides automatic caching, loading states, and cache invalidation
 * for tasks and projects CRUD operations.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
export function useTasks(filters?: TaskFilters) {
  return useQuery({
    queryKey: queryKeys.tasks.list(filters),
    queryFn: () => getTasks(filters),
    ...queryOptions.user,
  });
}

/**
 * Get a single task by ID
 */
export function useTask(id: string | null) {
  return useQuery({
    queryKey: queryKeys.tasks.detail(id!),
    queryFn: () => getTask(id!),
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
export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTask,
    onSuccess: (newTask) => {
      // Invalidate all task lists
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.lists() });

      // Optimistically add to cache
      queryClient.setQueryData<TaskData[]>(
        queryKeys.tasks.lists(),
        (old) => {
          return old ? [newTask, ...old] : [newTask];
        }
      );
    },
  });
}

/**
 * Update an existing task
 */
export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<TaskData> }) =>
      updateTask(id, updates),
    onSuccess: (updatedTask) => {
      // Invalidate all task lists
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.lists() });

      // Update the specific task detail cache
      queryClient.setQueryData(
        queryKeys.tasks.detail(updatedTask.id!),
        updatedTask
      );

      // Optimistically update in list caches
      queryClient.setQueryData<TaskData[]>(
        queryKeys.tasks.lists(),
        (old) => {
          return old?.map((task) =>
            task.id === updatedTask.id ? updatedTask : task
          );
        }
      );
    },
  });
}

/**
 * Delete a task (soft delete)
 */
export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTask,
    onSuccess: (_data, deletedId) => {
      // Invalidate all task lists
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.lists() });

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
  });
}

/**
 * Permanently delete a task
 */
export function usePermanentlyDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: permanentlyDeleteTask,
    onSuccess: (_data, deletedId) => {
      // Invalidate all task lists
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.lists() });

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
  });
}

/**
 * Restore a deleted task
 */
export function useRestoreTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: restoreTask,
    onSuccess: (restoredTask) => {
      // Invalidate all task lists
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.lists() });

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
export function useProjects(filters?: ProjectFilters) {
  return useQuery({
    queryKey: [...queryKeys.tasks.all, 'projects', filters] as const,
    queryFn: () => getProjects(filters),
    ...queryOptions.user,
  });
}

/**
 * Get a single project by ID
 */
export function useProject(id: string | null) {
  return useQuery({
    queryKey: [...queryKeys.tasks.all, 'projects', 'detail', id] as const,
    queryFn: () => getProject(id!),
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
export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createProject,
    onSuccess: (newProject) => {
      // Invalidate all project queries
      queryClient.invalidateQueries({ queryKey: [...queryKeys.tasks.all, 'projects'] });

      // Optimistically add to cache
      queryClient.setQueryData<ProjectData[]>(
        [...queryKeys.tasks.all, 'projects', undefined] as const,
        (old) => {
          return old ? [newProject, ...old] : [newProject];
        }
      );
    },
  });
}

/**
 * Update an existing project
 */
export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<ProjectData> }) =>
      updateProject(id, updates),
    onSuccess: (updatedProject) => {
      // Invalidate all project queries
      queryClient.invalidateQueries({ queryKey: [...queryKeys.tasks.all, 'projects'] });

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
  });
}

/**
 * Delete a project
 */
export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteProject,
    onSuccess: (_data, deletedId) => {
      // Invalidate all project queries
      queryClient.invalidateQueries({ queryKey: [...queryKeys.tasks.all, 'projects'] });

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
  });
}
