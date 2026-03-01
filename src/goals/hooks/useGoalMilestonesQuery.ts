import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { addMilestone, updateMilestone, deleteMilestone } from '@/goals/api/lifeGoalsAPI';
import { dataEvents } from '@/lib/dataEvents';
import type { CreateMilestoneInput, LifeGoalMilestone } from '@/goals/types/lifeGoals';
import { logger } from '@/services/logger';
import { lifeGoalsKeys } from './lifeGoalsKeys';

// ==================== Milestones ====================

export function useAddMilestoneMutation(): UseMutationResult<LifeGoalMilestone, Error, CreateMilestoneInput, unknown> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateMilestoneInput) => {
      logger.debug('Goals', 'Adding milestone', { goalId: input.goalId, title: input.title });
      return addMilestone(input);
    },
    onSuccess: (milestone, { goalId }) => {
      logger.info('Goals', 'Milestone added successfully', { id: milestone.id, goalId, title: milestone.title });
      void queryClient.invalidateQueries({ queryKey: lifeGoalsKeys.goal(goalId) });
    },
    onError: (error: Error, input) => {
      logger.error('Goals', 'Failed to add milestone', { error: error.message, goalId: input.goalId });
    },
  });
}

export function useUpdateGoalMilestoneMutation(): UseMutationResult<LifeGoalMilestone, Error, { milestoneId: string; goalId: string; updates: { isCompleted?: boolean; title?: string; description?: string; targetDate?: string } }, unknown> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      milestoneId,
      updates,
    }: {
      milestoneId: string;
      goalId: string;
      updates: { isCompleted?: boolean; title?: string; description?: string; targetDate?: string };
    }) => {
      logger.debug('Goals', 'Updating milestone', { milestoneId, updates });
      return updateMilestone(milestoneId, updates);
    },
    onSuccess: (milestone, { goalId, updates }) => {
      logger.info('Goals', 'Milestone updated successfully', { id: milestone.id, goalId });
      void queryClient.invalidateQueries({ queryKey: lifeGoalsKeys.goal(goalId) });

      if (updates.isCompleted) {
        dataEvents.emit('goal:milestone-completed', { goalId, milestoneId: milestone.id });
      }
    },
    onError: (error: Error, { milestoneId, goalId }) => {
      logger.error('Goals', 'Failed to update milestone', { error: error.message, milestoneId, goalId });
    },
  });
}

export function useDeleteGoalMilestoneMutation(): UseMutationResult<void, Error, { milestoneId: string; goalId: string }, unknown> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ milestoneId, goalId }: { milestoneId: string; goalId: string }) => {
      logger.debug('Goals', 'Deleting milestone', { milestoneId, goalId });
      return deleteMilestone(milestoneId);
    },
    onSuccess: (_, { milestoneId, goalId }) => {
      logger.info('Goals', 'Milestone deleted successfully', { id: milestoneId, goalId });
      void queryClient.invalidateQueries({ queryKey: lifeGoalsKeys.goal(goalId) });
    },
    onError: (error: Error, { milestoneId, goalId }) => {
      logger.error('Goals', 'Failed to delete milestone', { error: error.message, milestoneId, goalId });
    },
  });
}
