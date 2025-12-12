/**
 * Hook for business logic actions
 * Create task, create project, toggle task status, etc.
 */

import type { UseMutationResult } from '@tanstack/react-query';
import { useCreateTask, useUpdateTask } from '../../../../hooks/useTasksQuery';
import { useCreateProject } from '../../../../hooks/useTasksQuery';
import type { TodoItem } from '../../../../types';
import type { TaskView, ProjectView } from '../types';
import { mapCategoryViewToId } from '../utils';
import { logger } from '../../../../services/logger';
import type { TaskData, ProjectData } from '../../../../services/types';

interface UseTaskFocusActionsParams {
  onTaskComplete: (taskId: string) => void;
  storeTasks: TodoItem[];
}

interface UseTaskFocusActionsReturn {
  createTask: (newTask: Partial<TaskView>) => Promise<void>;
  createProject: (newProject: Partial<ProjectView>) => Promise<void>;
  toggleTaskStatus: (taskId: string) => Promise<void>;
  addSubtask: (taskId: string, subtaskTitle: string) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
}

export const useTaskFocusActions = ({ onTaskComplete, storeTasks }: UseTaskFocusActionsParams): UseTaskFocusActionsReturn => {
  const createTaskMutation: UseMutationResult<TaskData, Error, Omit<TaskData, 'id' | 'created_at' | 'updated_at'>, unknown> = useCreateTask();
  const updateTaskMutation: UseMutationResult<TaskData, Error, { id: string; updates: Partial<TaskData> }, unknown> = useUpdateTask();
  const createProjectMutation: UseMutationResult<ProjectData, Error, Omit<ProjectData, 'id' | 'created_at' | 'updated_at'>, unknown> = useCreateProject();

  // Wrapper functions to maintain API compatibility
  const addTodo = async (task: Omit<TaskData, 'id' | 'created_at' | 'updated_at'>): Promise<TaskData> => {
    return await createTaskMutation.mutateAsync(task);
  };

  const _updateTodo = async (id: string, updates: Partial<TaskData>): Promise<void> => {
    await updateTaskMutation.mutateAsync({ id, updates });
  };

  const toggleTodo = async (id: string): Promise<void> => {
    const task = storeTasks.find(t => t.id === id);
    if (!task) return;

    const newStatus: TaskData['status'] = task.status === 'done' ? 'todo' : 'done';
    await updateTaskMutation.mutateAsync({
      id,
      updates: {
        status: newStatus,
        completed: newStatus === 'done',
        completed_at: newStatus === 'done' ? new Date().toISOString() : undefined
      }
    });
  };

  const addProject = async (project: Omit<ProjectData, 'id' | 'created_at' | 'updated_at'>): Promise<ProjectData> => {
    return await createProjectMutation.mutateAsync(project);
  };

  const createTask = async (newTask: Partial<TaskView>): Promise<void> => {
    if (!newTask.title) {
      return;
    }

    try {
      await addTodo({
        title: newTask.title,
        description: newTask.description,
        status: 'todo',
        priority: newTask.priority ?? 'medium',
        category: mapCategoryViewToId(newTask.category),
        due_date: newTask.dueDate,
        tags: newTask.tags ?? [],
        notes: newTask.notes,
        project_id: newTask.projectId ?? undefined,
        estimated_time: newTask.estimatedTime ?? 0,
        actual_time: 0,
        completed: false,
        archived: false,
        starred: false,
        subtasks: [],
      } as Omit<TaskData, 'id' | 'created_at' | 'updated_at'>);
    } catch (error) {
      logger.error('Focus', 'Error creating task:', { error });
      throw error;
    }
  };

  const createProject = async (newProject: Partial<ProjectView>): Promise<void> => {
    if (!newProject.name) {
      return;
    }

    try {
      await addProject({
        name: newProject.name,
        description: newProject.description,
        color: newProject.color ?? '#6366f1',
        status: (newProject.status as ProjectView['status']) ?? 'active',
        icon: newProject.icon ?? '📁',
      } as Omit<ProjectData, 'id' | 'created_at' | 'updated_at'>);
    } catch (error) {
      logger.error('Focus', 'Error creating project:', { error });
      throw error;
    }
  };

  const toggleTaskStatus = async (taskId: string): Promise<void> => {
    const storeTask = storeTasks.find(task => task.id === taskId);
    if (!storeTask) {
      return;
    }

    const isCompleting = storeTask.status !== 'done';

    try {
      await toggleTodo(taskId);
      if (isCompleting) {
        onTaskComplete(taskId);
      }
    } catch (error) {
      logger.error('Focus', 'Error updating task status:', { error });
      throw error;
    }
  };

  const addSubtask = (taskId: string, subtaskTitle: string): void => {
    logger.warn('Focus', 'Subtask creation is not yet integrated with the backend', { taskId, subtaskTitle });
  };

  const toggleSubtask = (taskId: string, subtaskId: string): void => {
    logger.warn('Focus', 'Subtask updates are not yet integrated with the backend', { taskId, subtaskId });
  };

  return {
    createTask,
    createProject,
    toggleTaskStatus,
    addSubtask,
    toggleSubtask
  };
};
