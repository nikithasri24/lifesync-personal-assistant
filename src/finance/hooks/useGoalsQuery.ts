import { useQuery, useMutation, useQueryClient, type UseQueryResult, type UseMutationResult } from '@tanstack/react-query';
import { getFinanceAPI } from '@/finance/data';
import type { Goal, GoalInput, GoalProgressPoint } from '@/finance/types';
import { logger } from '@/services/logger';
import { financeKeys } from './useFinanceMergedMode';

// ==================== Goals ====================

export function useGoalsQuery(): UseQueryResult<Goal[], Error> {
  return useQuery<Goal[], Error>({
    queryKey: financeKeys.goals(),
    queryFn: async () => {
      const api = await getFinanceAPI();
      return api.listGoals();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useUpsertGoalMutation(): UseMutationResult<void, Error, GoalInput, unknown> {
  const queryClient = useQueryClient();

  return useMutation<void, Error, GoalInput>({
    mutationFn: async (goal: GoalInput) => {
      logger.debug('Finance', 'Upserting goal', { id: goal.id, name: goal.name });
      const api = await getFinanceAPI();
      await api.upsertGoal(goal);
    },
    onSuccess: (_, goal) => {
      logger.info('Finance', 'Goal upserted successfully', { id: goal.id, name: goal.name });
      void queryClient.invalidateQueries({ queryKey: financeKeys.goals() });
    },
    onError: (error: Error, goal) => {
      logger.error('Finance', 'Failed to upsert goal', { error: error.message, id: goal.id });
    },
  });
}

export function useDeleteGoalMutation(): UseMutationResult<void, Error, string, unknown> {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (goalId: string) => {
      logger.debug('Finance', 'Deleting goal', { goalId });
      const api = await getFinanceAPI();
      await api.deleteGoal(goalId);
    },
    onSuccess: (_, goalId) => {
      logger.info('Finance', 'Goal deleted successfully', { id: goalId });
      void queryClient.invalidateQueries({ queryKey: financeKeys.goals() });
    },
    onError: (error: Error, goalId) => {
      logger.error('Finance', 'Failed to delete goal', { error: error.message, goalId });
    },
  });
}

export function useGoalProgressQuery(goalId: string | null): UseQueryResult<GoalProgressPoint[], Error> {
  return useQuery<GoalProgressPoint[], Error>({
    queryKey: goalId ? financeKeys.goalProgress(goalId) : ['goalProgress-null'],
    queryFn: async () => {
      if (!goalId) throw new Error('Goal ID is required');
      const api = await getFinanceAPI();
      return api.getGoalProgressHistory(goalId);
    },
    enabled: !!goalId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useSyncGoalMutation(): UseMutationResult<void, Error, string, unknown> {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (goalId: string) => {
      logger.debug('Finance', 'Syncing goal from account', { goalId });
      const api = await getFinanceAPI();
      await api.syncGoalFromAccount(goalId);
    },
    onSuccess: (_, goalId) => {
      logger.info('Finance', 'Goal synced successfully', { goalId });
      void queryClient.invalidateQueries({ queryKey: financeKeys.goals() });
      void queryClient.invalidateQueries({ queryKey: financeKeys.goalProgress(goalId) });
    },
    onError: (error: Error, goalId) => {
      logger.error('Finance', 'Failed to sync goal', { error: error.message, goalId });
    },
  });
}
