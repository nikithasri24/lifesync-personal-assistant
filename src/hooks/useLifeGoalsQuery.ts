import { useQuery, useMutation, useQueryClient, type UseQueryResult, type UseMutationResult } from '@tanstack/react-query';
import {
  getUserLifeGoals,
  getUserLifeDreams,
  createLifeGoal,
  updateLifeGoal,
  deleteLifeGoal,
  createLifeDream,
  updateLifeDream,
  deleteLifeDream,
  getLifeGoalById,
  addMilestone,
  updateMilestone,
  deleteMilestone,
  createCheckin,
  getGoalCheckins,
  recordStreak,
  getStreakHistory,
  getGoalTemplates,
  createGoalFromTemplate,
} from '@/goals/api/lifeGoalsAPI';
import { dataEvents } from '@/lib/dataEvents';
import type {
  LifeGoal,
  LifeDream,
  CreateLifeGoalInput,
  UpdateLifeGoalInput,
  CreateLifeDreamInput,
  UpdateLifeDreamInput,
  CreateMilestoneInput,
  CreateCheckinInput,
  LifeGoalWithMilestones,
  LifeGoalMilestone,
  LifeGoalCheckin,
  LifeGoalStreakEntry,
  LifeGoalTemplate,
} from '@/goals/types/lifeGoals';
import { logger } from '@/services/logger';

// ==================== Query Keys ====================

export const lifeGoalsKeys = {
  all: ['lifeGoals'] as const,
  goals: () => [...lifeGoalsKeys.all, 'goals'] as const,
  goal: (id: string) => [...lifeGoalsKeys.all, 'goal', id] as const,
  dreams: () => [...lifeGoalsKeys.all, 'dreams'] as const,
  dream: (id: string) => [...lifeGoalsKeys.all, 'dream', id] as const,
  templates: () => [...lifeGoalsKeys.all, 'templates'] as const,
  checkins: (goalId: string) => [...lifeGoalsKeys.all, 'checkins', goalId] as const,
  streaks: (goalId: string) => [...lifeGoalsKeys.all, 'streaks', goalId] as const,
};

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
      const result = await createLifeGoal(input);
      return result;
    },
    onMutate: async (input) => {
      logger.debug('Goals', 'Optimistic update: create life goal', { title: input.title });
      await queryClient.cancelQueries({ queryKey: lifeGoalsKeys.goals() });
      const previousGoals = queryClient.getQueryData<LifeGoal[]>(lifeGoalsKeys.goals());

      // Optimistic update
      const optimisticGoal: LifeGoal = {
        id: `temp-${Date.now()}`,
        userId: '',
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
        difficulty: input.difficulty ?? 'medium',
        xpReward: 100,
        streakDays: 0,
        longestStreak: 0,
        currentStreak: 0,
        streakEnabled: input.streakEnabled ?? false,
        streakFrequency: input.streakFrequency ?? 'daily',
        streakTarget: input.streakTarget,
        lastStreakUpdate: undefined,
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

      // Emit event - DataSyncProvider handles cache invalidation
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
      const result = await updateLifeGoal(goalId, updates);
      return result;
    },
    onMutate: async ({ goalId, updates }) => {
      logger.debug('Goals', 'Optimistic update: life goal', { goalId, updates });
      await queryClient.cancelQueries({ queryKey: lifeGoalsKeys.goals() });
      await queryClient.cancelQueries({ queryKey: lifeGoalsKeys.goal(goalId) });

      const previousGoals = queryClient.getQueryData<LifeGoal[]>(lifeGoalsKeys.goals());
      const previousGoal = queryClient.getQueryData<LifeGoalWithMilestones>(
        lifeGoalsKeys.goal(goalId)
      );

      // Optimistic update for list
      queryClient.setQueryData<LifeGoal[]>(lifeGoalsKeys.goals(), (old) => {
        if (!old) return old;
        return old.map((goal) =>
          goal.id === goalId ? { ...goal, ...updates, updatedAt: new Date().toISOString() } : goal
        );
      });

      // Optimistic update for single goal
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

      // Emit event - DataSyncProvider handles cache invalidation
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
      const result = await deleteLifeGoal(goalId);
      return result;
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

      // Emit event - DataSyncProvider handles cache invalidation
      dataEvents.emit('goal:deleted', { goalId });
    },
  });
}

// ==================== Life Dreams ====================

/**
 * Query all life dreams for current user
 */
export function useLifeDreamsQuery(): UseQueryResult<LifeDream[], Error> {
  return useQuery({
    queryKey: lifeGoalsKeys.dreams(),
    queryFn: getUserLifeDreams,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Create a new life dream
 */
export function useCreateLifeDreamMutation(): UseMutationResult<LifeDream, Error, CreateLifeDreamInput, unknown> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateLifeDreamInput) => {
      logger.debug('Goals', 'Creating life dream', { title: input.title, category: input.category });
      const result = await createLifeDream(input);
      return result;
    },
    onSuccess: (newDream) => {
      logger.info('Goals', 'Life dream created successfully', { id: newDream.id, title: newDream.title });
      queryClient.setQueryData<LifeDream[]>(lifeGoalsKeys.dreams(), (old) => {
        if (!old) return [newDream];
        return [newDream, ...old];
      });
    },
    onError: (error: Error, input) => {
      logger.error('Goals', 'Failed to create life dream', { error: error.message, title: input.title });
    },
  });
}

