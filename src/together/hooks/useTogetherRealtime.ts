/**
 * Together Feature Real-time Subscriptions
 * Listen for partner updates via Supabase real-time
 */

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { logger } from '@/services/logger';
import { milestoneKeys } from './useMilestonesQuery';
import { partnerMessageKeys } from './usePartnerMessagesQuery';
import { achievementRewardKeys } from './useAchievementRewardsQuery';

export function useTogetherRealtime(userId: string | undefined, partnerId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId || !partnerId) return;

    logger.debug('Together', 'Setting up real-time subscriptions', { userId, partnerId });

    // Subscribe to partner messages
    const messagesChannel = supabase
      .channel('partner-messages-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'partner_messages',
          filter: `recipient_id=eq.${userId}`,
        },
        (payload) => {
          logger.info('Together', 'Partner message real-time update', {
            event: payload.eventType,
            id: payload.new?.id || payload.old?.id,
          });

          // Invalidate queries to refetch data
          void queryClient.invalidateQueries({ queryKey: partnerMessageKeys.all });
        }
      )
      .subscribe();

    // Subscribe to milestones (both user's and partner's)
    const milestonesChannel = supabase
      .channel('milestones-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'milestones',
        },
        (payload) => {
          logger.info('Together', 'Milestone real-time update', {
            event: payload.eventType,
            id: payload.new?.id || payload.old?.id,
          });

          // Invalidate queries to refetch data
          void queryClient.invalidateQueries({ queryKey: milestoneKeys.all });
        }
      )
      .subscribe();

    // Subscribe to achievement rewards (challenges)
    const rewardsChannel = supabase
      .channel('achievement-rewards-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'achievement_rewards',
          filter: `recipient_id=eq.${userId}`,
        },
        (payload) => {
          logger.info('Together', 'Achievement reward real-time update', {
            event: payload.eventType,
            id: payload.new?.id || payload.old?.id,
          });

          // Invalidate queries to refetch data
          void queryClient.invalidateQueries({ queryKey: achievementRewardKeys.all });
        }
      )
      .subscribe();

    // Cleanup subscriptions on unmount
    return () => {
      logger.debug('Together', 'Cleaning up real-time subscriptions');
      void messagesChannel.unsubscribe();
      void milestonesChannel.unsubscribe();
      void rewardsChannel.unsubscribe();
    };
  }, [userId, partnerId, queryClient]);
}
