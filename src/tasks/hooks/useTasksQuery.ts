/**
 * Tasks React Query Hooks
 *
 * Comprehensive hooks for Tasks domain with optimistic updates,
 * soft delete, and restore functionality.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { TaskData } from '@/services/types';
import { logger } from '@/services/logger';
import {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  restoreTask,
  permanentlyDeleteTask,
} from '@/api/tasksAPI';

// ==================== Types ====================

export interface Task {
  id: string;
  title: string;
  description?: string;
  projectId?: string;
  status: 'todo' | 'done' | 'waiting' | 'scheduled' | 'in_progress';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimatedTime?: number;
  actualTime?: number;
  dueDate?: Date;
  tags: string[];
  category?: 'work' | 'personal' | 'learning' | 'creative' | 'health' | 'other';
  notes?: string;
  starred: boolean;
  archived: boolean;
  deleted: boolean;
  parentId?: string;
  position?: number;
  deletedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt?: Date;
}

export type TaskInput = Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'deleted' | 'deletedAt' | 'archived' | 'starred'>;
export type TaskUpdate = Partial<Omit<Task, 'id' | 'createdAt' | 'updatedAt'>>;

export interface TaskFilters {
  status?: Task['status'];
  priority?: Task['priority'];
  category?: Task['category'];
  projectId?: string;
  parentId?: string;
  starred?: boolean;
  archived?: boolean;
  deleted?: boolean;
  tags?: string[];
}

export interface TaskAnalytics {
  total: number;
  byStatus: {
    todo: number;
    in_progress: number;
    done: number;
    waiting: number;
    scheduled: number;
  };
  byPriority: {
    low: number;
    medium: number;
    high: number;
    urgent: number;
  };
  starred: number;
  overdue: number;
  completedToday: number;
  completedThisWeek: number;
  totalEstimatedTime: number;
  totalActualTime: number;
  averageCompletionTime: number;
}

// ==================== Query Keys ====================

export const tasksKeys = {
  all: ['tasks'] as const,
  lists: () => [...tasksKeys.all, 'list'] as const,
  list: (filters?: TaskFilters) => [...tasksKeys.lists(), { filters }] as const,
  details: () => [...tasksKeys.all, 'detail'] as const,
  detail: (id: string) => [...tasksKeys.details(), id] as const,
  analytics: () => [...tasksKeys.all, 'analytics'] as const,
};

// ==================== Mappers ====================

const toDate = (value?: string | Date | null): Date | undefined => {
  if (!value) return undefined;
  if (value instanceof Date) return value;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

const sanitize = <T extends Record<string, unknown>>(payload: T): T => {
  const entries = Object.entries(payload).filter(([, value]) => value !== undefined);
  return Object.fromEntries(entries) as T;
};

function mapTaskDataToTask(data: TaskData): Task {
  return {
    id: data.id ?? crypto.randomUUID(),
    title: data.title,
    description: data.description ?? undefined,
    projectId: data.project_id ?? undefined,
    status: (data.status as Task['status']) ?? 'todo',
    priority: (data.priority as Task['priority']) ?? 'medium',
    estimatedTime: data.estimated_time ?? undefined,
    actualTime: data.actual_time ?? undefined,
    dueDate: toDate(data.due_date),
    tags: data.tags ?? [],
    category: (data.category as Task['category']) ?? undefined,
    notes: data.notes ?? undefined,
    starred: data.starred ?? false,
    archived: data.archived ?? false,
    deleted: data.deleted ?? false,
    parentId: data.parent_id ?? undefined,
    position: data.position ?? undefined,
    deletedAt: toDate(data.deleted_at),
    completedAt: toDate(data.completed_at),
    createdAt: toDate(data.created_at) ?? new Date(),
    updatedAt: toDate(data.updated_at),
  };
}

function buildTaskInsertPayload(
  input: Partial<TaskInput>
): Omit<TaskData, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'deleted' | 'deleted_at'> {
  return sanitize({
    title: input.title ?? 'Untitled Task',
    description: input.description ?? undefined,
    project_id: input.projectId ?? null,
    status: input.status ?? 'todo',
    priority: input.priority ?? 'medium',
    estimated_time: input.estimatedTime ?? null,
    actual_time: input.actualTime ?? null,
    due_date: input.dueDate ? input.dueDate.toISOString() : null,
    tags: input.tags ?? [],
    category: input.category ?? null,
    notes: input.notes ?? null,
    starred: false,
    archived: false,
    parent_id: input.parentId ?? null,
    position: input.position ?? null,
    completed_at: input.status === 'done' && input.completedAt
      ? input.completedAt.toISOString()
      : null,
  });
}

function buildTaskUpdatePayload(updates: TaskUpdate): Partial<TaskData> {
  return sanitize({
    title: updates.title,
    description: updates.description,
    project_id: updates.projectId,
    status: updates.status,
    priority: updates.priority,
    estimated_time: updates.estimatedTime,
    actual_time: updates.actualTime,
    due_date: updates.dueDate ? updates.dueDate.toISOString() : undefined,
    tags: updates.tags,
    category: updates.category,
    notes: updates.notes,
    starred: updates.starred,
    archived: updates.archived,
    parent_id: updates.parentId,
    position: updates.position,
    completed_at: updates.completedAt ? updates.completedAt.toISOString() : undefined,
    deleted: updates.deleted,
    deleted_at: updates.deletedAt ? updates.deletedAt.toISOString() : undefined,
  });
}

// ==================== Queries ====================

/**
 * Fetch all tasks with optional filters
 */
