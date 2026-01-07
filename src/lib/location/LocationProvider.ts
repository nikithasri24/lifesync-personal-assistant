/**
 * LocationProvider - Abstract interface for location services
 * Supports both web (navigator.geolocation) and native (Capacitor) implementations
 */

import type { Coordinates, SavedLocation } from './types';

export interface LocationWatchOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

export interface GeofenceEvent {
  location: SavedLocation;
  type: 'enter' | 'exit';
  timestamp: Date;
}

export type LocationCallback = (coords: Coordinates) => void;
export type GeofenceCallback = (event: GeofenceEvent) => void;
export type ErrorCallback = (error: Error) => void;

export abstract class LocationProvider {
  protected watchId: number | null = null;
  protected locationCallbacks: LocationCallback[] = [];
  protected geofenceCallbacks: GeofenceCallback[] = [];
  protected errorCallbacks: ErrorCallback[] = [];

  /**
   * Get current location (one-time)
   */
  abstract getCurrentLocation(): Promise<Coordinates | null>;

  /**
   * Start watching location changes
   */
  abstract startWatching(options?: LocationWatchOptions): Promise<void>;

  /**
   * Stop watching location changes
   */
  abstract stopWatching(): void;

  /**
   * Check if location services are available
   */
  abstract isAvailable(): boolean;

  /**
   * Request location permission
   */
  abstract requestPermission(): Promise<'granted' | 'denied' | 'prompt'>;

  /**
   * Check current permission status
   */
  abstract checkPermission(): Promise<'granted' | 'denied' | 'prompt'>;

  /**
   * Add a geofence for a saved location
   */
  abstract addGeofence(location: SavedLocation): Promise<void>;

  /**
   * Remove a geofence
   */
  abstract removeGeofence(locationId: string): Promise<void>;

  /**
   * Calculate distance between two coordinates (in km)
   */
  calculateDistance(from: Coordinates, to: Coordinates): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(to.lat - from.lat);
    const dLng = this.toRad(to.lng - from.lng);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(from.lat)) *
        Math.cos(this.toRad(to.lat)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  /**
   * Check if coordinates are within a location's geofence
   */
  isWithinGeofence(coords: Coordinates, location: SavedLocation): boolean {
    const distance = this.calculateDistance(coords, location.coordinates);
    const radiusKm = (location.radius ?? 100) / 1000; // Default 100m radius
    return distance <= radiusKm;
  }

  // Event subscription methods
  onLocationUpdate(callback: LocationCallback): () => void {
    this.locationCallbacks.push(callback);
    return () => {
      this.locationCallbacks = this.locationCallbacks.filter((cb) => cb !== callback);
    };
  }

  onGeofenceEvent(callback: GeofenceCallback): () => void {
    this.geofenceCallbacks.push(callback);
    return () => {
      this.geofenceCallbacks = this.geofenceCallbacks.filter((cb) => cb !== callback);
    };
  }

  onError(callback: ErrorCallback): () => void {
    this.errorCallbacks.push(callback);
    return () => {
      this.errorCallbacks = this.errorCallbacks.filter((cb) => cb !== callback);
    };
  }

  protected notifyLocationUpdate(coords: Coordinates): void {
    this.locationCallbacks.forEach((cb) => cb(coords));
  }

  protected notifyGeofenceEvent(event: GeofenceEvent): void {
    this.geofenceCallbacks.forEach((cb) => cb(event));
  }

  protected notifyError(error: Error): void {
    this.errorCallbacks.forEach((cb) => cb(error));
  }
}

