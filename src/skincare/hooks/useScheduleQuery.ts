import { useQuery, useMutation, useQueryClient, type UseMutationResult, type UseQueryResult } from '@tanstack/react-query';
import { queryKeys, queryOptions } from '@/lib/react-query';
import { getMonthSchedule, scheduleItem, updateScheduleStatus, removeScheduledItem } from '@/api/personalCareAPI';
import { logger } from '@/services/logger';
import type { PersonalCareSchedule, PersonalCareScheduleWithItem, ScheduleStatus } from '@/skincare/personalCareTypes';

// =====================================================
// SCHEDULE (CALENDAR) QUERY HOOKS
// =====================================================

export function useMonthSchedule(year: number, month: number): UseQueryResult<PersonalCareScheduleWithItem[], Error> {
  return useQuery({
    queryKey: queryKeys.personalCare.schedule.month(year, month),
    queryFn: async () => {
      logger.debug('PersonalCare', 'Fetching month schedule', { year, month });
      return getMonthSchedule(year, month);
    },
    staleTime: queryOptions.user.staleTime,
  });
}

export function useScheduleItem(): UseMutationResult<PersonalCareSchedule, Error, { itemId: string; scheduledDate: string }> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemId, scheduledDate }) => {
      logger.debug('PersonalCare', 'Scheduling item', { itemId, scheduledDate });
      return scheduleItem(itemId, scheduledDate);
    },
    onSuccess: (result) => {
      logger.info('PersonalCare', 'Item scheduled', { id: result.id });
      queryClient.invalidateQueries({ queryKey: queryKeys.personalCare.schedule.all() });
    },
    onError: (error: Error) => {
      logger.error('PersonalCare', 'Failed to schedule item', { error: error.message });
    },
  });
}

export function useUpdateScheduleStatus(): UseMutationResult<PersonalCareSchedule, Error, { scheduleId: string; status: ScheduleStatus; notes?: string }> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ scheduleId, status, notes }) => {
      logger.debug('PersonalCare', 'Updating schedule status', { scheduleId, status });
      return updateScheduleStatus(scheduleId, status, notes);
    },
    onSuccess: (result) => {
      logger.info('PersonalCare', 'Schedule status updated', { id: result.id, status: result.status });
      queryClient.invalidateQueries({ queryKey: queryKeys.personalCare.schedule.all() });
      // Also invalidate logs since completing creates a log entry
      queryClient.invalidateQueries({ queryKey: queryKeys.personalCare.logs.all() });
    },
    onError: (error: Error) => {
      logger.error('PersonalCare', 'Failed to update schedule status', { error: error.message });
    },
  });
}

export function useRemoveScheduledItem(): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (scheduleId: string) => {
      logger.debug('PersonalCare', 'Removing scheduled item', { scheduleId });
      return removeScheduledItem(scheduleId);
    },
    onSuccess: (_, scheduleId) => {
      logger.info('PersonalCare', 'Scheduled item removed', { scheduleId });
      queryClient.invalidateQueries({ queryKey: queryKeys.personalCare.schedule.all() });
    },
    onError: (error: Error) => {
      logger.error('PersonalCare', 'Failed to remove scheduled item', { error: error.message });
    },
  });
}
