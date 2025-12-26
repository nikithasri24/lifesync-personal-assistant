/**
 * React Query hooks for Habits and Habit Entries
 *
 * Provides automatic caching, loading states, and cache invalidation
 * for habits tracking CRUD operations.
 */

import { useQuery, useMutation, useQueryClient, type UseMutationResult, type UseQueryResult } from '@tanstack/react-query';
import type { HabitData, HabitEntryData } from '../services/types';
import { queryKeys, queryOptions } from '@/lib/react-query';
import {
  getHabits,
  getHabit,
  createHabit,
  updateHabit,
  deleteHabit,
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
import { recordHabitCompletion } from '@/services/gamification';

// =====================================================
// HABITS QUERY HOOKS
// =====================================================

export interface HabitFilters {
  category?: string;
  isActive?: boolean;
}

/**
 * Get all habits with optional filters
 */
export function useHabits(filters?: HabitFilters): UseQueryResult<HabitData[], Error> {
  return useQuery({
    queryKey: [...queryKeys.tasks.all, 'habits', filters] as const,
    queryFn: () => getHabits(filters),
    // CRITICAL: Set staleTime to 0 to ensure data is always fresh
    staleTime: 0,
    // Always refetch on mount
    refetchOnMount: true,
    // Refetch on window focus
    refetchOnWindowFocus: true,
  });
}

/**
 * Get a single habit by ID
 */
export function useHabit(id: string | null): UseQueryResult<HabitData, Error> {
  return useQuery({
    queryKey: [...queryKeys.tasks.all, 'habits', 'detail', id] as const,
    queryFn: () => {
      if (!id) throw new Error('Habit ID is required');
      return getHabit(id);
    },
    enabled: !!id,
    ...queryOptions.user,
  });
}

// =====================================================
// HABITS MUTATION HOOKS
// =====================================================

/**
 * Create a new habit
 */
export function useCreateHabit(): UseMutationResult<HabitData, Error, Omit<HabitData, 'id' | 'created_at' | 'updated_at'>> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: Omit<HabitData, 'id' | 'created_at' | 'updated_at'>) => {
      logger.debug('Habits', 'Creating habit', { name: input.name, category: input.category });
      const result = await createHabit(input);
      return result;
    },
    onSuccess: (newHabit) => {
      logger.info('Habits', 'Habit created successfully', { id: newHabit.id, name: newHabit.name });

      // Invalidate all habits lists
      void queryClient.invalidateQueries({ queryKey: [...queryKeys.tasks.all, 'habits'] });

      // Optimistically add to cache
      queryClient.setQueryData<HabitData[]>(
        [...queryKeys.tasks.all, 'habits', undefined] as const,
        (old) => {
          return old ? [newHabit, ...old] : [newHabit];
        }
      );
    },
    onError: (error: Error) => {
      logger.error('Habits', 'Failed to create habit', { error: error.message });
    },
  });
}

/**
 * Update an existing habit
 */
export function useUpdateHabit(): UseMutationResult<HabitData, Error, { id: string; updates: Partial<HabitData> }> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<HabitData> }) => {
      logger.debug('Habits', 'Updating habit', { id, updates });
      const result = await updateHabit(id, updates);
      return result;
    },
    onMutate: ({ id, updates }) => {
      logger.debug('Habits', 'Optimistic update: updating habit', { id, updates });
    },
    onSuccess: (updatedHabit) => {
      logger.info('Habits', 'Habit updated successfully', { id: updatedHabit.id, name: updatedHabit.name });

      // Invalidate all habits lists
      void queryClient.invalidateQueries({ queryKey: [...queryKeys.tasks.all, 'habits'] });

      // Update the specific habit detail cache
      queryClient.setQueryData(
        [...queryKeys.tasks.all, 'habits', 'detail', updatedHabit.id] as const,
        updatedHabit
      );

      // Optimistically update in list caches
      queryClient.setQueryData<HabitData[]>(
        [...queryKeys.tasks.all, 'habits', undefined] as const,
        (old) => {
          return old?.map((habit) =>
            habit.id === updatedHabit.id ? updatedHabit : habit
          );
        }
      );
    },
    onError: (error: Error, { id }) => {
      logger.error('Habits', 'Failed to update habit', { error: error.message, id });
    },
  });
}

/**
 * Delete a habit
 */
export function useDeleteHabit(): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      logger.debug('Habits', 'Deleting habit', { id });
      const result = await deleteHabit(id);
      return result;
    },
    onSuccess: (_data, deletedId) => {
      logger.info('Habits', 'Habit deleted successfully', { id: deletedId });

      // Invalidate all habits queries
      void queryClient.invalidateQueries({ queryKey: [...queryKeys.tasks.all, 'habits'] });

      // Remove from cache
      queryClient.removeQueries({ queryKey: [...queryKeys.tasks.all, 'habits', 'detail', deletedId] });

      // Optimistically remove from list caches
      queryClient.setQueryData<HabitData[]>(
        [...queryKeys.tasks.all, 'habits', undefined] as const,
        (old) => {
          return old?.filter((habit) => habit.id !== deletedId);
        }
      );

      // Also invalidate habit entries for this habit
      void queryClient.invalidateQueries({ queryKey: [...queryKeys.tasks.all, 'habitEntries'] });
    },
    onError: (error: Error, id) => {
      logger.error('Habits', 'Failed to delete habit', { error: error.message, id });
    },
  });
}

