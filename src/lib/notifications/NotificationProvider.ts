/**
 * Abstract NotificationProvider interface for cross-platform notifications
 * 
 * Implementations:
 * - WebNotificationProvider: Uses Web Push API
 * - NativeNotificationProvider: Uses Capacitor Push/Local Notifications
 */

export interface NotificationData {
  title: string;
  body?: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, unknown>;
  sound?: string;
  vibrate?: number[];
  actions?: NotificationAction[];
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

export interface ScheduleOptions {
  id: number;
  at: Date;
  repeats?: boolean;
  every?: 'year' | 'month' | 'week' | 'day' | 'hour' | 'minute';
}

export interface NotificationPermissionStatus {
  permission: 'granted' | 'denied' | 'default' | 'prompt';
  isEnabled: boolean;
}

export interface NotificationProvider {
  /**
   * Provider name for debugging
   */
  readonly name: string;
  
  /**
   * Check if notifications are supported
   */
  isSupported(): boolean;
  
  /**
   * Check current permission status
   */
  getPermissionStatus(): Promise<NotificationPermissionStatus>;
  
  /**
   * Request notification permission
   */
  requestPermission(): Promise<NotificationPermissionStatus>;
  
  /**
   * Register for push notifications (remote)
   * Returns a token/subscription that can be used to send push notifications
   */
  registerForPush(): Promise<string | null>;
  
  /**
   * Unregister from push notifications
   */
  unregisterFromPush(): Promise<boolean>;
  
  /**
   * Show a local notification immediately
   */
  showNotification(notification: NotificationData): Promise<void>;
  
  /**
   * Schedule a local notification for later
   */
  scheduleNotification(
    notification: NotificationData, 
    schedule: ScheduleOptions
  ): Promise<number>; // Returns notification ID
  
  /**
   * Cancel a scheduled notification
   */
  cancelNotification(id: number): Promise<void>;
  
  /**
   * Cancel all scheduled notifications
   */
  cancelAllNotifications(): Promise<void>;
  
  /**
   * Get all pending/scheduled notifications
   */
  getPendingNotifications(): Promise<{ id: number; notification: NotificationData }[]>;
  
  /**
   * Set up listeners for notification events
   */
  onNotificationReceived(callback: (notification: NotificationData) => void): () => void;
  onNotificationAction(callback: (actionId: string, notificationData: NotificationData) => void): () => void;
  
  /**
   * Clean up resources
   */
  dispose(): void;
}

/**
 * Base class with common functionality
 */
export abstract class BaseNotificationProvider implements NotificationProvider {
  abstract readonly name: string;
  protected receivedListeners: ((notification: NotificationData) => void)[] = [];
  protected actionListeners: ((actionId: string, notificationData: NotificationData) => void)[] = [];
  
  abstract isSupported(): boolean;
  abstract getPermissionStatus(): Promise<NotificationPermissionStatus>;
  abstract requestPermission(): Promise<NotificationPermissionStatus>;
  abstract registerForPush(): Promise<string | null>;
  abstract unregisterFromPush(): Promise<boolean>;
  abstract showNotification(notification: NotificationData): Promise<void>;
  abstract scheduleNotification(notification: NotificationData, schedule: ScheduleOptions): Promise<number>;
  abstract cancelNotification(id: number): Promise<void>;
  abstract cancelAllNotifications(): Promise<void>;
  abstract getPendingNotifications(): Promise<{ id: number; notification: NotificationData }[]>;
  
  onNotificationReceived(callback: (notification: NotificationData) => void): () => void {
    this.receivedListeners.push(callback);
    return () => {
      const idx = this.receivedListeners.indexOf(callback);
      if (idx >= 0) this.receivedListeners.splice(idx, 1);
    };
  }
  
  onNotificationAction(callback: (actionId: string, notificationData: NotificationData) => void): () => void {
    this.actionListeners.push(callback);
    return () => {
      const idx = this.actionListeners.indexOf(callback);
      if (idx >= 0) this.actionListeners.splice(idx, 1);
    };
  }
  
  protected emitReceived(notification: NotificationData): void {
    this.receivedListeners.forEach(cb => cb(notification));
  }
  
  protected emitAction(actionId: string, notificationData: NotificationData): void {
    this.actionListeners.forEach(cb => cb(actionId, notificationData));
  }
  
  dispose(): void {
    this.receivedListeners = [];
    this.actionListeners = [];
  }
}

