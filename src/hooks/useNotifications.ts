/**
 * useNotifications Hook
 * Cross-platform notification hook using NotificationProvider abstraction
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  getNotificationProvider, 
  type NotificationProvider,
  type NotificationData,
  type NotificationPermissionStatus,
  type ScheduleOptions,
} from '@/lib/notifications';

interface UseNotificationsReturn {
  // Status
  isSupported: boolean;
  permission: NotificationPermissionStatus;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  requestPermission: () => Promise<NotificationPermissionStatus>;
  registerForPush: () => Promise<string | null>;
  unregisterFromPush: () => Promise<boolean>;
  showNotification: (notification: NotificationData) => Promise<void>;
  scheduleNotification: (notification: NotificationData, schedule: ScheduleOptions) => Promise<number>;
  cancelNotification: (id: number) => Promise<void>;
  cancelAllNotifications: () => Promise<void>;
  
  // Provider info
  providerName: string;
}

export function useNotifications(): UseNotificationsReturn {
  const providerRef = useRef<NotificationProvider | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermissionStatus>({
    permission: 'default',
    isEnabled: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Initialize provider
  useEffect(() => {
    const provider = getNotificationProvider();
    providerRef.current = provider;
    
    setIsSupported(provider.isSupported());
    
    // Get initial permission status
    provider.getPermissionStatus()
      .then(status => {
        setPermission(status);
        setIsLoading(false);
      })
      .catch(err => {
        setError(err instanceof Error ? err.message : 'Failed to get permission status');
        setIsLoading(false);
      });
    
    return () => {
      // Don't dispose - it's a singleton
    };
  }, []);
  
  const requestPermission = useCallback(async (): Promise<NotificationPermissionStatus> => {
    if (!providerRef.current) {
      return { permission: 'denied', isEnabled: false };
    }
    
    try {
      setError(null);
      const status = await providerRef.current.requestPermission();
      setPermission(status);
      return status;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to request permission';
      setError(message);
      return { permission: 'denied', isEnabled: false };
    }
  }, []);
  
  const registerForPush = useCallback(async (): Promise<string | null> => {
    if (!providerRef.current) return null;
    
    try {
      setError(null);
      return await providerRef.current.registerForPush();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to register for push');
      return null;
    }
  }, []);
  
  const unregisterFromPush = useCallback(async (): Promise<boolean> => {
    if (!providerRef.current) return false;
    
    try {
      setError(null);
      return await providerRef.current.unregisterFromPush();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unregister');
      return false;
    }
  }, []);
  
  const showNotification = useCallback(async (notification: NotificationData): Promise<void> => {
    if (!providerRef.current) return;
    
    try {
      setError(null);
      await providerRef.current.showNotification(notification);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to show notification');
    }
  }, []);
  
  const scheduleNotification = useCallback(async (
    notification: NotificationData,
    schedule: ScheduleOptions
  ): Promise<number> => {
    if (!providerRef.current) return -1;
    
    try {
      setError(null);
      return await providerRef.current.scheduleNotification(notification, schedule);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to schedule notification');
      return -1;
    }
  }, []);
  
  const cancelNotification = useCallback(async (id: number): Promise<void> => {
    if (!providerRef.current) return;
    
    try {
      setError(null);
      await providerRef.current.cancelNotification(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel notification');
    }
  }, []);
  
  const cancelAllNotifications = useCallback(async (): Promise<void> => {
    if (!providerRef.current) return;
    
    try {
      setError(null);
      await providerRef.current.cancelAllNotifications();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel notifications');
    }
  }, []);
  
  return {
    isSupported,
    permission,
    isLoading,
    error,
    requestPermission,
    registerForPush,
    unregisterFromPush,
    showNotification,
    scheduleNotification,
    cancelNotification,
    cancelAllNotifications,
    providerName: providerRef.current?.name ?? 'unknown',
  };
}

