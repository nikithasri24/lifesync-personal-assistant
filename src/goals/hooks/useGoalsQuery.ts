/**
 * Goals React Query Hooks - Simplified API
 *
 * This file provides a simplified interface for Goals management,
 * wrapping the comprehensive useLifeGoalsQuery.ts for easier use
 * in components that don't need the full Life Goals features.
 *
 * For full Life Goals functionality (milestones, check-ins, streaks, templates),
 * use useLifeGoalsQuery.ts directly.
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import {
  useLifeGoalsQuery,
  useLifeGoalQuery,
  useCreateLifeGoalMutation,
  useUpdateLifeGoalMutation,
  useDeleteLifeGoalMutation,
  lifeGoalsKeys,
} from './useLifeGoalsQuery';
import type {
  LifeGoal,
  CreateLifeGoalInput,
  UpdateLifeGoalInput,
  GoalStats,
  GoalStatus,
  GoalCategory,
  GoalPriority,
} from '../types/lifeGoals';

// ==================== Re-export Types ====================

export type Goal = LifeGoal;
export type GoalInput = CreateLifeGoalInput;
export type GoalUpdate = UpdateLifeGoalInput;
export type { GoalStatus, GoalCategory, GoalPriority, GoalStats };

// ==================== Query Keys ====================

export const goalsKeys = {
  all: ['goals'] as const,
  lists: () => [...goalsKeys.all, 'list'] as const,
  list: (filters?: GoalFilters) => [...goalsKeys.lists(), { filters }] as const,
  details: () => [...goalsKeys.all, 'detail'] as const,
  detail: (id: string) => [...goalsKeys.details(), id] as const,
  progress: (id: string) => [...goalsKeys.all, 'progress', id] as const,
  stats: () => [...goalsKeys.all, 'stats'] as const,
};

// ==================== Types ====================

export interface GoalFilters {
  status?: GoalStatus | GoalStatus[];
  category?: GoalCategory;
  priority?: GoalPriority;
}

export interface GoalProgress {
  goalId: string;
  progress: number; // 0-100
  currentValue?: number;
  targetValue?: number;
  unit?: string;
  status: GoalStatus;
  startDate?: string;
  targetDate?: string;
  completedDate?: string;
}

// ==================== Queries ====================

/**
 * Fetch all goals with optional filters
 */
export function useGoalsQuery(filters?: GoalFilters): UseQueryResult<Goal[], Error> {
  const { data: allGoals = [], ...rest } = useLifeGoalsQuery();

  // Apply client-side filtering
  let filteredGoals = allGoals;

  if (filters?.status) {
    const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
    filteredGoals = filteredGoals.filter(g => statuses.includes(g.status));
  }

  if (filters?.category) {
    filteredGoals = filteredGoals.filter(g => g.category === filters.category);
  }

  if (filters?.priority) {
    filteredGoals = filteredGoals.filter(g => g.priority === filters.priority);
  }

  return {
    ...rest,
    data: filteredGoals,
  } as UseQueryResult<Goal[], Error>;
}

/**
 * Fetch a single goal by ID
 */
export function useGoalQuery(goalId: string | null): UseQueryResult<Goal, Error> {
  return useLifeGoalQuery(goalId) as UseQueryResult<Goal, Error>;
}

/**
 * Get goal progress for a specific goal
 */
