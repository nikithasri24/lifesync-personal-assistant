/**
 * React hook for platform detection
 * 
 * Provides reactive access to platform information
 * and enables platform-specific rendering patterns
 */

import { useMemo } from 'react';
import { getPlatformInfo, type PlatformInfo } from '../lib/platform';

/**
 * Hook to get current platform information
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { isNative, isIOS, isMobile } = usePlatform();
 *   
 *   if (isNative) {
 *     return <NativeSpecificComponent />;
 *   }
 *   
 *   return <WebComponent />;
 * }
 * ```
 */
export function usePlatform(): PlatformInfo {
  // Platform info is static after initial load, so we can memoize
  return useMemo(() => getPlatformInfo(), []);
}

/**
 * Higher-order component pattern for platform-specific rendering
 */
export function usePlatformSwitch<T>(options: {
  ios?: T;
  android?: T;
  native?: T;
  web?: T;
  default: T;
}): T {
  const { isIOS, isAndroid, isNative, isWeb } = usePlatform();
  
  return useMemo(() => {
    if (isIOS && options.ios !== undefined) return options.ios;
    if (isAndroid && options.android !== undefined) return options.android;
    if (isNative && options.native !== undefined) return options.native;
    if (isWeb && options.web !== undefined) return options.web;
    return options.default;
  }, [isIOS, isAndroid, isNative, isWeb, options]);
}

export default usePlatform;

