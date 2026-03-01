import { useQuery, useMutation, useQueryClient, keepPreviousData, type UseQueryResult, type UseMutationResult } from '@tanstack/react-query';
import {
  getUserLifeGoals,
  getPagedLifeGoals,
  getLifeGoalById,
  createLifeGoal,
  updateLifeGoal,
  deleteLifeGoal,
} from '@/goals/api/lifeGoalsAPI';
import { dataEvents } from '@/lib/dataEvents';
import { DEFAULT_PAGE_SIZE, type PaginatedResult } from '@/types/pagination';
import type {
  LifeGoal,
  CreateLifeGoalInput,
  UpdateLifeGoalInput,
  LifeGoalWithMilestones,
} from '@/goals/types/lifeGoals';
import { logger } from '@/services/logger';
import { lifeGoalsKeys } from './lifeGoalsKeys';

// ==================== Life Goals ====================

/**
 * Query all life goals for current user
 */
export function useLifeGoalsQuery(): UseQueryResult<LifeGoal[], Error> {
  return useQuery({
    queryKey: lifeGoalsKeys.goals(),
    queryFn: getUserLifeGoals,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Paginated life goals for the Goals tab list.
 * Leave useLifeGoalsQuery() untouched for stats/filter computations.
 */
export function usePagedLifeGoals(page = 1): UseQueryResult<PaginatedResult<LifeGoal>, Error> {
  return useQuery({
    queryKey: [...lifeGoalsKeys.goals(), 'paged', page] as const,
    queryFn: () => getPagedLifeGoals({ page, pageSize: DEFAULT_PAGE_SIZE }),
    staleTime: 1000 * 60 * 5,
    placeholderData: keepPreviousData,
  });
}

/**
 * Query single life goal with milestones
 */
export function useLifeGoalQuery(goalId: string | null): UseQueryResult<LifeGoalWithMilestones | null, Error> {
  return useQuery({
    queryKey: goalId ? lifeGoalsKeys.goal(goalId) : ['lifeGoal-null'],
    queryFn: () => {
      if (!goalId) return null;
      return getLifeGoalById(goalId);
    },
    enabled: !!goalId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

/**
 * Create a new life goal
 */
export function useCreateLifeGoalMutation(): UseMutationResult<LifeGoal, Error, CreateLifeGoalInput, { previousGoals?: LifeGoal[] }> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateLifeGoalInput) => {
      logger.debug('Goals', 'Creating life goal', { title: input.title, category: input.category });
      return createLifeGoal(input);
    },
    onMutate: async (input) => {
      logger.debug('Goals', 'Optimistic update: create life goal', { title: input.title });
      await queryClient.cancelQueries({ queryKey: lifeGoalsKeys.goals() });
      const previousGoals = queryClient.getQueryData<LifeGoal[]>(lifeGoalsKeys.goals());

      const optimisticGoal: LifeGoal = {
        id: `temp-${Date.now()}`,
        userId: '',
        trackingMode: input.trackingMode ?? 'combined',
        title: input.title,
        description: input.description,
        category: input.category,
        priority: input.priority,
        status: 'not-started',
        progress: 0,
        targetValue: input.targetValue,
        currentValue: input.currentValue ?? 0,
        unit: input.unit,
        startDate: input.startDate,
        targetDate: input.targetDate,
        completedDate: undefined,
        tags: input.tags ?? [],
        isPublic: false,
        templateId: input.templateId,
        notes: undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      queryClient.setQueryData<LifeGoal[]>(lifeGoalsKeys.goals(), (old) => {
        if (!old) return [optimisticGoal];
        return [optimisticGoal, ...old];
      });

      return { previousGoals };
    },
    onError: (err: Error, input, context) => {
      logger.error('Goals', 'Failed to create life goal', { error: err.message, title: input.title });
      if (context?.previousGoals) {
        queryClient.setQueryData(lifeGoalsKeys.goals(), context.previousGoals);
      }
    },
    onSuccess: (newGoal) => {
      logger.info('Goals', 'Life goal created successfully', { id: newGoal.id, title: newGoal.title });
      queryClient.setQueryData<LifeGoal[]>(lifeGoalsKeys.goals(), (old) => {
        if (!old) return [newGoal];
        return old.map((goal) => (goal.id.startsWith('temp-') ? newGoal : goal));
      });
      dataEvents.emit('goal:created', { goalId: newGoal.id });
    },
  });
}

/**
 * Update a life goal
 */
export function useUpdateLifeGoalMutation(): UseMutationResult<LifeGoal, Error, { goalId: string; updates: UpdateLifeGoalInput }, { previousGoals?: LifeGoal[]; previousGoal?: LifeGoalWithMilestones }> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ goalId, updates }: { goalId: string; updates: UpdateLifeGoalInput }) => {
      logger.debug('Goals', 'Updating life goal', { goalId, updates });
      return updateLifeGoal(goalId, updates);
    },
    onMutate: async ({ goalId, updates }) => {
      logger.debug('Goals', 'Optimistic update: life goal', { goalId, updates });
      await queryClient.cancelQueries({ queryKey: lifeGoalsKeys.goals() });
      await queryClient.cancelQueries({ queryKey: lifeGoalsKeys.goal(goalId) });

      const previousGoals = queryClient.getQueryData<LifeGoal[]>(lifeGoalsKeys.goals());
      const previousGoal = queryClient.getQueryData<LifeGoalWithMilestones>(lifeGoalsKeys.goal(goalId));

      queryClient.setQueryData<LifeGoal[]>(lifeGoalsKeys.goals(), (old) => {
        if (!old) return old;
        return old.map((goal) =>
          goal.id === goalId ? { ...goal, ...updates, updatedAt: new Date().toISOString() } : goal
        );
      });

      if (previousGoal) {
        queryClient.setQueryData<LifeGoalWithMilestones>(lifeGoalsKeys.goal(goalId), {
          ...previousGoal,
          ...updates,
          updatedAt: new Date().toISOString(),
        });
      }

      return { previousGoals, previousGoal };
    },
    onError: (err: Error, { goalId }, context) => {
      logger.error('Goals', 'Failed to update life goal', { error: err.message, goalId });
      if (context?.previousGoals) {
        queryClient.setQueryData(lifeGoalsKeys.goals(), context.previousGoals);
      }
      if (context?.previousGoal) {
        queryClient.setQueryData(lifeGoalsKeys.goal(goalId), context.previousGoal);
      }
    },
    onSuccess: (updatedGoal, { goalId }) => {
      logger.info('Goals', 'Life goal updated successfully', { id: goalId, title: updatedGoal.title });
      queryClient.setQueryData<LifeGoal[]>(lifeGoalsKeys.goals(), (old) => {
        if (!old) return old;
        return old.map((goal) => (goal.id === goalId ? updatedGoal : goal));
      });
      queryClient.setQueryData<LifeGoalWithMilestones>(lifeGoalsKeys.goal(goalId), (old) => {
        if (!old) return old;
        return { ...old, ...updatedGoal };
      });
      dataEvents.emit('goal:updated', { goalId });
    },
  });
}

