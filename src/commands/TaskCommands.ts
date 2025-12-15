/**
 * Task Commands - Reversible task operations
 *
 * Implements Command Pattern for task create, update, delete operations.
 */

import type { Command } from '../contexts/UndoRedoContext';
import type { Task } from '../lib/supabase';
import { createTask, updateTask, deleteTask } from '../api/tasksAPI';
import { logger } from '../services/logger';
import { queryClient } from '../lib/react-query';

/**
 * Create Task Command
 */
export class CreateTaskCommand implements Command {
  id: string;
  description: string;
  timestamp: number;
  private taskData: Omit<Task, 'id' | 'created_at' | 'updated_at'>;
  private createdTaskId: string | null = null;

  constructor(taskData: Omit<Task, 'id' | 'created_at' | 'updated_at'>) {
    this.id = `create-task-${Date.now()}`;
    this.description = `Create task: ${taskData.title}`;
    this.timestamp = Date.now();
    this.taskData = taskData;
  }

  async execute(): Promise<void> {
    logger.debug('Tasks', '[CreateTaskCommand] Executing', { title: this.taskData.title });
    const created = await createTask(this.taskData);
    this.createdTaskId = created.id as string;
    await queryClient.invalidateQueries({ queryKey: ['tasks'] });
  }

  async undo(): Promise<void> {
    if (!this.createdTaskId) {
      throw new Error('Cannot undo: task was not created');
    }
    logger.debug('Tasks', '[CreateTaskCommand] Undoing', { taskId: this.createdTaskId });
    await deleteTask(this.createdTaskId);
    await queryClient.invalidateQueries({ queryKey: ['tasks'] });
  }
}

/**
 * Update Task Command
 */
export class UpdateTaskCommand implements Command {
  id: string;
  description: string;
  timestamp: number;
  private taskId: string;
  private updates: Partial<Task>;
  private previousState: Partial<Task> | null = null;

  constructor(taskId: string, updates: Partial<Task>, currentTask: Task) {
    this.id = `update-task-${taskId}-${Date.now()}`;
    this.description = `Update task: ${currentTask.title}`;
    this.timestamp = Date.now();
    this.taskId = taskId;
    this.updates = updates;

    // Store previous values for undo
    this.previousState = {};
    Object.keys(updates).forEach(key => {
      this.previousState![key as keyof Task] = currentTask[key as keyof Task] as any;
    });
  }

  async execute(): Promise<void> {
    logger.debug('Tasks', '[UpdateTaskCommand] Executing', { taskId: this.taskId, updates: this.updates });
    await updateTask(this.taskId, this.updates);
    await queryClient.invalidateQueries({ queryKey: ['tasks'] });
  }

  async undo(): Promise<void> {
    if (!this.previousState) {
      throw new Error('Cannot undo: previous state not stored');
    }
    logger.debug('Tasks', '[UpdateTaskCommand] Undoing', { taskId: this.taskId, previousState: this.previousState });
    await updateTask(this.taskId, this.previousState);
    await queryClient.invalidateQueries({ queryKey: ['tasks'] });
  }
}

/**
 * Delete Task Command
 */
export class DeleteTaskCommand implements Command {
  id: string;
  description: string;
  timestamp: number;
  private task: Task;

  constructor(task: Task) {
    this.id = `delete-task-${task.id}-${Date.now()}`;
    this.description = `Delete task: ${task.title}`;
    this.timestamp = Date.now();
    this.task = { ...task };
  }

  async execute(): Promise<void> {
    logger.debug('Tasks', '[DeleteTaskCommand] Executing', { taskId: this.task.id });
    await deleteTask(this.task.id as string);
    await queryClient.invalidateQueries({ queryKey: ['tasks'] });
  }

  async undo(): Promise<void> {
    logger.debug('Tasks', '[DeleteTaskCommand] Undoing', { taskId: this.task.id });
    // Recreate the task with the same data (except timestamps)
    const { id, created_at, updated_at, ...taskData } = this.task;
    await createTask(taskData);
    await queryClient.invalidateQueries({ queryKey: ['tasks'] });
  }
}

