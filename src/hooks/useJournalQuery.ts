/**
 * React Query hooks for Journal Entries
 *
 * Provides automatic caching, loading states, and cache invalidation
 * for journal CRUD operations.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { JournalEntry, JournalMood } from '../types';
import { queryKeys, queryOptions } from '@/lib/react-query';
import {
  getJournalEntries,
  getJournalEntry,
  createJournalEntry,
  updateJournalEntry,
  deleteJournalEntry,
  getJournalTags,
  getMoodStats,
  type CreateJournalEntryInput,
  type UpdateJournalEntryInput,
  type JournalEntryFilters,
} from '@/api/journalAPI';

// =====================================================
// QUERY HOOKS
// =====================================================

/**
 * Get all journal entries with optional filters
 */
export function useJournalEntries(filters?: JournalEntryFilters) {
  return useQuery({
    queryKey: queryKeys.journal.list(filters),
    queryFn: () => getJournalEntries(filters),
    ...queryOptions.user,
  });
}

/**
 * Get a single journal entry by ID
 */
export function useJournalEntry(id: string | null) {
  return useQuery({
    queryKey: queryKeys.journal.detail(id!),
    queryFn: () => getJournalEntry(id!),
    enabled: !!id,
    ...queryOptions.user,
  });
}

/**
 * Get all available tags
 */
export function useJournalTags() {
  return useQuery({
    queryKey: [...queryKeys.journal.all, 'tags'] as const,
    queryFn: getJournalTags,
    ...queryOptions.user,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Get mood statistics
 */
export function useMoodStats(startDate?: Date, endDate?: Date) {
  return useQuery({
    queryKey: [...queryKeys.journal.all, 'mood-stats', { startDate, endDate }] as const,
    queryFn: () => getMoodStats(startDate, endDate),
    ...queryOptions.user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// =====================================================
// MUTATION HOOKS
// =====================================================

/**
 * Create a new journal entry
 */
export function useCreateJournalEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createJournalEntry,
    onSuccess: (newEntry) => {
      // Invalidate all journal lists to refetch with new entry
      queryClient.invalidateQueries({ queryKey: queryKeys.journal.lists() });

      // Optimistically add to cache
      queryClient.setQueryData<JournalEntry[]>(
        queryKeys.journal.lists(),
        (old) => {
          return old ? [newEntry, ...old] : [newEntry];
        }
      );
    },
  });
}

/**
 * Update an existing journal entry
 */
export function useUpdateJournalEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateJournalEntryInput }) =>
      updateJournalEntry(id, updates),
    onSuccess: (updatedEntry) => {
      // Invalidate all journal lists
      queryClient.invalidateQueries({ queryKey: queryKeys.journal.lists() });

      // Update the specific entry detail cache
      queryClient.setQueryData(
        queryKeys.journal.detail(updatedEntry.id),
        updatedEntry
      );

      // Optimistically update in list caches
      queryClient.setQueryData<JournalEntry[]>(
        queryKeys.journal.lists(),
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
 * Delete a journal entry
 */
export function useDeleteJournalEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteJournalEntry,
    onSuccess: (_data, deletedId) => {
      // Invalidate all journal lists
      queryClient.invalidateQueries({ queryKey: queryKeys.journal.lists() });

      // Remove from cache
      queryClient.removeQueries({ queryKey: queryKeys.journal.detail(deletedId) });

      // Optimistically remove from list caches
      queryClient.setQueryData<JournalEntry[]>(
        queryKeys.journal.lists(),
        (old) => {
          return old?.filter((entry) => entry.id !== deletedId);
        }
      );
    },
  });
}
