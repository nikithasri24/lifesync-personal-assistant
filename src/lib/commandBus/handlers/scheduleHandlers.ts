/**
 * Schedule Command Handlers
 *
 * Handles all schedule-related commands through the command bus.
 * Uses the API layer for data access.
 */

import * as schedulerAPI from '@/api/schedulerAPI';
import * as tasksAPI from '@/api/tasksAPI';
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

  try {
    const data = await schedulerAPI.createScheduleBlock({
      date: payload.date,
      start_time: payload.startTime,
      end_time: payload.endTime,
      type: payload.type,
      title: payload.title,
      task_id: payload.taskId,
      color: payload.color,
      is_recurring: false,
    });

    return {
      success: true,
      data,
      message: `Schedule block created for ${payload.date}`,
    };
  } catch (error) {
    logger.error('ScheduleHandlers', 'Failed to create schedule block', { error });
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Handle UPDATE_SCHEDULE_BLOCK command
 */
export async function handleUpdateScheduleBlock(command: UpdateScheduleBlockCommand): Promise<CommandResult> {
  const { payload } = command;

  try {
    // Map camelCase to snake_case for API layer
    const updates: Record<string, unknown> = {};
    if (payload.updates.startTime !== undefined) updates.start_time = payload.updates.startTime;
    if (payload.updates.endTime !== undefined) updates.end_time = payload.updates.endTime;
    if (payload.updates.title !== undefined) updates.title = payload.updates.title;
    if (payload.updates.type !== undefined) updates.type = payload.updates.type;
    if (payload.updates.color !== undefined) updates.color = payload.updates.color;

    const data = await schedulerAPI.updateScheduleBlock(payload.id, updates);

    return {
      success: true,
      data,
      message: 'Schedule block updated',
    };
  } catch (error) {
    logger.error('ScheduleHandlers', 'Failed to update schedule block', { error });
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Handle DELETE_SCHEDULE_BLOCK command
 */
export async function handleDeleteScheduleBlock(command: DeleteScheduleBlockCommand): Promise<CommandResult> {
  const { payload } = command;

  try {
    await schedulerAPI.deleteScheduleBlock(payload.id);

    return {
      success: true,
      message: 'Schedule block deleted',
    };
  } catch (error) {
    logger.error('ScheduleHandlers', 'Failed to delete schedule block', { error });
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Handle PLAN_DAY command
 */
export async function handlePlanDay(command: PlanDayCommand): Promise<CommandResult> {
  const { payload } = command;

  try {
    const date = parseISO(payload.date);
    const includeOverdue = payload.includeOverdue !== false;

    // Fetch unscheduled tasks using API layer
    const allTasks = await tasksAPI.getTasks({
      deleted: false,
      archived: false,
    });

    // Filter to unscheduled tasks
    let tasks = allTasks.filter(t =>
      t.status !== 'done' && t.status !== 'scheduled'
    );

    // Filter overdue if needed
    if (!includeOverdue) {
      tasks = tasks.filter(t =>
        !t.due_date || t.due_date >= payload.date
      );
    }

    // Limit tasks
    const maxTasks = payload.maxTasks || 10;
    tasks = tasks.slice(0, maxTasks);

    if (tasks.length === 0) {
      return {
        success: true,
        message: 'No unscheduled tasks to plan',
        data: { scheduled: [], unscheduled: [] },
      };
    }

    // Map tasks for the scheduler (filter out tasks without IDs)
    const tasksForScheduling = tasks
      .filter((t): t is typeof t & { id: string } => !!t.id)
      .map(t => ({
        id: t.id,
        title: t.title,
        priority: (t.priority || 'medium') as 'urgent' | 'high' | 'medium' | 'low',
        estimatedMinutes: t.estimated_time || 30,
        complexity: 'shallow' as const,
        depends_on: t.depends_on || [],
      }));

    // Use ScheduleEngine to plan the day
    const dayPlan = await scheduleEngine.planDay(tasksForScheduling, date, DEFAULT_SCHEDULING_PREFS);

    // Update scheduled tasks using API layer
    const scheduled: Array<{ taskId: string; title: string; time: string }> = [];
    for (const item of dayPlan.scheduledItems) {
      const timeStr = format(item.start, 'HH:mm');
      try {
        await tasksAPI.updateTask(item.taskId, {
          due_date: payload.date,
          scheduled_time: timeStr,
          status: 'scheduled',
        });
        const task = tasks.find(t => t.id === item.taskId);
        scheduled.push({
          taskId: item.taskId,
          title: task?.title || 'Unknown',
          time: timeStr,
        });
      } catch {
        // Continue with other tasks if one fails
        logger.warn('ScheduleHandlers', `Failed to schedule task ${item.taskId}`);
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
  } catch (error) {
    logger.error('ScheduleHandlers', 'Failed to plan day', { error });
    return { success: false, error: (error as Error).message };
  }
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

