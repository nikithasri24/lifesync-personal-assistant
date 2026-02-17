/**
 * Message Reveal Listener
 * Monitors for messages that should be revealed based on triggers
 */

import React, { useEffect, useState } from 'react';
import { usePendingMessageReveals } from '../hooks/usePartnerMessagesQuery';
import { useAchievementRewards } from '../hooks/useAchievementRewardsQuery';
import { MessageRevealNotification } from './MessageRevealNotification';
import type { PartnerMessage } from '../types';
import { logger } from '@/services/logger';

export const MessageRevealListener: React.FC = () => {
  const [revealQueue, setRevealQueue] = useState<PartnerMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState<PartnerMessage | null>(null);

  const { data: pendingMessages = [] } = usePendingMessageReveals();
  const { data: achievements = [] } = useAchievementRewards();

  useEffect(() => {
    if (pendingMessages.length === 0) return;

    logger.debug('Together', 'Checking for messages to reveal', {
      count: pendingMessages.length,
    });

    const now = new Date();
    const messagesToReveal: PartnerMessage[] = [];

    for (const message of pendingMessages) {
      // Check if message should be revealed based on trigger
      let shouldReveal = false;

      switch (message.reveal_trigger) {
        case 'first_login':
          // Reveal on user's first login after message was sent
          shouldReveal = true;
          logger.info('Together', 'Revealing first_login message', {
            messageId: message.id,
          });
          break;

        case 'specific_date':
          // Reveal if scheduled time has passed
          if (message.reveal_date) {
            const scheduledTime = new Date(message.reveal_date);
            shouldReveal = now >= scheduledTime;
            if (shouldReveal) {
              logger.info('Together', 'Revealing scheduled message', {
                messageId: message.id,
                revealDate: message.reveal_date,
              });
            }
          }
          break;

        case 'achievement':
          // Check if linked achievement is completed
          if (message.achievement_id) {
            const linkedAchievement = achievements.find(
              (a) => a.id === message.achievement_id
            );

            if (linkedAchievement && linkedAchievement.status === 'completed') {
              shouldReveal = true;
              logger.info('Together', 'Revealing achievement-linked message', {
                messageId: message.id,
                achievementId: message.achievement_id,
                achievementTitle: linkedAchievement.title,
              });
            }
          }
          break;

        case 'manual':
          // Manual reveal - don't auto-reveal
          break;
      }

      if (shouldReveal) {
        messagesToReveal.push(message);
      }
    }

    if (messagesToReveal.length > 0) {
      logger.info('Together', 'Messages ready to reveal', {
        count: messagesToReveal.length,
      });
      setRevealQueue(messagesToReveal);
      setCurrentMessage(messagesToReveal[0]);
    }
  }, [pendingMessages, achievements]);

  const handleCloseReveal = () => {
    // Move to next message in queue
    const nextQueue = revealQueue.slice(1);
    setRevealQueue(nextQueue);

    if (nextQueue.length > 0) {
      setCurrentMessage(nextQueue[0]);
    } else {
      setCurrentMessage(null);
    }
  };

  if (!currentMessage) return null;

  return (
    <MessageRevealNotification
      message={currentMessage}
      onClose={handleCloseReveal}
    />
  );
};
