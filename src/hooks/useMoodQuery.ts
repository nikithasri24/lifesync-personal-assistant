/**
 * React Query hooks for Mood Entries
 *
 * Provides automatic caching, loading states, and cache invalidation
 * for mood tracking CRUD operations.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { MoodEntryData } from '../api/moodAPI';
import { queryKeys, queryOptions } from '@/lib/react-query';
import {
  getMoodEntries,
  getMoodEntry,
  createMoodEntry,
  updateMoodEntry,
  deleteMoodEntry,
} from '@/api/moodAPI';

// =====================================================
// MOOD ENTRIES QUERY HOOKS
// =====================================================

/**
 * Get all mood entries
 */
export function useMoodEntries() {
  return useQuery({
    queryKey: [...queryKeys.tasks.all, 'moodEntries'] as const,
    queryFn: () => getMoodEntries(),
    ...queryOptions.user,
  });
}

/**
 * Get a single mood entry by ID
 */
export function useMoodEntry(id: string | null) {
  return useQuery({
    queryKey: [...queryKeys.tasks.all, 'moodEntries', 'detail', id] as const,
    queryFn: () => getMoodEntry(id!),
    enabled: !!id,
    ...queryOptions.user,
  });
}

// =====================================================
// MOOD ENTRIES MUTATION HOOKS
// =====================================================

/**
 * Create a new mood entry
 */
export function useCreateMoodEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createMoodEntry,
    onSuccess: (newEntry) => {
      // Invalidate mood entries list
      queryClient.invalidateQueries({ queryKey: [...queryKeys.tasks.all, 'moodEntries'] });

      // Optimistically add to cache
      queryClient.setQueryData<MoodEntryData[]>(
        [...queryKeys.tasks.all, 'moodEntries'] as const,
        (old) => {
          return old ? [newEntry, ...old] : [newEntry];
        }
      );
    },
  });
}

/**
 * Update an existing mood entry
 */
export function useUpdateMoodEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<MoodEntryData> }) =>
      updateMoodEntry(id, updates),
    onSuccess: (updatedEntry) => {
      // Invalidate mood entries list
      queryClient.invalidateQueries({ queryKey: [...queryKeys.tasks.all, 'moodEntries'] });

      // Update the specific mood entry detail cache
      queryClient.setQueryData(
        [...queryKeys.tasks.all, 'moodEntries', 'detail', updatedEntry.id] as const,
        updatedEntry
      );

      // Optimistically update in list cache
      queryClient.setQueryData<MoodEntryData[]>(
        [...queryKeys.tasks.all, 'moodEntries'] as const,
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
 * Delete a mood entry
 */
export function useDeleteMoodEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteMoodEntry,
    onSuccess: (_data, deletedId) => {
      // Invalidate mood entries list
      queryClient.invalidateQueries({ queryKey: [...queryKeys.tasks.all, 'moodEntries'] });

      // Remove from detail cache
      queryClient.removeQueries({ queryKey: [...queryKeys.tasks.all, 'moodEntries', 'detail', deletedId] });

      // Optimistically remove from list cache
      queryClient.setQueryData<MoodEntryData[]>(
        [...queryKeys.tasks.all, 'moodEntries'] as const,
        (old) => {
          return old?.filter((entry) => entry.id !== deletedId);
        }
      );
    },
  });
}
