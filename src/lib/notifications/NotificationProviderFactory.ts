/**
 * Factory for creating the appropriate NotificationProvider based on platform
 */

import { isNative } from '../platform';
import type { NotificationProvider } from './NotificationProvider';
import { WebNotificationProvider } from './WebNotificationProvider';
import { NativeNotificationProvider } from './NativeNotificationProvider';

let instance: NotificationProvider | null = null;

/**
 * Get the appropriate notification provider for the current platform
 * Returns a singleton instance
 */
export function getNotificationProvider(): NotificationProvider {
  if (!instance) {
    if (isNative()) {
      instance = new NativeNotificationProvider();
    } else {
      instance = new WebNotificationProvider();
    }
  }
  return instance;
}

/**
 * Reset the singleton (useful for testing)
 */
export function resetNotificationProvider(): void {
  if (instance) {
    instance.dispose();
    instance = null;
  }
}

