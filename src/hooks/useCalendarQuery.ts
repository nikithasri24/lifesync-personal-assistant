/**
 * React Query hooks for Calendar Events
 *
 * Provides automatic caching, loading states, and cache invalidation
 * for calendar events CRUD operations.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import type { CalendarEvent } from '../services/types';
import { queryKeys, queryOptions } from '@/lib/react-query';
import {
  getCalendarEvents,
  getCalendarEvent,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
} from '@/api/calendarAPI';
import { logger } from '@/services/logger';
import { dataEvents } from '@/lib/dataEvents';
import { scheduleEngine } from '@/services/scheduler';
import { DEFAULT_SCHEDULING_PREFS } from '@/services/scheduling/types';
import { format, parseISO } from 'date-fns';

// =====================================================
// CALENDAR EVENTS QUERY HOOKS
// =====================================================

export interface CalendarEventFilters extends Record<string, unknown> {
  startDate?: string;
  endDate?: string;
  type?: CalendarEvent['type'];
}

/**
 * Get all calendar events with optional filters
 */
export function useCalendarEvents(filters?: CalendarEventFilters): UseQueryResult<CalendarEvent[], Error> {
  return useQuery({
    queryKey: queryKeys.calendar.list(filters),
    queryFn: () => getCalendarEvents(filters),
    ...queryOptions.user,
  });
}

/**
 * Get a single calendar event by ID
 */
export function useCalendarEvent(id: string | null): UseQueryResult<CalendarEvent, Error> {
  return useQuery({
    queryKey: queryKeys.calendar.detail(id ?? ''),
    queryFn: () => getCalendarEvent(id ?? ''),
    enabled: !!id,
    ...queryOptions.user,
  });
}

/**
 * Find free time slots for scheduling on a specific date
 */
export function useCalendarFreeSlots(date: string, durationMinutes: number, enabled = true): UseQueryResult<Array<{ start: string; end: string }>, Error> {
  return useQuery({
    queryKey: [...queryKeys.calendar.all, 'freeSlots', date, durationMinutes] as const,
    queryFn: async () => {
      const day = parseISO(date);
      const slots = await scheduleEngine.findFreeSlots(day, DEFAULT_SCHEDULING_PREFS, durationMinutes);
      return slots.map(slot => ({
        start: format(slot.start, 'HH:mm'),
        end: format(slot.end, 'HH:mm'),
      }));
    },
    enabled,
    ...queryOptions.user,
  });
}

// =====================================================
// CALENDAR EVENTS MUTATION HOOKS
// =====================================================

/**
 * Create a new calendar event
 */
export function useCreateCalendarEvent(): UseMutationResult<
  CalendarEvent,
  Error,
  Omit<CalendarEvent, 'id' | 'user_id' | 'created_at' | 'updated_at'>,
  unknown
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: Omit<CalendarEvent, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      logger.debug('Calendar', 'Creating calendar event', { title: input.title, type: input.type });
      const result = await createCalendarEvent(input);
      return result;
    },
    onSuccess: (newEvent) => {
      logger.info('Calendar', 'Calendar event created successfully', { id: newEvent.id, title: newEvent.title });

      // Optimistically add to cache for immediate UI response
      queryClient.setQueryData<CalendarEvent[]>(
        queryKeys.calendar.lists(),
        (old) => {
          return old ? [...old, newEvent].sort((a, b) => a.start_date.localeCompare(b.start_date)) : [newEvent];
        }
      );

      // Emit event - DataSyncProvider handles cache invalidation
      dataEvents.emit('calendar:created', { eventId: newEvent.id!, date: newEvent.start_date });
    },
    onError: (error: Error) => {
      logger.error('Calendar', 'Failed to create calendar event', { error: error.message });
    },
  });
}

/**
 * Update an existing calendar event
 */
export function useUpdateCalendarEvent(): UseMutationResult<
  CalendarEvent,
  Error,
  { id: string; updates: Partial<CalendarEvent> },
  { previousEvents?: CalendarEvent[]; previousEvent?: CalendarEvent }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<CalendarEvent> }) => {
      logger.debug('Calendar', 'Updating calendar event', { id, updates });
      const result = await updateCalendarEvent(id, updates);
      return result;
    },
    // Optimistic update - happens BEFORE API call
    onMutate: async ({ id, updates }) => {
      logger.debug('Calendar', 'Optimistic update: updating calendar event', { id, updates });

      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: queryKeys.calendar.lists() });
      await queryClient.cancelQueries({ queryKey: queryKeys.calendar.detail(id) });

      // Snapshot the previous values for rollback
      const previousEvents = queryClient.getQueryData<CalendarEvent[]>(queryKeys.calendar.lists());
      const previousEvent = queryClient.getQueryData<CalendarEvent>(queryKeys.calendar.detail(id));

      // Optimistically update calendar event lists
      queryClient.setQueryData<CalendarEvent[]>(
        queryKeys.calendar.lists(),
        (old) => {
          return old?.map((event) =>
            event.id === id ? { ...event, ...updates } : event
          );
        }
      );

      // Optimistically update calendar event detail
      if (previousEvent) {
        queryClient.setQueryData(
          queryKeys.calendar.detail(id),
          { ...previousEvent, ...updates }
        );
      }

      // Return context with previous values for rollback
      return { previousEvents, previousEvent };
    },
    onSuccess: (updatedEvent) => {
      logger.info('Calendar', 'Calendar event updated successfully', { id: updatedEvent.id, title: updatedEvent.title });

      // Update with server response (in case server modified the data)
      queryClient.setQueryData(
        queryKeys.calendar.detail(updatedEvent.id ?? ''),
        updatedEvent
      );

      queryClient.setQueryData<CalendarEvent[]>(
        queryKeys.calendar.lists(),
        (old) => {
          return old?.map((event) =>
            event.id === updatedEvent.id ? updatedEvent : event
          );
        }
      );

      // Emit event - DataSyncProvider handles cache invalidation
      dataEvents.emit('calendar:updated', { eventId: updatedEvent.id!, date: updatedEvent.start_date });
    },
    onError: (error: Error, { id }, context) => {
      logger.error('Calendar', 'Failed to update calendar event', { error: error.message, id });

      // Rollback to previous state on error
      if (context?.previousEvents) {
        queryClient.setQueryData(queryKeys.calendar.lists(), context.previousEvents);
      }
      if (context?.previousEvent) {
        queryClient.setQueryData(queryKeys.calendar.detail(id), context.previousEvent);
      }
    },
  });
}

/**
 * Delete a calendar event
 */
export function useDeleteCalendarEvent(): UseMutationResult<void, Error, string, unknown> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      logger.debug('Calendar', 'Deleting calendar event', { id });
      await deleteCalendarEvent(id);
    },
    onSuccess: (_data, deletedId) => {
      logger.info('Calendar', 'Calendar event deleted successfully', { id: deletedId });

      // Remove from cache
      queryClient.removeQueries({ queryKey: queryKeys.calendar.detail(deletedId) });

      // Optimistically remove from list caches for immediate UI response
      queryClient.setQueryData<CalendarEvent[]>(
        queryKeys.calendar.lists(),
        (old) => {
          return old?.filter((event) => event.id !== deletedId);
        }
      );

      // Emit event - DataSyncProvider handles cache invalidation
      dataEvents.emit('calendar:deleted', { eventId: deletedId });
    },
    onError: (error: Error, id) => {
      logger.error('Calendar', 'Failed to delete calendar event', { error: error.message, id });
    },
  });
}
