/**
 * Achievement Rewards React Query Hooks
 * Manage challenges and rewards for partners
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { logger } from '@/services/logger';
import { parseToLifeSyncError, getUserErrorMessage, AuthenticationError } from '@/lib/errors';
import { useToast } from '@/hooks/useToast';
import {
  getAchievementRewards,
  getAchievementReward,
} from '../api/challengesAPI';
import type {
  AchievementReward,
  CreateAchievementRewardRequest,
  UpdateAchievementRewardRequest,
  ChallengeStatus,
} from '../types';

// =====================================================
// QUERY KEYS
// =====================================================

export const achievementRewardKeys = {
  all: ['achievement-rewards'] as const,
  lists: () => [...achievementRewardKeys.all, 'list'] as const,
  list: (connectionId?: string) => [...achievementRewardKeys.lists(), connectionId] as const,
  detail: (id: string) => [...achievementRewardKeys.all, id] as const,
};

// =====================================================
// QUERIES
// =====================================================

/**
 * Get all achievement rewards for a connection
 * Uses API layer which automatically handles merged mode
 * connectionId is now optional - API will fetch based on merged connection if available
 */
export function useAchievementRewards(connectionId?: string) {
  return useQuery({
    queryKey: achievementRewardKeys.list(connectionId),
    queryFn: () => getAchievementRewards(connectionId),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Get single achievement reward by ID
 * Uses API layer which automatically handles merged mode
 */
export function useAchievementReward(id: string) {
  return useQuery({
    queryKey: achievementRewardKeys.detail(id),
    queryFn: () => getAchievementReward(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });
}

// =====================================================
// MUTATIONS
// =====================================================

/**
 * Create new achievement reward (challenge)
 */
export function useCreateAchievementReward() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: async (request: CreateAchievementRewardRequest): Promise<AchievementReward> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      logger.debug('Together', 'Creating achievement reward', { request });

      const { data, error } = await supabase
        .from('achievement_rewards')
        .insert({
          ...request,
          creator_id: user.id,
          status: 'active' as ChallengeStatus,
          current_progress: 0,
        })
        .select()
        .single();

      if (error) {
        logger.error('Together', 'Failed to create achievement reward', { error });
        throw parseToLifeSyncError(error);
      }

      return data;
    },
    onSuccess: (data) => {
      showToast('Challenge created successfully!', 'success');
      // Invalidate lists only, not detail queries
      void queryClient.invalidateQueries({ queryKey: achievementRewardKeys.lists() });
      logger.info('Together', 'Achievement reward created', { id: data.id });
    },
    onError: (error) => {
      const message = getUserErrorMessage(error);
      showToast(message, 'error');
      logger.error('Together', error as Error, { operation: 'createAchievementReward' });
    },
  });
}

/**
 * Update achievement reward
 */
export function useUpdateAchievementReward() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: async (request: UpdateAchievementRewardRequest): Promise<AchievementReward> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      const { id, ...updates } = request;
      logger.debug('Together', 'Updating achievement reward', { id, updates });

      const { data, error } = await supabase
        .from('achievement_rewards')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        logger.error('Together', 'Failed to update achievement reward', { error, id });
        throw parseToLifeSyncError(error);
      }

      return data;
    },
    onMutate: async (request) => {
      const { id, ...updates } = request;

      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: achievementRewardKeys.detail(id) });
      await queryClient.cancelQueries({ queryKey: achievementRewardKeys.lists() });

      // Snapshot previous values
      const previousChallenge = queryClient.getQueryData<AchievementReward>(
        achievementRewardKeys.detail(id)
      );

      // Optimistically update detail query
      if (previousChallenge) {
        const optimisticUpdate = { ...previousChallenge, ...updates };

        // Auto-complete if progress reaches goal
        if (
          updates.current_progress !== undefined &&
          previousChallenge.target_value &&
          updates.current_progress >= previousChallenge.target_value
        ) {
          optimisticUpdate.status = 'completed';
        }

        queryClient.setQueryData<AchievementReward>(
          achievementRewardKeys.detail(id),
          optimisticUpdate
        );
      }

      // Optimistically update lists
      queryClient.setQueriesData<AchievementReward[]>(
        { queryKey: achievementRewardKeys.lists() },
        (old) => {
          if (!old) return old;
          return old.map((challenge) => {
            if (challenge.id !== id) return challenge;

            const optimisticUpdate = { ...challenge, ...updates };

            // Auto-complete if progress reaches goal
            if (
              updates.current_progress !== undefined &&
              challenge.target_value &&
              updates.current_progress >= challenge.target_value
            ) {
              optimisticUpdate.status = 'completed';
            }

            return optimisticUpdate;
          });
        }
      );

      return { previousChallenge };
    },
    onSuccess: (data) => {
      showToast('Challenge updated successfully!', 'success');
      // Update specific item in cache with server data
      queryClient.setQueryData(achievementRewardKeys.detail(data.id), data);
      // Invalidate lists only (detail query already updated)
      void queryClient.invalidateQueries({ queryKey: achievementRewardKeys.lists() });
      logger.info('Together', 'Achievement reward updated', { id: data.id });
    },
    onError: (error, request, context) => {
      // Rollback on error
      if (context?.previousChallenge) {
        queryClient.setQueryData(
          achievementRewardKeys.detail(request.id),
          context.previousChallenge
        );
      }
      void queryClient.invalidateQueries({ queryKey: achievementRewardKeys.lists() });

      const message = getUserErrorMessage(error);
      showToast(message, 'error');
      logger.error('Together', error as Error, { operation: 'updateAchievementReward' });
    },
  });
}

/**
 * Delete achievement reward
 */
export function useDeleteAchievementReward() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      logger.debug('Together', 'Deleting achievement reward', { id });

      const { error } = await supabase
        .from('achievement_rewards')
        .delete()
        .eq('id', id);

      if (error) {
        logger.error('Together', 'Failed to delete achievement reward', { error, id });
        throw parseToLifeSyncError(error);
      }
    },
    onSuccess: (_, id) => {
      showToast('Challenge deleted', 'success');
      // Remove from cache
      queryClient.removeQueries({ queryKey: achievementRewardKeys.detail(id) });
      // Invalidate lists only
      void queryClient.invalidateQueries({ queryKey: achievementRewardKeys.lists() });
      logger.info('Together', 'Achievement reward deleted', { id });
    },
    onError: (error) => {
      const message = getUserErrorMessage(error);
      showToast(message, 'error');
      logger.error('Together', error as Error, { operation: 'deleteAchievementReward' });
    },
  });
}
