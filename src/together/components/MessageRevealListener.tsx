/**
 * Message Reveal Listener
 * Monitors for messages that should be revealed based on triggers
 */

import React, { useEffect, useState } from 'react';
import { usePendingMessageReveals } from '../hooks/usePartnerMessagesQuery';
import { MessageRevealNotification } from './MessageRevealNotification';
import type { PartnerMessage } from '../types';
import { logger } from '@/services/logger';

export const MessageRevealListener: React.FC = () => {
  const [revealQueue, setRevealQueue] = useState<PartnerMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState<PartnerMessage | null>(null);

  const { data: pendingMessages = [] } = usePendingMessageReveals();

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

        case 'scheduled_date':
          // Reveal if scheduled time has passed
          if (message.scheduled_for) {
            const scheduledTime = new Date(message.scheduled_for);
            shouldReveal = now >= scheduledTime;
            if (shouldReveal) {
              logger.info('Together', 'Revealing scheduled message', {
                messageId: message.id,
                scheduledFor: message.scheduled_for,
              });
            }
          }
          break;

        case 'achievement_unlock':
          // Achievement unlock is handled separately by the challenges system
          // Don't auto-reveal here
          break;

        case 'immediate':
          // Should already be revealed, but just in case
          shouldReveal = true;
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
  }, [pendingMessages]);

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
