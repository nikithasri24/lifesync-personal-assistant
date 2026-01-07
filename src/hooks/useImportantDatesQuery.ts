/**
 * React Query hooks for Important Dates
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryOptions } from '@/lib/react-query';
import {
  getImportantDates,
  getUpcomingDates,
  getDatesThisWeek,
  getDatesSummary,
  createImportantDate,
  updateImportantDate,
  deleteImportantDate,
} from '@/services/dates';
import type { CreateImportantDateInput, UpdateImportantDateInput } from '@/services/dates';

// Query keys
const datesKeys = {
  all: ['important-dates'] as const,
  list: () => [...datesKeys.all, 'list'] as const,
  upcoming: (days: number) => [...datesKeys.all, 'upcoming', days] as const,
  thisWeek: () => [...datesKeys.all, 'this-week'] as const,
  summary: () => [...datesKeys.all, 'summary'] as const,
};

/**
 * Get all important dates
 */
export function useImportantDates(activeOnly = true) {
  return useQuery({
    queryKey: datesKeys.list(),
    queryFn: () => getImportantDates(activeOnly),
    staleTime: queryOptions.user.staleTime,
  });
}

/**
 * Get upcoming dates within specified days
 */
export function useUpcomingDates(daysAhead = 30) {
  return useQuery({
    queryKey: datesKeys.upcoming(daysAhead),
    queryFn: () => getUpcomingDates(daysAhead),
    staleTime: queryOptions.user.staleTime,
  });
}

/**
 * Get dates coming up this week
 */
export function useDatesThisWeek() {
  return useQuery({
    queryKey: datesKeys.thisWeek(),
    queryFn: getDatesThisWeek,
    staleTime: queryOptions.user.staleTime,
  });
}

/**
 * Get dates summary
 */
export function useDatesSummary() {
  return useQuery({
    queryKey: datesKeys.summary(),
    queryFn: getDatesSummary,
    staleTime: queryOptions.user.staleTime,
  });
}

/**
 * Create a new important date
 */
export function useCreateImportantDate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateImportantDateInput) => createImportantDate(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: datesKeys.all });
    },
  });
}

/**
 * Update an important date
 */
export function useUpdateImportantDate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateImportantDateInput }) =>
      updateImportantDate(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: datesKeys.all });
    },
  });
}

/**
 * Delete an important date
 */
export function useDeleteImportantDate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteImportantDate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: datesKeys.all });
    },
  });
}

