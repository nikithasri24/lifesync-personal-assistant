/**
 * Push Notification Service
 * Handles Web Push subscription and notification management
 *
 * ARCHITECTURE: Uses API layer for all data access (no direct Supabase calls)
 */

import { upsertPushSubscription, deactivatePushSubscription } from '@/api/pushSubscriptionsAPI';
import { supabase } from '@/lib/supabase';

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
      console.error('[PushService] Error getting status:', error);
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
      console.warn('[PushService] Push notifications not supported');
      return false;
    }

    try {
      // Register service worker
      this.registration = await navigator.serviceWorker.register('/sw-push.js', {
        scope: '/',
      });
      console.log('[PushService] Service worker registered');

      // Wait for service worker to be ready
      await navigator.serviceWorker.ready;
      console.log('[PushService] Service worker ready');

      return true;
    } catch (error) {
      console.error('[PushService] Failed to initialize:', error);
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
    console.log('[PushService] Permission:', permission);
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
      console.error('[PushService] No service worker registration');
      return null;
    }

    if (!VAPID_PUBLIC_KEY) {
      console.error('[PushService] VAPID public key not configured');
      return null;
    }

    try {
      // Subscribe to push
      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      console.log('[PushService] Subscribed:', subscription);
      this.subscription = subscription;

      // Save subscription using API layer instead of direct Supabase
      const { data: session } = await supabase.auth.getSession();
      if (session?.session) {
        const subscriptionJson = subscription.toJSON();
        try {
          await upsertPushSubscription({
            user_id: session.session.user.id,
            endpoint: subscriptionJson.endpoint || '',
            p256dh: subscriptionJson.keys?.p256dh,
            auth: subscriptionJson.keys?.auth,
            is_active: true,
          });
        } catch (error) {
          console.error('[PushService] Failed to save subscription:', error);
        } else {
          console.log('[PushService] Subscription saved to database');
        }
      }

      return subscription;
    } catch (error) {
      console.error('[PushService] Failed to subscribe:', error);
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

      // Remove from database using API layer instead of direct Supabase
      const { data: session } = await supabase.auth.getSession();
      if (session?.session) {
        await deactivatePushSubscription(endpoint, session.session.user.id);
      }

      console.log('[PushService] Unsubscribed');
      return true;
    } catch (error) {
      console.error('[PushService] Failed to unsubscribe:', error);
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
      console.error('[PushService] No service worker registration');
      return;
    }

    if (Notification.permission !== 'granted') {
      console.warn('[PushService] Notification permission not granted');
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

