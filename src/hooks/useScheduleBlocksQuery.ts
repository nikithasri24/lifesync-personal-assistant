/**
 * React Query hooks for Schedule Blocks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';
import { queryKeys, queryOptions } from '@/lib/react-query';
import type { ScheduleBlock } from '@/services/types';
import { getScheduleBlocks, createScheduleBlock, updateScheduleBlock, deleteScheduleBlock } from '@/api/schedulerAPI';
import { logger } from '@/services/logger';

export interface ScheduleBlockFilters extends Record<string, unknown> {
  startDate?: string;
  endDate?: string;
  type?: ScheduleBlock['type'];
}

/**
 * Get schedule blocks with optional filters
 */
export function useScheduleBlocks(filters?: ScheduleBlockFilters): UseQueryResult<ScheduleBlock[], Error> {
  return useQuery({
    queryKey: queryKeys.scheduleBlocks.list(filters),
    queryFn: () => getScheduleBlocks(filters),
    ...queryOptions.user,
  });
}

export function useCreateScheduleBlock(): UseMutationResult<
  ScheduleBlock,
  Error,
  Omit<ScheduleBlock, 'id' | 'user_id' | 'created_at' | 'updated_at'>
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input) => {
      logger.debug('ScheduleBlocks', 'Creating schedule block', { date: input.date });
      return createScheduleBlock(input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.scheduleBlocks.all });
    },
  });
}

export function useUpdateScheduleBlock(): UseMutationResult<
  ScheduleBlock,
  Error,
  { id: string; updates: Partial<ScheduleBlock> }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }) => {
      logger.debug('ScheduleBlocks', 'Updating schedule block', { id, updates });
      return updateScheduleBlock(id, updates);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.scheduleBlocks.all });
    },
  });
}

export function useDeleteScheduleBlock(): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      logger.debug('ScheduleBlocks', 'Deleting schedule block', { id });
      return deleteScheduleBlock(id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.scheduleBlocks.all });
    },
  });
}