/**
 * Delete a life goal
 */
export function useDeleteLifeGoalMutation(): UseMutationResult<void, Error, string, { previousGoals?: LifeGoal[] }> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (goalId: string) => {
      logger.debug('Goals', 'Deleting life goal', { goalId });
      return deleteLifeGoal(goalId);
    },
    onMutate: async (goalId) => {
      logger.debug('Goals', 'Optimistic update: delete life goal', { goalId });
      await queryClient.cancelQueries({ queryKey: lifeGoalsKeys.goals() });
      const previousGoals = queryClient.getQueryData<LifeGoal[]>(lifeGoalsKeys.goals());

      queryClient.setQueryData<LifeGoal[]>(lifeGoalsKeys.goals(), (old) => {
        if (!old) return old;
        return old.filter((goal) => goal.id !== goalId);
      });

      return { previousGoals };
    },
    onError: (err: Error, goalId, context) => {
      logger.error('Goals', 'Failed to delete life goal', { error: err.message, goalId });
      if (context?.previousGoals) {
        queryClient.setQueryData(lifeGoalsKeys.goals(), context.previousGoals);
      }
    },
    onSuccess: (_, goalId) => {
      logger.info('Goals', 'Life goal deleted successfully', { id: goalId });
      queryClient.removeQueries({ queryKey: lifeGoalsKeys.goal(goalId) });
      dataEvents.emit('goal:deleted', { goalId });
    },
  });
}
