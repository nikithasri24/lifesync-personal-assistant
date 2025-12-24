/**
 * ReminderService
 * Manages scheduling, displaying, and processing reminders
 *
 * ARCHITECTURE: Uses API layer for all data access (no direct Supabase calls)
 */

import {
  queueNotification,
  getUpcomingReminders,
  getDueReminders,
  cancelReminder as cancelReminderAPI,
  markReminderSent,
  type NotificationQueueItem as NotificationQueueItemAPI,
} from '@/api/notificationAPI';
import { pushNotificationService } from '@/services/pushNotificationService';
import { format, addMinutes, subMinutes, isAfter, isBefore, parseISO } from 'date-fns';
import type {
  Reminder,
  ReminderType,
  ReminderPriority,
  NotificationQueueItem,
  ReminderPreferences,
} from './types';

export interface ScheduleReminderParams {
  type: ReminderType;
  title: string;
  body: string;
  scheduledFor: Date;
  priority?: ReminderPriority;
  entityType?: 'task' | 'event' | 'habit' | 'goal' | 'bill' | 'important_date';
  entityId?: string;
  actions?: { action: string; title: string }[];
}

class ReminderService {
  private checkInterval: NodeJS.Timeout | null = null;
  private preferences: ReminderPreferences | null = null;

  /**
   * Schedule a reminder to be sent at a specific time
   */
  async scheduleReminder(params: ScheduleReminderParams): Promise<string | null> {
    try {
      // Map priority: 'urgent' -> 'high' for API compatibility
      const apiPriority = params.priority === 'urgent' ? 'high' : (params.priority || 'normal');

      const result = await queueNotification({
        type: this.mapReminderTypeToDbType(params.type),
        priority: apiPriority as 'low' | 'normal' | 'high',
        payload: {
          title: params.title,
          body: params.body,
          icon: '/icons/icon-192x192.png',
          data: {
            type: params.type,
            entityType: params.entityType,
            entityId: params.entityId,
          },
          actions: params.actions,
        },
        scheduled_for: params.scheduledFor.toISOString(),
      });

      console.log('[ReminderService] Scheduled reminder:', result.id);
      return result.id;
    } catch (error) {
      console.error('[ReminderService] Failed to schedule reminder:', error);
      return null;
    }
  }

  /**
   * Cancel a scheduled reminder
   */
  async cancelReminder(reminderId: string): Promise<boolean> {
    try {
      await cancelReminderAPI(reminderId);
      return true;
    } catch (error) {
      console.error('[ReminderService] Failed to cancel reminder:', error);
      return false;
    }
  }

  /**
   * Schedule a task reminder (X minutes before scheduled time)
   */
  async scheduleTaskReminder(
    taskId: string,
    taskTitle: string,
    scheduledTime: Date,
    minutesBefore: number = 15
  ): Promise<string | null> {
    const reminderTime = subMinutes(scheduledTime, minutesBefore);
    
    // Don't schedule if reminder time is in the past
    if (isBefore(reminderTime, new Date())) {
      console.log('[ReminderService] Reminder time is in the past, skipping');
      return null;
    }

    return this.scheduleReminder({
      type: 'task_upcoming',
      title: 'Task Starting Soon',
      body: `"${taskTitle}" starts in ${minutesBefore} minutes`,
      scheduledFor: reminderTime,
      priority: 'normal',
      entityType: 'task',
      entityId: taskId,
      actions: [
        { action: 'open', title: 'View Task' },
        { action: 'snooze', title: 'Snooze 5m' },
      ],
    });
  }

  /**
   * Schedule an event reminder
   */
  async scheduleEventReminder(
    eventId: string,
    eventTitle: string,
    eventTime: Date,
    minutesBefore: number = 15
  ): Promise<string | null> {
    const reminderTime = subMinutes(eventTime, minutesBefore);
    
    if (isBefore(reminderTime, new Date())) {
      return null;
    }

    return this.scheduleReminder({
      type: 'event_upcoming',
      title: 'Event Starting Soon',
      body: `"${eventTitle}" starts in ${minutesBefore} minutes`,
      scheduledFor: reminderTime,
      priority: 'high',
      entityType: 'event',
      entityId: eventId,
      actions: [
        { action: 'open', title: 'View Event' },
        { action: 'dismiss', title: 'Dismiss' },
      ],
    });
  }

  /**
   * Get pending reminders for a user
   */
  async getPendingReminders(): Promise<NotificationQueueItem[]> {
    try {
      const reminders = await getUpcomingReminders();
      return reminders as NotificationQueueItem[];
    } catch (error) {
      console.error('[ReminderService] Failed to get pending reminders:', error);
      return [];
    }
  }

  /**
   * Get reminders due to be shown (scheduled_for <= now)
   */
  async getDueReminders(): Promise<NotificationQueueItem[]> {
    try {
      const reminders = await getDueReminders();
      return reminders as NotificationQueueItem[];
    } catch (error) {
      console.error('[ReminderService] Failed to get due reminders:', error);
      return [];
    }
  }

  /**
   * Mark a reminder as sent
   */
  async markAsSent(reminderId: string): Promise<boolean> {
    try {
      await markReminderSent(reminderId);
      return true;
    } catch (error) {
      console.error('[ReminderService] Failed to mark as sent:', error);
      return false;
    }
  }

  /**
   * Show a local notification for a reminder
   */
  async showReminderNotification(reminder: NotificationQueueItem): Promise<void> {
    const { payload } = reminder;

    await pushNotificationService.showLocalNotification(payload.title, {
      body: payload.body,
      icon: payload.icon,
      tag: `reminder-${reminder.id}`,
      data: {
        reminderId: reminder.id,
        entityType: reminder.entity_type,
        entityId: reminder.entity_id,
        ...payload.data,
      },
    });

    await this.markAsSent(reminder.id);
  }

  /**
   * Check for and display due reminders
   */
  async checkAndShowDueReminders(): Promise<number> {
    const dueReminders = await this.getDueReminders();

    for (const reminder of dueReminders) {
      await this.showReminderNotification(reminder);
    }

    return dueReminders.length;
  }

  /**
   * Start periodic reminder check (call on app init)
   */
  startReminderCheck(intervalMs: number = 60000): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    // Check immediately
    this.checkAndShowDueReminders();

    // Then check periodically
    this.checkInterval = setInterval(() => {
      this.checkAndShowDueReminders();
    }, intervalMs);

    console.log('[ReminderService] Started reminder check every', intervalMs, 'ms');
  }

  /**
   * Stop periodic reminder check
   */
  stopReminderCheck(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.log('[ReminderService] Stopped reminder check');
    }
  }

  private mapReminderTypeToDbType(type: ReminderType): string {
    const mapping: Record<ReminderType, string> = {
      task_upcoming: 'task_due',
      task_due: 'task_due',
      task_overdue: 'task_overdue',
      event_upcoming: 'calendar_event',
      habit_reminder: 'habit_reminder',
      morning_briefing: 'morning_briefing',
      custom: 'system',
    };
    return mapping[type] || 'system';
  }
}

export const reminderService = new ReminderService();