/**
 * Move Task to Calendar Command (drag and drop)
 */
export class MoveTaskCommand implements Command {
  id: string;
  description: string;
  timestamp: number;
  private taskId: string;
  private newDate: string | null;
  private previousDate: string | null;
  private taskTitle: string;

  constructor(taskId: string, taskTitle: string, newDate: string | null, previousDate: string | null) {
    this.id = `move-task-${taskId}-${Date.now()}`;
    this.description = newDate
      ? `Schedule task: ${taskTitle} for ${newDate}`
      : `Unschedule task: ${taskTitle}`;
    this.timestamp = Date.now();
    this.taskId = taskId;
    this.newDate = newDate;
    this.previousDate = previousDate;
    this.taskTitle = taskTitle;
  }

  async execute(): Promise<void> {
    logger.debug('Tasks', '[MoveTaskCommand] Executing', { taskId: this.taskId, newDate: this.newDate });
    await updateTask(this.taskId, { due_date: this.newDate });
    // Invalidate React Query cache to refresh UI
    await queryClient.invalidateQueries({ queryKey: ['tasks'] });
  }

  async undo(): Promise<void> {
    logger.debug('Tasks', '[MoveTaskCommand] Undoing', { taskId: this.taskId, previousDate: this.previousDate });
    await updateTask(this.taskId, { due_date: this.previousDate });
    // Invalidate React Query cache to refresh UI
    await queryClient.invalidateQueries({ queryKey: ['tasks'] });
  }
}

/**
 * Change Task Category Command (drag between sections)
 */
export class ChangeTaskCategoryCommand implements Command {
  id: string;
  description: string;
  timestamp: number;
  private taskId: string;
  private newStatus: Task['status'];
  private newPriority: Task['priority'];
  private newDueDate: string | null;
  private newSidebarSection: Task['sidebar_section'];
  private previousStatus: Task['status'];
  private previousPriority: Task['priority'];
  private previousDueDate: string | null;
  private previousSidebarSection: Task['sidebar_section'];
  private taskTitle: string;

  constructor(
    taskId: string,
    taskTitle: string,
    updates: {
      status?: Task['status'];
      priority?: Task['priority'];
      due_date?: string | null;
      sidebar_section?: Task['sidebar_section'];
    },
    currentTask: Task
  ) {
    this.id = `change-category-${taskId}-${Date.now()}`;
    this.description = `Move task: ${taskTitle}`;
    this.timestamp = Date.now();
    this.taskId = taskId;
    this.taskTitle = taskTitle;

    this.newStatus = updates.status ?? currentTask.status;
    this.newPriority = updates.priority ?? currentTask.priority;
    this.newDueDate = updates.due_date !== undefined ? updates.due_date : (currentTask.due_date ?? null);
    this.newSidebarSection = updates.sidebar_section ?? currentTask.sidebar_section ?? null;

    this.previousStatus = currentTask.status;
    this.previousPriority = currentTask.priority;
    this.previousDueDate = currentTask.due_date ?? null;
    this.previousSidebarSection = currentTask.sidebar_section ?? null;
  }

  async execute(): Promise<void> {
    logger.debug('Tasks', '[ChangeTaskCategoryCommand] Executing', { taskId: this.taskId });
    await updateTask(this.taskId, {
      status: this.newStatus,
      priority: this.newPriority,
      due_date: this.newDueDate,
      sidebar_section: this.newSidebarSection,
    });
    // Invalidate React Query cache to refresh UI
    await queryClient.invalidateQueries({ queryKey: ['tasks'] });
  }

  async undo(): Promise<void> {
    logger.debug('Tasks', '[ChangeTaskCategoryCommand] Undoing', { taskId: this.taskId });
    await updateTask(this.taskId, {
      status: this.previousStatus,
      priority: this.previousPriority,
      due_date: this.previousDueDate,
      sidebar_section: this.previousSidebarSection,
    });
    // Invalidate React Query cache to refresh UI
    await queryClient.invalidateQueries({ queryKey: ['tasks'] });
  }
}
