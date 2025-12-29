/**
 * Calendar API
 * CRUD operations for calendar events with recurring support
 */

import { supabase } from '../lib/supabase';
import { format, parseISO } from 'date-fns';
import type { CalendarEvent } from '../services/types';
import { logger } from '../services/logger';
import { apiCall, requireAuth, handleSupabaseResponse } from './apiWrapper';
import { scheduleEngine } from '../services/scheduler';
import { DEFAULT_SCHEDULING_PREFS } from '../services/scheduling/types';
import { fetchCalendarEvents } from './calendarData';

// =====================================================
// CALENDAR EVENTS CRUD OPERATIONS
// =====================================================

/**
 * Get calendar events for a date range
 * @param filters - Optional filters for date range and event type
 * @returns Promise<CalendarEvent[]> - Array of calendar events matching the filters
 * @throws Error if user not authenticated
 */
export async function getCalendarEvents(filters?: {
  startDate?: string;
  endDate?: string;
  type?: CalendarEvent['type'];
}): Promise<CalendarEvent[]> {
  return fetchCalendarEvents(filters);
}

/**
 * Get a single calendar event by ID
 * @param id - Calendar event ID
 * @returns Promise<CalendarEvent> - The requested calendar event
 * @throws Error if event not found or user not authenticated
 */
export async function getCalendarEvent(id: string): Promise<CalendarEvent> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const result = await supabase
        .from('calendar_events')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      const data = handleSupabaseResponse(result, 'Calendar Event', id);
      return data as CalendarEvent;
    },
    { domain: 'CalendarAPI', operation: 'getCalendarEvent', data: { id } }
  );
}

/**
 * Create a new calendar event
 * @param event - Calendar event data
 * @returns Promise<CalendarEvent> - The created calendar event
 * @throws Error if creation fails or user not authenticated
 */
export async function createCalendarEvent(
  event: Omit<CalendarEvent, 'id' | 'user_id' | 'created_at' | 'updated_at'>
): Promise<CalendarEvent> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const result = await supabase
        .from('calendar_events')
        .insert({ ...event, user_id: user.id })
        .select()
        .single();

      const data = handleSupabaseResponse(result, 'Calendar Event');
      logger.info('CalendarAPI', 'Calendar event created', { id: data.id, title: data.title });
      return data as CalendarEvent;
    },
    { domain: 'CalendarAPI', operation: 'createCalendarEvent', data: { title: event.title } }
  );
}

/**
 * Update an existing calendar event
 * @param id - Calendar event ID to update
 * @param updates - Partial calendar event data to update
 * @returns Promise<CalendarEvent> - The updated calendar event
 * @throws Error if event not found or user not authenticated
 */
export async function updateCalendarEvent(
  id: string,
  updates: Partial<CalendarEvent>
): Promise<CalendarEvent> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const result = await supabase
        .from('calendar_events')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      const data = handleSupabaseResponse(result, 'Calendar Event', id);
      logger.info('CalendarAPI', 'Calendar event updated', { id });
      return data as CalendarEvent;
    },
    { domain: 'CalendarAPI', operation: 'updateCalendarEvent', data: { id } }
  );
}

/**
 * Delete a calendar event
 * @param id - Calendar event ID to delete
 * @returns Promise<void>
 * @throws Error if deletion fails or user not authenticated
 */
export async function deleteCalendarEvent(id: string): Promise<void> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      logger.info('CalendarAPI', 'Calendar event deleted', { id });
    },
    { domain: 'CalendarAPI', operation: 'deleteCalendarEvent', data: { id } }
  );
}

/**
 * Find free time slots between events
 *
 * @deprecated Use scheduleEngine.findFreeSlots() from src/services/scheduler instead.
 * This function only considers calendar_events. The ScheduleEngine considers ALL sources:
 * calendar_events, schedule_blocks, and scheduled tasks.
 *
 * @param date - Date to search for free slots
 * @param durationMinutes - Minimum duration required in minutes
 * @returns Promise<Array<{ start: string; end: string }>> - Array of free time slots
 * @throws Error if user not authenticated
 */
export async function findFreeSlots(
  date: string,
  durationMinutes: number
): Promise<Array<{ start: string; end: string }>> {
  const day = parseISO(date);
  const slots = await scheduleEngine.findFreeSlots(day, DEFAULT_SCHEDULING_PREFS, durationMinutes);

  return slots.map(slot => ({
    start: format(slot.start, 'HH:mm'),
    end: format(slot.end, 'HH:mm'),
  }));
}
