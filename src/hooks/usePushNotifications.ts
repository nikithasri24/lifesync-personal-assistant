/**
 * usePushNotifications Hook
 * React hook for managing push notification subscription state
 */

import { useState, useEffect, useCallback } from 'react';
import { pushNotificationService } from '@/services/pushNotificationService';
import type { PushNotificationStatus } from '@/services/pushNotificationService';
import { logger } from '@/services/logger';

interface UsePushNotificationsReturn {
  // Status
  status: PushNotificationStatus;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  requestPermission: () => Promise<NotificationPermission>;
  subscribe: (deviceName?: string) => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
  showTestNotification: () => Promise<void>;
  
  // Computed
  isSupported: boolean;
  isSubscribed: boolean;
  canSubscribe: boolean;
}

export function usePushNotifications(): UsePushNotificationsReturn {
  const [status, setStatus] = useState<PushNotificationStatus>({
    supported: false,
    permission: 'default',
    subscribed: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize and get current status
  useEffect(() => {
    async function init() {
      try {
        setIsLoading(true);
        setError(null);
        
        // Initialize service worker
        await pushNotificationService.initialize();
        
        // Get current status
        const currentStatus = await pushNotificationService.getStatus();
        setStatus(currentStatus);
      } catch (err) {
        logger.error('Hooks', 'Push notifications init error', { error: err });
        setError(err instanceof Error ? err.message : 'Failed to initialize');
      } finally {
        setIsLoading(false);
      }
    }
    
    init();
  }, []);

  // Request notification permission
  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    try {
      setError(null);
      const permission = await pushNotificationService.requestPermission();
      setStatus(prev => ({ ...prev, permission }));
      return permission;
    } catch (err) {
      logger.error('Hooks', 'Push notifications permission error', { error: err });
      setError(err instanceof Error ? err.message : 'Failed to request permission');
      return 'denied';
    }
  }, []);

  // Subscribe to push notifications
  const subscribe = useCallback(async (deviceName?: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Request permission if not granted
      if (status.permission !== 'granted') {
        const permission = await requestPermission();
        if (permission !== 'granted') {
          setError('Notification permission denied');
          return false;
        }
      }
      
      // Subscribe
      const subscription = await pushNotificationService.subscribe(deviceName);
      
      if (subscription) {
        setStatus(prev => ({
          ...prev,
          subscribed: true,
          subscription,
        }));
        return true;
      } else {
        setError('Failed to subscribe');
        return false;
      }
    } catch (err) {
      logger.error('Hooks', 'Push notifications subscribe error', { error: err });
      setError(err instanceof Error ? err.message : 'Failed to subscribe');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [status.permission, requestPermission]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const success = await pushNotificationService.unsubscribe();
      
      if (success) {
        setStatus(prev => ({
          ...prev,
          subscribed: false,
          subscription: undefined,
        }));
      }
      
      return success;
    } catch (err) {
      logger.error('Hooks', 'Push notifications unsubscribe error', { error: err });
      setError(err instanceof Error ? err.message : 'Failed to unsubscribe');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Show a test notification
  const showTestNotification = useCallback(async (): Promise<void> => {
    try {
      setError(null);
      await pushNotificationService.showLocalNotification('LifeSync Test', {
        body: 'Push notifications are working! 🎉',
        tag: 'test-notification',
        data: { type: 'test' },
      });
    } catch (err) {
      logger.error('Hooks', 'Push notifications test error', { error: err });
      setError(err instanceof Error ? err.message : 'Failed to show notification');
    }
  }, []);

  return {
    status,
    isLoading,
    error,
    requestPermission,
    subscribe,
    unsubscribe,
    showTestNotification,
    isSupported: status.supported,
    isSubscribed: status.subscribed,
    canSubscribe: status.supported && status.permission !== 'denied' && !status.subscribed,
  };
}

