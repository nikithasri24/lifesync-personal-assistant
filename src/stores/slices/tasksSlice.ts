/**
 * Tasks Zustand Slice
 *
 * MIGRATION STATUS: React Query hooks available
 * - New React Query hooks: /src/tasks/hooks/useTasksQuery.ts
 * - Recommended: Use React Query hooks for new features
 * - This slice is maintained for backward compatibility
 *
 * Migration Guide:
 * - Replace `loadTasks()` with `useTasksQuery()`
 * - Replace `addTask()` with `useCreateTaskMutation()`
 * - Replace `updateTask()` with `useUpdateTaskMutation()`
 * - Replace `softDeleteTask()` with `useDeleteTaskMutation()`
 * - Replace `restoreTask()` with `useRestoreTaskMutation()`
 * - Replace `hardDeleteTask()` with `usePermanentlyDeleteTaskMutation()`
 *
 * Benefits of React Query:
 * - Automatic caching and background refetching
 * - Optimistic updates with automatic rollback on error
 * - Better loading and error states
 * - Automatic request deduplication
 */

import type { StateCreator } from 'zustand';
import type { TaskData } from '@/services/types';
import {
  createTask,
  deleteTask,
  getTask,
  getTasks,
  permanentlyDeleteTask,
  restoreTask,
  updateTask,
} from '@/api/tasksAPI';
import { logger } from '@/services/logger';

export type TaskInput = Omit<
  TaskData,
  'id' | 'user_id' | 'deleted' | 'deleted_at' | 'created_at' | 'updated_at'
>;

export interface TasksSlice {
  tasks: TaskData[];
  tasksLoaded: boolean;
  tasksLoading: boolean;
  tasksError: string | null;

  loadTasks: (filters?: Parameters<typeof getTasks>[0]) => Promise<void>;
  addTask: (task: TaskInput) => Promise<TaskData>;
  updateTask: (id: string, updates: Partial<TaskData>) => Promise<TaskData>;
  softDeleteTask: (id: string) => Promise<void>;
  restoreTask: (id: string) => Promise<TaskData>;
  hardDeleteTask: (id: string) => Promise<void>;
  getTaskById: (id: string) => TaskData | undefined;
}

export const createTasksSlice: StateCreator<TasksSlice, [], [], TasksSlice> = (
  set,
  get
) => ({
  tasks: [],
  tasksLoaded: false,
  tasksLoading: false,
  tasksError: null,

  loadTasks: async (filters) => {
    if (get().tasksLoading) return;

    set({ tasksLoading: true, tasksError: null });
    try {
      const tasks = await getTasks(filters);
      set({ tasks, tasksLoaded: true, tasksLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load tasks';
      set({ tasksError: message, tasksLoading: false });
      logger.error('Tasks', error as Error, { context: 'loadTasks' });
      throw error;
    }
  },

  addTask: async (task) => {
    try {
      const created = await createTask(task);
      set((state) => ({ tasks: [created, ...state.tasks] }));
      return created;
    } catch (error) {
      logger.error('Tasks', error as Error, { context: 'addTask' });
      throw error;
    }
  },

  updateTask: async (id, updates) => {
    try {
      const updated = await updateTask(id, updates);
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updated } : t)),
      }));
      return updated;
    } catch (error) {
      logger.error('Tasks', error as Error, { context: 'updateTask', taskId: id });
      throw error;
    }
  },

  softDeleteTask: async (id) => {
    try {
      await deleteTask(id);
      set((state) => ({
        tasks: state.tasks.map((t) =>
          t.id === id ? { ...t, deleted: true, deleted_at: new Date().toISOString() } : t
        ),
      }));
    } catch (error) {
      logger.error('Tasks', error as Error, { context: 'softDeleteTask', taskId: id });
      throw error;
    }
  },

  restoreTask: async (id) => {
    try {
      const restored = await restoreTask(id);
      const latest = restored ?? (await getTask(id));
      set((state) => ({
        tasks: state.tasks.map((t) =>
          t.id === id ? { ...t, ...latest, deleted: false, deleted_at: null } : t
        ),
      }));
      return latest;
    } catch (error) {
      logger.error('Tasks', error as Error, { context: 'restoreTask', taskId: id });
      throw error;
    }
  },

  hardDeleteTask: async (id) => {
    try {
      await permanentlyDeleteTask(id);
      set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) }));
    } catch (error) {
      logger.error('Tasks', error as Error, { context: 'hardDeleteTask', taskId: id });
      throw error;
    }
  },

  getTaskById: (id) => get().tasks.find((t) => t.id === id),
});
