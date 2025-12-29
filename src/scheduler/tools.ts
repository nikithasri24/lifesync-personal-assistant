/**
 * Scheduler AI Tools
 * AI tools for schedule block management, time finding, and smart scheduling
 * Uses CommandBus for unified action dispatch
 */

import type { Tool, ToolDefinition, ToolResult } from '@/lib/ai/toolRegistry';
import {
  getScheduleBlocks,
  findFreeTimeSlots,
} from '@/api/schedulerAPI';
import { commandBus, type CreateScheduleBlockCommand, type UpdateScheduleBlockCommand, type DeleteScheduleBlockCommand, type PlanDayCommand } from '@/lib/commandBus';
import { scheduleEngine } from '@/services/scheduler';
import { DEFAULT_SCHEDULING_PREFS } from '@/services/scheduling';
import type { ScheduleBlock } from '@/services/types';
import { logger } from '@/services/logger';
import { format, parseISO, addMinutes } from 'date-fns';
import { supabase } from '@/lib/supabase';

// =====================================================
// TOOL DEFINITIONS
// =====================================================

const createScheduleBlockDefinition: ToolDefinition = {
  type: 'function',
  function: {
    name: 'create_schedule_block',
    description:
      'Create a schedule block for task scheduling. Requires date (YYYY-MM-DD), start_time (HH:MM), end_time (HH:MM), and type (task/event/focus/break). Optional: title, task_id, color.',
    parameters: {
      type: 'object',
      properties: {
        date: { type: 'string', description: 'Date in YYYY-MM-DD format - required' },
        start_time: { type: 'string', description: 'Start time in HH:MM format (24h) - required' },
        end_time: { type: 'string', description: 'End time in HH:MM format (24h) - required' },
        type: {
          type: 'string',
          enum: ['task', 'event', 'focus', 'break'],
          description: 'Type of schedule block - required',
        },
        title: { type: 'string', description: 'Title for the block - optional' },
        task_id: { type: 'string', description: 'ID of linked task - optional' },
        color: { type: 'string', description: 'Color hex code - optional' },
      },
      required: ['date', 'start_time', 'end_time', 'type'],
    },
  },
};

const getScheduleDefinition: ToolDefinition = {
  type: 'function',
  function: {
    name: 'get_schedule',
    description:
      'Get schedule blocks for a date range. Optional filters: startDate (YYYY-MM-DD), endDate (YYYY-MM-DD), type (task/event/focus/break).',
    parameters: {
      type: 'object',
      properties: {
        startDate: { type: 'string', description: 'Start date in YYYY-MM-DD format - optional' },
        endDate: { type: 'string', description: 'End date in YYYY-MM-DD format - optional' },
        type: { type: 'string', description: 'Filter by type - optional' },
      },
    },
  },
};

const updateScheduleBlockDefinition: ToolDefinition = {
  type: 'function',
  function: {
    name: 'update_schedule',
    description: 'Update a schedule block. Requires block_id. Can update: start_time, end_time, title, type, color.',
    parameters: {
      type: 'object',
      properties: {
        block_id: { type: 'string', description: 'Schedule block ID - required' },
        start_time: { type: 'string', description: 'New start time in HH:MM format - optional' },
        end_time: { type: 'string', description: 'New end time in HH:MM format - optional' },
        title: { type: 'string', description: 'New title - optional' },
        type: { type: 'string', description: 'New type - optional' },
        color: { type: 'string', description: 'New color - optional' },
      },
      required: ['block_id'],
    },
  },
};

const deleteScheduleBlockDefinition: ToolDefinition = {
  type: 'function',
  function: {
    name: 'delete_schedule',
    description: 'Delete a schedule block. Requires block_id.',
    parameters: {
      type: 'object',
      properties: {
        block_id: { type: 'string', description: 'Schedule block ID to delete - required' },
      },
      required: ['block_id'],
    },
  },
};

const findFreeTimeDefinition: ToolDefinition = {
  type: 'function',
  function: {
    name: 'find_free_time',
    description: 'Find free time slots on a specific date. Requires date and duration_minutes.',
    parameters: {
      type: 'object',
      properties: {
        date: { type: 'string', description: 'Date in YYYY-MM-DD format - required' },
        duration_minutes: { type: 'number', description: 'Required duration in minutes - required' },
      },
      required: ['date', 'duration_minutes'],
    },
  },
};

