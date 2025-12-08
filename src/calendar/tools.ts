/**
 * Calendar AI Tools
 * AI tools for calendar event management
 */

import type { Tool, ToolDefinition, ToolResult } from '@/lib/ai/toolRegistry';
import {
  getCalendarEvents,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  findFreeSlots,
} from '@/api/calendarAPI';
import type { CalendarEvent } from '@/services/types';
import { logger } from '@/services/logger';

// =====================================================
// TOOL DEFINITIONS
// =====================================================

const createEventDefinition: ToolDefinition = {
  type: 'function',
  function: {
    name: 'create_event',
    description:
      'Create a calendar event. Requires title, start_date (YYYY-MM-DD), end_date, and type. Optional: start_time, end_time, all_day, location, description.',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Event title - required' },
        start_date: { type: 'string', description: 'Start date in YYYY-MM-DD format - required' },
        end_date: { type: 'string', description: 'End date in YYYY-MM-DD format - required' },
        type: {
          type: 'string',
          enum: ['event', 'meeting', 'reminder', 'birthday', 'holiday'],
          description: 'Event type - required',
        },
        start_time: { type: 'string', description: 'Start time in HH:MM format - optional' },
        end_time: { type: 'string', description: 'End time in HH:MM format - optional' },
        all_day: { type: 'boolean', description: 'All-day event flag - optional, defaults to false' },
        location: { type: 'string', description: 'Event location - optional' },
        description: { type: 'string', description: 'Event description - optional' },
      },
      required: ['title', 'start_date', 'end_date', 'type'],
    },
  },
};

const getEventsDefinition: ToolDefinition = {
  type: 'function',
  function: {
    name: 'get_events',
    description: 'Get calendar events. Optional filters: startDate, endDate, type.',
    parameters: {
      type: 'object',
      properties: {
        startDate: { type: 'string', description: 'Start date in YYYY-MM-DD format - optional' },
        endDate: { type: 'string', description: 'End date in YYYY-MM-DD format - optional' },
        type: { type: 'string', description: 'Filter by event type - optional' },
      },
    },
  },
};

const updateEventDefinition: ToolDefinition = {
  type: 'function',
  function: {
    name: 'update_event',
    description: 'Update a calendar event. Requires event_id. Can update: title, start_date, end_date, start_time, end_time, location, description.',
    parameters: {
      type: 'object',
      properties: {
        event_id: { type: 'string', description: 'Event ID - required' },
        title: { type: 'string', description: 'New title - optional' },
        start_date: { type: 'string', description: 'New start date - optional' },
        end_date: { type: 'string', description: 'New end date - optional' },
        start_time: { type: 'string', description: 'New start time - optional' },
        end_time: { type: 'string', description: 'New end time - optional' },
        location: { type: 'string', description: 'New location - optional' },
        description: { type: 'string', description: 'New description - optional' },
      },
      required: ['event_id'],
    },
  },
};

const deleteEventDefinition: ToolDefinition = {
  type: 'function',
  function: {
    name: 'delete_event',
    description: 'Delete a calendar event. Requires event_id.',
    parameters: {
      type: 'object',
      properties: {
        event_id: { type: 'string', description: 'Event ID to delete - required' },
      },
      required: ['event_id'],
    },
  },
};

const findFreeSlotsDefinition: ToolDefinition = {
  type: 'function',
  function: {
    name: 'find_free_slots',
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

async function executeCreateEvent(args: Record<string, unknown>): Promise<ToolResult> {
  try {
    const event = await createCalendarEvent({
      title: args.title as string,
      start_date: args.start_date as string,
      end_date: args.end_date as string,
      type: args.type as CalendarEvent['type'],
      start_time: args.start_time as string | undefined,
      end_time: args.end_time as string | undefined,
      all_day: (args.all_day as boolean) || false,
      location: args.location as string | undefined,
      description: args.description as string | undefined,
      is_recurring: false,
    });

    logger.info('CalendarTools', 'Calendar event created', { id: event.id, title: event.title });
    return {
      success: true,
      message: `Event created: ${event.title} on ${event.start_date}`,
      data: event,
    };
  } catch (error) {
    logger.error('CalendarTools', error as Error, { context: 'executeCreateEvent' });
    return { success: false, error: (error as Error).message };
  }
}

async function executeGetEvents(args: Record<string, unknown>): Promise<ToolResult> {
  try {
    const events = await getCalendarEvents({
      startDate: args.startDate as string | undefined,
      endDate: args.endDate as string | undefined,
      type: args.type as CalendarEvent['type'] | undefined,
    });

    return {
      success: true,
      message: `Found ${events.length} calendar events`,
      data: events,
      count: events.length,
    };
  } catch (error) {
    logger.error('CalendarTools', error as Error, { context: 'executeGetEvents' });
    return { success: false, error: (error as Error).message };
  }
}

async function executeUpdateEvent(args: Record<string, unknown>): Promise<ToolResult> {
  try {
    const updates: Partial<CalendarEvent> = {};
    if (args.title) updates.title = args.title as string;
    if (args.start_date) updates.start_date = args.start_date as string;
    if (args.end_date) updates.end_date = args.end_date as string;
    if (args.start_time) updates.start_time = args.start_time as string;
    if (args.end_time) updates.end_time = args.end_time as string;
    if (args.location) updates.location = args.location as string;
    if (args.description) updates.description = args.description as string;

    const updated = await updateCalendarEvent(args.event_id as string, updates);

    logger.info('CalendarTools', 'Calendar event updated', { id: updated.id });
    return {
      success: true,
      message: 'Calendar event updated successfully',
      data: updated,
    };
  } catch (error) {
    logger.error('CalendarTools', error as Error, { context: 'executeUpdateEvent' });
    return { success: false, error: (error as Error).message };
  }
}

async function executeDeleteEvent(args: Record<string, unknown>): Promise<ToolResult> {
  try {
    await deleteCalendarEvent(args.event_id as string);

    logger.info('CalendarTools', 'Calendar event deleted', { id: args.event_id });
    return {
      success: true,
      message: 'Calendar event deleted successfully',
    };
  } catch (error) {
    logger.error('CalendarTools', error as Error, { context: 'executeDeleteEvent' });
    return { success: false, error: (error as Error).message };
  }
}

async function executeFindFreeSlots(args: Record<string, unknown>): Promise<ToolResult> {
  try {
    const slots = await findFreeSlots(args.date as string, args.duration_minutes as number);

    return {
      success: true,
      message: `Found ${slots.length} free time slots on ${args.date}`,
      data: slots,
      count: slots.length,
    };
  } catch (error) {
    logger.error('CalendarTools', error as Error, { context: 'executeFindFreeSlots' });
    return { success: false, error: (error as Error).message };
  }
}

// =====================================================
// EXPORT TOOLS
// =====================================================

export const calendarTools: Tool[] = [
  { definition: createEventDefinition, execute: executeCreateEvent },
  { definition: getEventsDefinition, execute: executeGetEvents },
  { definition: updateEventDefinition, execute: executeUpdateEvent },
  { definition: deleteEventDefinition, execute: executeDeleteEvent },
  { definition: findFreeSlotsDefinition, execute: executeFindFreeSlots },
];
