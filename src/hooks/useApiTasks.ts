// Legacy API-friendly hook backed by React Query.
// Components that still expect raw TaskData/ProjectData can keep using this
// wrapper while the app transitions fully to React Query hooks.

import { useCallback, useMemo } from 'react';
import type { TaskData, ProjectData, Project as StoreProject } from '../services/types';
import {
  useTasks,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
  useRestoreTask,
  usePermanentlyDeleteTask,
} from './useTasksQuery';
import {
  useProjects,
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
} from './useProjectsQuery';

export interface UseApiTasksReturn {
  tasks: TaskData[];
  projects: ProjectData[];
  loading: boolean;
  error: string | null;

  // Task operations
  createTask: (task: Omit<TaskData, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateTask: (id: string, updates: Partial<TaskData>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  restoreTask: (id: string) => Promise<void>;
  permanentlyDeleteTask: (id: string) => Promise<void>;

  // Project operations
  createProject: (project: Omit<ProjectData, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateProject: (id: string, updates: Partial<ProjectData>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;

  // Utility functions
  refreshData: () => Promise<void>;
}

// Map StoreProject status to ProjectData status
const mapProjectStatus = (status: StoreProject['status']): ProjectData['status'] => {
  switch (status) {
    case 'planning':
    case 'active':
      return 'active';
    case 'on-hold':
      return 'on_hold';
    case 'completed':
      return 'completed';
    case 'archived':
      return 'on_hold'; // Map archived to on_hold for legacy API
    default:
      return 'active';
  }
};

// Map ProjectData status to StoreProject status
const mapProjectDataStatusToStore = (status?: ProjectData['status']): StoreProject['status'] => {
  switch (status) {
    case 'active':
      return 'active';
    case 'on_hold':
      return 'on-hold';
    case 'completed':
      return 'completed';
    default:
      return 'active';
  }
};

const mapProjectToProjectData = (project: StoreProject): ProjectData => ({
  id: project.id,
  name: project.name,
  description: project.description,
  color: project.color,
  status: mapProjectStatus(project.status),
  icon: undefined, // StoreProject doesn't have icon
  created_at: project.created_at,
  updated_at: project.updated_at,
});

export const useApiTasks = (): UseApiTasksReturn => {
  // Use React Query hooks
  const { data: tasksData = [], isLoading: tasksLoading, error: tasksError } = useTasks();
  const { data: projectsData = [], isLoading: projectsLoading, error: projectsError } = useProjects();

  const createTaskMutation = useCreateTask();
  const updateTaskMutation = useUpdateTask();
  const deleteTaskMutation = useDeleteTask();
  const restoreTaskMutation = useRestoreTask();
  const permanentlyDeleteTaskMutation = usePermanentlyDeleteTask();

  const createProjectMutation = useCreateProject();
  const updateProjectMutation = useUpdateProject();
  const deleteProjectMutation = useDeleteProject();

  // Map tasks data
  const tasks = useMemo((): TaskData[] => {
    return tasksData;
  }, [tasksData]);

  // Map projects data
  const projects = useMemo((): ProjectData[] => {
    try {
      return projectsData.map(mapProjectToProjectData);
    } catch {
      return [];
    }
  }, [projectsData]);

  // Combine errors
  const error = tasksError?.message || projectsError?.message || null;

  const createTask = useCallback(async (taskData: Omit<TaskData, 'id' | 'created_at' | 'updated_at'>): Promise<void> => {
    await createTaskMutation.mutateAsync(taskData);
  }, [createTaskMutation]);

  const updateTask = useCallback(async (id: string, updates: Partial<TaskData>): Promise<void> => {
    await updateTaskMutation.mutateAsync({ id, updates });
  }, [updateTaskMutation]);

  const deleteTask = useCallback(async (id: string): Promise<void> => {
    await deleteTaskMutation.mutateAsync(id);
  }, [deleteTaskMutation]);

  const restoreTask = useCallback(async (id: string): Promise<void> => {
    await restoreTaskMutation.mutateAsync(id);
  }, [restoreTaskMutation]);

  const permanentlyDeleteTask = useCallback(async (id: string): Promise<void> => {
    await permanentlyDeleteTaskMutation.mutateAsync(id);
  }, [permanentlyDeleteTaskMutation]);

  const createProject = useCallback(async (projectData: Omit<ProjectData, 'id' | 'created_at' | 'updated_at'>): Promise<void> => {
    await createProjectMutation.mutateAsync({
      name: projectData.name,
      description: projectData.description ?? undefined,
      color: projectData.color ?? '#6366f1',
      status: mapProjectDataStatusToStore(projectData.status),
      priority: 'medium',
      tags: [],
      progress: 0,
    });
  }, [createProjectMutation]);

  const updateProject = useCallback(async (id: string, updates: Partial<ProjectData>): Promise<void> => {
    await updateProjectMutation.mutateAsync({
      id,
      updates: {
        name: updates.name,
        description: updates.description ?? undefined,
        color: updates.color ?? undefined,
        status: updates.status ? mapProjectDataStatusToStore(updates.status) : undefined,
      },
    });
  }, [updateProjectMutation]);

  const deleteProject = useCallback(async (id: string): Promise<void> => {
    await deleteProjectMutation.mutateAsync(id);
  }, [deleteProjectMutation]);

  const refreshData = useCallback(async (): Promise<void> => {
    // No-op: React Query handles refetching automatically
    // Components should use React Query's refetch() if needed
  }, []);

  return {
    tasks,
    projects,
    loading: tasksLoading || projectsLoading,
    error,
    createTask,
    updateTask,
    deleteTask,
    restoreTask,
    permanentlyDeleteTask,
    createProject,
    updateProject,
    deleteProject,
    refreshData,
  };
};
