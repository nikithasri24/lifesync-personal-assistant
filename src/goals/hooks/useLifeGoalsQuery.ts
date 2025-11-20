import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
} from '../api/lifeGoalsAPI';
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
} from '../types/lifeGoals';

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
export function useLifeGoalsQuery() {
  return useQuery({
    queryKey: lifeGoalsKeys.goals(),
    queryFn: getUserLifeGoals,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Query single life goal with milestones
 */
export function useLifeGoalQuery(goalId: string | null) {
  return useQuery({
    queryKey: goalId ? lifeGoalsKeys.goal(goalId) : ['lifeGoal-null'],
    queryFn: () => {
      if (!goalId) throw new Error('Goal ID is required');
      return getLifeGoalById(goalId);
    },
    enabled: !!goalId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

/**
 * Create a new life goal
 */
export function useCreateLifeGoalMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateLifeGoalInput) => createLifeGoal(input),
    onMutate: async (input) => {
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
        currentValue: input.currentValue || 0,
        unit: input.unit,
        startDate: input.startDate,
        targetDate: input.targetDate,
        completedDate: null,
        difficulty: input.difficulty || 'medium',
        xpReward: 100,
        streakDays: 0,
        longestStreak: 0,
        currentStreak: 0,
        streakEnabled: input.streakEnabled || false,
        streakFrequency: input.streakFrequency || 'daily',
        streakTarget: input.streakTarget,
        lastStreakUpdate: null,
        tags: input.tags || [],
        isPublic: false,
        templateId: input.templateId,
        notes: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      queryClient.setQueryData<LifeGoal[]>(lifeGoalsKeys.goals(), (old) => {
        if (!old) return [optimisticGoal];
        return [optimisticGoal, ...old];
      });

      return { previousGoals };
    },
    onError: (err, variables, context) => {
      if (context?.previousGoals) {
        queryClient.setQueryData(lifeGoalsKeys.goals(), context.previousGoals);
      }
    },
    onSuccess: (newGoal) => {
      queryClient.setQueryData<LifeGoal[]>(lifeGoalsKeys.goals(), (old) => {
        if (!old) return [newGoal];
        return old.map((goal) => (goal.id.startsWith('temp-') ? newGoal : goal));
      });
    },
  });
}

/**
 * Update a life goal
 */
export function useUpdateLifeGoalMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ goalId, updates }: { goalId: string; updates: UpdateLifeGoalInput }) =>
      updateLifeGoal(goalId, updates),
    onMutate: async ({ goalId, updates }) => {
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
    onError: (err, { goalId }, context) => {
      if (context?.previousGoals) {
        queryClient.setQueryData(lifeGoalsKeys.goals(), context.previousGoals);
      }
      if (context?.previousGoal) {
        queryClient.setQueryData(lifeGoalsKeys.goal(goalId), context.previousGoal);
      }
    },
    onSuccess: (updatedGoal, { goalId }) => {
      queryClient.setQueryData<LifeGoal[]>(lifeGoalsKeys.goals(), (old) => {
        if (!old) return old;
        return old.map((goal) => (goal.id === goalId ? updatedGoal : goal));
      });
      queryClient.setQueryData<LifeGoalWithMilestones>(lifeGoalsKeys.goal(goalId), (old) => {
        if (!old) return old;
        return { ...old, ...updatedGoal };
      });
    },
  });
}

/**
 * Delete a life goal
 */
export function useDeleteLifeGoalMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (goalId: string) => deleteLifeGoal(goalId),
    onMutate: async (goalId) => {
      await queryClient.cancelQueries({ queryKey: lifeGoalsKeys.goals() });
      const previousGoals = queryClient.getQueryData<LifeGoal[]>(lifeGoalsKeys.goals());

      queryClient.setQueryData<LifeGoal[]>(lifeGoalsKeys.goals(), (old) => {
        if (!old) return old;
        return old.filter((goal) => goal.id !== goalId);
      });

      return { previousGoals };
    },
    onError: (err, goalId, context) => {
      if (context?.previousGoals) {
        queryClient.setQueryData(lifeGoalsKeys.goals(), context.previousGoals);
      }
    },
    onSuccess: (_, goalId) => {
      queryClient.removeQueries({ queryKey: lifeGoalsKeys.goal(goalId) });
    },
  });
}

