/**
 * Calendar API
 * CRUD operations for calendar events with recurring support
 */

import { supabase } from '../lib/supabase';
import type { CalendarEvent } from '../services/types';
import { logger } from '../services/logger';

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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  let query = supabase
    .from('calendar_events')
    .select('*')
    .eq('user_id', user.id)
    .order('start_date', { ascending: true });

  // Apply filters
  if (filters) {
    if (filters.startDate) {
      query = query.gte('start_date', filters.startDate);
    }
    if (filters.endDate) {
      query = query.lte('start_date', filters.endDate);
    }
    if (filters.type) {
      query = query.eq('type', filters.type);
    }
  }

  const { data, error } = await query;

  if (error) {
    logger.error('CalendarAPI', error, { context: 'getCalendarEvents', filters });
    throw error;
  }

  return (data ?? []) as CalendarEvent[];
}

/**
 * Get a single calendar event by ID
 * @param id - Calendar event ID
 * @returns Promise<CalendarEvent> - The requested calendar event
 * @throws Error if event not found or user not authenticated
 */
export async function getCalendarEvent(id: string): Promise<CalendarEvent> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('calendar_events')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error) {
    logger.error('CalendarAPI', error, { context: 'getCalendarEvent', id });
    throw error;
  }

  return data as CalendarEvent;
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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('calendar_events')
    .insert({ ...event, user_id: user.id })
    .select()
    .single();

  if (error) {
    logger.error('CalendarAPI', error, { context: 'createCalendarEvent', event });
    throw error;
  }

  logger.info('CalendarAPI', 'Calendar event created', { id: data.id, title: data.title });
  return data as CalendarEvent;
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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('calendar_events')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    logger.error('CalendarAPI', error, { context: 'updateCalendarEvent', id, updates });
    throw error;
  }

  logger.info('CalendarAPI', 'Calendar event updated', { id });
  return data as CalendarEvent;
}

/**
 * Delete a calendar event
 * @param id - Calendar event ID to delete
 * @returns Promise<void>
 * @throws Error if deletion fails or user not authenticated
 */
export async function deleteCalendarEvent(id: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('calendar_events')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    logger.error('CalendarAPI', error, { context: 'deleteCalendarEvent', id });
    throw error;
  }

  logger.info('CalendarAPI', 'Calendar event deleted', { id });
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
  const events = await getCalendarEvents({
    startDate: date,
    endDate: date,
  });

  // Filter to only events with specific times (not all-day)
  const timedEvents = events.filter((e) => !e.all_day && e.start_time && e.end_time);

  // Define work hours (9 AM to 6 PM by default)
  const workStart = '09:00';
  const workEnd = '18:00';

  const freeSlots: Array<{ start: string; end: string }> = [];

  if (timedEvents.length === 0) {
    freeSlots.push({ start: workStart, end: workEnd });
    return freeSlots;
  }

  // Sort events by start time
  const sortedEvents = timedEvents.sort((a, b) =>
    (a.start_time || '').localeCompare(b.start_time || '')
  );

  // Check gap before first event
  const firstStart = sortedEvents[0].start_time || workStart;
  if (firstStart > workStart) {
    const gap = calculateMinutes(workStart, firstStart);
    if (gap >= durationMinutes) {
      freeSlots.push({ start: workStart, end: firstStart });
    }
  }

  // Check gaps between events
  for (let i = 0; i < sortedEvents.length - 1; i++) {
    const currentEnd = sortedEvents[i].end_time || '';
    const nextStart = sortedEvents[i + 1].start_time || '';
    if (currentEnd && nextStart) {
      const gap = calculateMinutes(currentEnd, nextStart);
      if (gap >= durationMinutes) {
        freeSlots.push({ start: currentEnd, end: nextStart });
      }
    }
  }

  // Check gap after last event
  const lastEvent = sortedEvents[sortedEvents.length - 1];
  const lastEnd = lastEvent.end_time || workEnd;
  if (lastEnd < workEnd) {
    const gap = calculateMinutes(lastEnd, workEnd);
    if (gap >= durationMinutes) {
      freeSlots.push({ start: lastEnd, end: workEnd });
    }
  }

  return freeSlots;
}

// Helper function to calculate minutes between two times
function calculateMinutes(start: string, end: string): number {
  const [startHour, startMin] = start.split(':').map(Number);
  const [endHour, endMin] = end.split(':').map(Number);
  return endHour * 60 + endMin - (startHour * 60 + startMin);
}
