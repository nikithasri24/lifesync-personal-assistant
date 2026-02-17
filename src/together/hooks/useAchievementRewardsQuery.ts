/**
 * Achievement Rewards React Query Hooks
 * Manage gamified challenges linked to habits/goals with unlockable rewards
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { logger } from '@/services/logger';
import { parseToLifeSyncError, AuthenticationError } from '@/lib/errors';
import type {
  AchievementReward,
  CreateAchievementRewardRequest,
  UpdateAchievementRewardRequest,
  ChallengeFilters,
} from '../types';

// =====================================================
// QUERY KEYS
// =====================================================

export const achievementRewardKeys = {
  all: ['achievement-rewards'] as const,
  lists: () => [...achievementRewardKeys.all, 'list'] as const,
  list: (filters?: ChallengeFilters) => [...achievementRewardKeys.lists(), filters] as const,
  active: () => [...achievementRewardKeys.all, 'active'] as const,
  detail: (id: string) => [...achievementRewardKeys.all, id] as const,
};

// =====================================================
// QUERIES
// =====================================================

/**
 * Get all achievement rewards with optional filters
 */
export function useAchievementRewards(filters?: ChallengeFilters) {
  return useQuery({
    queryKey: achievementRewardKeys.list(filters),
    queryFn: async (): Promise<AchievementReward[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      logger.debug('Together', 'Fetching achievement rewards', { filters });

      let query = supabase
        .from('achievement_rewards')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.linked_type) {
        query = query.eq('linked_type', filters.linked_type);
      }
      if (filters?.is_recipient) {
        query = query.eq('recipient_id', user.id);
      }
      if (filters?.is_creator) {
        query = query.eq('creator_id', user.id);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('Together', 'Failed to fetch achievement rewards', { error });
        throw parseToLifeSyncError(error);
      }

      logger.debug('Together', 'Achievement rewards fetched', { count: data?.length || 0 });
      return data || [];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Get active challenges (using view for computed fields)
 */
export function useActiveChallenges() {
  return useQuery({
    queryKey: achievementRewardKeys.active(),
    queryFn: async (): Promise<AchievementReward[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      logger.debug('Together', 'Fetching active challenges');

      const { data, error } = await supabase
        .from('active_challenges')
        .select('*');

      if (error) {
        logger.error('Together', 'Failed to fetch active challenges', { error });
        throw parseToLifeSyncError(error);
      }

      logger.debug('Together', 'Active challenges fetched', { count: data?.length || 0 });
      return (data || []) as AchievementReward[];
    },
    staleTime: 1 * 60 * 1000, // 1 minute (check frequently for progress)
  });
}

/**
 * Get single achievement reward by ID
 */
export function useAchievementReward(id: string) {
  return useQuery({
    queryKey: achievementRewardKeys.detail(id),
    queryFn: async (): Promise<AchievementReward | null> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      logger.debug('Together', 'Fetching achievement reward', { id });

      const { data, error } = await supabase
        .from('achievement_rewards')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        logger.error('Together', 'Failed to fetch achievement reward', { error });
        throw parseToLifeSyncError(error);
      }

      return data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

// =====================================================
// MUTATIONS
// =====================================================

/**
 * Create new achievement reward
 */
export function useCreateAchievementReward() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      reward: CreateAchievementRewardRequest
    ): Promise<AchievementReward> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      logger.debug('Together', 'Creating achievement reward', {
        linkedType: reward.linked_type,
      });

      const { data, error } = await supabase
        .from('achievement_rewards')
        .insert({
          creator_id: user.id,
          ...reward,
          current_progress: 0,
          status: 'active',
        })
        .select()
        .single();

      if (error) {
        logger.error('Together', 'Failed to create achievement reward', { error });
        throw parseToLifeSyncError(error);
      }

      logger.info('Together', 'Achievement reward created', { id: data.id });
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: achievementRewardKeys.all });
    },
  });
}

/**
 * Update achievement reward (including progress)
 */
export function useUpdateAchievementReward() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: UpdateAchievementRewardRequest): Promise<AchievementReward> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      logger.debug('Together', 'Updating achievement reward', { id, updates });

      // If progress meets target, mark as completed
      const shouldComplete =
        updates.current_progress !== undefined &&
        updates.current_progress !== null;

      // Fetch current reward to check target
      if (shouldComplete) {
        const { data: current } = await supabase
          .from('achievement_rewards')
          .select('target_value')
          .eq('id', id)
          .single();

        if (
          current &&
          current.target_value &&
          updates.current_progress! >= current.target_value
        ) {
          updates.status = 'completed';
          updates.completed_at = new Date().toISOString();
        }
      }

      const { data, error } = await supabase
        .from('achievement_rewards')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        logger.error('Together', 'Failed to update achievement reward', { error });
        throw parseToLifeSyncError(error);
      }

      logger.info('Together', 'Achievement reward updated', { id });
      return data;
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: achievementRewardKeys.all });
      void queryClient.invalidateQueries({ queryKey: achievementRewardKeys.detail(data.id) });
    },
  });
}

/**
 * Complete achievement reward (unlock)
 */
export function useCompleteAchievementReward() {
  const { mutate: update } = useUpdateAchievementReward();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      logger.debug('Together', 'Completing achievement reward', { id });

      update({
        id,
        status: 'completed',
        completed_at: new Date().toISOString(),
      });
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
        .eq('id', id)
        .eq('creator_id', user.id); // Only creator can delete

      if (error) {
        logger.error('Together', 'Failed to delete achievement reward', { error });
        throw parseToLifeSyncError(error);
      }

      logger.info('Together', 'Achievement reward deleted', { id });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: achievementRewardKeys.all });
    },
  });
}
