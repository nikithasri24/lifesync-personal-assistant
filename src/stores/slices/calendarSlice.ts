/**
 * Calendar Slice
 * Manages calendar events state and operations
 */

import type { StateCreator } from 'zustand';
import type { CalendarEvent } from '@/services/types';
import {
  getCalendarEvents,
  createCalendarEvent as apiCreateCalendarEvent,
  updateCalendarEvent as apiUpdateCalendarEvent,
  deleteCalendarEvent as apiDeleteCalendarEvent,
  findFreeSlots,
} from '@/api/calendarAPI';
import { logger } from '@/services/logger';

export interface CalendarSlice {
  // State
  calendarEvents: CalendarEvent[];
  calendarLoaded: boolean;
  calendarLoading: boolean;
  calendarError: string | null;

  // Actions
  loadCalendarEvents: (filters?: Parameters<typeof getCalendarEvents>[0]) => Promise<void>;
  addCalendarEvent: (event: Omit<CalendarEvent, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<CalendarEvent>;
  updateCalendarEvent: (id: string, updates: Partial<CalendarEvent>) => Promise<CalendarEvent>;
  deleteCalendarEvent: (id: string) => Promise<void>;
  findFreeSlots: (date: string, durationMinutes: number) => Promise<Array<{ start: string; end: string }>>;
  getCalendarEventById: (id: string) => CalendarEvent | undefined;
}

export const createCalendarSlice: StateCreator<CalendarSlice, [], [], CalendarSlice> = (
  set,
  get
) => ({
  // Initial state
  calendarEvents: [],
  calendarLoaded: false,
  calendarLoading: false,
  calendarError: null,

  // Load calendar events
  loadCalendarEvents: async (filters): Promise<void> => {
    if (get().calendarLoading) return;

    set({ calendarLoading: true, calendarError: null });
    try {
      const events = await getCalendarEvents(filters);
      set({ calendarEvents: events, calendarLoaded: true, calendarLoading: false });
      logger.info('CalendarSlice', 'Calendar events loaded', { count: events.length });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load calendar events';
      logger.error('CalendarSlice', error as Error, { context: 'loadCalendarEvents' });
      set({
        calendarError: errorMessage,
        calendarLoading: false,
      });
      throw error;
    }
  },

  // Add a new calendar event
  addCalendarEvent: async (event): Promise<CalendarEvent> => {
    try {
      const created = await apiCreateCalendarEvent(event);
      set((state) => ({ calendarEvents: [...state.calendarEvents, created].sort((a, b) => a.start_date.localeCompare(b.start_date)) }));
      logger.info('CalendarSlice', 'Calendar event created', { id: created.id, title: created.title });
      return created;
    } catch (error) {
      logger.error('CalendarSlice', error as Error, { context: 'addCalendarEvent' });
      throw error;
    }
  },

  // Update a calendar event
  updateCalendarEvent: async (id, updates): Promise<CalendarEvent> => {
    try {
      const updated = await apiUpdateCalendarEvent(id, updates);
      set((state) => ({
        calendarEvents: state.calendarEvents.map((e) => (e.id === id ? updated : e)),
      }));
      logger.info('CalendarSlice', 'Calendar event updated', { id });
      return updated;
    } catch (error) {
      logger.error('CalendarSlice', error as Error, { context: 'updateCalendarEvent', id });
      throw error;
    }
  },

  // Delete a calendar event
  deleteCalendarEvent: async (id): Promise<void> => {
    try {
      await apiDeleteCalendarEvent(id);
      set((state) => ({
        calendarEvents: state.calendarEvents.filter((e) => e.id !== id),
      }));
      logger.info('CalendarSlice', 'Calendar event deleted', { id });
    } catch (error) {
      logger.error('CalendarSlice', error as Error, { context: 'deleteCalendarEvent', id });
      throw error;
    }
  },

  // Find free time slots
  findFreeSlots: async (date, durationMinutes): Promise<Array<{ start: string; end: string }>> => {
    try {
      const slots = await findFreeSlots(date, durationMinutes);
      logger.info('CalendarSlice', 'Free slots found', { date, count: slots.length });
      return slots;
    } catch (error) {
      logger.error('CalendarSlice', error as Error, { context: 'findFreeSlots', date, durationMinutes });
      throw error;
    }
  },

  // Get calendar event by ID
  getCalendarEventById: (id) => get().calendarEvents.find((e) => e.id === id),
});
