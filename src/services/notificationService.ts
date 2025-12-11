/**
 * Notification Service
 *
 * Handles browser notifications for skincare routine reminders.
 * Uses the Web Notifications API for cross-browser compatibility.
 */

import { logger } from './logger';

export interface RoutineReminder {
  routineId: string;
  routineType: 'AM' | 'PM';
  routineName: string;
  time: string; // HH:MM format
}

// Store for active reminder timeouts
const activeReminders = new Map<string, number>();

/**
 * Check if notifications are supported in this browser
 */
export function isNotificationSupported(): boolean {
  return 'Notification' in window;
}

/**
 * Get current notification permission status
 */
export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) {
    return 'denied';
  }
  return Notification.permission;
}

/**
 * Request permission to show notifications
 * @returns Promise<boolean> - true if permission granted
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNotificationSupported()) {
    logger.warn('Notifications are not supported in this browser');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission === 'denied') {
    logger.warn('Notification permission was previously denied');
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    logger.info('Notification permission requested', { permission });
    return permission === 'granted';
  } catch (error) {
    logger.error('Error requesting notification permission', { error });
    return false;
  }
}

/**
 * Show a browser notification
 * @param title - Notification title
 * @param options - Notification options
 */
export function showNotification(
  title: string,
  options?: NotificationOptions
): Notification | null {
  if (!isNotificationSupported()) {
    logger.warn('Notifications are not supported');
    return null;
  }

  if (Notification.permission !== 'granted') {
    logger.warn('Notification permission not granted');
    return null;
  }

  try {
    const notification = new Notification(title, {
      icon: '/skincare-icon.png', // TODO: Add actual icon
      badge: '/skincare-badge.png',
      ...options,
    });

    // Auto-close after 10 seconds
    setTimeout(() => {
      notification.close();
    }, 10000);

    return notification;
  } catch (error) {
    logger.error('Error showing notification', { error, title });
    return null;
  }
}

/**
 * Calculate milliseconds until a specific time today or tomorrow
 * @param time - Time in HH:MM format (e.g., "08:00", "20:30")
 * @returns Milliseconds until that time
 */
function getMillisecondsUntilTime(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);

  if (isNaN(hours) || isNaN(minutes)) {
    throw new Error(`Invalid time format: ${time}`);
  }

  const now = new Date();
  const scheduledTime = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    hours,
    minutes,
    0,
    0
  );

  // If the time has already passed today, schedule for tomorrow
  if (scheduledTime <= now) {
    scheduledTime.setDate(scheduledTime.getDate() + 1);
  }

  return scheduledTime.getTime() - now.getTime();
}

/**
 * Schedule a routine reminder notification
 * @param reminder - Routine reminder details
 */
export function scheduleRoutineReminder(reminder: RoutineReminder): void {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    logger.warn('Cannot schedule reminder: notifications not available', { reminder });
    return;
  }

  // Cancel any existing reminder for this routine
  cancelRoutineReminder(reminder.routineId);

  try {
    const delay = getMillisecondsUntilTime(reminder.time);

    logger.info('Scheduling routine reminder', {
      routineId: reminder.routineId,
      routineType: reminder.routineType,
      time: reminder.time,
      delayMs: delay,
    });

    const timeoutId = window.setTimeout(() => {
      const notification = showNotification(`${reminder.routineType} Skincare Routine`, {
        body: `Time for your ${reminder.routineName}!`,
        tag: `skincare-${reminder.routineType}-${reminder.routineId}`,
        requireInteraction: false,
        icon: '/skincare-icon.png',
        data: {
          routineId: reminder.routineId,
          routineType: reminder.routineType,
          url: '/skincare',
        },
      });

      if (notification) {
        // Navigate to skincare page when notification is clicked
        notification.onclick = () => {
          window.focus();
          window.location.href = '/skincare';
          notification.close();
        };
      }

      // Remove from active reminders after showing
      activeReminders.delete(reminder.routineId);

      // Reschedule for tomorrow
      scheduleRoutineReminder(reminder);
    }, delay);

    // Store the timeout ID so we can cancel it later
    activeReminders.set(reminder.routineId, timeoutId);
  } catch (error) {
    logger.error('Error scheduling routine reminder', { error, reminder });
  }
}

/**
 * Cancel a scheduled routine reminder
 * @param routineId - ID of the routine to cancel reminder for
 */
export function cancelRoutineReminder(routineId: string): void {
  const timeoutId = activeReminders.get(routineId);
  if (timeoutId) {
    window.clearTimeout(timeoutId);
    activeReminders.delete(routineId);
    logger.info('Cancelled routine reminder', { routineId });
  }
}

/**
 * Cancel all scheduled reminders
 */
export function cancelAllReminders(): void {
  activeReminders.forEach((timeoutId) => {
    window.clearTimeout(timeoutId);
  });
  activeReminders.clear();
  logger.info('Cancelled all routine reminders');
}

/**
 * Get count of active reminders
 */
export function getActiveReminderCount(): number {
  return activeReminders.size;
}

/**
 * Test notification by showing it immediately
 * Useful for testing if notifications are working
 */
export function testNotification(): void {
  showNotification('Test Notification', {
    body: 'Your skincare reminders will look like this!',
    tag: 'test-notification',
  });
}
