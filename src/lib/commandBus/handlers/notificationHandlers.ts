/**
 * Notification Command Handlers
 * 
 * Handles all notification-related commands through the command bus.
 * Uses the ReminderService for scheduling notifications.
 */

import { reminderService } from '@/services/reminders';
import { logger } from '@/services/logger';
import { supabase } from '@/lib/supabase';
import type {
  CommandResult,
  ScheduleReminderCommand,
  CancelReminderCommand,
} from '../types';

/**
 * Handle SCHEDULE_REMINDER command
 */
export async function handleScheduleReminder(command: ScheduleReminderCommand): Promise<CommandResult> {
  const { payload } = command;

  try {
    const reminderId = await reminderService.scheduleReminder({
      type: 'task_upcoming', // Default type
      title: payload.title,
      body: payload.body || '',
      scheduledFor: new Date(payload.scheduledFor),
      entityType: payload.entityType,
      entityId: payload.entityId,
    });

    if (!reminderId) {
      return { success: false, error: 'Failed to schedule reminder' };
    }

    return {
      success: true,
      data: { reminderId },
      message: `Reminder scheduled for ${payload.scheduledFor}`,
    };
  } catch (error) {
    logger.error('NotificationHandlers', 'Failed to schedule reminder', { error });
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Handle CANCEL_REMINDER command
 */
export async function handleCancelReminder(command: CancelReminderCommand): Promise<CommandResult> {
  const { payload } = command;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Cancel by updating status to 'cancelled'
    const { error } = await supabase
      .from('notification_queue')
      .update({ status: 'cancelled' })
      .eq('id', payload.id)
      .eq('user_id', user.id);

    if (error) {
      throw error;
    }

    return {
      success: true,
      message: 'Reminder cancelled',
    };
  } catch (error) {
    logger.error('NotificationHandlers', 'Failed to cancel reminder', { error });
    return { success: false, error: (error as Error).message };
  }
}

/**
 * All notification handlers mapped by command type
 */
export const notificationHandlers = {
  SCHEDULE_REMINDER: handleScheduleReminder,
  CANCEL_REMINDER: handleCancelReminder,
};

