/**
 * Scheduler AI Tools
 * AI tools for schedule block management and time finding
 */

import type { Tool, ToolDefinition, ToolResult } from '@/lib/ai/toolRegistry';
import {
  getScheduleBlocks,
  createScheduleBlock,
  updateScheduleBlock,
  deleteScheduleBlock,
  findFreeTimeSlots,
} from '@/api/schedulerAPI';
import type { ScheduleBlock } from '@/services/types';
import { logger } from '@/services/logger';

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

// =====================================================
// TOOL EXECUTION FUNCTIONS
// =====================================================

async function executeCreateScheduleBlock(args: Record<string, unknown>): Promise<ToolResult> {
  try {
    const block = await createScheduleBlock({
      date: args.date as string,
      start_time: args.start_time as string,
      end_time: args.end_time as string,
      type: args.type as ScheduleBlock['type'],
      title: args.title as string | undefined,
      task_id: args.task_id as string | undefined,
      color: args.color as string | undefined,
      is_recurring: false,
    });

    logger.info('SchedulerTools', 'Schedule block created', { id: block.id });
    return {
      success: true,
      message: `Schedule block created for ${args.date} from ${args.start_time} to ${args.end_time}`,
      data: block,
    };
  } catch (error) {
    logger.error('SchedulerTools', error as Error, { context: 'executeCreateScheduleBlock' });
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
    logger.error('SchedulerTools', error as Error, { context: 'executeGetSchedule' });
    return { success: false, error: (error as Error).message };
  }
}

async function executeUpdateScheduleBlock(args: Record<string, unknown>): Promise<ToolResult> {
  try {
    const updates: Partial<ScheduleBlock> = {};
    if (args.start_time) updates.start_time = args.start_time as string;
    if (args.end_time) updates.end_time = args.end_time as string;
    if (args.title) updates.title = args.title as string;
    if (args.type) updates.type = args.type as ScheduleBlock['type'];
    if (args.color) updates.color = args.color as string;

    const updated = await updateScheduleBlock(args.block_id as string, updates);

    logger.info('SchedulerTools', 'Schedule block updated', { id: updated.id });
    return {
      success: true,
      message: 'Schedule block updated successfully',
      data: updated,
    };
  } catch (error) {
    logger.error('SchedulerTools', error as Error, { context: 'executeUpdateScheduleBlock' });
    return { success: false, error: (error as Error).message };
  }
}

async function executeDeleteScheduleBlock(args: Record<string, unknown>): Promise<ToolResult> {
  try {
    await deleteScheduleBlock(args.block_id as string);

    logger.info('SchedulerTools', 'Schedule block deleted', { id: args.block_id });
    return {
      success: true,
      message: 'Schedule block deleted successfully',
    };
  } catch (error) {
    logger.error('SchedulerTools', error as Error, { context: 'executeDeleteScheduleBlock' });
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
    logger.error('SchedulerTools', error as Error, { context: 'executeFindFreeTime' });
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
];
