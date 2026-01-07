/**
 * Platform detection utilities for Capacitor/Web hybrid app
 * 
 * Provides unified detection of running environment:
 * - Native iOS app (Capacitor)
 * - Native Android app (Capacitor)
 * - Web browser
 * - PWA installed
 */

import { Capacitor } from '@capacitor/core';

export type Platform = 'ios' | 'android' | 'web';

export interface PlatformInfo {
  platform: Platform;
  isNative: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isWeb: boolean;
  isPWA: boolean;
  isMobile: boolean;
}

/**
 * Get the current platform
 */
export function getPlatform(): Platform {
  return Capacitor.getPlatform() as Platform;
}

/**
 * Check if running as a native app (not web)
 */
export function isNative(): boolean {
  return Capacitor.isNativePlatform();
}

/**
 * Check if running on iOS
 */
export function isIOS(): boolean {
  return Capacitor.getPlatform() === 'ios';
}

/**
 * Check if running on Android
 */
export function isAndroid(): boolean {
  return Capacitor.getPlatform() === 'android';
}

/**
 * Check if running in a web browser
 */
export function isWeb(): boolean {
  return Capacitor.getPlatform() === 'web';
}

/**
 * Check if running as an installed PWA
 */
export function isPWA(): boolean {
  if (isNative()) return false;
  
  // Check if running in standalone mode (installed PWA)
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

/**
 * Check if running on a mobile device (native or mobile web)
 */
export function isMobile(): boolean {
  if (isNative()) return true;
  
  // Check user agent for mobile web
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

/**
 * Get comprehensive platform information
 */
export function getPlatformInfo(): PlatformInfo {
  const platform = getPlatform();
  
  return {
    platform,
    isNative: isNative(),
    isIOS: isIOS(),
    isAndroid: isAndroid(),
    isWeb: isWeb(),
    isPWA: isPWA(),
    isMobile: isMobile(),
  };
}

/**
 * Execute platform-specific code
 */
export function platformSwitch<T>(options: {
  ios?: () => T;
  android?: () => T;
  native?: () => T;
  web?: () => T;
  default: () => T;
}): T {
  const platform = getPlatform();
  
  // Try platform-specific handler first
  if (platform === 'ios' && options.ios) {
    return options.ios();
  }
  if (platform === 'android' && options.android) {
    return options.android();
  }
  
  // Try native handler
  if (isNative() && options.native) {
    return options.native();
  }
  
  // Try web handler
  if (isWeb() && options.web) {
    return options.web();
  }
  
  // Fall back to default
  return options.default();
}

