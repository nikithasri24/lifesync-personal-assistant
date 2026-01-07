/**
 * SmartReminderService
 *
 * Intelligent reminder features:
 * - Adaptive timing based on user patterns
 * - Context-aware reminders (location, time of day, current activity)
 * - Notification batching to reduce interruptions
 * - Do Not Disturb awareness
 * - Priority-based filtering
 * - Streak protection alerts
 *
 * ARCHITECTURE: Uses API layer for all data access (no direct Supabase calls)
 */

import { getUserSettings, getNotificationQueueCount } from '@/api/userSettingsAPI';
import { reminderService, type ScheduleReminderParams } from './ReminderService';
import {
  format,
  addMinutes,
  setHours,
  setMinutes,
  isWeekend,
  getDay,
  getHours,
  isBefore,
  isAfter,
  startOfDay,
  endOfDay,
} from 'date-fns';
import type { ReminderPreferences, ReminderPriority, ReminderType } from './types';

interface SmartTimingContext {
  userPatterns: {
    avgWakeTime: number; // hour of day
    avgSleepTime: number;
    productiveHours: number[];
    preferredReminderLead: number; // minutes
  };
  currentContext: {
    isQuietHours: boolean;
    isProductiveTime: boolean;
    recentNotificationCount: number;
    currentFocusMode: boolean;
  };
}

interface BatchedNotification {
  id: string;
  priority: ReminderPriority;
  params: ScheduleReminderParams;
  originalTime: Date;
}

class SmartReminderService {
  private batchQueue: BatchedNotification[] = [];
  private batchTimeout: NodeJS.Timeout | null = null;
  private preferences: ReminderPreferences | null = null;
  private readonly BATCH_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

  /**
   * Get user's reminder preferences
   */
  async getPreferences(): Promise<ReminderPreferences | null> {
    if (this.preferences) return this.preferences;

    // Use API layer instead of direct Supabase
    try {
      const settings = await getUserSettings();
      this.preferences = (settings?.reminder_preferences as unknown as ReminderPreferences) ?? this.getDefaultPreferences();
      return this.preferences;
    } catch (error) {
      return this.getDefaultPreferences();
    }
  }

  private getDefaultPreferences(): ReminderPreferences {
    return {
      enabled: true,
      quietHoursEnabled: true,
      quietHoursStart: '22:00',
      quietHoursEnd: '07:00',
      taskRemindersEnabled: true,
      taskReminderMinutesBefore: 15,
      overdueRemindersEnabled: true,
      eventRemindersEnabled: true,
      eventReminderMinutesBefore: 30,
      habitRemindersEnabled: true,
      morningBriefingEnabled: true,
      morningBriefingTime: '07:30',
      soundEnabled: true,
      vibrationEnabled: true,
    };
  }

  // Extended preferences for smart features (stored separately or in user_settings)
  private smartPrefs = {
    eveningReviewTime: '21:00',
    batchNotifications: true,
    maxNotificationsPerHour: 5,
  };

  /**
   * Check if current time is within quiet hours
   */
  async isQuietHours(): Promise<boolean> {
    const prefs = await this.getPreferences();
    if (!prefs?.quietHoursEnabled) return false;

    const now = new Date();
    const [startHour, startMin] = (prefs.quietHoursStart || '22:00').split(':').map(Number);
    const [endHour, endMin] = (prefs.quietHoursEnd || '07:00').split(':').map(Number);

    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    // Handle overnight quiet hours (e.g., 22:00 - 07:00)
    if (startMinutes > endMinutes) {
      return currentMinutes >= startMinutes || currentMinutes < endMinutes;
    }
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  }

  /**
   * Get smart timing context for intelligent scheduling
   */
  async getTimingContext(): Promise<SmartTimingContext> {
    // TODO: Analyze user patterns from analytics data
    // For now, use reasonable defaults
    return {
      userPatterns: {
        avgWakeTime: 7,
        avgSleepTime: 23,
        productiveHours: [9, 10, 11, 14, 15, 16],
        preferredReminderLead: 15,
      },
      currentContext: {
        isQuietHours: await this.isQuietHours(),
        isProductiveTime: this.isProductiveTime(),
        recentNotificationCount: await this.getRecentNotificationCount(),
        currentFocusMode: false, // TODO: implement focus mode detection
      },
    };
  }

  private isProductiveTime(): boolean {
    const hour = getHours(new Date());
    const productiveHours = [9, 10, 11, 14, 15, 16];
    return productiveHours.includes(hour) && !isWeekend(new Date());
  }

  private async getRecentNotificationCount(): Promise<number> {
    // Use API layer instead of direct Supabase
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    try {
      return await getNotificationQueueCount({
        status: 'sent',
        since: oneHourAgo.toISOString(),
      });
    } catch (error) {
      return 0;
    }
  }

