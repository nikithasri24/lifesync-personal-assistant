/**
 * Together Feature Real-time Subscriptions
 * Listen for partner updates via Supabase real-time
 */

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { logger } from '@/services/logger';
import { useToast } from '@/hooks/useToast';
import { milestoneKeys } from './useMilestonesQuery';
import { partnerMessageKeys } from './usePartnerMessagesQuery';
import { achievementRewardKeys } from './useAchievementRewardsQuery';

export function useTogetherRealtime(userId: string | undefined, partnerId: string | undefined) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  useEffect(() => {
    console.log('[🔴REALTIME🔴] Hook running!', { userId, partnerId });

    if (!userId || !partnerId) {
      console.log('[🔴REALTIME🔴] SKIPPING - missing user or partner');
      logger.debug('Together', 'Skipping real-time setup - missing user or partner', { userId, partnerId });
      return;
    }

    console.log('[🔴REALTIME🔴] Setting up subscriptions...', new Date().toISOString());
    logger.info('Together', 'Setting up real-time subscriptions', { userId, partnerId });

    // Add keepalive heartbeat to prevent disconnections
    const heartbeatInterval = setInterval(() => {
      console.log('[🔴REALTIME🔴] ⏱️ Heartbeat - subscriptions still active', new Date().toISOString());
    }, 30000); // Every 30 seconds

    // Subscribe to ALL partner messages changes
    // RLS policies will ensure user only receives updates for their accessible messages
    const messagesChannel = supabase
      .channel('partner-messages-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'partner_messages',
        },
        (payload) => {
          logger.info('Together', 'Partner message real-time update', {
            event: payload.eventType,
            messageId: payload.new?.id || payload.old?.id,
            senderId: payload.new?.sender_id,
            recipientId: payload.new?.recipient_id,
          });

          // Show toast for incoming messages (not sent by current user)
          console.log('[🔴REALTIME🔴] 💌 Message event received:', {
            eventType: payload.eventType,
            senderId: payload.new?.sender_id,
            recipientId: payload.new?.recipient_id,
            currentUserId: userId,
            partnerId: partnerId,
            title: payload.new?.title,
            status: payload.new?.status
          });

          const isIncomingMessage = payload.eventType === 'INSERT' &&
                                    payload.new?.sender_id !== userId &&
                                    payload.new?.recipient_id === userId;

          console.log('[🔴REALTIME🔴] 💌 Is incoming message?', isIncomingMessage);

          if (isIncomingMessage) {
            const messageTitle = payload.new?.title || 'New Message';
            const status = payload.new?.status;

            console.log('[🔴REALTIME🔴] 💌 Showing toast for incoming message:', { messageTitle, status });

            if (status === 'revealed' || status === 'draft') {
              // Immediate message
              showToast(`💌 ${messageTitle}`, 'success');
            } else if (status === 'scheduled') {
              // Scheduled message notification
              showToast(`📅 Your partner scheduled a surprise message: "${messageTitle}"`, 'info');
            }
          }

          // Invalidate queries to refetch data
          void queryClient.invalidateQueries({ queryKey: partnerMessageKeys.all });
        }
      )
      .subscribe((status, err) => {
        console.log('[🔴REALTIME🔴] 💌 Messages subscription status:', status, err);
        logger.info('Together', 'Messages channel subscription status', { status, error: err });

        if (status === 'SUBSCRIBED') {
          console.log('[🔴REALTIME🔴] ✅ Messages subscription ACTIVE!');
          logger.info('Together', '✅ Real-time messages subscription ACTIVE!');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[🔴REALTIME🔴] ❌ Messages ERROR:', err);
          logger.error('Together', '❌ Messages channel ERROR - realtime may not be enabled in Supabase', { error: err });
        } else if (status === 'TIMED_OUT') {
          console.error('[🔴REALTIME🔴] ⏱️ Messages TIMED OUT');
          logger.error('Together', '⏱️ Messages channel TIMED OUT');
        } else if (status === 'CLOSED') {
          console.log('[🔴REALTIME🔴] 🚪 Messages channel CLOSED');
        }
      });

    // Subscribe to ALL milestones changes
    // RLS policies will ensure user only receives updates for their accessible milestones
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

          // Show toast for new milestones
          if (payload.eventType === 'INSERT' && payload.new) {
            const milestoneName = payload.new.name || 'New Milestone';
            showToast(`🎉 Milestone added: ${milestoneName}`, 'success');
          }

          // Invalidate queries to refetch data
          void queryClient.invalidateQueries({ queryKey: milestoneKeys.all });
        }
      )
      .subscribe((status) => {
        console.log('[🔴REALTIME🔴] 🎉 Milestones subscription status:', status);
        logger.info('Together', 'Milestones channel subscription status', { status });
        if (status === 'SUBSCRIBED') {
          console.log('[🔴REALTIME🔴] ✅ Milestones subscription ACTIVE!');
          logger.info('Together', '✅ Real-time milestones subscription ACTIVE!');
        }
      });

    // Subscribe to ALL achievement rewards changes
    // RLS policies will ensure user only receives updates for their accessible rewards
    const rewardsChannel = supabase
      .channel('achievement-rewards-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'achievement_rewards',
        },
        (payload) => {
          logger.info('Together', 'Achievement reward real-time update', {
            event: payload.eventType,
            id: payload.new?.id || payload.old?.id,
          });

          // Show toast for incoming challenges/rewards
          const isIncomingReward = payload.eventType === 'INSERT' &&
                                   payload.new?.recipient_id === userId;

          if (isIncomingReward) {
            const challengeTitle = payload.new?.title || 'New Challenge';
            showToast(`🏆 ${challengeTitle}`, 'success');
          }

          // Invalidate queries to refetch data
          void queryClient.invalidateQueries({ queryKey: achievementRewardKeys.all });
        }
      )
      .subscribe((status) => {
        console.log('[🔴REALTIME🔴] 🏆 Rewards subscription status:', status);
        logger.info('Together', 'Rewards channel subscription status', { status });
        if (status === 'SUBSCRIBED') {
          console.log('[🔴REALTIME🔴] ✅ Rewards subscription ACTIVE!');
          logger.info('Together', '✅ Real-time rewards subscription ACTIVE!');
        }
      });

    // Cleanup subscriptions on unmount
    return () => {
      console.log('[🔴REALTIME🔴] 🧹 CLEANUP - Unsubscribing all channels', new Date().toISOString());
      logger.debug('Together', 'Cleaning up real-time subscriptions');
      clearInterval(heartbeatInterval);
      void messagesChannel.unsubscribe();
      void milestonesChannel.unsubscribe();
      void rewardsChannel.unsubscribe();
    };
  }, [userId, partnerId, queryClient, showToast]);
}