/**
 * Update a life dream
 */
export function useUpdateLifeDreamMutation(): UseMutationResult<LifeDream, Error, { dreamId: string; updates: UpdateLifeDreamInput }, unknown> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ dreamId, updates }: { dreamId: string; updates: UpdateLifeDreamInput }) => {
      logger.debug('Goals', 'Updating life dream', { dreamId, updates });
      const result = await updateLifeDream(dreamId, updates);
      return result;
    },
    onSuccess: (updatedDream, { dreamId }) => {
      logger.info('Goals', 'Life dream updated successfully', { id: dreamId, title: updatedDream.title });
      queryClient.setQueryData<LifeDream[]>(lifeGoalsKeys.dreams(), (old) => {
        if (!old) return old;
        return old.map((dream) => (dream.id === dreamId ? updatedDream : dream));
      });
    },
    onError: (error: Error, { dreamId }) => {
      logger.error('Goals', 'Failed to update life dream', { error: error.message, dreamId });
    },
  });
}

/**
 * Delete a life dream
 */
export function useDeleteLifeDreamMutation(): UseMutationResult<void, Error, string, unknown> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dreamId: string) => {
      logger.debug('Goals', 'Deleting life dream', { dreamId });
      const result = await deleteLifeDream(dreamId);
      return result;
    },
    onSuccess: (_, dreamId) => {
      logger.info('Goals', 'Life dream deleted successfully', { id: dreamId });
      queryClient.setQueryData<LifeDream[]>(lifeGoalsKeys.dreams(), (old) => {
        if (!old) return old;
        return old.filter((dream) => dream.id !== dreamId);
      });
    },
    onError: (error: Error, dreamId) => {
      logger.error('Goals', 'Failed to delete life dream', { error: error.message, dreamId });
    },
  });
}

// ==================== Milestones ====================

export function useAddMilestoneMutation(): UseMutationResult<LifeGoalMilestone, Error, CreateMilestoneInput, unknown> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateMilestoneInput) => {
      logger.debug('Goals', 'Adding milestone', { goalId: input.goalId, title: input.title });
      const result = await addMilestone(input);
      return result;
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
      goalId,
      updates,
    }: {
      milestoneId: string;
      goalId: string;
      updates: { isCompleted?: boolean; title?: string; description?: string; targetDate?: string };
    }) => {
      logger.debug('Goals', 'Updating milestone', { milestoneId, goalId, updates });
      const result = await updateMilestone(milestoneId, updates);
      return result;
    },
    onSuccess: (milestone, { goalId, updates }) => {
      logger.info('Goals', 'Milestone updated successfully', { id: milestone.id, goalId });
      void queryClient.invalidateQueries({ queryKey: lifeGoalsKeys.goal(goalId) });

      // Emit milestone completion event if completed
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
      const result = await deleteMilestone(milestoneId);
      return result;
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
      const result = await createCheckin(input);
      return result;
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

// ==================== Streaks ====================

export function useStreakHistoryQuery(goalId: string | null, limit = 30): UseQueryResult<LifeGoalStreakEntry[], Error> {
  return useQuery({
    queryKey: goalId ? lifeGoalsKeys.streaks(goalId) : ['streaks-null'],
    queryFn: () => {
      if (!goalId) throw new Error('Goal ID is required');
      return getStreakHistory(goalId, limit);
    },
    enabled: !!goalId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useRecordStreakMutation(): UseMutationResult<LifeGoalStreakEntry, Error, { goalId: string; date: string; completed: boolean; notes?: string }, unknown> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      goalId,
      date,
      completed,
      notes,
    }: {
      goalId: string;
      date: string;
      completed: boolean;
      notes?: string;
    }) => {
      logger.debug('Goals', 'Recording streak', { goalId, date, completed });
      const result = await recordStreak(goalId, date, completed, notes);
      return result;
    },
    onSuccess: (_, { goalId, date, completed }) => {
      logger.info('Goals', 'Streak recorded successfully', { goalId, date, completed });
      void queryClient.invalidateQueries({ queryKey: lifeGoalsKeys.streaks(goalId) });
      void queryClient.invalidateQueries({ queryKey: lifeGoalsKeys.goal(goalId) });
      void queryClient.invalidateQueries({ queryKey: lifeGoalsKeys.goals() });
    },
    onError: (error: Error, { goalId, date }) => {
      logger.error('Goals', 'Failed to record streak', { error: error.message, goalId, date });
    },
  });
}

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
      const result = await createGoalFromTemplate(templateId, customTitle);
      return result;
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