  /**
   * Schedule reminder with smart timing adjustments
   */
  async scheduleSmartReminder(params: ScheduleReminderParams): Promise<string | null> {
    const context = await this.getTimingContext();
    const prefs = await this.getPreferences();
    let adjustedTime = new Date(params.scheduledFor);

    // Skip if in quiet hours (unless urgent)
    if (context.currentContext.isQuietHours && params.priority !== 'urgent') {
      // Defer to end of quiet hours
      const [endHour, endMin] = (prefs?.quietHoursEnd || '07:00').split(':').map(Number);
      adjustedTime = setMinutes(setHours(addMinutes(adjustedTime, 1), endHour), endMin);
    }

    // Batch low-priority notifications
    if (this.smartPrefs.batchNotifications && params.priority === 'low') {
      return this.addToBatch({ ...params, scheduledFor: adjustedTime });
    }

    // Check notification rate limit
    if (context.currentContext.recentNotificationCount >= this.smartPrefs.maxNotificationsPerHour) {
      // Delay by 15 minutes
      adjustedTime = addMinutes(adjustedTime, 15);
    }

    return reminderService.scheduleReminder({
      ...params,
      scheduledFor: adjustedTime,
    });
  }

  /**
   * Add notification to batch queue
   */
  private async addToBatch(params: ScheduleReminderParams): Promise<string> {
    const batchId = crypto.randomUUID();
    
    this.batchQueue.push({
      id: batchId,
      priority: params.priority || 'normal',
      params,
      originalTime: params.scheduledFor,
    });

    // Schedule batch processing if not already scheduled
    if (!this.batchTimeout) {
      this.batchTimeout = setTimeout(() => {
        this.processBatch();
      }, this.BATCH_WINDOW_MS);
    }

    return batchId;
  }

  /**
   * Process batched notifications - combine into single notification
   */
  private async processBatch(): Promise<void> {
    this.batchTimeout = null;

    if (this.batchQueue.length === 0) return;

    const items = [...this.batchQueue];
    this.batchQueue = [];

    if (items.length === 1) {
      // Single item - just schedule normally
      await reminderService.scheduleReminder(items[0].params);
      return;
    }

    // Combine into single notification
    const titles = items.map(i => i.params.title).slice(0, 3);
    const moreCount = items.length - 3;

    await reminderService.scheduleReminder({
      type: 'custom',
      title: `${items.length} Updates`,
      body: titles.join(', ') + (moreCount > 0 ? ` +${moreCount} more` : ''),
      scheduledFor: new Date(),
      priority: 'normal',
    });
  }

  /**
   * Schedule habit reminder with streak protection
   */
  async scheduleHabitReminder(
    habitId: string,
    habitName: string,
    currentStreak: number,
    preferredTime?: Date
  ): Promise<string | null> {
    const prefs = await this.getPreferences();
    if (!prefs?.habitRemindersEnabled) return null;

    // Urgent if streak at risk
    const priority: ReminderPriority = currentStreak >= 7 ? 'high' : 'normal';
    const streakText = currentStreak > 0 ? ` (${currentStreak} day streak!)` : '';

    return this.scheduleSmartReminder({
      type: 'habit_reminder',
      title: 'Habit Reminder',
      body: `Time to: ${habitName}${streakText}`,
      scheduledFor: preferredTime || new Date(),
      priority,
      entityType: 'habit',
      entityId: habitId,
      actions: [
        { action: 'complete', title: 'Done ✓' },
        { action: 'snooze', title: 'Later' },
      ],
    });
  }

  /**
   * Schedule morning briefing
   */
  async scheduleMorningBriefing(): Promise<string | null> {
    const prefs = await this.getPreferences();
    const [hour, min] = (prefs?.morningBriefingTime || '07:30').split(':').map(Number);

    const tomorrow = addMinutes(startOfDay(new Date()), (hour * 60) + min + 24 * 60);

    return reminderService.scheduleReminder({
      type: 'morning_briefing',
      title: '☀️ Good Morning!',
      body: 'Tap to see your day ahead',
      scheduledFor: tomorrow,
      priority: 'normal',
      actions: [
        { action: 'open_briefing', title: 'View Briefing' },
      ],
    });
  }

  /**
   * Alert when a streak is at risk (evening reminder)
   */
  async scheduleStreakProtectionAlert(
    habitId: string,
    habitName: string,
    streak: number
  ): Promise<string | null> {
    if (streak < 3) return null; // Only protect meaningful streaks

    await this.getPreferences(); // Ensure preferences are loaded
    const [hour, min] = this.smartPrefs.eveningReviewTime.split(':').map(Number);

    const today = new Date();
    const reminderTime = setMinutes(setHours(today, hour), min);

    if (isBefore(reminderTime, today)) return null; // Already past

    return this.scheduleSmartReminder({
      type: 'habit_reminder',
      title: '🔥 Streak at Risk!',
      body: `Don't break your ${streak}-day streak on "${habitName}"!`,
      scheduledFor: reminderTime,
      priority: 'high',
      entityType: 'habit',
      entityId: habitId,
      actions: [
        { action: 'complete', title: 'Complete Now' },
        { action: 'skip', title: 'Skip Today' },
      ],
    });
  }
}

export const smartReminderService = new SmartReminderService();