// =====================================================
// HABIT ENTRIES QUERY HOOKS
// =====================================================

export interface HabitEntryFilters {
  habitId?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * Get habit entries with optional filters
 */
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
        allDates: entries.map(e => e.date).slice(0, 10), // Show first 10 dates
        sampleEntry: entries[0] // Show a sample entry to see the date format
      });
      return entries;
    },
    // CRITICAL: Set staleTime to 0 to ensure data is always fresh
    staleTime: 0,
    // Always refetch on mount
    refetchOnMount: true,
    // Refetch on window focus
    refetchOnWindowFocus: true,
  });
}

/**
 * Get entries for a specific habit
 */
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

/**
 * Create a habit entry (log completion)
 */
export function useCreateHabitEntry(): UseMutationResult<
  HabitEntryData,
  Error,
  Omit<HabitEntryData, 'id' | 'created_at' | 'updated_at'>
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: Omit<HabitEntryData, 'id' | 'created_at' | 'updated_at'>) => {
      logger.debug('Habits', 'Creating habit entry', {
        habitId: input.habit_id,
        date: input.date,
        value: input.value,
        fullInput: input
      });
      const result = await createHabitEntry(input);
      logger.debug('Habits', 'Habit entry created - server response', {
        id: result.id,
        habitId: result.habit_id,
        date: result.date,
        value: result.value,
        created_at: result.created_at
      });
      return result;
    },
    // Removed optimistic update to avoid sync issues
    // Just rely on server response and invalidation
    onSuccess: async (newEntry) => {
      logger.info('Habits', 'Habit entry created successfully', {
        id: newEntry.id,
        habitId: newEntry.habit_id,
        date: newEntry.date,
        value: newEntry.value
      });

      // Record gamification points for habit completion
      recordHabitCompletion(newEntry.habit_id, 0).catch((err) => {
        logger.error('Gamification', err instanceof Error ? err : new Error(String(err)));
      });

      logger.debug('Habits', 'Invalidating habitEntries queries...');
      // Invalidate ALL habitEntries queries and WAIT for active queries to refetch
      // This ensures Dashboard and Habits page stay in sync
      await queryClient.invalidateQueries({
        queryKey: [...queryKeys.tasks.all, 'habitEntries'],
        exact: false, // Invalidate all queries that start with this key
        refetchType: 'active' // Only refetch queries that are currently being used
      });
      logger.debug('Habits', 'habitEntries queries invalidated');

      logger.debug('Habits', 'Invalidating habit detail query...');
      // Also invalidate the specific habit's data
      await queryClient.invalidateQueries({
        queryKey: [...queryKeys.tasks.all, 'habits', 'detail', newEntry.habit_id],
        refetchType: 'active'
      });
      logger.debug('Habits', 'Habit detail query invalidated');

      logger.debug('Habits', 'Invalidating habits list queries...');
      // Invalidate habits list to update completion counts
      await queryClient.invalidateQueries({
        queryKey: [...queryKeys.tasks.all, 'habits'],
        exact: false,
        refetchType: 'active'
      });
      logger.debug('Habits', 'All queries invalidated successfully');
    },
    onError: (error: Error) => {
      logger.error('Habits', 'Failed to create habit entry', { error: error.message });
    },
    // Always refetch to ensure sync with server
    onSettled: (_data, _error, input) => {
      void queryClient.invalidateQueries({ queryKey: [...queryKeys.tasks.all, 'habitEntries'] });
      void queryClient.invalidateQueries({
        queryKey: [...queryKeys.tasks.all, 'habits', 'detail', input.habit_id]
      });
      void queryClient.invalidateQueries({ queryKey: [...queryKeys.tasks.all, 'habits'] });
    },
  });
}

/**
 * Update a habit entry
 */
export function useUpdateHabitEntry(): UseMutationResult<HabitEntryData, Error, { id: string; updates: Partial<HabitEntryData> }> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<HabitEntryData> }) => {
      logger.debug('Habits', 'Updating habit entry', { id, updates });
      const result = await updateHabitEntry(id, updates);
      return result;
    },
    onSuccess: (updatedEntry) => {
      logger.info('Habits', 'Habit entry updated successfully', { id: updatedEntry.id, habitId: updatedEntry.habit_id });

      // Invalidate ALL habitEntries queries to ensure sync across Dashboard and Habits page
      void queryClient.invalidateQueries({
        queryKey: [...queryKeys.tasks.all, 'habitEntries'],
        exact: false
      });

      // Also invalidate the specific habit's data
      void queryClient.invalidateQueries({
        queryKey: [...queryKeys.tasks.all, 'habits', 'detail', updatedEntry.habit_id]
      });

      // Invalidate habits list
      void queryClient.invalidateQueries({
        queryKey: [...queryKeys.tasks.all, 'habits'],
        exact: false
      });
    },
    onError: (error: Error, { id }) => {
      logger.error('Habits', 'Failed to update habit entry', { error: error.message, id });
    },
  });
}

