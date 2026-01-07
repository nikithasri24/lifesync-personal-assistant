/**
 * NativeLocationProvider - Capacitor-based location for iOS/Android
 * Uses @capacitor/geolocation plugin
 */

import { LocationProvider, type LocationWatchOptions } from './LocationProvider';
import type { Coordinates, SavedLocation } from './types';

// Capacitor Geolocation types (will be available when plugin is installed)
interface CapacitorGeolocation {
  getCurrentPosition(options?: {
    enableHighAccuracy?: boolean;
    timeout?: number;
    maximumAge?: number;
  }): Promise<{ coords: { latitude: number; longitude: number } }>;
  watchPosition(
    options: { enableHighAccuracy?: boolean; timeout?: number; maximumAge?: number },
    callback: (position: { coords: { latitude: number; longitude: number } } | null, err?: Error) => void
  ): Promise<string>;
  clearWatch(options: { id: string }): Promise<void>;
  checkPermissions(): Promise<{ location: 'granted' | 'denied' | 'prompt' }>;
  requestPermissions(): Promise<{ location: 'granted' | 'denied' | 'prompt' }>;
}

declare global {
  interface Window {
    Capacitor?: {
      Plugins?: {
        Geolocation?: CapacitorGeolocation;
      };
    };
  }
}

export class NativeLocationProvider extends LocationProvider {
  private nativeWatchId: string | null = null;
  private geofences: Map<string, SavedLocation> = new Map();
  private previouslyInside: Set<string> = new Set();

  private get geolocation(): CapacitorGeolocation | null {
    return window.Capacitor?.Plugins?.Geolocation ?? null;
  }

  isAvailable(): boolean {
    return this.geolocation !== null;
  }

  async requestPermission(): Promise<'granted' | 'denied' | 'prompt'> {
    if (!this.geolocation) return 'denied';
    try {
      const result = await this.geolocation.requestPermissions();
      return result.location;
    } catch {
      return 'denied';
    }
  }

  async checkPermission(): Promise<'granted' | 'denied' | 'prompt'> {
    if (!this.geolocation) return 'denied';
    try {
      const result = await this.geolocation.checkPermissions();
      return result.location;
    } catch {
      return 'denied';
    }
  }

  async getCurrentLocation(): Promise<Coordinates | null> {
    if (!this.geolocation) return null;
    try {
      const position = await this.geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      });
      return {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };
    } catch (error) {
      // Log error for debugging but don't throw
      console.warn('[NativeLocationProvider] Could not get location:', error);
      return null;
    }
  }

  async startWatching(options?: LocationWatchOptions): Promise<void> {
    if (!this.geolocation) return;

    if (this.nativeWatchId) {
      await this.stopWatchingAsync();
    }

    this.nativeWatchId = await this.geolocation.watchPosition(
      {
        enableHighAccuracy: options?.enableHighAccuracy ?? true,
        timeout: options?.timeout ?? 10000,
        maximumAge: options?.maximumAge ?? 60000,
      },
      (position, err) => {
        if (err) {
          // Only notify for critical errors, not transient location failures
          const errorMessage = err.message || String(err);
          if (errorMessage.includes('permission') || errorMessage.includes('denied')) {
            this.notifyError(new Error('Location permission denied'));
          }
          // Silently ignore kCLErrorLocationUnknown and other transient errors
          return;
        }
        if (position) {
          const coords: Coordinates = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          this.notifyLocationUpdate(coords);
          this.checkGeofences(coords);
        }
      }
    );
  }

  stopWatching(): void {
    void this.stopWatchingAsync();
  }

  private async stopWatchingAsync(): Promise<void> {
    if (this.nativeWatchId && this.geolocation) {
      await this.geolocation.clearWatch({ id: this.nativeWatchId });
      this.nativeWatchId = null;
    }
  }

  async addGeofence(location: SavedLocation): Promise<void> {
    // Native geofencing would use BackgroundGeolocation plugin
    // For now, use software-based geofencing like web
    this.geofences.set(location.id, location);
  }

  async removeGeofence(locationId: string): Promise<void> {
    this.geofences.delete(locationId);
  }

  private checkGeofences(coords: Coordinates): void {
    for (const [id, location] of this.geofences) {
      const isInside = this.isWithinGeofence(coords, location);
      const wasInside = this.previouslyInside.has(id);

      if (isInside && !wasInside) {
        this.previouslyInside.add(id);
        this.notifyGeofenceEvent({ location, type: 'enter', timestamp: new Date() });
      } else if (!isInside && wasInside) {
        this.previouslyInside.delete(id);
        this.notifyGeofenceEvent({ location, type: 'exit', timestamp: new Date() });
      }
    }
  }
}

