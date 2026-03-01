import { useQuery, useMutation, useQueryClient, type UseQueryResult, type UseMutationResult } from '@tanstack/react-query';
import { getGoalTemplates, createGoalFromTemplate } from '@/goals/api/lifeGoalsAPI';
import type { LifeGoal, LifeGoalTemplate } from '@/goals/types/lifeGoals';
import { logger } from '@/services/logger';
import { lifeGoalsKeys } from './lifeGoalsKeys';

// ==================== Templates ====================

export function useGoalTemplatesQuery(): UseQueryResult<LifeGoalTemplate[], Error> {
  return useQuery({
    queryKey: lifeGoalsKeys.templates(),
    queryFn: getGoalTemplates,
    staleTime: 1000 * 60 * 30, // 30 minutes (templates don't change often)
  });
}

export function useCreateGoalFromTemplateMutation(): UseMutationResult<LifeGoal, Error, { templateId: string; customTitle?: string }, unknown> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ templateId, customTitle }: { templateId: string; customTitle?: string }) => {
      logger.debug('Goals', 'Creating goal from template', { templateId, customTitle });
      return createGoalFromTemplate(templateId, customTitle);
    },
    onSuccess: (newGoal) => {
      logger.info('Goals', 'Goal created from template successfully', { id: newGoal.id, title: newGoal.title });
      queryClient.setQueryData<LifeGoal[]>(lifeGoalsKeys.goals(), (old) => {
        if (!old) return [newGoal];
        return [newGoal, ...old];
      });
    },
    onError: (error: Error, { templateId }) => {
      logger.error('Goals', 'Failed to create goal from template', { error: error.message, templateId });
    },
  });
}
