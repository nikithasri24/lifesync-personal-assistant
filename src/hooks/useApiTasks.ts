// Legacy API-friendly hook backed by the shared Zustand store.
// Components that still expect raw TaskData/ProjectData can keep using this
// wrapper while the app transitions fully to the store-centric APIs.

import { useCallback, useMemo, useState } from 'react';
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
    case 'in-progress':
      return 'in_progress';
    case 'scheduled':
      return 'scheduled';
    default:
      return 'todo';
  }
};

const fromTaskStatus = (status?: TaskData['status']): TodoItem['status'] => {
  switch (status) {
    case 'in_progress':
      return 'in-progress';
    case 'waiting':
      return 'waiting';
    case 'scheduled':
      return 'scheduled';
    case 'done':
      return 'done';
    case 'todo':
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
  category: (todo.categoryId ?? todo.category ?? 'other') as TaskData['category'],
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

const mapTaskInsertToTodo = (
  task: Omit<TaskData, 'id' | 'created_at' | 'updated_at'>,
): Omit<TodoItem, 'id' | 'createdAt' | 'updatedAt'> => ({
  title: task.title,
  description: task.description ?? undefined,
  status: fromTaskStatus(task.status),
  priority: (task.priority as TodoItem['priority']) ?? 'medium',
  estimatedTime: task.estimated_time ?? undefined,
  actualTime: task.actual_time ?? undefined,
  dueDate: task.due_date ? new Date(task.due_date) : undefined,
  tags: task.tags ?? [],
  categoryId: task.category ?? undefined,
  category: task.category ?? undefined,
  projectId: task.project_id ?? undefined,
  parentId: task.parent_id ?? undefined,
  completed: task.completed_at ? true : task.status === 'done',
  completedAt: task.completed_at ? new Date(task.completed_at) : undefined,
  deleted: task.deleted ?? false,
  deletedAt: task.deleted_at ? new Date(task.deleted_at) : undefined,
  notes: task.notes ?? undefined,
  archived: task.archived ?? undefined,
  starred: task.starred ?? undefined,
});

const mapTaskUpdateToTodoUpdate = (updates: Partial<TaskData>): Partial<TodoItem> => {
  const partial: Partial<TodoItem> = {};

  if (updates.title !== undefined) partial.title = updates.title;
  if (updates.description !== undefined) partial.description = updates.description ?? undefined;
  if (updates.status !== undefined) partial.status = fromTaskStatus(updates.status);
  if (updates.priority !== undefined) partial.priority = updates.priority as TodoItem['priority'];
  if (updates.estimated_time !== undefined) partial.estimatedTime = updates.estimated_time ?? undefined;
  if (updates.actual_time !== undefined) partial.actualTime = updates.actual_time ?? undefined;
  if (updates.due_date !== undefined) partial.dueDate = updates.due_date ? new Date(updates.due_date) : undefined;
  if (updates.tags !== undefined) partial.tags = updates.tags ?? [];
  if (updates.category !== undefined) partial.categoryId = updates.category ?? undefined;
  if (updates.category !== undefined) partial.category = updates.category ?? undefined;
  if (updates.project_id !== undefined) partial.projectId = updates.project_id ?? undefined;
  if (updates.parent_id !== undefined) partial.parentId = updates.parent_id ?? undefined;
  if (updates.deleted !== undefined) partial.deleted = updates.deleted;
  if (updates.deleted_at !== undefined) partial.deletedAt = updates.deleted_at ? new Date(updates.deleted_at) : undefined;
  if (updates.completed_at !== undefined) {
    partial.completed = Boolean(updates.completed_at);
    partial.completedAt = updates.completed_at ? new Date(updates.completed_at) : undefined;
  }

  return partial;
};

const mapProjectToProjectData = (project: StoreProject): ProjectData => ({
  id: project.id,
  name: project.name,
  description: project.description,
  color: project.color,
  status: project.status as ProjectData['status'],
  icon: project.icon,
  created_at: project.createdAt?.toISOString(),
  updated_at: project.updatedAt?.toISOString(),
});

export const useApiTasks = (): UseApiTasksReturn => {
  const {
    tasks: storeTasks,
    projects: storeProjects,
    tasksLoading,
    projectsLoading,
    addTodo,
    updateTodo,
    deleteTodo,
    restoreTodo,
    permanentlyDeleteTodo,
    addProject: addProjectToStore,
    updateProject: updateProjectInStore,
    deleteProject: deleteProjectFromStore,
  } = useAppStore();

  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const tasks = useMemo((): TaskData[] => {
    if (!storeTasks || !Array.isArray(storeTasks)) return [];
    try {
      return storeTasks.map(mapTodoToTaskData);
    } catch {
      return [];
    }
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
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      await addTodo(mapTaskInsertToTodo(taskData));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      throw new Error(message);
    }
  }, [addTodo]);

  const updateTask = useCallback(async (id: string, updates: Partial<TaskData>): Promise<void> => {
    setError(null);
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      await updateTodo(id, mapTaskUpdateToTodoUpdate(updates));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      throw new Error(message);
    }
  }, [updateTodo]);

  const deleteTask = useCallback(async (id: string): Promise<void> => {
    setError(null);
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      await deleteTodo(id);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      throw new Error(message);
    }
  }, [deleteTodo]);

  const restoreTask = useCallback(async (id: string): Promise<void> => {
    setError(null);
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      await restoreTodo(id);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      throw new Error(message);
    }
  }, [restoreTodo]);

  const permanentlyDeleteTask = useCallback(async (id: string): Promise<void> => {
    setError(null);
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      await permanentlyDeleteTodo(id);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      throw new Error(message);
    }
  }, [permanentlyDeleteTodo]);

  const createProject = useCallback(async (projectData: Omit<ProjectData, 'id' | 'created_at' | 'updated_at'>): Promise<void> => {
    setError(null);
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      await addProjectToStore({
        name: projectData.name,
        description: projectData.description ?? undefined,
        color: projectData.color ?? '#6366f1',
        status: (projectData.status as StoreProject['status']) ?? 'active',
        icon: projectData.icon ?? '📁',
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
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      await updateProjectInStore(id, {
        name: updates.name,
        description: updates.description ?? undefined,
        color: updates.color ?? undefined,
        status: updates.status,
        icon: updates.icon ?? undefined,
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
      useAppStore.getState().initializeData();
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
