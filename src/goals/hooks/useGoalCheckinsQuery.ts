import { useQuery, useMutation, useQueryClient, type UseQueryResult, type UseMutationResult } from '@tanstack/react-query';
import { getGoalCheckins, createCheckin } from '@/goals/api/lifeGoalsAPI';
import type { LifeGoalCheckin, CreateCheckinInput } from '@/goals/types/lifeGoals';
import { logger } from '@/services/logger';
import { lifeGoalsKeys } from './lifeGoalsKeys';

// ==================== Check-ins ====================

export function useGoalCheckinsQuery(goalId: string | null): UseQueryResult<LifeGoalCheckin[], Error> {
  return useQuery({
    queryKey: goalId ? lifeGoalsKeys.checkins(goalId) : ['checkins-null'],
    queryFn: () => {
      if (!goalId) throw new Error('Goal ID is required');
      return getGoalCheckins(goalId);
    },
    enabled: !!goalId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useCreateCheckinMutation(): UseMutationResult<LifeGoalCheckin, Error, CreateCheckinInput, unknown> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateCheckinInput) => {
      logger.debug('Goals', 'Creating check-in', { goalId: input.goalId, progressUpdate: input.progressUpdate });
      return createCheckin(input);
    },
    onSuccess: (checkin, { goalId }) => {
      logger.info('Goals', 'Check-in created successfully', { id: checkin.id, goalId });
      void queryClient.invalidateQueries({ queryKey: lifeGoalsKeys.checkins(goalId) });
    },
    onError: (error: Error, input) => {
      logger.error('Goals', 'Failed to create check-in', { error: error.message, goalId: input.goalId });
    },
  });
}
