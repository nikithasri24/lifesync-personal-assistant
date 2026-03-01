import { useQuery, useMutation, useQueryClient, type UseMutationResult, type UseQueryResult } from '@tanstack/react-query';
import { queryKeys, queryOptions } from '@/lib/react-query';
import { getPersonalCareLogs, logPersonalCareCompletion, deletePersonalCareLog } from '@/api/personalCareAPI';
import { logger } from '@/services/logger';
import type { PersonalCareLog, PersonalCareLogInput } from '@/skincare/personalCareTypes';

// =====================================================
// LOGS QUERY HOOKS
// =====================================================

export interface PersonalCareLogFilters extends Record<string, unknown> {
  itemId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}

export function usePersonalCareLogs(filters?: PersonalCareLogFilters): UseQueryResult<PersonalCareLog[], Error> {
  return useQuery({
    queryKey: queryKeys.personalCare.logs.list(filters),
    queryFn: () => getPersonalCareLogs(filters),
    ...queryOptions.user,
  });
}

export function useItemLogs(itemId: string, limit?: number): UseQueryResult<PersonalCareLog[], Error> {
  return useQuery({
    queryKey: queryKeys.personalCare.logs.forItem(itemId),
    queryFn: () => getPersonalCareLogs({ itemId, limit }),
    enabled: !!itemId,
    ...queryOptions.user,
  });
}

export function useLogCompletion(): UseMutationResult<PersonalCareLog, Error, PersonalCareLogInput> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: PersonalCareLogInput) => {
      logger.debug('PersonalCare', 'Logging completion', { itemId: input.itemId });
      return logPersonalCareCompletion(input);
    },
    onSuccess: (log) => {
      logger.info('PersonalCare', 'Completion logged', { id: log.id, itemId: log.itemId });
      // Invalidate logs and items (items have lastCompletedAt/nextDueDate updated)
      queryClient.invalidateQueries({ queryKey: queryKeys.personalCare.logs.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.personalCare.items.all() });
    },
    onError: (error: Error) => {
      logger.error('PersonalCare', 'Failed to log completion', { error: error.message });
    },
  });
}

export function useDeleteLog(): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      logger.debug('PersonalCare', 'Deleting log', { id });
      return deletePersonalCareLog(id);
    },
    onSuccess: (_, id) => {
      logger.info('PersonalCare', 'Log deleted', { id });
      queryClient.invalidateQueries({ queryKey: queryKeys.personalCare.logs.all() });
    },
    onError: (error: Error, id) => {
      logger.error('PersonalCare', 'Failed to delete log', { error: error.message, id });
    },
  });
}