export function useTasksQuery(filters?: TaskFilters): ReturnType<typeof useQuery<Task[]>> {
  return useQuery({
    queryKey: tasksKeys.list(filters),
    queryFn: async () => {
      const data = await getTasks(filters);
      return data.map(mapTaskDataToTask);
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Fetch a single task by ID
 */
export function useTaskQuery(taskId: string | undefined): ReturnType<typeof useQuery<Task>> {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: tasksKeys.detail(taskId ?? ''),
    queryFn: async () => {
      // Try to get from cache first
      const cachedTasks = queryClient.getQueryData<Task[]>(tasksKeys.list());
      if (cachedTasks) {
        const cached = cachedTasks.find(t => t.id === taskId);
        if (cached) return cached;
      }

      // Fetch from API
      if (!taskId) throw new Error('Task ID is required');
      const data = await getTask(taskId);
      return mapTaskDataToTask(data);
    },
    enabled: !!taskId,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Get task analytics
 */
export function useTaskAnalyticsQuery(): ReturnType<typeof useQuery<TaskAnalytics>> {
  const { data: tasks = [] } = useTasksQuery({ deleted: false });

  return useQuery({
    queryKey: tasksKeys.analytics(),
    queryFn: () => {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());

      const completedTasks = tasks.filter(t => t.completedAt);
      const completionTimes = completedTasks
        .filter(t => t.actualTime)
        .map(t => t.actualTime!);

      return {
        total: tasks.length,
        byStatus: {
          todo: tasks.filter(t => t.status === 'todo').length,
          in_progress: tasks.filter(t => t.status === 'in_progress').length,
          done: tasks.filter(t => t.status === 'done').length,
          waiting: tasks.filter(t => t.status === 'waiting').length,
          scheduled: tasks.filter(t => t.status === 'scheduled').length,
        },
        byPriority: {
          low: tasks.filter(t => t.priority === 'low').length,
          medium: tasks.filter(t => t.priority === 'medium').length,
          high: tasks.filter(t => t.priority === 'high').length,
          urgent: tasks.filter(t => t.priority === 'urgent').length,
        },
        starred: tasks.filter(t => t.starred).length,
        overdue: tasks.filter(t => t.dueDate && t.dueDate < now && t.status !== 'done').length,
        completedToday: completedTasks.filter(t => t.completedAt! >= today).length,
        completedThisWeek: completedTasks.filter(t => t.completedAt! >= weekStart).length,
        totalEstimatedTime: tasks.reduce((sum, t) => sum + (t.estimatedTime ?? 0), 0),
        totalActualTime: tasks.reduce((sum, t) => sum + (t.actualTime ?? 0), 0),
        averageCompletionTime: completionTimes.length > 0
          ? completionTimes.reduce((sum, t) => sum + t, 0) / completionTimes.length
          : 0,
      };
    },
    enabled: tasks.length > 0,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

// ==================== Mutations ====================

/**
 * Create a new task with optimistic updates
 */
export function useCreateTaskMutation(): ReturnType<typeof useMutation<Task, Error, Partial<TaskInput>, { previousTasks?: Task[] }>> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: Partial<TaskInput>) => {
      logger.debug('Tasks', 'Creating task', { title: input.title });
      const payload = buildTaskInsertPayload(input);
      const created = await createTask(payload);
      return mapTaskDataToTask(created);
    },
    onMutate: async (input) => {
      logger.debug('Tasks', 'Optimistic update: create task', { title: input.title });
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: tasksKeys.lists() });

      // Snapshot previous value
      const previousTasks = queryClient.getQueryData<Task[]>(tasksKeys.list());

      // Optimistically add new task
      const optimisticTask: Task = {
        id: `temp-${Date.now()}`,
        title: input.title ?? 'Untitled Task',
        description: input.description,
        projectId: input.projectId,
        status: input.status ?? 'todo',
        priority: input.priority ?? 'medium',
        estimatedTime: input.estimatedTime,
        actualTime: input.actualTime,
        dueDate: input.dueDate,
        tags: input.tags ?? [],
        category: input.category,
        notes: input.notes,
        starred: false,
        archived: false,
        deleted: false,
        parentId: input.parentId,
        position: input.position,
        completedAt: input.completedAt,
        createdAt: new Date(),
      };

      queryClient.setQueryData<Task[]>(tasksKeys.list(), (old) => {
        if (!old) return [optimisticTask];
        return [optimisticTask, ...old];
      });

      return { previousTasks };
    },
    onError: (err: Error, input, context) => {
      logger.error('Tasks', 'Failed to create task', { error: err.message, title: input.title });
      // Rollback on error
      if (context?.previousTasks) {
        queryClient.setQueryData(tasksKeys.list(), context.previousTasks);
      }
    },
    onSuccess: (newTask) => {
      logger.info('Tasks', 'Task created successfully', { id: newTask.id, title: newTask.title });
      // Replace temp task with real one
      queryClient.setQueryData<Task[]>(tasksKeys.list(), (old) => {
        if (!old) return [newTask];
        return old.map((t) => (t.id.startsWith('temp-') ? newTask : t));
      });
      // Invalidate analytics
      void queryClient.invalidateQueries({ queryKey: tasksKeys.analytics() });
    },
  });
}

/**
 * Update an existing task
 */
export function useUpdateTaskMutation(): ReturnType<typeof useMutation<Task, Error, { taskId: string; updates: TaskUpdate }, { previousTasks?: Task[] }>> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, updates }: { taskId: string; updates: TaskUpdate }) => {
      logger.debug('Tasks', 'Updating task', { taskId, updates });
      const payload = buildTaskUpdatePayload(updates);
      const updated = await updateTask(taskId, payload);
      return mapTaskDataToTask(updated);
    },
    onMutate: async ({ taskId, updates }) => {
      logger.debug('Tasks', 'Optimistic update: task', { taskId, updates });
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: tasksKeys.lists() });

      // Snapshot previous value
      const previousTasks = queryClient.getQueryData<Task[]>(tasksKeys.list());

      // Optimistically update
      queryClient.setQueryData<Task[]>(tasksKeys.list(), (old) => {
        if (!old) return [];
        return old.map((t) =>
          t.id === taskId
            ? { ...t, ...updates, updatedAt: new Date() }
            : t
        );
      });

      return { previousTasks };
    },
    onError: (err: Error, { taskId }, context) => {
      logger.error('Tasks', 'Failed to update task', { error: err.message, taskId });
      // Rollback on error
      if (context?.previousTasks) {
        queryClient.setQueryData(tasksKeys.list(), context.previousTasks);
      }
    },
    onSuccess: (updatedTask) => {
      logger.info('Tasks', 'Task updated successfully', { id: updatedTask.id, title: updatedTask.title });
      // Update with server response
      queryClient.setQueryData<Task[]>(tasksKeys.list(), (old) => {
        if (!old) return [updatedTask];
        return old.map((t) => (t.id === updatedTask.id ? updatedTask : t));
      });
      // Invalidate analytics
      void queryClient.invalidateQueries({ queryKey: tasksKeys.analytics() });
    },
  });
}

