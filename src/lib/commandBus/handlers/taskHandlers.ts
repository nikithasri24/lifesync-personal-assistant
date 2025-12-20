/**
 * Task Command Handlers
 * 
 * Handles all task-related commands through the command bus.
 */

import { supabase } from '@/lib/supabase';
import { logger } from '@/services/logger';
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
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const { data, error } = await supabase
    .from('tasks')
    .insert({
      user_id: user.id,
      title: payload.title,
      description: payload.description,
      priority: payload.priority || 'medium',
      due_date: payload.dueDate,
      estimated_time: payload.estimatedTime,
      category: payload.category,
      tags: payload.tags,
      depends_on: payload.depends_on,
      status: 'todo',
      deleted: false,
      archived: false,
    })
    .select()
    .single();

  if (error) {
    logger.error('TaskHandlers', 'Failed to create task', { error });
    return { success: false, error: error.message };
  }

  return {
    success: true,
    data,
    message: `Task "${payload.title}" created`,
  };
}

/**
 * Handle UPDATE_TASK command
 */
export async function handleUpdateTask(command: UpdateTaskCommand): Promise<CommandResult> {
  const { payload } = command;
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  // Map camelCase to snake_case
  const updates: Record<string, unknown> = {};
  if (payload.updates.title !== undefined) updates.title = payload.updates.title;
  if (payload.updates.description !== undefined) updates.description = payload.updates.description;
  if (payload.updates.priority !== undefined) updates.priority = payload.updates.priority;
  if (payload.updates.status !== undefined) updates.status = payload.updates.status;
  if (payload.updates.dueDate !== undefined) updates.due_date = payload.updates.dueDate;
  if (payload.updates.scheduledTime !== undefined) updates.scheduled_time = payload.updates.scheduledTime;
  if (payload.updates.estimatedTime !== undefined) updates.estimated_time = payload.updates.estimatedTime;
  if (payload.updates.category !== undefined) updates.category = payload.updates.category;
  if (payload.updates.tags !== undefined) updates.tags = payload.updates.tags;
  if (payload.updates.depends_on !== undefined) updates.depends_on = payload.updates.depends_on;

  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', payload.id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    logger.error('TaskHandlers', 'Failed to update task', { error });
    return { success: false, error: error.message };
  }

  return {
    success: true,
    data,
    message: 'Task updated',
  };
}

/**
 * Handle DELETE_TASK command (soft delete)
 */
export async function handleDeleteTask(command: DeleteTaskCommand): Promise<CommandResult> {
  const { payload } = command;
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const { error } = await supabase
    .from('tasks')
    .update({ deleted: true })
    .eq('id', payload.id)
    .eq('user_id', user.id);

  if (error) {
    logger.error('TaskHandlers', 'Failed to delete task', { error });
    return { success: false, error: error.message };
  }

  return {
    success: true,
    message: 'Task deleted',
  };
}

/**
 * Handle COMPLETE_TASK command
 */
export async function handleCompleteTask(command: CompleteTaskCommand): Promise<CommandResult> {
  const { payload } = command;
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const { data, error } = await supabase
    .from('tasks')
    .update({ status: 'done' })
    .eq('id', payload.id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    logger.error('TaskHandlers', 'Failed to complete task', { error });
    return { success: false, error: error.message };
  }

  return {
    success: true,
    data,
    message: `Task completed`,
  };
}

/**
 * Handle SCHEDULE_TASK command
 */
export async function handleScheduleTask(command: ScheduleTaskCommand): Promise<CommandResult> {
  const { payload } = command;
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const { data, error } = await supabase
    .from('tasks')
    .update({
      due_date: payload.date,
      scheduled_time: payload.time,
      status: 'scheduled',
    })
    .eq('id', payload.id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    logger.error('TaskHandlers', 'Failed to schedule task', { error });
    return { success: false, error: error.message };
  }

  return {
    success: true,
    data,
    message: `Task scheduled for ${payload.date} at ${payload.time}`,
  };
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