export function useGoalProgressQuery(goalId: string | null): UseQueryResult<GoalProgress | null, Error> {
  const { data: goal, ...rest } = useLifeGoalQuery(goalId);

  return useQuery({
    queryKey: goalId ? goalsKeys.progress(goalId) : ['goal-progress-null'],
    queryFn: () => {
      if (!goal) return null;

      return {
        goalId: goal.id,
        progress: goal.progress,
        currentValue: goal.currentValue,
        targetValue: goal.targetValue,
        unit: goal.unit,
        status: goal.status,
        startDate: goal.startDate,
        targetDate: goal.targetDate,
        completedDate: goal.completedDate ?? undefined,
      };
    },
    enabled: !!goal,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

/**
 * Get goal statistics
 */
export function useGoalStatsQuery(): UseQueryResult<GoalStats, Error> {
  const { data: goals = [] } = useLifeGoalsQuery();

  return useQuery({
    queryKey: goalsKeys.stats(),
    queryFn: () => {
      const completedGoals = goals.filter(g => g.status === 'completed');
      const totalProgress = goals.reduce((sum, g) => sum + g.progress, 0);

      return {
        total: goals.length,
        notStarted: goals.filter(g => g.status === 'not-started').length,
        inProgress: goals.filter(g => g.status === 'in-progress').length,
        completed: completedGoals.length,
        onHold: goals.filter(g => g.status === 'on-hold').length,
        abandoned: goals.filter(g => g.status === 'abandoned').length,
        totalXpEarned: completedGoals.reduce((sum, g) => sum + g.xpReward, 0),
        avgProgress: goals.length > 0 ? totalProgress / goals.length : 0,
        completionRate: goals.length > 0 ? (completedGoals.length / goals.length) * 100 : 0,
      };
    },
    enabled: goals.length > 0,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// ==================== Mutations ====================

/**
 * Create a new goal
 * Delegates to useCreateLifeGoalMutation
 */
export function useCreateGoalMutation() {
  return useCreateLifeGoalMutation();
}

/**
 * Update an existing goal
 * Delegates to useUpdateLifeGoalMutation
 */
export function useUpdateGoalMutation() {
  return useUpdateLifeGoalMutation();
}

/**
 * Delete a goal
 * Delegates to useDeleteLifeGoalMutation
 */
export function useDeleteGoalMutation() {
  return useDeleteLifeGoalMutation();
}

/**
 * Update goal progress
 * This is a convenience mutation for updating progress specifically
 */
export function useUpdateGoalProgressMutation() {
  const updateMutation = useUpdateLifeGoalMutation();

  return {
    ...updateMutation,
    mutate: (params: { goalId: string; progress: number; currentValue?: number }) => {
      const { goalId, progress, currentValue } = params;

      // Determine status based on progress
      let status: GoalStatus = 'in-progress';
      if (progress === 0) status = 'not-started';
      if (progress === 100) status = 'completed';

      updateMutation.mutate({
        goalId,
        updates: {
          progress,
          currentValue,
          status,
          completedDate: progress === 100 ? new Date().toISOString() : undefined,
        },
      });
    },
  };
}

// ==================== Helper Hooks ====================

/**
 * Get goals by status
 */
export function useGoalsByStatus(status: GoalStatus): UseQueryResult<Goal[], Error> {
  return useGoalsQuery({ status });
}

/**
 * Get goals by category
 */
export function useGoalsByCategory(category: GoalCategory): UseQueryResult<Goal[], Error> {
  return useGoalsQuery({ category });
}

/**
 * Get goals by priority
 */
export function useGoalsByPriority(priority: GoalPriority): UseQueryResult<Goal[], Error> {
  return useGoalsQuery({ priority });
}

/**
 * Get active goals (not-started or in-progress)
 */
export function useActiveGoals(): UseQueryResult<Goal[], Error> {
  return useGoalsQuery({ status: ['not-started', 'in-progress'] });
}

/**
 * Get completed goals
 */
export function useCompletedGoals(): UseQueryResult<Goal[], Error> {
  return useGoalsQuery({ status: 'completed' });
}

/**
 * Get goals with streaks enabled
 */
export function useStreakGoals(): UseQueryResult<Goal[], Error> {
  const { data: allGoals = [], ...rest } = useLifeGoalsQuery();

  const streakGoals = allGoals.filter(g => g.streakEnabled);

  return {
    ...rest,
    data: streakGoals,
  } as UseQueryResult<Goal[], Error>;
}

/**
 * Get overdue goals
 */
export function useOverdueGoals(): UseQueryResult<Goal[], Error> {
  const { data: allGoals = [], ...rest } = useLifeGoalsQuery();

  const now = new Date().toISOString();
  const overdueGoals = allGoals.filter(
    g => g.targetDate && g.targetDate < now && g.status !== 'completed'
  );

  return {
    ...rest,
    data: overdueGoals,
  } as UseQueryResult<Goal[], Error>;
}

/**
 * Get goals by difficulty
 */
export function useGoalsByDifficulty(difficulty: Goal['difficulty']): UseQueryResult<Goal[], Error> {
  const { data: allGoals = [], ...rest } = useLifeGoalsQuery();

  const filteredGoals = allGoals.filter(g => g.difficulty === difficulty);

  return {
    ...rest,
    data: filteredGoals,
  } as UseQueryResult<Goal[], Error>;
}

// ==================== Re-export Life Goals Keys ====================
// For advanced usage, expose the life goals keys
export { lifeGoalsKeys };