/**
 * Soft delete a task (mark as deleted)
 */
export function useDeleteTaskMutation(): ReturnType<typeof useMutation<string, Error, string, { previousTasks?: Task[] }>> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskId: string) => {
      logger.debug('Tasks', 'Soft deleting task', { taskId });
      await deleteTask(taskId);
      return taskId;
    },
    onMutate: async (taskId) => {
      logger.debug('Tasks', 'Optimistic update: soft delete task', { taskId });
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: tasksKeys.lists() });

      // Snapshot previous value
      const previousTasks = queryClient.getQueryData<Task[]>(tasksKeys.list());

      // Optimistically mark as deleted
      queryClient.setQueryData<Task[]>(tasksKeys.list(), (old) => {
        if (!old) return [];
        return old.map((t) =>
          t.id === taskId
            ? { ...t, deleted: true, deletedAt: new Date() }
            : t
        );
      });

      return { previousTasks };
    },
    onError: (err: Error, taskId, context) => {
      logger.error('Tasks', 'Failed to delete task', { error: err.message, taskId });
      // Rollback on error
      if (context?.previousTasks) {
        queryClient.setQueryData(tasksKeys.list(), context.previousTasks);
      }
    },
    onSuccess: (taskId) => {
      logger.info('Tasks', 'Task deleted successfully', { id: taskId });
      // Invalidate to ensure consistency
      void queryClient.invalidateQueries({ queryKey: tasksKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: tasksKeys.analytics() });
    },
  });
}

