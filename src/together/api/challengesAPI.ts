/**
 * Challenges API (Achievement Rewards)
 * CRUD operations for challenges and rewards with merged mode support
 */

import { supabase } from '@/lib/supabase';
import { apiCall, requireAuth } from '@/api/apiWrapper';
import { parseToLifeSyncError, ConflictError } from '@/lib/errors';
import { logger } from '@/services/logger';
import { getTogetherMergedConnection } from '../hooks/useTogetherMergedMode';
import type {
  AchievementReward,
  CreateAchievementRewardRequest,
  UpdateAchievementRewardRequest,
  ChallengeStatus,
} from '../types';

// =====================================================
// QUERIES
// =====================================================

/**
 * Get all achievement rewards for a connection (supports merged mode)
 */
export async function getAchievementRewards(connectionId?: string): Promise<AchievementReward[]> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      // Check for merged connection
      const mergedConnection = await getTogetherMergedConnection('challenges');

      let query = supabase
        .from('achievement_rewards')
        .select('*')
        .order('created_at', { ascending: false });

      // If merged mode, get challenges for both users
      // Otherwise, filter by connection
      if (mergedConnection) {
        logger.debug('Together', 'Merged mode enabled - fetching challenges for both users');
        query = query.or(
          `creator_id.eq.${user.id},recipient_id.eq.${user.id},creator_id.eq.${mergedConnection.partnerId},recipient_id.eq.${mergedConnection.partnerId}`
        );
      } else if (connectionId) {
        query = query.eq('connection_id', connectionId);
      } else {
        // No connection specified and not merged - return empty
        return [];
      }

      const { data, error } = await query;

      if (error) throw parseToLifeSyncError(error);

      return data || [];
    },
    { domain: 'Together', operation: 'getAchievementRewards' }
  );
}

/**
 * Get single achievement reward by ID
 */
export async function getAchievementReward(id: string): Promise<AchievementReward> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const { data, error } = await supabase
        .from('achievement_rewards')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw parseToLifeSyncError(error);

      return data;
    },
    { domain: 'Together', operation: 'getAchievementReward', data: { id } }
  );
}

// =====================================================
// MUTATIONS
// =====================================================

/**
 * Create new achievement reward (challenge)
 */
export async function createAchievementReward(
  request: CreateAchievementRewardRequest
): Promise<AchievementReward> {
  return apiCall(
    async () => {
      const user = await requireAuth();

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

      logger.info('Together', 'Achievement reward created', { id: data.id });
      return data;
    },
    { domain: 'Together', operation: 'createAchievementReward' }
  );
}

/**
 * Update achievement reward.
 * Pass `expectedUpdatedAt` to enable optimistic locking.
 */
export async function updateAchievementReward(
  id: string,
  updates: Partial<CreateAchievementRewardRequest> & { current_progress?: number; status?: ChallengeStatus },
  expectedUpdatedAt?: string
): Promise<AchievementReward> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      let query = supabase
        .from('achievement_rewards')
        .update(updates)
        .eq('id', id);

      if (expectedUpdatedAt) {
        query = query.eq('updated_at', expectedUpdatedAt);
      }

      const { data, error } = await query.select().maybeSingle();

      if (error) {
        logger.error('Together', 'Failed to update achievement reward', { error, id });
        throw parseToLifeSyncError(error);
      }

      if (!data) {
        throw new ConflictError(
          'This challenge was modified by another session. Please refresh and try again.'
        );
      }

      logger.info('Together', 'Achievement reward updated', { id });
      return data;
    },
    { domain: 'Together', operation: 'updateAchievementReward', data: { id } }
  );
}

/**
 * Delete achievement reward
 */
export async function deleteAchievementReward(id: string): Promise<void> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const { error } = await supabase
        .from('achievement_rewards')
        .delete()
        .eq('id', id);

      if (error) {
        logger.error('Together', 'Failed to delete achievement reward', { error, id });
        throw parseToLifeSyncError(error);
      }

      logger.info('Together', 'Achievement reward deleted', { id });
    },
    { domain: 'Together', operation: 'deleteAchievementReward', data: { id } }
  );
}
