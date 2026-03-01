/**
 * Habit entry query and mutation hooks.
 * Core habit hooks live in useHabitsQuery.ts.
 */

import { useQuery, useMutation, useQueryClient, type UseMutationResult, type UseQueryResult } from '@tanstack/react-query';
import type { HabitEntryData } from '../../services/types';
import { queryKeys, queryOptions } from '@/lib/react-query';
import {
  getHabitEntries,
  getHabitEntriesForHabit,
  createHabitEntry,
  updateHabitEntry,
  deleteHabitEntry,
  deleteHabitEntriesForDate,
  deleteHabitEntriesForDateRange,
  deleteAllHabitEntries,
} from '@/api/habitsAPI';
import { logger } from '@/services/logger';
import { dataEvents } from '@/lib/dataEvents';

// =====================================================
// HABIT ENTRIES QUERY HOOKS
// =====================================================

export interface HabitEntryFilters {
  habitId?: string;
  startDate?: string;
  endDate?: string;
}

export function useHabitEntries(filters?: HabitEntryFilters): UseQueryResult<HabitEntryData[], Error> {
  return useQuery({
    queryKey: [...queryKeys.tasks.all, 'habitEntries', filters] as const,
    queryFn: async () => {
      const entries = await getHabitEntries(filters);
      const todayKey = new Date().toISOString().split('T')[0];
      const todayEntries = entries.filter(e => e.date === todayKey);

      logger.debug('Habits', 'Fetched habit entries', {
        count: entries.length,
        filters,
        todayKey,
        todayEntries: todayEntries.length,
        entries: todayEntries,
        allDates: entries.map(e => e.date).slice(0, 10),
        sampleEntry: entries[0],
      });
      return entries;
    },
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
}

export function useHabitEntriesForHabit(habitId: string | null): UseQueryResult<HabitEntryData[], Error> {
  return useQuery({
    queryKey: [...queryKeys.tasks.all, 'habitEntries', 'habit', habitId] as const,
    queryFn: () => {
      if (!habitId) throw new Error('Habit ID is required');
      return getHabitEntriesForHabit(habitId);
    },
    enabled: !!habitId,
    ...queryOptions.user,
  });
}

// =====================================================
// HABIT ENTRIES MUTATION HOOKS
// =====================================================

export function useCreateHabitEntry(): UseMutationResult<
  HabitEntryData,
  Error,
  Omit<HabitEntryData, 'id' | 'created_at' | 'updated_at'>
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: Omit<HabitEntryData, 'id' | 'created_at' | 'updated_at'>) => {
      logger.debug('Habits', 'Creating habit entry', { habitId: input.habit_id, date: input.date, value: input.value, fullInput: input });
      const result = await createHabitEntry(input);
      logger.debug('Habits', 'Habit entry created - server response', { id: result.id, habitId: result.habit_id, date: result.date, value: result.value, created_at: result.created_at });
      return result;
    },
    onSuccess: (newEntry) => {
      logger.info('Habits', 'Habit entry created successfully', { id: newEntry.id, habitId: newEntry.habit_id, date: newEntry.date, value: newEntry.value });
      queryClient.invalidateQueries({ queryKey: [...queryKeys.tasks.all, 'habitEntries'] });
      dataEvents.emit('habit:entry-logged', { habitId: newEntry.habit_id, date: newEntry.date, completed: (newEntry.value ?? 0) > 0, entry: newEntry });
    },
    onError: (error: Error) => {
      logger.error('Habits', 'Failed to create habit entry', { error: error.message });
    },
  });
}

export function useUpdateHabitEntry(): UseMutationResult<HabitEntryData, Error, { id: string; updates: Partial<HabitEntryData> }> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<HabitEntryData> }) => {
      logger.debug('Habits', 'Updating habit entry', { id, updates });
      return updateHabitEntry(id, updates);
    },
    onSuccess: (updatedEntry) => {
      logger.info('Habits', 'Habit entry updated successfully', { id: updatedEntry.id, habitId: updatedEntry.habit_id });
      queryClient.invalidateQueries({ queryKey: [...queryKeys.tasks.all, 'habitEntries'] });
      dataEvents.emit('habit:entry-logged', { habitId: updatedEntry.habit_id, date: updatedEntry.date, completed: (updatedEntry.value ?? 0) > 0, entry: updatedEntry });
    },
    onError: (error: Error, { id }) => {
      logger.error('Habits', 'Failed to update habit entry', { error: error.message, id });
    },
  });
}

export function useDeleteHabitEntry(): UseMutationResult<void, Error, { id: string; habitId: string; date: string }> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, habitId }: { id: string; habitId: string; date: string }) => {
      logger.debug('Habits', 'Deleting habit entry', { id, habitId });
      return deleteHabitEntry(id, habitId);
    },
    onSuccess: (_data, { habitId, date }) => {
      logger.info('Habits', 'Habit entry deleted successfully', { habitId, date });
      queryClient.invalidateQueries({ queryKey: [...queryKeys.tasks.all, 'habitEntries'] });
      dataEvents.emit('habit:entry-logged', { habitId, date, completed: false });
    },
    onError: (error: Error, { id, habitId }) => {
      logger.error('Habits', 'Failed to delete habit entry', { error: error.message, id, habitId });
    },
  });
}

export function useDeleteHabitEntriesForDate(): UseMutationResult<void, Error, { habitId: string; date: string }> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ habitId, date }: { habitId: string; date: string }) => {
      logger.debug('Habits', 'Deleting habit entries for date', { habitId, date });
      return deleteHabitEntriesForDate(habitId, date);
    },
    onSuccess: (_data, { habitId, date }) => {
      logger.info('Habits', 'Habit entries deleted for date', { habitId, date });
      queryClient.invalidateQueries({ queryKey: [...queryKeys.tasks.all, 'habitEntries'] });
      dataEvents.emit('habit:entry-logged', { habitId, date, completed: false });
    },
    onError: (error: Error, { habitId, date }) => {
      logger.error('Habits', 'Failed to delete habit entries for date', { error: error.message, habitId, date });
    },
  });
}

export function useDeleteHabitEntriesForDateRange(): UseMutationResult<void, Error, { habitId: string; startDate: string; endDate: string }> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ habitId, startDate, endDate }: { habitId: string; startDate: string; endDate: string }) => {
      logger.debug('Habits', 'Deleting habit entries for date range', { habitId, startDate, endDate });
      return deleteHabitEntriesForDateRange(habitId, startDate, endDate);
    },
    onSuccess: (_data, { habitId, startDate }) => {
      logger.info('Habits', 'Habit entries deleted for date range', { habitId, startDate });
      queryClient.invalidateQueries({ queryKey: [...queryKeys.tasks.all, 'habitEntries'] });
      dataEvents.emit('habit:entry-logged', { habitId, date: startDate, completed: false });
    },
    onError: (error: Error, { habitId, startDate, endDate }) => {
      logger.error('Habits', 'Failed to delete habit entries for date range', { error: error.message, habitId, startDate, endDate });
    },
  });
}

export function useDeleteAllHabitEntries(): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (habitId: string) => {
      logger.debug('Habits', 'Deleting all habit entries', { habitId });
      return deleteAllHabitEntries(habitId);
    },
    onSuccess: (_data, habitId) => {
      logger.info('Habits', 'All habit entries deleted', { habitId });
      queryClient.invalidateQueries({ queryKey: [...queryKeys.tasks.all, 'habitEntries'] });
      dataEvents.emit('habit:updated', { habitId });
    },
    onError: (error: Error, habitId) => {
      logger.error('Habits', 'Failed to delete all habit entries', { error: error.message, habitId });
    },
  });
}