/**
 * Restore a deleted task
 */
export function useRestoreTaskMutation(): ReturnType<typeof useMutation<Task, Error, string, { previousTasks?: Task[] }>> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskId: string) => {
      logger.debug('Tasks', 'Restoring task', { taskId });
      const restored = await restoreTask(taskId);
      return mapTaskDataToTask(restored);
    },
    onMutate: async (taskId) => {
      logger.debug('Tasks', 'Optimistic update: restore task', { taskId });
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: tasksKeys.lists() });

      // Snapshot previous value
      const previousTasks = queryClient.getQueryData<Task[]>(tasksKeys.list());

      // Optimistically restore
      queryClient.setQueryData<Task[]>(tasksKeys.list(), (old) => {
        if (!old) return [];
        return old.map((t) =>
          t.id === taskId
            ? { ...t, deleted: false, deletedAt: undefined }
            : t
        );
      });

      return { previousTasks };
    },
    onError: (err: Error, taskId, context) => {
      logger.error('Tasks', 'Failed to restore task', { error: err.message, taskId });
      // Rollback on error
      if (context?.previousTasks) {
        queryClient.setQueryData(tasksKeys.list(), context.previousTasks);
      }
    },
    onSuccess: (restoredTask) => {
      logger.info('Tasks', 'Task restored successfully', { id: restoredTask.id });
      // Update with server response
      queryClient.setQueryData<Task[]>(tasksKeys.list(), (old) => {
        if (!old) return [restoredTask];
        return old.map((t) => (t.id === restoredTask.id ? restoredTask : t));
      });
      // Invalidate analytics
      void queryClient.invalidateQueries({ queryKey: tasksKeys.analytics() });
    },
  });
}

