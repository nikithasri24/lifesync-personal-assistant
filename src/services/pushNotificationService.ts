/**
 * Push Notification Service
 * Handles Web Push subscription and notification management
 *
 * ARCHITECTURE: Uses API layer for all data access (no direct Supabase calls)
 */

import { upsertPushSubscription, deactivatePushSubscription } from '@/api/pushSubscriptionsAPI';
import { requireAuth } from '@/api/apiWrapper';
import { logger } from '@/services/logger';

// VAPID public key from environment
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

// Convert VAPID key to Uint8Array for subscription
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export interface PushNotificationStatus {
  supported: boolean;
  permission: NotificationPermission;
  subscribed: boolean;
  subscription?: PushSubscription;
}

class PushNotificationService {
  private registration: ServiceWorkerRegistration | null = null;
  private subscription: PushSubscription | null = null;

  /**
   * Check if push notifications are supported
   */
  isSupported(): boolean {
    return (
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    );
  }

  /**
   * Get current notification status
   */
  async getStatus(): Promise<PushNotificationStatus> {
    if (!this.isSupported()) {
      return {
        supported: false,
        permission: 'denied',
        subscribed: false,
      };
    }

    const permission = Notification.permission;
    let subscribed = false;
    let subscription: PushSubscription | undefined;

    try {
      const reg = await navigator.serviceWorker.getRegistration('/sw-push.js');
      this.registration = reg ?? null;
      if (this.registration) {
        subscription = (await this.registration.pushManager.getSubscription()) || undefined;
        subscribed = !!subscription;
        this.subscription = subscription || null;
      }
    } catch (error) {
      logger.error('PushService', error as Error, { operation: 'getStatus' });
    }

    return {
      supported: true,
      permission,
      subscribed,
      subscription,
    };
  }

  /**
   * Register service worker and request permission
   */
  async initialize(): Promise<boolean> {
    if (!this.isSupported()) {
      logger.warn('PushService', 'Push notifications not supported');
      return false;
    }

    try {
      // Register service worker
      this.registration = await navigator.serviceWorker.register('/sw-push.js', {
        scope: '/',
      });
      logger.info('PushService', 'Service worker registered');

      // Wait for service worker to be ready
      await navigator.serviceWorker.ready;
      logger.info('PushService', 'Service worker ready');

      return true;
    } catch (error) {
      logger.error('PushService', error as Error, { operation: 'initialize' });
      return false;
    }
  }

  /**
   * Request notification permission
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) {
      return 'denied';
    }

    const permission = await Notification.requestPermission();
    logger.info('PushService', 'Permission requested', { permission });
    return permission;
  }

  /**
   * Subscribe to push notifications
   */
  async subscribe(deviceName?: string): Promise<PushSubscription | null> {
    if (!this.registration) {
      await this.initialize();
    }

    if (!this.registration) {
      logger.error('PushService', 'No service worker registration');
      return null;
    }

    if (!VAPID_PUBLIC_KEY) {
      logger.error('PushService', 'VAPID public key not configured');
      return null;
    }

    try {
      // Subscribe to push
      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      logger.debug('PushService', 'Subscribed to push notifications', { endpoint: subscription.endpoint });
      this.subscription = subscription;

      // Save subscription using API layer
      try {
        const user = await requireAuth();
        const subscriptionJson = subscription.toJSON();
        await upsertPushSubscription({
          user_id: user.id,
          endpoint: subscriptionJson.endpoint || '',
          p256dh: subscriptionJson.keys?.p256dh,
          auth: subscriptionJson.keys?.auth,
          is_active: true,
        });
        logger.info('PushService', 'Subscription saved to database');
      } catch (error) {
        logger.error('PushService', error as Error, { operation: 'saveSubscription' });
      }

      return subscription;
    } catch (error) {
      logger.error('PushService', error as Error, { operation: 'subscribe' });
      return null;
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe(): Promise<boolean> {
    if (!this.subscription) {
      const status = await this.getStatus();
      if (!status.subscription) {
        return true; // Already unsubscribed
      }
      this.subscription = status.subscription;
    }

    try {
      const endpoint = this.subscription.endpoint;

      // Unsubscribe from browser
      await this.subscription.unsubscribe();
      this.subscription = null;

      // Remove from database using API layer
      try {
        const user = await requireAuth();
        await deactivatePushSubscription(endpoint, user.id);
      } catch {
        // User may not be authenticated, that's ok
      }

      logger.info('PushService', 'Unsubscribed from push notifications');
      return true;
    } catch (error) {
      logger.error('PushService', error as Error, { operation: 'unsubscribe' });
      return false;
    }
  }

  /**
   * Show a local notification (for testing or immediate notifications)
   */
  async showLocalNotification(
    title: string,
    options?: NotificationOptions
  ): Promise<void> {
    if (!this.registration) {
      await this.initialize();
    }

    if (!this.registration) {
      logger.error('PushService', 'No service worker registration');
      return;
    }

    if (Notification.permission !== 'granted') {
      logger.warn('PushService', 'Notification permission not granted');
      return;
    }

    await this.registration.showNotification(title, {
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      ...options,
    });
  }
}

// Export singleton instance
export const pushNotificationService = new PushNotificationService();

// Export type for use in components
export type { PushNotificationService };

