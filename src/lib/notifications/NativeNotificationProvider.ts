/**
 * Native Notification Provider using Capacitor plugins
 * 
 * Uses:
 * - @capacitor/push-notifications for remote push
 * - @capacitor/local-notifications for scheduled/local notifications
 */

import {
  BaseNotificationProvider,
  type NotificationData,
  type NotificationPermissionStatus,
  type ScheduleOptions,
} from './NotificationProvider';
import { isNative } from '../platform';

// Types for Capacitor notification plugins
interface PushNotificationsPlugin {
  register(): Promise<void>;
  getDeliveredNotifications(): Promise<{ notifications: unknown[] }>;
  removeAllDeliveredNotifications(): Promise<void>;
  addListener(event: 'registration', callback: (token: { value: string }) => void): Promise<{ remove: () => void }>;
  addListener(event: 'registrationError', callback: (error: { error: string }) => void): Promise<{ remove: () => void }>;
  addListener(event: 'pushNotificationReceived', callback: (notification: unknown) => void): Promise<{ remove: () => void }>;
  addListener(event: 'pushNotificationActionPerformed', callback: (action: unknown) => void): Promise<{ remove: () => void }>;
  checkPermissions(): Promise<{ receive: 'granted' | 'denied' | 'prompt' }>;
  requestPermissions(): Promise<{ receive: 'granted' | 'denied' | 'prompt' }>;
}

interface LocalNotificationsPlugin {
  schedule(options: { notifications: LocalNotification[] }): Promise<{ notifications: { id: number }[] }>;
  getPending(): Promise<{ notifications: { id: number }[] }>;
  cancel(options: { notifications: { id: number }[] }): Promise<void>;
  addListener(event: 'localNotificationReceived', callback: (notification: unknown) => void): Promise<{ remove: () => void }>;
  addListener(event: 'localNotificationActionPerformed', callback: (action: unknown) => void): Promise<{ remove: () => void }>;
  checkPermissions(): Promise<{ display: 'granted' | 'denied' | 'prompt' }>;
  requestPermissions(): Promise<{ display: 'granted' | 'denied' | 'prompt' }>;
}

interface LocalNotification {
  id: number;
  title: string;
  body?: string;
  schedule?: { at: Date; repeats?: boolean; every?: string };
  sound?: string;
  extra?: Record<string, unknown>;
}

// Dynamically loaded plugins
let PushNotifications: PushNotificationsPlugin | null = null;
let LocalNotifications: LocalNotificationsPlugin | null = null;
let pluginsLoadAttempted = false;

async function tryImport<T>(moduleName: string): Promise<T | null> {
  try {
    const importFn = new Function('m', 'return import(m)') as (m: string) => Promise<T>;
    return await importFn(moduleName);
  } catch {
    return null;
  }
}

async function loadPlugins(): Promise<void> {
  if (pluginsLoadAttempted) return;
  pluginsLoadAttempted = true;
  
  if (!isNative()) return;
  
  try {
    const pushModule = await tryImport<{ PushNotifications: PushNotificationsPlugin }>(
      '@capacitor/push-notifications'
    );
    if (pushModule?.PushNotifications) {
      PushNotifications = pushModule.PushNotifications;
    }
  } catch {
    console.warn('[NativeNotificationProvider] Push notifications plugin not available');
  }
  
  try {
    const localModule = await tryImport<{ LocalNotifications: LocalNotificationsPlugin }>(
      '@capacitor/local-notifications'
    );
    if (localModule?.LocalNotifications) {
      LocalNotifications = localModule.LocalNotifications;
    }
  } catch {
    console.warn('[NativeNotificationProvider] Local notifications plugin not available');
  }
}

const pluginsLoaded = loadPlugins();

export class NativeNotificationProvider extends BaseNotificationProvider {
  readonly name = 'NativeNotificationProvider';
  private pushToken: string | null = null;
  private listenerRemovers: (() => void)[] = [];
  private nextId = 1;
  
  isSupported(): boolean {
    return isNative();
  }
  
  async getPermissionStatus(): Promise<NotificationPermissionStatus> {
    await pluginsLoaded;
    
    if (!LocalNotifications) {
      return { permission: 'denied', isEnabled: false };
    }
    
    try {
      const result = await LocalNotifications.checkPermissions();
      return {
        permission: result.display,
        isEnabled: result.display === 'granted',
      };
    } catch {
      return { permission: 'denied', isEnabled: false };
    }
  }
  