/**
 * Permanently delete a task (hard delete)
 */
export function usePermanentlyDeleteTaskMutation(): ReturnType<typeof useMutation<string, Error, string, { previousTasks?: Task[] }>> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskId: string) => {
      logger.debug('Tasks', 'Permanently deleting task', { taskId });
      await permanentlyDeleteTask(taskId);
      return taskId;
    },
    onMutate: async (taskId) => {
      logger.debug('Tasks', 'Optimistic update: permanently delete task', { taskId });
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: tasksKeys.lists() });

      // Snapshot previous value
      const previousTasks = queryClient.getQueryData<Task[]>(tasksKeys.list());

      // Optimistically remove
      queryClient.setQueryData<Task[]>(tasksKeys.list(), (old) => {
        if (!old) return [];
        return old.filter((t) => t.id !== taskId);
      });

      return { previousTasks };
    },
    onError: (err: Error, taskId, context) => {
      logger.error('Tasks', 'Failed to permanently delete task', { error: err.message, taskId });
      // Rollback on error
      if (context?.previousTasks) {
        queryClient.setQueryData(tasksKeys.list(), context.previousTasks);
      }
    },
    onSuccess: (taskId) => {
      logger.info('Tasks', 'Task permanently deleted successfully', { id: taskId });
      // Invalidate to ensure consistency
      void queryClient.invalidateQueries({ queryKey: tasksKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: tasksKeys.analytics() });
    },
  });
}

// ==================== Helper Hooks ====================

/**
 * Get tasks filtered by status
 */
export function useTasksByStatus(status: Task['status']): { data: Task[] } & Omit<ReturnType<typeof useTasksQuery>, 'data'> {
  const { data: tasks = [], ...rest } = useTasksQuery({ deleted: false });

  const filtered = tasks.filter((t) => t.status === status);

  return { data: filtered, ...rest };
}

/**
 * Get tasks filtered by priority
 */
export function useTasksByPriority(priority: Task['priority']): { data: Task[] } & Omit<ReturnType<typeof useTasksQuery>, 'data'> {
  const { data: tasks = [], ...rest } = useTasksQuery({ deleted: false });

  const filtered = tasks.filter((t) => t.priority === priority);

  return { data: filtered, ...rest };
}

/**
 * Get starred tasks
 */
export function useStarredTasks(): { data: Task[] } & Omit<ReturnType<typeof useTasksQuery>, 'data'> {
  const { data: tasks = [], ...rest } = useTasksQuery({ deleted: false, starred: true });

  return { data: tasks, ...rest };
}

/**
 * Get overdue tasks
 */
export function useOverdueTasks(): { data: Task[] } & Omit<ReturnType<typeof useTasksQuery>, 'data'> {
  const { data: tasks = [], ...rest } = useTasksQuery({ deleted: false });

  const now = new Date();
  const filtered = tasks.filter((t) => t.dueDate && t.dueDate < now && t.status !== 'done');

  return { data: filtered, ...rest };
}

/**
 * Get tasks by project
 */
export function useTasksByProject(projectId: string): { data: Task[] } & Omit<ReturnType<typeof useTasksQuery>, 'data'> {
  const { data: tasks = [], ...rest } = useTasksQuery({ deleted: false, projectId });

  return { data: tasks, ...rest };
}

/**
 * Get deleted tasks (trash)
 */
export function useDeletedTasks(): { data: Task[] } & Omit<ReturnType<typeof useTasksQuery>, 'data'> {
  const { data: tasks = [], ...rest } = useTasksQuery({ deleted: true });

  return { data: tasks, ...rest };
}
