// Legacy API-friendly hook backed by the shared Zustand store.
// Components that still expect raw TaskData/ProjectData can keep using this
// wrapper while the app transitions fully to the store-centric APIs.

import { useCallback, useMemo, useState } from 'react';
import type { TaskData, ProjectData, Project as StoreProject } from '../services/types';
import { useComposedStore } from '../stores/useComposedStore';
import type { TaskInput } from '../stores/slices/tasksSlice';

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

// Convert TaskData input to TaskInput for the store (strip system fields)
const toTaskInput = (
  task: Omit<TaskData, 'id' | 'created_at' | 'updated_at'>,
): TaskInput => ({
  title: task.title,
  description: task.description,
  status: task.status,
  priority: task.priority,
  estimated_time: task.estimated_time,
  actual_time: task.actual_time,
  due_date: task.due_date,
  tags: task.tags,
  category: task.category,
  notes: task.notes,
  starred: task.starred,
  archived: task.archived,
  project_id: task.project_id,
  parent_id: task.parent_id,
});

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
  const {
    tasks: storeTasks,
    projects: storeProjects,
    tasksLoading,
    projectsLoading,
    addTask,
    updateTask: updateTaskInStore,
    softDeleteTask,
    restoreTask: restoreTaskInStore,
    hardDeleteTask,
    addProject: addProjectToStore,
    updateProject: updateProjectInStore,
    deleteProject: deleteProjectFromStore,
  } = useComposedStore();

  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Store already uses TaskData, so just return it directly
  const tasks = useMemo((): TaskData[] => {
    if (!storeTasks || !Array.isArray(storeTasks)) return [];
    return storeTasks;
  }, [storeTasks]);

  const projects = useMemo((): ProjectData[] => {
    if (!storeProjects || !Array.isArray(storeProjects)) return [];
    try {
      return storeProjects.map(mapProjectToProjectData);
    } catch {
      return [];
    }
  }, [storeProjects]);

  const createTask = useCallback(async (taskData: Omit<TaskData, 'id' | 'created_at' | 'updated_at'>): Promise<void> => {
    setError(null);
    try {
      await addTask(toTaskInput(taskData));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      throw new Error(message);
    }
  }, [addTask]);

  const updateTask = useCallback(async (id: string, updates: Partial<TaskData>): Promise<void> => {
    setError(null);
    try {
      await updateTaskInStore(id, updates);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      throw new Error(message);
    }
  }, [updateTaskInStore]);

  const deleteTask = useCallback(async (id: string): Promise<void> => {
    setError(null);
    try {
      await softDeleteTask(id);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      throw new Error(message);
    }
  }, [softDeleteTask]);

  const restoreTask = useCallback(async (id: string): Promise<void> => {
    setError(null);
    try {
      await restoreTaskInStore(id);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      throw new Error(message);
    }
  }, [restoreTaskInStore]);

  const permanentlyDeleteTask = useCallback(async (id: string): Promise<void> => {
    setError(null);
    try {
      await hardDeleteTask(id);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      throw new Error(message);
    }
  }, [hardDeleteTask]);

  const createProject = useCallback(async (projectData: Omit<ProjectData, 'id' | 'created_at' | 'updated_at'>): Promise<void> => {
    setError(null);
    try {
      await addProjectToStore({
        name: projectData.name,
        description: projectData.description ?? undefined,
        color: projectData.color ?? '#6366f1',
        status: mapProjectDataStatusToStore(projectData.status),
        priority: 'medium',
        tags: [],
        progress: 0,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      throw new Error(message);
    }
  }, [addProjectToStore]);

  const updateProject = useCallback(async (id: string, updates: Partial<ProjectData>): Promise<void> => {
    setError(null);
    try {
      await updateProjectInStore(id, {
        name: updates.name,
        description: updates.description ?? undefined,
        color: updates.color ?? undefined,
        status: updates.status ? mapProjectDataStatusToStore(updates.status) : undefined,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      throw new Error(message);
    }
  }, [updateProjectInStore]);

  const deleteProject = useCallback(async (id: string): Promise<void> => {
    setError(null);
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      await deleteProjectFromStore(id);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      throw new Error(message);
    }
  }, [deleteProjectFromStore]);

  const refreshData = useCallback(async (): Promise<void> => {
    setRefreshing(true);
    setError(null);
    try {
      // TODO: This hook is deprecated - data is now in React Query
      // Components should use React Query's refetch() instead
      // For now, this is a no-op
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      throw new Error(message);
    } finally {
      setRefreshing(false);
    }
  }, []);

  return {
    tasks,
    projects,
    loading: (tasksLoading === true) || (projectsLoading === true) || refreshing,
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