  async requestPermission(): Promise<NotificationPermissionStatus> {
    await pluginsLoaded;
    
    if (!LocalNotifications) {
      return { permission: 'denied', isEnabled: false };
    }
    
    try {
      const result = await LocalNotifications.requestPermissions();
      return {
        permission: result.display,
        isEnabled: result.display === 'granted',
      };
    } catch {
      return { permission: 'denied', isEnabled: false };
    }
  }
  
  async registerForPush(): Promise<string | null> {
    await pluginsLoaded;

    if (!PushNotifications) {
      console.warn('[NativeNotificationProvider] Push plugin not available');
      return null;
    }

    try {
      // Request permission first
      const permResult = await PushNotifications.requestPermissions();
      if (permResult.receive !== 'granted') {
        return null;
      }

      // Set up registration listener
      return new Promise((resolve) => {
        PushNotifications!.addListener('registration', (token) => {
          this.pushToken = token.value;
          resolve(token.value);
        });

        PushNotifications!.addListener('registrationError', (error) => {
          console.error('[NativeNotificationProvider] Registration error:', error);
          resolve(null);
        });

        // Register for push
        PushNotifications!.register();
      });
    } catch (error) {
      console.error('[NativeNotificationProvider] Failed to register:', error);
      return null;
    }
  }

  async unregisterFromPush(): Promise<boolean> {
    // Capacitor doesn't have an unregister method
    // The token should be removed from the server side
    this.pushToken = null;
    return true;
  }

  async showNotification(notification: NotificationData): Promise<void> {
    await pluginsLoaded;

    if (!LocalNotifications) {
      console.warn('[NativeNotificationProvider] Local notifications not available');
      return;
    }

    try {
      await LocalNotifications.schedule({
        notifications: [{
          id: this.nextId++,
          title: notification.title,
          body: notification.body,
          sound: notification.sound,
          extra: notification.data as Record<string, unknown>,
        }],
      });

      this.emitReceived(notification);
    } catch (error) {
      console.error('[NativeNotificationProvider] Failed to show notification:', error);
    }
  }

  async scheduleNotification(
    notification: NotificationData,
    schedule: ScheduleOptions
  ): Promise<number> {
    await pluginsLoaded;

    if (!LocalNotifications) {
      console.warn('[NativeNotificationProvider] Local notifications not available');
      return -1;
    }

    const id = schedule.id || this.nextId++;

    try {
      await LocalNotifications.schedule({
        notifications: [{
          id,
          title: notification.title,
          body: notification.body,
          sound: notification.sound,
          extra: notification.data as Record<string, unknown>,
          schedule: {
            at: schedule.at,
            repeats: schedule.repeats,
            every: schedule.every,
          },
        }],
      });

      return id;
    } catch (error) {
      console.error('[NativeNotificationProvider] Failed to schedule:', error);
      return -1;
    }
  }

  async cancelNotification(id: number): Promise<void> {
    await pluginsLoaded;

    if (!LocalNotifications) return;

    try {
      await LocalNotifications.cancel({ notifications: [{ id }] });
    } catch (error) {
      console.error('[NativeNotificationProvider] Failed to cancel:', error);
    }
  }

  async cancelAllNotifications(): Promise<void> {
    await pluginsLoaded;

    if (!LocalNotifications) return;

    try {
      const pending = await LocalNotifications.getPending();
      if (pending.notifications.length > 0) {
        await LocalNotifications.cancel({ notifications: pending.notifications });
      }
    } catch (error) {
      console.error('[NativeNotificationProvider] Failed to cancel all:', error);
    }
  }

  async getPendingNotifications(): Promise<{ id: number; notification: NotificationData }[]> {
    await pluginsLoaded;

    if (!LocalNotifications) return [];

    try {
      const pending = await LocalNotifications.getPending();
      // LocalNotifications.getPending() only returns IDs, not full notification data
      return pending.notifications.map(n => ({
        id: n.id,
        notification: { title: 'Scheduled Notification' }, // Limited info available
      }));
    } catch {
      return [];
    }
  }

  dispose(): void {
    this.listenerRemovers.forEach(remove => remove());
    this.listenerRemovers = [];
    super.dispose();
  }
}

