import { useQuery, useMutation, useQueryClient, type UseQueryResult, type UseMutationResult } from '@tanstack/react-query';
import {
  getGoalsMergedConnection,
  getGoalProgressTracking,
  getPartnerGoalProgress,
  updateGoalProgressTracking,
  deleteGoalProgressTracking,
} from '@/goals/api/lifeGoalsAPI';
import type { LifeGoal, GoalProgressTracking, MergedGoalsConnectionInfo } from '@/goals/types/lifeGoals';
import { logger } from '@/services/logger';
import { lifeGoalsKeys } from './lifeGoalsKeys';

// ==================== Merged Goals ====================

/**
 * Query for merged connection status for goals module
 * Returns connection info if both users have enabled merged mode, null otherwise
 */
export function useMergedGoalsConnectionQuery(): UseQueryResult<MergedGoalsConnectionInfo | null, Error> {
  return useQuery({
    queryKey: lifeGoalsKeys.mergedConnection(),
    queryFn: async () => {
      const result = await getGoalsMergedConnection();
      if (!result) return null;
      return {
        connectionId: result.connectionId,
        partnerId: result.partnerId,
        partnerName: result.partnerName,
      } as MergedGoalsConnectionInfo;
    },
    staleTime: 1000 * 60 * 10, // 10 minutes (doesn't change often)
  });
}

/**
 * Query personal progress tracking for a list of goal IDs
 * Used in merged mode where each user tracks their own progress
 */
export function useGoalProgressTrackingQuery(goalIds: string[]): UseQueryResult<GoalProgressTracking[], Error> {
  return useQuery({
    queryKey: lifeGoalsKeys.progressTracking(goalIds),
    queryFn: async () => {
      if (goalIds.length === 0) return [];
      const rows = await getGoalProgressTracking(goalIds);
      return rows.map((row) => ({
        id: row.id,
        userId: row.user_id,
        goalId: row.goal_id,
        personalProgress: row.personal_progress,
        personalCurrentValue: row.personal_current_value ?? undefined,
        notes: row.notes ?? undefined,
        lastUpdated: row.last_updated,
        createdAt: row.created_at,
      }));
    },
    enabled: goalIds.length > 0,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

/**
 * Query partner's progress tracking for shared goals
 */
export function usePartnerGoalProgressQuery(goalIds: string[], partnerId: string | null): UseQueryResult<GoalProgressTracking[], Error> {
  return useQuery({
    queryKey: partnerId ? lifeGoalsKeys.partnerProgress(goalIds, partnerId) : ['partnerProgress-null'],
    queryFn: async () => {
      if (goalIds.length === 0 || !partnerId) return [];
      const rows = await getPartnerGoalProgress(goalIds, partnerId);
      return rows.map((row) => ({
        id: row.id,
        userId: row.user_id,
        goalId: row.goal_id,
        personalProgress: row.personal_progress,
        personalCurrentValue: row.personal_current_value ?? undefined,
        notes: row.notes ?? undefined,
        lastUpdated: row.last_updated,
        createdAt: row.created_at,
      }));
    },
    enabled: goalIds.length > 0 && !!partnerId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

/**
 * Mutation to update personal progress on a shared goal
 */
export function useUpdateGoalProgressMutation(): UseMutationResult<
  GoalProgressTracking,
  Error,
  { goalId: string; personalProgress: number; personalCurrentValue?: number; notes?: string },
  unknown
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ goalId, personalProgress, personalCurrentValue, notes }) => {
      logger.debug('Goals', 'Updating personal progress', { goalId, personalProgress });
      const row = await updateGoalProgressTracking(goalId, personalProgress, personalCurrentValue, notes);
      return {
        id: row.id,
        userId: row.user_id,
        goalId: row.goal_id,
        personalProgress: row.personal_progress,
        personalCurrentValue: row.personal_current_value ?? undefined,
        notes: row.notes ?? undefined,
        lastUpdated: row.last_updated,
        createdAt: row.created_at,
      };
    },
    onSuccess: (tracking) => {
      logger.info('Goals', 'Personal progress updated', { goalId: tracking.goalId, progress: tracking.personalProgress });
      void queryClient.invalidateQueries({ queryKey: [...lifeGoalsKeys.all, 'progressTracking'] });
      void queryClient.invalidateQueries({ queryKey: lifeGoalsKeys.goals() });
    },
    onError: (error: Error, { goalId }) => {
      logger.error('Goals', 'Failed to update personal progress', { error: error.message, goalId });
    },
  });
}

/**
 * Mutation to delete personal progress tracking for a goal
 */
export function useDeleteGoalProgressMutation(): UseMutationResult<void, Error, string, unknown> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (goalId: string) => {
      logger.debug('Goals', 'Deleting personal progress', { goalId });
      await deleteGoalProgressTracking(goalId);
    },
    onSuccess: (_, goalId) => {
      logger.info('Goals', 'Personal progress deleted', { goalId });
      void queryClient.invalidateQueries({ queryKey: [...lifeGoalsKeys.all, 'progressTracking'] });
    },
    onError: (error: Error, goalId) => {
      logger.error('Goals', 'Failed to delete personal progress', { error: error.message, goalId });
    },
  });
}

// Re-export LifeGoal for convenience (used by useCreateGoalFromTemplateMutation cache update)
export type { LifeGoal };