// ==================== Life Dreams ====================

/**
 * Query all life dreams for current user
 */
export function useLifeDreamsQuery() {
  return useQuery({
    queryKey: lifeGoalsKeys.dreams(),
    queryFn: getUserLifeDreams,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Create a new life dream
 */
export function useCreateLifeDreamMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateLifeDreamInput) => createLifeDream(input),
    onSuccess: (newDream) => {
      queryClient.setQueryData<LifeDream[]>(lifeGoalsKeys.dreams(), (old) => {
        if (!old) return [newDream];
        return [newDream, ...old];
      });
    },
  });
}

/**
 * Update a life dream
 */
export function useUpdateLifeDreamMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ dreamId, updates }: { dreamId: string; updates: UpdateLifeDreamInput }) =>
      updateLifeDream(dreamId, updates),
    onSuccess: (updatedDream, { dreamId }) => {
      queryClient.setQueryData<LifeDream[]>(lifeGoalsKeys.dreams(), (old) => {
        if (!old) return old;
        return old.map((dream) => (dream.id === dreamId ? updatedDream : dream));
      });
    },
  });
}

/**
 * Delete a life dream
 */
export function useDeleteLifeDreamMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dreamId: string) => deleteLifeDream(dreamId),
    onSuccess: (_, dreamId) => {
      queryClient.setQueryData<LifeDream[]>(lifeGoalsKeys.dreams(), (old) => {
        if (!old) return old;
        return old.filter((dream) => dream.id !== dreamId);
      });
    },
  });
}

// ==================== Milestones ====================

export function useAddMilestoneMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateMilestoneInput) => addMilestone(input),
    onSuccess: (_, { goalId }) => {
      queryClient.invalidateQueries({ queryKey: lifeGoalsKeys.goal(goalId) });
    },
  });
}

export function useUpdateMilestoneMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      milestoneId,
      goalId,
      updates,
    }: {
      milestoneId: string;
      goalId: string;
      updates: { isCompleted?: boolean; title?: string; description?: string; targetDate?: string };
    }) => updateMilestone(milestoneId, updates),
    onSuccess: (_, { goalId }) => {
      queryClient.invalidateQueries({ queryKey: lifeGoalsKeys.goal(goalId) });
    },
  });
}

export function useDeleteMilestoneMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ milestoneId, goalId }: { milestoneId: string; goalId: string }) =>
      deleteMilestone(milestoneId),
    onSuccess: (_, { goalId }) => {
      queryClient.invalidateQueries({ queryKey: lifeGoalsKeys.goal(goalId) });
    },
  });
}

// ==================== Check-ins ====================

export function useGoalCheckinsQuery(goalId: string | null) {
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

export function useCreateCheckinMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateCheckinInput) => createCheckin(input),
    onSuccess: (_, { goalId }) => {
      queryClient.invalidateQueries({ queryKey: lifeGoalsKeys.checkins(goalId) });
    },
  });
}

// ==================== Streaks ====================

export function useStreakHistoryQuery(goalId: string | null, limit = 30) {
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

export function useRecordStreakMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      goalId,
      date,
      completed,
      notes,
    }: {
      goalId: string;
      date: string;
      completed: boolean;
      notes?: string;
    }) => recordStreak(goalId, date, completed, notes),
    onSuccess: (_, { goalId }) => {
      queryClient.invalidateQueries({ queryKey: lifeGoalsKeys.streaks(goalId) });
      queryClient.invalidateQueries({ queryKey: lifeGoalsKeys.goal(goalId) });
      queryClient.invalidateQueries({ queryKey: lifeGoalsKeys.goals() });
    },
  });
}

// ==================== Templates ====================

export function useGoalTemplatesQuery() {
  return useQuery({
    queryKey: lifeGoalsKeys.templates(),
    queryFn: getGoalTemplates,
    staleTime: 1000 * 60 * 30, // 30 minutes (templates don't change often)
  });
}

export function useCreateGoalFromTemplateMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ templateId, customTitle }: { templateId: string; customTitle?: string }) =>
      createGoalFromTemplate(templateId, customTitle),
    onSuccess: (newGoal) => {
      queryClient.setQueryData<LifeGoal[]>(lifeGoalsKeys.goals(), (old) => {
        if (!old) return [newGoal];
        return [newGoal, ...old];
      });
    },
  });
}
