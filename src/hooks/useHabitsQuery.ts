/**
 * React Query hooks for Habits and Habit Entries
 *
 * Provides automatic caching, loading states, and cache invalidation
 * for habits tracking CRUD operations.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  deleteAllHabitEntries,
} from '@/api/habitsAPI';

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
export function useHabits(filters?: HabitFilters) {
  return useQuery({
    queryKey: [...queryKeys.tasks.all, 'habits', filters] as const,
    queryFn: () => getHabits(filters),
    ...queryOptions.user,
  });
}

/**
 * Get a single habit by ID
 */
export function useHabit(id: string | null) {
  return useQuery({
    queryKey: [...queryKeys.tasks.all, 'habits', 'detail', id] as const,
    queryFn: () => getHabit(id!),
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
export function useCreateHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createHabit,
    onSuccess: (newHabit) => {
      // Invalidate all habits lists
      queryClient.invalidateQueries({ queryKey: [...queryKeys.tasks.all, 'habits'] });

      // Optimistically add to cache
      queryClient.setQueryData<HabitData[]>(
        [...queryKeys.tasks.all, 'habits', undefined] as const,
        (old) => {
          return old ? [newHabit, ...old] : [newHabit];
        }
      );
    },
  });
}

/**
 * Update an existing habit
 */
export function useUpdateHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<HabitData> }) =>
      updateHabit(id, updates),
    onSuccess: (updatedHabit) => {
      // Invalidate all habits lists
      queryClient.invalidateQueries({ queryKey: [...queryKeys.tasks.all, 'habits'] });

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
  });
}

/**
 * Delete a habit
 */
export function useDeleteHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteHabit,
    onSuccess: (_data, deletedId) => {
      // Invalidate all habits queries
      queryClient.invalidateQueries({ queryKey: [...queryKeys.tasks.all, 'habits'] });

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
      queryClient.invalidateQueries({ queryKey: [...queryKeys.tasks.all, 'habitEntries'] });
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
export function useHabitEntries(filters?: HabitEntryFilters) {
  return useQuery({
    queryKey: [...queryKeys.tasks.all, 'habitEntries', filters] as const,
    queryFn: () => getHabitEntries(filters),
    ...queryOptions.user,
  });
}

/**
 * Get entries for a specific habit
 */
export function useHabitEntriesForHabit(habitId: string | null) {
  return useQuery({
    queryKey: [...queryKeys.tasks.all, 'habitEntries', 'habit', habitId] as const,
    queryFn: () => getHabitEntriesForHabit(habitId!),
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
export function useCreateHabitEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createHabitEntry,
    onSuccess: (newEntry) => {
      // Invalidate habit entries queries
      queryClient.invalidateQueries({ queryKey: [...queryKeys.tasks.all, 'habitEntries'] });

      // Invalidate the specific habit (to update streak/progress)
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.tasks.all, 'habits', 'detail', newEntry.habit_id]
      });

      // Invalidate all habits list (to show updated streak counts)
      queryClient.invalidateQueries({ queryKey: [...queryKeys.tasks.all, 'habits'] });

      // Optimistically add to entries cache
      queryClient.setQueryData<HabitEntryData[]>(
        [...queryKeys.tasks.all, 'habitEntries', undefined] as const,
        (old) => {
          return old ? [newEntry, ...old] : [newEntry];
        }
      );
    },
  });
}

/**
 * Update a habit entry
 */
export function useUpdateHabitEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<HabitEntryData> }) =>
      updateHabitEntry(id, updates),
    onSuccess: (updatedEntry) => {
      // Invalidate habit entries queries
      queryClient.invalidateQueries({ queryKey: [...queryKeys.tasks.all, 'habitEntries'] });

      // Optimistically update in cache
      queryClient.setQueryData<HabitEntryData[]>(
        [...queryKeys.tasks.all, 'habitEntries', undefined] as const,
        (old) => {
          return old?.map((entry) =>
            entry.id === updatedEntry.id ? updatedEntry : entry
          );
        }
      );
    },
  });
}

/**
 * Delete a habit entry
 */
export function useDeleteHabitEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, habitId }: { id: string; habitId: string }) =>
      deleteHabitEntry(id, habitId),
    onSuccess: (_data, { id, habitId }) => {
      // Invalidate habit entries queries
      queryClient.invalidateQueries({ queryKey: [...queryKeys.tasks.all, 'habitEntries'] });

      // Invalidate the specific habit (to update streak/progress)
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.tasks.all, 'habits', 'detail', habitId]
      });

      // Invalidate all habits list
      queryClient.invalidateQueries({ queryKey: [...queryKeys.tasks.all, 'habits'] });

      // Optimistically remove from cache
      queryClient.setQueryData<HabitEntryData[]>(
        [...queryKeys.tasks.all, 'habitEntries', undefined] as const,
        (old) => {
          return old?.filter((entry) => entry.id !== id);
        }
      );
    },
  });
}

/**
 * Delete all entries for a specific date (reset today's progress)
 */
export function useDeleteHabitEntriesForDate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ habitId, date }: { habitId: string; date: string }) =>
      deleteHabitEntriesForDate(habitId, date),
    onSuccess: (_data, { habitId }) => {
      // Invalidate habit entries queries
      queryClient.invalidateQueries({ queryKey: [...queryKeys.tasks.all, 'habitEntries'] });

      // Invalidate the specific habit
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.tasks.all, 'habits', 'detail', habitId]
      });

      // Invalidate all habits list
      queryClient.invalidateQueries({ queryKey: [...queryKeys.tasks.all, 'habits'] });
    },
  });
}

/**
 * Delete all entries for a habit (reset history)
 */
export function useDeleteAllHabitEntries() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteAllHabitEntries,
    onSuccess: (_data, habitId) => {
      // Invalidate habit entries queries
      queryClient.invalidateQueries({ queryKey: [...queryKeys.tasks.all, 'habitEntries'] });

      // Invalidate the specific habit
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.tasks.all, 'habits', 'detail', habitId]
      });

      // Invalidate all habits list
      queryClient.invalidateQueries({ queryKey: [...queryKeys.tasks.all, 'habits'] });
    },
  });
}
