/**
 * Hook for business logic actions
 * Create task, create project, toggle task status, etc.
 */

import { useCreateTaskMutation, useUpdateTaskMutation, useToggleTaskMutation } from '../../../../tasks/hooks/useTasksQuery';
import { useCreateProjectMutation } from '../../../../projects/hooks/useProjectsQuery';
import type { TodoItem } from '../../../../types';
import type { Project as StoreProject } from '../../../../projects/hooks/useProjectsQuery';
import type { TaskView, ProjectView } from '../types';
import { mapCategoryViewToId } from '../utils';
import { logger } from '../../../../services/logger';

interface UseTaskFocusActionsParams {
  onTaskComplete: (taskId: string) => void;
  storeTasks: TodoItem[];
}

export const useTaskFocusActions = ({ onTaskComplete, storeTasks }: UseTaskFocusActionsParams) => {
  const createTaskMutation = useCreateTaskMutation();
  const updateTaskMutation = useUpdateTaskMutation();
  const toggleTaskMutation = useToggleTaskMutation();
  const createProjectMutation = useCreateProjectMutation();

  // Wrapper functions to maintain API compatibility
  const addTodo = async (task: Parameters<typeof createTaskMutation.mutateAsync>[0]) => {
    return await createTaskMutation.mutateAsync(task);
  };

  const _updateTodo = async (id: string, updates: Parameters<typeof updateTaskMutation.mutateAsync>[0]['updates']) => {
    await updateTaskMutation.mutateAsync({ taskId: id, updates });
  };

  const toggleTodo = async (id: string) => {
    await toggleTaskMutation.mutateAsync(id);
  };

  const addProject = async (project: Parameters<typeof createProjectMutation.mutateAsync>[0]) => {
    return await createProjectMutation.mutateAsync(project);
  };

  const createTask = async (newTask: Partial<TaskView>) => {
    if (!newTask.title) {
      return;
    }

    try {
      await addTodo({
        title: newTask.title,
        description: newTask.description,
        status: 'todo',
        priority: newTask.priority ?? 'medium',
        categoryId: mapCategoryViewToId(newTask.category),
        dueDate: newTask.dueDate,
        tags: newTask.tags ?? [],
        notes: newTask.notes,
        projectId: newTask.projectId || undefined,
        estimatedTime: newTask.estimatedTime ?? 0,
        actualTime: 0,
        completed: false,
        archived: false,
        starred: false,
        subtasks: [],
      } as Omit<TodoItem, 'id' | 'createdAt' | 'updatedAt'>);
    } catch (error) {
      logger.error('Error creating task:', { error });
      throw error;
    }
  };

  const createProject = async (newProject: Partial<ProjectView>) => {
    if (!newProject.name) {
      return;
    }

    try {
      await addProject({
        name: newProject.name,
        description: newProject.description,
        color: newProject.color || '#6366f1',
        status: (newProject.status as ProjectView['status']) || 'active',
        icon: newProject.icon || '📁',
      } as Omit<StoreProject, 'id' | 'createdAt' | 'updatedAt'>);
    } catch (error) {
      logger.error('Error creating project:', { error });
      throw error;
    }
  };

  const toggleTaskStatus = async (taskId: string) => {
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
      logger.error('Error updating task status:', { error });
      throw error;
    }
  };

  const addSubtask = (taskId: string, subtaskTitle: string) => {
    logger.warn('Subtask creation is not yet integrated with the backend', { taskId, subtaskTitle });
  };

  const toggleSubtask = (taskId: string, subtaskId: string) => {
    logger.warn('Subtask updates are not yet integrated with the backend', { taskId, subtaskId });
  };

  return {
    createTask,
    createProject,
    toggleTaskStatus,
    addSubtask,
    toggleSubtask
  };
};
