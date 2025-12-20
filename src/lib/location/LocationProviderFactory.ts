/**
 * LocationProviderFactory - Creates the appropriate location provider based on platform
 */

import { isNative } from '../platform';
import type { LocationProvider } from './LocationProvider';
import { WebLocationProvider } from './WebLocationProvider';
import { NativeLocationProvider } from './NativeLocationProvider';

let instance: LocationProvider | null = null;

export function getLocationProvider(): LocationProvider {
  if (!instance) {
    instance = isNative() ? new NativeLocationProvider() : new WebLocationProvider();
  }
  return instance;
}

export function resetLocationProvider(): void {
  if (instance) {
    instance.stopWatching();
    instance = null;
  }
}

