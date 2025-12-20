/**
 * useProactiveNotifications Hook
 * Generates proactive notifications based on AI predictions
 * 
 * Runs PredictionService periodically and creates notifications for:
 * - Busy periods ahead
 * - Streak at risk warnings
 * - Goal deadline reminders
 * - Bill payment reminders
 * - Upcoming birthdays/anniversaries
 */

import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from './useAuth';
import { predictionService, type Prediction } from '@/services/ai/PredictionService';
import { reminderService } from '@/services/reminders';
import type { ReminderPriority } from '@/services/reminders/types';

interface ProactiveNotificationOptions {
  enabled?: boolean;
  checkIntervalMs?: number;  // How often to check (default: 1 hour)
  lookAheadDays?: number;    // How far ahead to look (default: 7 days)
}

const DEFAULT_OPTIONS: Required<ProactiveNotificationOptions> = {
  enabled: true,
  checkIntervalMs: 60 * 60 * 1000, // 1 hour
  lookAheadDays: 7,
};

// Track which predictions we've already created notifications for (avoid duplicates)
const processedPredictions = new Set<string>();

/**
 * Convert a Prediction to a scheduled notification
 */
async function createNotificationFromPrediction(prediction: Prediction): Promise<string | null> {
  // Skip if already processed
  if (processedPredictions.has(prediction.id)) {
    return null;
  }

  const priorityMap: Record<string, ReminderPriority> = {
    high: 'high',
    medium: 'normal',
    low: 'low',
  };

  const typeToReminderType: Record<string, string> = {
    busy_period: 'proactive_suggestion',
    streak_at_risk: 'habit_reminder',
    goal_deadline: 'goal_reminder',
    bill_due: 'bill_reminder',
    birthday_upcoming: 'important_date',
    low_energy_predicted: 'proactive_suggestion',
    routine_reminder: 'proactive_suggestion',
  };

  try {
    const reminderId = await reminderService.scheduleReminder({
      type: typeToReminderType[prediction.type] as any || 'proactive_suggestion',
      title: prediction.title,
      body: prediction.message,
      scheduledFor: new Date(), // Show immediately
      priority: priorityMap[prediction.priority] || 'normal',
      entityType: getEntityType(prediction),
      entityId: getEntityId(prediction),
      actions: prediction.suggestedAction
        ? [{ action: 'view', title: prediction.suggestedAction }]
        : undefined,
    });

    if (reminderId) {
      processedPredictions.add(prediction.id);
    }

    return reminderId;
  } catch (error) {
    console.error('[ProactiveNotifications] Failed to create notification:', error);
    return null;
  }
}

function getEntityType(prediction: Prediction): 'habit' | 'goal' | 'bill' | 'important_date' | undefined {
  switch (prediction.type) {
    case 'streak_at_risk': return 'habit';
    case 'goal_deadline': return 'goal';
    case 'bill_due': return 'bill';
    case 'birthday_upcoming': return 'important_date';
    default: return undefined;
  }
}

function getEntityId(prediction: Prediction): string | undefined {
  const payload = prediction.actionPayload as Record<string, unknown> | undefined;
  return (payload?.habitId || payload?.goalId || payload?.billId || payload?.dateId) as string | undefined;
}

/**
 * Hook to run proactive notification generation
 */
export function useProactiveNotifications(options: ProactiveNotificationOptions = {}) {
  const { user } = useAuth();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { enabled, checkIntervalMs, lookAheadDays } = { ...DEFAULT_OPTIONS, ...options };

  const generateNotifications = useCallback(async () => {
    if (!user?.id) return;

    try {
      console.log('[ProactiveNotifications] Generating predictions...');
      const predictions = await predictionService.generatePredictions(user.id, lookAheadDays);

      // Filter to high/medium priority only to avoid notification spam
      const important = predictions.filter(p => p.priority === 'high' || p.priority === 'medium');

      console.log(`[ProactiveNotifications] Found ${important.length} important predictions`);

      for (const prediction of important) {
        await createNotificationFromPrediction(prediction);
      }
    } catch (error) {
      console.error('[ProactiveNotifications] Failed to generate:', error);
    }
  }, [user?.id, lookAheadDays]);

  useEffect(() => {
    if (!enabled || !user?.id) return;

    // Run immediately on mount
    generateNotifications();

    // Set up interval
    intervalRef.current = setInterval(generateNotifications, checkIntervalMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, user?.id, checkIntervalMs, generateNotifications]);

  return { generateNotifications };
}

/**
 * Clear processed predictions cache (for testing or reset)
 */
export function clearProcessedPredictions(): void {
  processedPredictions.clear();
}