const scheduleTaskOptimallyDefinition: ToolDefinition = {
  type: 'function',
  function: {
    name: 'schedule_task_optimally',
    description: `Find the optimal time to schedule a task based on priority, energy levels, and existing schedule.
Uses smart scheduling that considers:
- User's peak/low energy hours
- Existing calendar events and schedule blocks
- Task priority (urgent/high tasks get peak energy slots)
- Task complexity (deep_work tasks get morning slots)
Returns the best time slot and optionally schedules the task.`,
    parameters: {
      type: 'object',
      properties: {
        task_id: {
          type: 'string',
          description: 'ID of the task to schedule - required'
        },
        date: {
          type: 'string',
          description: 'Date to schedule on in YYYY-MM-DD format. Defaults to today.'
        },
        duration_minutes: {
          type: 'number',
          description: 'Duration in minutes. Defaults to task estimated_time or 30 minutes.'
        },
        priority: {
          type: 'string',
          enum: ['urgent', 'high', 'medium', 'low'],
          description: 'Task priority for slot selection. Defaults to task priority.'
        },
        complexity: {
          type: 'string',
          enum: ['deep_work', 'shallow', 'routine'],
          description: 'Task complexity. deep_work gets morning peak hours.'
        },
        auto_schedule: {
          type: 'boolean',
          description: 'If true, automatically schedule the task at the best time. Defaults to false (just suggest).'
        },
      },
      required: ['task_id'],
    },
  },
};

const planMyDayDefinition: ToolDefinition = {
  type: 'function',
  function: {
    name: 'plan_my_day',
    description: `Auto-schedule all unscheduled tasks for a day. Uses smart scheduling that:
- Respects task dependencies (blocked tasks scheduled after their blockers)
- Matches task priority to energy levels (urgent/high → peak energy hours)
- Considers task complexity (deep_work → morning, routine → afternoon)
- Avoids conflicts with existing events
Returns a complete day plan with scheduled and unscheduled tasks.`,
    parameters: {
      type: 'object',
      properties: {
        date: {
          type: 'string',
          description: 'Date to plan in YYYY-MM-DD format. Defaults to today.'
        },
        include_overdue: {
          type: 'boolean',
          description: 'Include overdue tasks in planning. Defaults to true.'
        },
        max_tasks: {
          type: 'number',
          description: 'Maximum tasks to schedule. Defaults to 10.'
        },
      },
      required: [],
    },
  },
};

// =====================================================
// TOOL EXECUTION FUNCTIONS
// =====================================================

async function executeCreateScheduleBlock(args: Record<string, unknown>): Promise<ToolResult> {
  try {
    // Dispatch command through CommandBus
    const command: CreateScheduleBlockCommand = {
      type: 'CREATE_SCHEDULE_BLOCK',
      timestamp: new Date(),
      source: 'ai',
      payload: {
        date: args.date as string,
        startTime: args.start_time as string,
        endTime: args.end_time as string,
        type: args.type as 'task' | 'event' | 'focus' | 'break',
        title: args.title as string | undefined,
        taskId: args.task_id as string | undefined,
        color: args.color as string | undefined,
      }
    };

    const result = await commandBus.dispatch(command);

    if (!result.success) {
      return { success: false, error: result.error || 'Failed to create schedule block' };
    }

    logger.info('SchedulerTools', 'Schedule block created via CommandBus', { id: (result.data as ScheduleBlock)?.id });
    return {
      success: true,
      message: result.message || `Schedule block created for ${args.date} from ${args.start_time} to ${args.end_time}`,
      data: result.data,
    };
  } catch (error) {
    logger.error('SchedulerTools', 'Operation failed', { error, context: 'executeCreateScheduleBlock' });
    return { success: false, error: (error as Error).message };
  }
}

