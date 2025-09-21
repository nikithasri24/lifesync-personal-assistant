// Legacy API-friendly hook backed by the shared Zustand store.
// Components that still expect raw TaskData/ProjectData can keep using this
// wrapper while the app transitions fully to the store-centric APIs.

import { useCallback, useMemo, useState } from 'react';
import { apiClient } from '../services/apiClient';
import type { TaskData, ProjectData } from '../services/apiClient';
import { useAppStore } from '../stores/useAppStore';
import type { TodoItem, Project as StoreProject } from '../types';

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

const toTaskStatus = (status?: TodoItem['status']): TaskData['status'] => {
  switch (status) {
    case 'todo':
    case 'need-to-start':
      return 'todo';
    case 'done':
      return 'done';
    case 'waiting':
    case 'pending-others':
      return 'waiting';
    case 'currently-working':
    case 'in_progress':
      return 'in_progress';
    case 'scheduled':
      return 'scheduled';
    default:
      return 'todo';
  }
};

const mapTodoToTaskData = (todo: TodoItem): TaskData => ({
  id: todo.id,
  title: todo.title,
  description: todo.description,
  status: toTaskStatus(todo.status),
  priority: todo.priority as TaskData['priority'],
  estimated_time: todo.estimatedTime,
  actual_time: todo.actualTime,
  due_date: todo.dueDate?.toISOString(),
  tags: todo.tags,
  category: 'other',
  notes: todo.notes,
  starred: todo.starred,
  archived: todo.archived,
  deleted: todo.deleted,
  deleted_at: todo.deletedAt?.toISOString(),
  completed_at: todo.completedAt?.toISOString(),
  created_at: todo.createdAt?.toISOString(),
  updated_at: todo.updatedAt?.toISOString(),
  project_id: todo.projectId,
  parent_id: todo.parentId,
});

const mapProjectToProjectData = (project: StoreProject): ProjectData => ({
  id: project.id,
  name: project.name,
  description: project.description,
  color: project.color,
  status: project.status as ProjectData['status'],
  icon: project.icon,
  created_at: project.createdAt?.toISOString(),
  updated_at: project.createdAt?.toISOString(),
});

export const useApiTasks = (): UseApiTasksReturn => {
  const {
    tasks: storeTasks,
    projects: storeProjects,
    tasksLoading,
    projectsLoading,
    loadTasks,
    loadProjects,
  } = useAppStore();

  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const tasks = useMemo(() => storeTasks.map(mapTodoToTaskData), [storeTasks]);
  const projects = useMemo(() => storeProjects.map(mapProjectToProjectData), [storeProjects]);

  const withRefresh = useCallback(
    async (action: () => Promise<unknown>) => {
      setError(null);
      try {
        await action();
        await loadTasks();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Operation failed';
        setError(message);
        throw err;
      }
    },
    [loadTasks],
  );

  const createTask = useCallback(async (taskData: Omit<TaskData, 'id' | 'created_at' | 'updated_at'>) => {
    await withRefresh(() => apiClient.createTask(taskData));
  }, [withRefresh]);

  const updateTask = useCallback(async (id: string, updates: Partial<TaskData>) => {
    await withRefresh(() => apiClient.updateTask(id, updates));
  }, [withRefresh]);

  const deleteTask = useCallback(async (id: string) => {
    await withRefresh(() => apiClient.deleteTask(id));
  }, [withRefresh]);

  const restoreTask = useCallback(async (id: string) => {
    await withRefresh(() => apiClient.restoreTask(id));
  }, [withRefresh]);

  const permanentlyDeleteTask = useCallback(async (id: string) => {
    await withRefresh(() => apiClient.permanentlyDeleteTask(id));
  }, [withRefresh]);

  const createProject = useCallback(async (projectData: Omit<ProjectData, 'id' | 'created_at' | 'updated_at'>) => {
    setError(null);
    try {
      await apiClient.createProject(projectData);
      await loadProjects();
      await loadTasks(); // keep task associations fresh
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create project';
      setError(message);
      throw err;
    }
  }, [loadProjects, loadTasks]);

  const updateProject = useCallback(async (id: string, updates: Partial<ProjectData>) => {
    setError(null);
    try {
      await apiClient.updateProject(id, updates);
      await loadProjects();
      await loadTasks();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update project';
      setError(message);
      throw err;
    }
  }, [loadProjects, loadTasks]);

  const deleteProject = useCallback(async (id: string) => {
    setError(null);
    try {
      await apiClient.deleteProject(id);
      await Promise.all([loadProjects(), loadTasks()]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete project';
      setError(message);
      throw err;
    }
  }, [loadProjects, loadTasks]);

  const refreshData = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    try {
      await Promise.all([loadTasks(), loadProjects()]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to refresh data';
      setError(message);
      throw err;
    } finally {
      setRefreshing(false);
    }
  }, [loadProjects, loadTasks]);

  return {
    tasks,
    projects,
    loading: tasksLoading || projectsLoading || refreshing,
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
