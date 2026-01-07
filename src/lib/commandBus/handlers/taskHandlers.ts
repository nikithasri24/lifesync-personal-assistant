/**
 * Task Command Handlers
 *
 * Handles all task-related commands through the command bus.
 * Uses the API layer for data access.
 */

import * as tasksAPI from '@/api/tasksAPI';
import { logger } from '@/services/logger';
import { addMinutes, format, parseISO } from 'date-fns';
import type {
  CommandResult,
  CreateTaskCommand,
  UpdateTaskCommand,
  DeleteTaskCommand,
  CompleteTaskCommand,
  ScheduleTaskCommand,
} from '../types';

/**
 * Handle CREATE_TASK command
 */
export async function handleCreateTask(command: CreateTaskCommand): Promise<CommandResult> {
  const { payload } = command;

  try {
    // Validate category is one of the allowed values
    const validCategories = ['work', 'personal', 'learning', 'creative', 'health', 'other'] as const;
    const category = payload.category && validCategories.includes(payload.category as typeof validCategories[number])
      ? payload.category as typeof validCategories[number]
      : undefined;

    const data = await tasksAPI.createTask({
      title: payload.title,
      description: payload.description,
      priority: payload.priority || 'medium',
      due_date: payload.dueDate,
      estimated_time: payload.estimatedTime,
      category,
      tags: payload.tags,
      depends_on: payload.depends_on,
      status: 'todo',
      deleted: false,
      archived: false,
    });

    return {
      success: true,
      data,
      message: `Task "${payload.title}" created`,
    };
  } catch (error) {
    logger.error('TaskHandlers', 'Failed to create task', { error });
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Handle UPDATE_TASK command
 */
export async function handleUpdateTask(command: UpdateTaskCommand): Promise<CommandResult> {
  const { payload } = command;

  try {
    // Map camelCase to snake_case for API layer
    const updates: Record<string, unknown> = {};
    if (payload.updates.title !== undefined) updates.title = payload.updates.title;
    if (payload.updates.description !== undefined) updates.description = payload.updates.description;
    if (payload.updates.priority !== undefined) updates.priority = payload.updates.priority;
    if (payload.updates.status !== undefined) updates.status = payload.updates.status;
    if (payload.updates.dueDate !== undefined) updates.due_date = payload.updates.dueDate;
    if (payload.updates.scheduledStart !== undefined) updates.scheduled_start = payload.updates.scheduledStart;
    if (payload.updates.scheduledEnd !== undefined) updates.scheduled_end = payload.updates.scheduledEnd;
    if (payload.updates.estimatedTime !== undefined) updates.estimated_time = payload.updates.estimatedTime;
    if (payload.updates.category !== undefined) updates.category = payload.updates.category;
    if (payload.updates.tags !== undefined) updates.tags = payload.updates.tags;
    if (payload.updates.depends_on !== undefined) updates.depends_on = payload.updates.depends_on;

    const data = await tasksAPI.updateTask(payload.id, updates);

    return {
      success: true,
      data,
      message: 'Task updated',
    };
  } catch (error) {
    logger.error('TaskHandlers', 'Failed to update task', { error });
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Handle DELETE_TASK command (soft delete)
 */
export async function handleDeleteTask(command: DeleteTaskCommand): Promise<CommandResult> {
  const { payload } = command;

  try {
    await tasksAPI.deleteTask(payload.id);

    return {
      success: true,
      message: 'Task deleted',
    };
  } catch (error) {
    logger.error('TaskHandlers', 'Failed to delete task', { error });
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Handle COMPLETE_TASK command
 */
export async function handleCompleteTask(command: CompleteTaskCommand): Promise<CommandResult> {
  const { payload } = command;

  try {
    const data = await tasksAPI.updateTask(payload.id, { status: 'done' });

    return {
      success: true,
      data,
      message: 'Task completed',
    };
  } catch (error) {
    logger.error('TaskHandlers', 'Failed to complete task', { error });
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Handle SCHEDULE_TASK command
 */
export async function handleScheduleTask(command: ScheduleTaskCommand): Promise<CommandResult> {
  const { payload } = command;

  try {
    const scheduledStartDate = parseISO(payload.scheduledStart);
    const scheduledEndDate = payload.scheduledEnd ? parseISO(payload.scheduledEnd) : addMinutes(scheduledStartDate, 30);
    const scheduledStart = scheduledStartDate.toISOString();
    const scheduledEnd = scheduledEndDate.toISOString();
    const dueDate = format(scheduledStartDate, 'yyyy-MM-dd');
    const data = await tasksAPI.updateTask(payload.id, {
      due_date: dueDate,
      scheduled_start: scheduledStart,
      scheduled_end: scheduledEnd,
      status: 'scheduled',
    });

    return {
      success: true,
      data,
      message: `Task scheduled for ${dueDate}`,
    };
  } catch (error) {
    logger.error('TaskHandlers', 'Failed to schedule task', { error });
    return { success: false, error: (error as Error).message };
  }
}

/**
 * All task handlers mapped by command type
 */
export const taskHandlers = {
  CREATE_TASK: handleCreateTask,
  UPDATE_TASK: handleUpdateTask,
  DELETE_TASK: handleDeleteTask,
  COMPLETE_TASK: handleCompleteTask,
  SCHEDULE_TASK: handleScheduleTask,
};
