/**
 * Achievement Rewards React Query Hooks
 * Manage challenges and rewards for partners
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { logger } from '@/services/logger';
import { parseToLifeSyncError, AuthenticationError } from '@/lib/errors';
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
 */
export function useAchievementRewards(connectionId?: string) {
  return useQuery({
    queryKey: achievementRewardKeys.list(connectionId),
    queryFn: async (): Promise<AchievementReward[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      logger.debug('Together', 'Fetching achievement rewards', { connectionId });

      let query = supabase
        .from('achievement_rewards')
        .select('*')
        .order('created_at', { ascending: false });

      if (connectionId) {
        query = query.eq('connection_id', connectionId);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('Together', 'Failed to fetch achievement rewards', { error });
        throw parseToLifeSyncError(error);
      }

      return data || [];
    },
    enabled: !!connectionId,
  });
}

/**
 * Get single achievement reward by ID
 */
export function useAchievementReward(id: string) {
  return useQuery({
    queryKey: achievementRewardKeys.detail(id),
    queryFn: async (): Promise<AchievementReward> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      logger.debug('Together', 'Fetching achievement reward', { id });

      const { data, error } = await supabase
        .from('achievement_rewards')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        logger.error('Together', 'Failed to fetch achievement reward', { error, id });
        throw parseToLifeSyncError(error);
      }

      return data;
    },
    enabled: !!id,
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
      void queryClient.invalidateQueries({ queryKey: achievementRewardKeys.lists() });
      logger.info('Together', 'Achievement reward created', { id: data.id });
    },
  });
}

/**
 * Update achievement reward
 */
export function useUpdateAchievementReward() {
  const queryClient = useQueryClient();

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
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: achievementRewardKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: achievementRewardKeys.detail(data.id) });
      logger.info('Together', 'Achievement reward updated', { id: data.id });
    },
  });
}

/**
 * Delete achievement reward
 */
export function useDeleteAchievementReward() {
  const queryClient = useQueryClient();

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
      void queryClient.invalidateQueries({ queryKey: achievementRewardKeys.lists() });
      void queryClient.removeQueries({ queryKey: achievementRewardKeys.detail(id) });
      logger.info('Together', 'Achievement reward deleted', { id });
    },
  });
}
