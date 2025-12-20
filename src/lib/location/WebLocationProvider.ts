/**
 * WebLocationProvider - Browser-based location using navigator.geolocation
 */

import { LocationProvider, type LocationWatchOptions } from './LocationProvider';
import type { Coordinates, SavedLocation } from './types';

export class WebLocationProvider extends LocationProvider {
  private geofences: Map<string, SavedLocation> = new Map();
  private lastKnownLocation: Coordinates | null = null;

  isAvailable(): boolean {
    return typeof navigator !== 'undefined' && 'geolocation' in navigator;
  }

  async requestPermission(): Promise<'granted' | 'denied' | 'prompt'> {
    if (!this.isAvailable()) return 'denied';

    try {
      // Try to get location to trigger permission prompt
      await this.getCurrentLocation();
      return 'granted';
    } catch {
      return 'denied';
    }
  }

  async checkPermission(): Promise<'granted' | 'denied' | 'prompt'> {
    if (!this.isAvailable()) return 'denied';

    if ('permissions' in navigator) {
      try {
        const result = await navigator.permissions.query({ name: 'geolocation' });
        return result.state as 'granted' | 'denied' | 'prompt';
      } catch {
        return 'prompt';
      }
    }
    return 'prompt';
  }

  async getCurrentLocation(): Promise<Coordinates | null> {
    if (!this.isAvailable()) return null;

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords: Coordinates = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          this.lastKnownLocation = coords;
          resolve(coords);
        },
        () => {
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    });
  }

  async startWatching(options?: LocationWatchOptions): Promise<void> {
    if (!this.isAvailable()) return;

    if (this.watchId !== null) {
      this.stopWatching();
    }

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        const coords: Coordinates = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        this.lastKnownLocation = coords;
        this.notifyLocationUpdate(coords);
        this.checkGeofences(coords);
      },
      (error) => {
        this.notifyError(new Error(error.message));
      },
      {
        enableHighAccuracy: options?.enableHighAccuracy ?? true,
        timeout: options?.timeout ?? 10000,
        maximumAge: options?.maximumAge ?? 60000,
      }
    );
  }

  stopWatching(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  async addGeofence(location: SavedLocation): Promise<void> {
    this.geofences.set(location.id, location);
  }

  async removeGeofence(locationId: string): Promise<void> {
    this.geofences.delete(locationId);
  }

  private previouslyInside: Set<string> = new Set();

  private checkGeofences(coords: Coordinates): void {
    for (const [id, location] of this.geofences) {
      const isInside = this.isWithinGeofence(coords, location);
      const wasInside = this.previouslyInside.has(id);

      if (isInside && !wasInside) {
        this.previouslyInside.add(id);
        this.notifyGeofenceEvent({
          location,
          type: 'enter',
          timestamp: new Date(),
        });
      } else if (!isInside && wasInside) {
        this.previouslyInside.delete(id);
        this.notifyGeofenceEvent({
          location,
          type: 'exit',
          timestamp: new Date(),
        });
      }
    }
  }
}

