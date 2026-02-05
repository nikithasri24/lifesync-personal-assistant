/**
 * Factory for creating the appropriate VoiceProvider based on platform
 */

import { logger } from '@/services/logger';
import { type VoiceProvider } from './VoiceProvider';
import { WebVoiceProvider } from './WebVoiceProvider';
import { NativeVoiceProvider } from './NativeVoiceProvider';
import { isNative } from '../platform';

let cachedProvider: VoiceProvider | null = null;

/**
 * Get the appropriate VoiceProvider for the current platform
 * 
 * Returns:
 * - NativeVoiceProvider on iOS/Android (Capacitor)
 * - WebVoiceProvider on web browsers
 * 
 * The provider is cached for the lifetime of the app
 */
export function getVoiceProvider(): VoiceProvider {
  if (cachedProvider) {
    return cachedProvider;
  }
  
  if (isNative()) {
    cachedProvider = new NativeVoiceProvider();
  } else {
    cachedProvider = new WebVoiceProvider();
  }

  logger.debug('Voice', `Using ${cachedProvider.name}`);
  return cachedProvider;
}

/**
 * Force a specific provider (useful for testing)
 */
export function setVoiceProvider(provider: VoiceProvider): void {
  cachedProvider = provider;
}

/**
 * Reset the cached provider (for testing)
 */
export function resetVoiceProvider(): void {
  if (cachedProvider) {
    cachedProvider.dispose();
    cachedProvider = null;
  }
}

export { WebVoiceProvider, NativeVoiceProvider };