async function executeGetSchedule(args: Record<string, unknown>): Promise<ToolResult> {
  try {
    const blocks = await getScheduleBlocks({
      startDate: args.startDate as string | undefined,
      endDate: args.endDate as string | undefined,
      type: args.type as ScheduleBlock['type'] | undefined,
    });

    return {
      success: true,
      message: `Found ${blocks.length} schedule blocks`,
      data: blocks,
      count: blocks.length,
    };
  } catch (error) {
    logger.error('SchedulerTools', 'Operation failed', { error, context: 'executeGetSchedule' });
    return { success: false, error: (error as Error).message };
  }
}

async function executeUpdateScheduleBlock(args: Record<string, unknown>): Promise<ToolResult> {
  try {
    // Dispatch command through CommandBus
    const command: UpdateScheduleBlockCommand = {
      type: 'UPDATE_SCHEDULE_BLOCK',
      timestamp: new Date(),
      source: 'ai',
      payload: {
        id: args.block_id as string,
        updates: {
          startTime: args.start_time as string | undefined,
          endTime: args.end_time as string | undefined,
          title: args.title as string | undefined,
          type: args.type as 'task' | 'event' | 'focus' | 'break' | undefined,
          color: args.color as string | undefined,
        }
      }
    };

    const result = await commandBus.dispatch(command);

    if (!result.success) {
      return { success: false, error: result.error || 'Failed to update schedule block' };
    }

    logger.info('SchedulerTools', 'Schedule block updated via CommandBus', { id: args.block_id });
    return {
      success: true,
      message: result.message || 'Schedule block updated successfully',
      data: result.data,
    };
  } catch (error) {
    logger.error('SchedulerTools', 'Operation failed', { error, context: 'executeUpdateScheduleBlock' });
    return { success: false, error: (error as Error).message };
  }
}

async function executeDeleteScheduleBlock(args: Record<string, unknown>): Promise<ToolResult> {
  try {
    // Dispatch command through CommandBus
    const command: DeleteScheduleBlockCommand = {
      type: 'DELETE_SCHEDULE_BLOCK',
      timestamp: new Date(),
      source: 'ai',
      payload: {
        id: args.block_id as string,
      }
    };

    const result = await commandBus.dispatch(command);

    if (!result.success) {
      return { success: false, error: result.error || 'Failed to delete schedule block' };
    }

    logger.info('SchedulerTools', 'Schedule block deleted via CommandBus', { id: args.block_id });
    return {
      success: true,
      message: result.message || 'Schedule block deleted successfully',
    };
  } catch (error) {
    logger.error('SchedulerTools', 'Operation failed', { error, context: 'executeDeleteScheduleBlock' });
    return { success: false, error: (error as Error).message };
  }
}

async function executeFindFreeTime(args: Record<string, unknown>): Promise<ToolResult> {
  try {
    const slots = await findFreeTimeSlots(args.date as string, args.duration_minutes as number);

    return {
      success: true,
      message: `Found ${slots.length} free time slots on ${args.date}`,
      data: slots,
      count: slots.length,
    };
  } catch (error) {
    logger.error('SchedulerTools', 'Operation failed', { error, context: 'executeFindFreeTime' });
    return { success: false, error: (error as Error).message };
  }
}

