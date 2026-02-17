/**
 * Milestone Reminders Hook
 * Schedule notifications for upcoming birthdays, anniversaries, etc.
 */

import { useEffect } from 'react';
import { useUpcomingMilestones } from './useMilestonesQuery';
import { getDaysUntil } from '../utils/dateHelpers';
import { logger } from '@/services/logger';
import { useToast } from '@/hooks/useToast';

interface MilestoneReminderOptions {
  enabled?: boolean;
  checkIntervalMs?: number;
}

/**
 * Hook to schedule milestone reminders based on reminder settings
 */
export function useMilestoneReminders(options: MilestoneReminderOptions = {}) {
  const { enabled = true, checkIntervalMs = 60 * 60 * 1000 } = options; // Default: check hourly

  const { data: upcomingMilestones = [] } = useUpcomingMilestones();
  const { toast } = useToast();

  useEffect(() => {
    if (!enabled || !toast) return;

    const checkReminders = () => {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];

      logger.debug('Together', 'Checking milestone reminders', {
        count: upcomingMilestones.length,
      });

      for (const milestone of upcomingMilestones) {
        const daysUntil = getDaysUntil(milestone.milestone_date);

        // Check if we should show a reminder based on days until
        let shouldRemind = false;
        let reminderMessage = '';

        if (daysUntil === 0 && milestone.reminder_day_of) {
          shouldRemind = true;
          reminderMessage = `Today: ${milestone.title}! 🎉`;
        } else if (daysUntil === 1 && milestone.reminder_1d) {
          shouldRemind = true;
          reminderMessage = `Tomorrow: ${milestone.title}`;
        } else if (daysUntil === 7 && milestone.reminder_7d) {
          shouldRemind = true;
          reminderMessage = `In 1 week: ${milestone.title}`;
        } else if (daysUntil === 30 && milestone.reminder_30d) {
          shouldRemind = true;
          reminderMessage = `In 30 days: ${milestone.title}`;
        }

        if (shouldRemind) {
          // Check if we've already shown this reminder today
          const reminderKey = `milestone_reminder_${milestone.id}_${todayStr}`;
          const alreadyShown = localStorage.getItem(reminderKey);

          if (!alreadyShown) {
            logger.info('Together', 'Showing milestone reminder', {
              milestoneId: milestone.id,
              title: milestone.title,
              daysUntil,
            });

            // Show toast notification
            toast(reminderMessage, 'info');

            // Mark as shown for today
            localStorage.setItem(reminderKey, 'true');

            // Clean up old reminder flags (older than 7 days)
            cleanupOldReminders();
          }
        }
      }
    };

    // Check immediately on mount
    checkReminders();

    // Set up interval to check periodically
    const intervalId = setInterval(checkReminders, checkIntervalMs);

    return () => clearInterval(intervalId);
  }, [enabled, upcomingMilestones, toast, checkIntervalMs]);
}

/**
 * Clean up old reminder flags from localStorage
 */
function cleanupOldReminders() {
  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const cutoffStr = sevenDaysAgo.toISOString().split('T')[0];

    // Find all milestone reminder keys
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('milestone_reminder_')) {
        // Extract date from key: milestone_reminder_{id}_{date}
        const parts = key.split('_');
        const dateStr = parts[parts.length - 1];

        if (dateStr < cutoffStr) {
          keysToRemove.push(key);
        }
      }
    }

    // Remove old keys
    keysToRemove.forEach(key => localStorage.removeItem(key));

    if (keysToRemove.length > 0) {
      logger.debug('Together', 'Cleaned up old reminder flags', {
        count: keysToRemove.length,
      });
    }
  } catch (error) {
    logger.error('Together', 'Failed to cleanup old reminders', { error });
  }
}
