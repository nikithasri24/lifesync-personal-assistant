/**
 * Web Notification Provider using Web Push API and Service Workers
 * 
 * Uses existing pushNotificationService for push registration
 */

import {
  BaseNotificationProvider,
  type NotificationData,
  type NotificationPermissionStatus,
  type ScheduleOptions,
} from './NotificationProvider';

export class WebNotificationProvider extends BaseNotificationProvider {
  readonly name = 'WebNotificationProvider';
  private registration: ServiceWorkerRegistration | null = null;
  private scheduledNotifications = new Map<number, NodeJS.Timeout>();
  private nextId = 1;
  
  isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }
  
  async getPermissionStatus(): Promise<NotificationPermissionStatus> {
    if (!this.isSupported()) {
      return { permission: 'denied', isEnabled: false };
    }
    
    const permission = Notification.permission as 'granted' | 'denied' | 'default';
    return {
      permission,
      isEnabled: permission === 'granted',
    };
  }
  
  async requestPermission(): Promise<NotificationPermissionStatus> {
    if (!this.isSupported()) {
      return { permission: 'denied', isEnabled: false };
    }
    
    const permission = await Notification.requestPermission() as 'granted' | 'denied' | 'default';
    return {
      permission,
      isEnabled: permission === 'granted',
    };
  }
  
  async registerForPush(): Promise<string | null> {
    // Delegate to existing pushNotificationService
    // This returns the subscription endpoint
    try {
      const { pushNotificationService } = await import('@/services/pushNotificationService');
      const subscription = await pushNotificationService.subscribe();
      return subscription?.endpoint ?? null;
    } catch (error) {
      console.error('[WebNotificationProvider] Failed to register for push:', error);
      return null;
    }
  }
  
  async unregisterFromPush(): Promise<boolean> {
    try {
      const { pushNotificationService } = await import('@/services/pushNotificationService');
      return await pushNotificationService.unsubscribe();
    } catch (error) {
      console.error('[WebNotificationProvider] Failed to unregister:', error);
      return false;
    }
  }
  
  async showNotification(notification: NotificationData): Promise<void> {
    const { permission } = await this.getPermissionStatus();
    if (permission !== 'granted') {
      console.warn('[WebNotificationProvider] Permission not granted');
      return;
    }
    
    // Try to use service worker if available
    if (!this.registration) {
      try {
        this.registration = await navigator.serviceWorker.getRegistration('/sw-push.js') ?? null;
      } catch {
        // Service worker not available
      }
    }
    
    // Use a more permissive type for service worker notifications
    // which support more options than the basic Notification API
    const options: Record<string, unknown> = {
      body: notification.body,
      icon: notification.icon ?? '/icons/icon-192x192.png',
      badge: notification.badge ?? '/icons/badge-72x72.png',
      tag: notification.tag,
      data: notification.data,
    };

    if (notification.vibrate) {
      options.vibrate = notification.vibrate;
    }

    if (notification.actions) {
      options.actions = notification.actions;
    }
    
    if (this.registration) {
      await this.registration.showNotification(notification.title, options);
    } else {
      // Fallback to basic Notification API
      new Notification(notification.title, options);
    }
    
    this.emitReceived(notification);
  }
  
  async scheduleNotification(
    notification: NotificationData,
    schedule: ScheduleOptions
  ): Promise<number> {
    const id = schedule.id || this.nextId++;
    const delay = schedule.at.getTime() - Date.now();
    
    if (delay <= 0) {
      // Show immediately if scheduled time has passed
      await this.showNotification(notification);
      return id;
    }
    
    // For web, we use setTimeout (works only while app is open)
    // For background scheduling, would need service worker + IndexedDB
    const timeout = setTimeout(async () => {
      await this.showNotification(notification);
      this.scheduledNotifications.delete(id);
      
      // Handle repeating notifications
      if (schedule.repeats && schedule.every) {
        const nextDate = this.calculateNextDate(schedule.at, schedule.every);
        await this.scheduleNotification(notification, { ...schedule, id, at: nextDate });
      }
    }, delay);
    
    this.scheduledNotifications.set(id, timeout);
    return id;
  }
  
  private calculateNextDate(from: Date, every: ScheduleOptions['every']): Date {
    const next = new Date(from);
    switch (every) {
      case 'minute': next.setMinutes(next.getMinutes() + 1); break;
      case 'hour': next.setHours(next.getHours() + 1); break;
      case 'day': next.setDate(next.getDate() + 1); break;
      case 'week': next.setDate(next.getDate() + 7); break;
      case 'month': next.setMonth(next.getMonth() + 1); break;
      case 'year': next.setFullYear(next.getFullYear() + 1); break;
    }
    return next;
  }
  
  async cancelNotification(id: number): Promise<void> {
    const timeout = this.scheduledNotifications.get(id);
    if (timeout) {
      clearTimeout(timeout);
      this.scheduledNotifications.delete(id);
    }
  }
  
  async cancelAllNotifications(): Promise<void> {
    for (const timeout of this.scheduledNotifications.values()) {
      clearTimeout(timeout);
    }
    this.scheduledNotifications.clear();
  }
  
  async getPendingNotifications(): Promise<{ id: number; notification: NotificationData }[]> {
    // Web doesn't have a way to inspect pending notifications
    // Would need to store in IndexedDB for persistence
    return [];
  }
  
  dispose(): void {
    this.cancelAllNotifications();
    super.dispose();
  }
}