async function executeScheduleTaskOptimally(args: Record<string, unknown>): Promise<ToolResult> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const taskId = args.task_id as string;
    const dateStr = (args.date as string) || format(new Date(), 'yyyy-MM-dd');
    const date = parseISO(dateStr);

    // Fetch the task
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .eq('user_id', user.id)
      .single();

    if (taskError || !task) {
      return { success: false, error: 'Task not found' };
    }

    const durationMinutes = (args.duration_minutes as number) || task.estimated_time || 30;
    const priority = (args.priority as string) || task.priority || 'medium';
    const complexity = (args.complexity as string) || 'shallow';
    const autoSchedule = args.auto_schedule === true;

    // Find free slots using ScheduleEngine
    const freeSlots = await scheduleEngine.findFreeSlots(date, DEFAULT_SCHEDULING_PREFS, durationMinutes);

    if (freeSlots.length === 0) {
      return {
        success: false,
        error: 'No available time slots on this date',
        suggestion: 'Try a different date or reduce the task duration',
      };
    }

    // Create task object for scoring
    const taskForScoring = {
      priority: priority as 'urgent' | 'high' | 'medium' | 'low',
      estimatedMinutes: durationMinutes,
      complexity: complexity as 'deep_work' | 'shallow' | 'routine',
    };

    // Score slots based on priority and complexity
    const scoredSlots = freeSlots.map(slot => {
      return scheduleEngine.scoreSlot(slot, taskForScoring, DEFAULT_SCHEDULING_PREFS);
    }).sort((a, b) => b.score - a.score);

    const bestSlot = scoredSlots[0];
    const startTime = format(bestSlot.start, 'HH:mm');
    const scheduledStart = bestSlot.start.toISOString();
    const scheduledEndDate = addMinutes(bestSlot.start, durationMinutes);
    const endTime = format(scheduledEndDate, 'HH:mm');

    // If auto_schedule is true, update the task
    if (autoSchedule) {
      const { error: updateError } = await supabase
        .from('tasks')
        .update({
          due_date: dateStr,
          scheduled_start: scheduledStart,
          scheduled_end: scheduledEndDate.toISOString(),
          status: 'scheduled',
        })
        .eq('id', taskId)
        .eq('user_id', user.id);

      if (updateError) {
        return { success: false, error: 'Failed to schedule task: ' + updateError.message };
      }

      logger.info('SchedulerTools', 'Task scheduled optimally', { taskId, date: dateStr, time: startTime });
      return {
        success: true,
        message: `Task "${task.title}" scheduled for ${dateStr} at ${startTime}`,
        data: {
          taskId,
          taskTitle: task.title,
          scheduledDate: dateStr,
          scheduledTime: startTime,
          endTime,
          energyLevel: bestSlot.energyLevel,
          score: bestSlot.score,
        },
      };
    }

    // Just return the suggestion
    return {
      success: true,
      message: `Best time for "${task.title}": ${dateStr} at ${startTime}`,
      data: {
        taskId,
        taskTitle: task.title,
        suggestedDate: dateStr,
        suggestedTime: startTime,
        endTime,
        energyLevel: bestSlot.energyLevel,
        score: bestSlot.score,
        alternativeSlots: scoredSlots.slice(1, 4).map(s => ({
          time: format(s.start, 'HH:mm'),
          score: s.score,
          energyLevel: s.energyLevel,
        })),
      },
      hint: 'Set auto_schedule=true to automatically schedule the task',
    };
  } catch (error) {
    logger.error('SchedulerTools', 'Operation failed', { error, context: 'executeScheduleTaskOptimally' });
    return { success: false, error: (error as Error).message };
  }
}

async function executePlanMyDay(args: Record<string, unknown>): Promise<ToolResult> {
  try {
    const dateStr = (args.date as string) || format(new Date(), 'yyyy-MM-dd');
    const includeOverdue = args.include_overdue !== false;
    const maxTasks = (args.max_tasks as number) || 10;

    // Dispatch command through CommandBus
    const command: PlanDayCommand = {
      type: 'PLAN_DAY',
      timestamp: new Date(),
      source: 'ai',
      payload: {
        date: dateStr,
        includeOverdue,
        maxTasks,
      }
    };

    const result = await commandBus.dispatch(command);

    if (!result.success) {
      return { success: false, error: result.error || 'Failed to plan day' };
    }

    logger.info('SchedulerTools', 'Day planned via CommandBus', {
      date: dateStr,
      result: result.data
    });

    return {
      success: true,
      message: result.message || `Day planned for ${dateStr}`,
      data: result.data,
    };
  } catch (error) {
    logger.error('SchedulerTools', 'Operation failed', { error, context: 'executePlanMyDay' });
    return { success: false, error: (error as Error).message };
  }
}

// =====================================================
// EXPORT TOOLS
// =====================================================

export const schedulerTools: Tool[] = [
  { definition: createScheduleBlockDefinition, execute: executeCreateScheduleBlock },
  { definition: getScheduleDefinition, execute: executeGetSchedule },
  { definition: updateScheduleBlockDefinition, execute: executeUpdateScheduleBlock },
  { definition: deleteScheduleBlockDefinition, execute: executeDeleteScheduleBlock },
  { definition: findFreeTimeDefinition, execute: executeFindFreeTime },
  { definition: scheduleTaskOptimallyDefinition, execute: executeScheduleTaskOptimally },
  { definition: planMyDayDefinition, execute: executePlanMyDay },
];
