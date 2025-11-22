/**
 * React Query hooks for Life Goals and Dreams
 *
 * Provides automatic caching, loading states, and cache invalidation
 * for goals and dreams CRUD operations.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, queryOptions } from '@/lib/react-query';
import {
  getUserLifeGoals,
  getLifeGoalById,
  createLifeGoal,
  updateLifeGoal,
  deleteLifeGoal,
  getUserLifeDreams,
  createLifeDream,
  updateLifeDream,
  deleteLifeDream,
  type _CreateLifeGoalInput,
  type UpdateLifeGoalInput,
  type _CreateLifeDreamInput,
  type UpdateLifeDreamInput,
} from '@/goals/api/lifeGoalsAPI';
import type { LifeGoal, LifeGoalWithMilestones, LifeDream } from '@/goals/types/lifeGoals';

// =====================================================
// GOALS QUERY HOOKS
// =====================================================

/**
 * Get all life goals
 */
export function useLifeGoals() {
  return useQuery({
    queryKey: queryKeys.goals.lists(),
    queryFn: getUserLifeGoals,
    ...queryOptions.user,
  });
}

/**
 * Get a single life goal by ID with milestones
 */
export function useLifeGoal(id: string | null) {
  return useQuery({
    queryKey: queryKeys.goals.detail(id!),
    queryFn: () => getLifeGoalById(id!),
    enabled: !!id,
    ...queryOptions.user,
  });
}

// =====================================================
// GOALS MUTATION HOOKS
// =====================================================

/**
 * Create a new life goal
 */
export function useCreateLifeGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createLifeGoal,
    onSuccess: (newGoal) => {
      // Invalidate all goals lists
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.lists() });

      // Optimistically add to cache
      queryClient.setQueryData<LifeGoal[]>(
        queryKeys.goals.lists(),
        (old) => {
          return old ? [newGoal, ...old] : [newGoal];
        }
      );
    },
  });
}

/**
 * Update an existing life goal
 */
export function useUpdateLifeGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateLifeGoalInput }) =>
      updateLifeGoal(id, updates),
    onSuccess: (updatedGoal) => {
      // Invalidate all goals lists
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.lists() });

      // Update the specific goal detail cache
      queryClient.setQueryData<LifeGoalWithMilestones>(
        queryKeys.goals.detail(updatedGoal.id),
        (old) => {
          return old ? { ...old, ...updatedGoal } : undefined;
        }
      );

      // Optimistically update in list caches
      queryClient.setQueryData<LifeGoal[]>(
        queryKeys.goals.lists(),
        (old) => {
          return old?.map((goal) =>
            goal.id === updatedGoal.id ? updatedGoal : goal
          );
        }
      );
    },
  });
}

/**
 * Delete a life goal
 */
export function useDeleteLifeGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteLifeGoal,
    onSuccess: (_data, deletedId) => {
      // Invalidate all goals lists
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.lists() });

      // Remove from cache
      queryClient.removeQueries({ queryKey: queryKeys.goals.detail(deletedId) });

      // Optimistically remove from list caches
      queryClient.setQueryData<LifeGoal[]>(
        queryKeys.goals.lists(),
        (old) => {
          return old?.filter((goal) => goal.id !== deletedId);
        }
      );
    },
  });
}

// =====================================================
// DREAMS QUERY HOOKS
// =====================================================

/**
 * Get all life dreams
 */
export function useLifeDreams() {
  return useQuery({
    queryKey: queryKeys.dreams.lists(),
    queryFn: getUserLifeDreams,
    ...queryOptions.user,
  });
}

// =====================================================
// DREAMS MUTATION HOOKS
// =====================================================

/**
 * Create a new life dream
 */
export function useCreateLifeDream() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createLifeDream,
    onSuccess: (newDream) => {
      // Invalidate all dreams lists
      queryClient.invalidateQueries({ queryKey: queryKeys.dreams.lists() });

      // Optimistically add to cache
      queryClient.setQueryData<LifeDream[]>(
        queryKeys.dreams.lists(),
        (old) => {
          return old ? [newDream, ...old] : [newDream];
        }
      );
    },
  });
}

/**
 * Update an existing life dream
 */
export function useUpdateLifeDream() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateLifeDreamInput }) =>
      updateLifeDream(id, updates),
    onSuccess: (updatedDream) => {
      // Invalidate all dreams lists
      queryClient.invalidateQueries({ queryKey: queryKeys.dreams.lists() });

      // Update the specific dream detail cache
      queryClient.setQueryData(
        queryKeys.dreams.detail(updatedDream.id),
        updatedDream
      );

      // Optimistically update in list caches
      queryClient.setQueryData<LifeDream[]>(
        queryKeys.dreams.lists(),
        (old) => {
          return old?.map((dream) =>
            dream.id === updatedDream.id ? updatedDream : dream
          );
        }
      );
    },
  });
}

/**
 * Delete a life dream
 */
export function useDeleteLifeDream() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteLifeDream,
    onSuccess: (_data, deletedId) => {
      // Invalidate all dreams lists
      queryClient.invalidateQueries({ queryKey: queryKeys.dreams.lists() });

      // Remove from cache
      queryClient.removeQueries({ queryKey: queryKeys.dreams.detail(deletedId) });

      // Optimistically remove from list caches
      queryClient.setQueryData<LifeDream[]>(
        queryKeys.dreams.lists(),
        (old) => {
          return old?.filter((dream) => dream.id !== deletedId);
        }
      );
    },
  });
}
