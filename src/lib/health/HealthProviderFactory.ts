/**
 * Factory for creating the appropriate HealthProvider based on platform
 */

import { isNative, isIOS } from '../platform';
import type { HealthProvider } from './HealthProvider';
import { WebHealthProvider } from './WebHealthProvider';
import { NativeHealthProvider } from './NativeHealthProvider';

let instance: HealthProvider | null = null;

/**
 * Get the appropriate health provider for the current platform
 * Returns a singleton instance
 */
export function getHealthProvider(): HealthProvider {
  if (!instance) {
    if (isNative() && isIOS()) {
      instance = new NativeHealthProvider();
    } else {
      // Web or Android (Android would need Google Fit integration)
      instance = new WebHealthProvider();
    }
  }
  return instance;
}

/**
 * Reset the singleton (useful for testing)
 */
export function resetHealthProvider(): void {
  if (instance) {
    instance.dispose();
    instance = null;
  }
}