/**
 * Delete a habit entry
 */
export function useDeleteHabitEntry(): UseMutationResult<void, Error, { id: string; habitId: string }> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, habitId }: { id: string; habitId: string }) => {
      logger.debug('Habits', 'Deleting habit entry', { id, habitId });
      const result = await deleteHabitEntry(id, habitId);
      return result;
    },
    onSuccess: (_data, { id, habitId }) => {
      logger.info('Habits', 'Habit entry deleted successfully', { id, habitId });

      // Invalidate ALL habitEntries queries to ensure sync
      void queryClient.invalidateQueries({
        queryKey: [...queryKeys.tasks.all, 'habitEntries'],
        exact: false
      });

      // Invalidate the specific habit (to update streak/progress)
      void queryClient.invalidateQueries({
        queryKey: [...queryKeys.tasks.all, 'habits', 'detail', habitId]
      });

      // Invalidate all habits list
      void queryClient.invalidateQueries({
        queryKey: [...queryKeys.tasks.all, 'habits'],
        exact: false
      });
    },
    onError: (error: Error, { id, habitId }) => {
      logger.error('Habits', 'Failed to delete habit entry', { error: error.message, id, habitId });
    },
  });
}

/**
 * Delete all entries for a specific date (reset today's progress)
 */
export function useDeleteHabitEntriesForDate(): UseMutationResult<void, Error, { habitId: string; date: string }> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ habitId, date }: { habitId: string; date: string }) => {
      logger.debug('Habits', 'Deleting habit entries for date', { habitId, date });
      const result = await deleteHabitEntriesForDate(habitId, date);
      return result;
    },
    onSuccess: (_data, { habitId, date }) => {
      logger.info('Habits', 'Habit entries deleted for date', { habitId, date });

      // Invalidate ALL habitEntries queries to ensure sync
      void queryClient.invalidateQueries({
        queryKey: [...queryKeys.tasks.all, 'habitEntries'],
        exact: false
      });

      // Invalidate the specific habit
      void queryClient.invalidateQueries({
        queryKey: [...queryKeys.tasks.all, 'habits', 'detail', habitId]
      });

      // Invalidate all habits list
      void queryClient.invalidateQueries({
        queryKey: [...queryKeys.tasks.all, 'habits'],
        exact: false
      });
    },
    onError: (error: Error, { habitId, date }) => {
      logger.error('Habits', 'Failed to delete habit entries for date', { error: error.message, habitId, date });
    },
  });
}

/**
 * Delete all entries for a date range (reset weekly/monthly progress)
 */
export function useDeleteHabitEntriesForDateRange(): UseMutationResult<void, Error, { habitId: string; startDate: string; endDate: string }> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ habitId, startDate, endDate }: { habitId: string; startDate: string; endDate: string }) => {
      logger.debug('Habits', 'Deleting habit entries for date range', { habitId, startDate, endDate });
      const result = await deleteHabitEntriesForDateRange(habitId, startDate, endDate);
      return result;
    },
    onSuccess: (_data, { habitId, startDate, endDate }) => {
      logger.info('Habits', 'Habit entries deleted for date range', { habitId, startDate, endDate });

      // Invalidate ALL habitEntries queries to ensure sync
      void queryClient.invalidateQueries({
        queryKey: [...queryKeys.tasks.all, 'habitEntries'],
        exact: false
      });

      // Invalidate the specific habit
      void queryClient.invalidateQueries({
        queryKey: [...queryKeys.tasks.all, 'habits', 'detail', habitId]
      });

      // Invalidate all habits list
      void queryClient.invalidateQueries({
        queryKey: [...queryKeys.tasks.all, 'habits'],
        exact: false
      });
    },
    onError: (error: Error, { habitId, startDate, endDate }) => {
      logger.error('Habits', 'Failed to delete habit entries for date range', { error: error.message, habitId, startDate, endDate });
    },
  });
}

/**
 * Delete all entries for a habit (reset history)
 */
export function useDeleteAllHabitEntries(): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (habitId: string) => {
      logger.debug('Habits', 'Deleting all habit entries', { habitId });
      const result = await deleteAllHabitEntries(habitId);
      return result;
    },
    onSuccess: (_data, habitId) => {
      logger.info('Habits', 'All habit entries deleted', { habitId });

      // Invalidate ALL habitEntries queries to ensure sync
      void queryClient.invalidateQueries({
        queryKey: [...queryKeys.tasks.all, 'habitEntries'],
        exact: false
      });

      // Invalidate the specific habit
      void queryClient.invalidateQueries({
        queryKey: [...queryKeys.tasks.all, 'habits', 'detail', habitId]
      });

      // Invalidate all habits list
      void queryClient.invalidateQueries({
        queryKey: [...queryKeys.tasks.all, 'habits'],
        exact: false
      });
    },
    onError: (error: Error, habitId) => {
      logger.error('Habits', 'Failed to delete all habit entries', { error: error.message, habitId });
    },
  });
}
