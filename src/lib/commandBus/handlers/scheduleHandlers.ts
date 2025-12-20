/**
 * Schedule Command Handlers
 * 
 * Handles all schedule-related commands through the command bus.
 */

import { supabase } from '@/lib/supabase';
import { logger } from '@/services/logger';
import { scheduleEngine } from '@/services/scheduler';
import { DEFAULT_SCHEDULING_PREFS } from '@/services/scheduling';
import { format, parseISO } from 'date-fns';
import type {
  CommandResult,
  CreateScheduleBlockCommand,
  UpdateScheduleBlockCommand,
  DeleteScheduleBlockCommand,
  PlanDayCommand,
} from '../types';

/**
 * Handle CREATE_SCHEDULE_BLOCK command
 */
export async function handleCreateScheduleBlock(command: CreateScheduleBlockCommand): Promise<CommandResult> {
  const { payload } = command;
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const { data, error } = await supabase
    .from('schedule_blocks')
    .insert({
      user_id: user.id,
      date: payload.date,
      start_time: payload.startTime,
      end_time: payload.endTime,
      type: payload.type,
      title: payload.title,
      task_id: payload.taskId,
      color: payload.color,
      is_recurring: false,
    })
    .select()
    .single();

  if (error) {
    logger.error('ScheduleHandlers', 'Failed to create schedule block', { error });
    return { success: false, error: error.message };
  }

  return {
    success: true,
    data,
    message: `Schedule block created for ${payload.date}`,
  };
}

/**
 * Handle UPDATE_SCHEDULE_BLOCK command
 */
export async function handleUpdateScheduleBlock(command: UpdateScheduleBlockCommand): Promise<CommandResult> {
  const { payload } = command;
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  // Map camelCase to snake_case
  const updates: Record<string, unknown> = {};
  if (payload.updates.startTime !== undefined) updates.start_time = payload.updates.startTime;
  if (payload.updates.endTime !== undefined) updates.end_time = payload.updates.endTime;
  if (payload.updates.title !== undefined) updates.title = payload.updates.title;
  if (payload.updates.type !== undefined) updates.type = payload.updates.type;
  if (payload.updates.color !== undefined) updates.color = payload.updates.color;

  const { data, error } = await supabase
    .from('schedule_blocks')
    .update(updates)
    .eq('id', payload.id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    logger.error('ScheduleHandlers', 'Failed to update schedule block', { error });
    return { success: false, error: error.message };
  }

  return {
    success: true,
    data,
    message: 'Schedule block updated',
  };
}

/**
 * Handle DELETE_SCHEDULE_BLOCK command
 */
export async function handleDeleteScheduleBlock(command: DeleteScheduleBlockCommand): Promise<CommandResult> {
  const { payload } = command;
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const { error } = await supabase
    .from('schedule_blocks')
    .delete()
    .eq('id', payload.id)
    .eq('user_id', user.id);

  if (error) {
    logger.error('ScheduleHandlers', 'Failed to delete schedule block', { error });
    return { success: false, error: error.message };
  }

  return {
    success: true,
    message: 'Schedule block deleted',
  };
}

/**
 * Handle PLAN_DAY command
 */
export async function handlePlanDay(command: PlanDayCommand): Promise<CommandResult> {
  const { payload } = command;
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const date = parseISO(payload.date);
  const includeOverdue = payload.includeOverdue !== false;
  const maxTasks = payload.maxTasks || 10;

  // Fetch unscheduled tasks
  let query = supabase
    .from('tasks')
    .select('*')
    .eq('user_id', user.id)
    .eq('deleted', false)
    .eq('archived', false)
    .neq('status', 'done')
    .neq('status', 'scheduled')
    .limit(maxTasks);

  if (!includeOverdue) {
    query = query.or(`due_date.is.null,due_date.gte.${payload.date}`);
  }

  const { data: tasks, error: tasksError } = await query;

  if (tasksError) {
    return { success: false, error: 'Failed to fetch tasks: ' + tasksError.message };
  }

  if (!tasks || tasks.length === 0) {
    return {
      success: true,
      message: 'No unscheduled tasks to plan',
      data: { scheduled: [], unscheduled: [] },
    };
  }

  // Map tasks for the scheduler
  const tasksForScheduling = tasks.map(t => ({
    id: t.id,
    title: t.title,
    priority: (t.priority || 'medium') as 'urgent' | 'high' | 'medium' | 'low',
    estimatedMinutes: t.estimated_time || 30,
    complexity: 'shallow' as const,
    depends_on: t.depends_on || [],
  }));

  // Use ScheduleEngine to plan the day
  const dayPlan = await scheduleEngine.planDay(tasksForScheduling, date, DEFAULT_SCHEDULING_PREFS);

  // Update scheduled tasks in database
  const scheduled: Array<{ taskId: string; title: string; time: string }> = [];
  for (const item of dayPlan.scheduledItems) {
    const timeStr = format(item.start, 'HH:mm');
    const { error: updateError } = await supabase
      .from('tasks')
      .update({
        due_date: payload.date,
        scheduled_time: timeStr,
        status: 'scheduled',
      })
      .eq('id', item.taskId)
      .eq('user_id', user.id);

    if (!updateError) {
      const task = tasks.find(t => t.id === item.taskId);
      scheduled.push({
        taskId: item.taskId,
        title: task?.title || 'Unknown',
        time: timeStr,
      });
    }
  }

  const unscheduled = dayPlan.unscheduledTasks.map(id => {
    const task = tasks.find(t => t.id === id);
    return { taskId: id, title: task?.title || 'Unknown' };
  });

  return {
    success: true,
    message: `Planned ${scheduled.length} task(s) for ${payload.date}`,
    data: { scheduled, unscheduled },
  };
}

/**
 * All schedule handlers mapped by command type
 */
export const scheduleHandlers = {
  CREATE_SCHEDULE_BLOCK: handleCreateScheduleBlock,
  UPDATE_SCHEDULE_BLOCK: handleUpdateScheduleBlock,
  DELETE_SCHEDULE_BLOCK: handleDeleteScheduleBlock,
  PLAN_DAY: handlePlanDay,
};

