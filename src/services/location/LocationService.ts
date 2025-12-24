/**
 * LocationService - High-level location intelligence service
 * Provides commute estimation, location-based reminders, and errand suggestions
 *
 * ARCHITECTURE: Uses API layer for all data access (no direct Supabase calls)
 */

import { getLocationProvider } from '@/lib/location';
import type {
  Coordinates,
  SavedLocation,
  LocationContext,
  CommuteEstimate,
  LocationPreferences,
  ErrandTask,
} from '@/lib/location/types';
import { getUserPreferences, updateUserPreferences } from '@/api/userSettingsAPI';

class LocationService {
  private preferences: LocationPreferences | null = null;
  private currentContext: LocationContext | null = null;

  /**
   * Get user's location preferences from database
   */
  async getPreferences(): Promise<LocationPreferences> {
    if (this.preferences) return this.preferences;

    // Use API layer instead of direct Supabase
    try {
      const data = await getUserPreferences();

      if (data) {
        this.preferences = {
          homeLocation: (data.home_location as unknown as SavedLocation) || null,
          workLocation: (data.work_location as unknown as SavedLocation) || null,
          savedLocations: ((data.saved_locations as unknown as SavedLocation[]) ?? []),
          commuteMode: 'driving',
          defaultCommuteMinutes: 30,
        };
      } else {
        this.preferences = this.getDefaultPreferences();
      }

      return this.preferences;
    } catch (error) {
      return this.getDefaultPreferences();
    }
  }

  private getDefaultPreferences(): LocationPreferences {
    return {
      homeLocation: null,
      workLocation: null,
      savedLocations: [],
      commuteMode: 'driving',
      defaultCommuteMinutes: 30,
    };
  }

  /**
   * Get current location context
   */
  async getLocationContext(): Promise<LocationContext> {
    const provider = getLocationProvider();
    const prefs = await this.getPreferences();
    const currentLocation = await provider.getCurrentLocation();

    const context: LocationContext = {
      currentLocation,
      isAtHome: false,
      isAtWork: false,
      nearbyLocations: [],
      lastUpdated: new Date(),
    };

    if (currentLocation) {
      // Check if at home
      if (prefs.homeLocation) {
        context.isAtHome = provider.isWithinGeofence(currentLocation, prefs.homeLocation);
      }

      // Check if at work
      if (prefs.workLocation) {
        context.isAtWork = provider.isWithinGeofence(currentLocation, prefs.workLocation);
      }

      // Find nearby saved locations (within 2km)
      context.nearbyLocations = prefs.savedLocations.filter((loc) => {
        const distance = provider.calculateDistance(currentLocation, loc.coordinates);
        return distance <= 2; // 2km radius
      });
    }

    this.currentContext = context;
    return context;
  }

  /**
   * Estimate commute time between two locations
   */
  async estimateCommute(
    from: Coordinates,
    to: Coordinates,
    arriveBy?: Date
  ): Promise<CommuteEstimate> {
    const provider = getLocationProvider();
    const prefs = await this.getPreferences();
    const distanceKm = provider.calculateDistance(from, to);

    // Estimate duration based on mode (simplified - would use Maps API in production)
    const speedKmH = {
      driving: 40, // Average city driving
      walking: 5,
      cycling: 15,
      transit: 25,
    };

    const durationMinutes = Math.ceil((distanceKm / speedKmH[prefs.commuteMode]) * 60);
    const now = new Date();
    const arrivalTime = arriveBy ?? new Date(now.getTime() + durationMinutes * 60000);
    const leaveByTime = new Date(arrivalTime.getTime() - durationMinutes * 60000);

    return {
      durationMinutes,
      distanceKm,
      leaveByTime,
      arrivalTime,
      mode: prefs.commuteMode,
    };
  }

  /**
   * Get commute estimate to work
   */
  async getCommuteToWork(): Promise<CommuteEstimate | null> {
    const context = await this.getLocationContext();
    const prefs = await this.getPreferences();

    if (!context.currentLocation || !prefs.workLocation) {
      return null;
    }

    return this.estimateCommute(context.currentLocation, prefs.workLocation.coordinates);
  }

  /**
   * Get commute estimate to home
   */
  async getCommuteToHome(): Promise<CommuteEstimate | null> {
    const context = await this.getLocationContext();
    const prefs = await this.getPreferences();

    if (!context.currentLocation || !prefs.homeLocation) {
      return null;
    }

    return this.estimateCommute(context.currentLocation, prefs.homeLocation.coordinates);
  }

  /**
   * Get errands that can be done on the way to a destination
   */
  async getErrandsOnRoute(
    destination: SavedLocation,
    tasks: ErrandTask[]
  ): Promise<ErrandTask[]> {
    const context = await this.getLocationContext();
    if (!context.currentLocation) return [];

    const provider = getLocationProvider();

    // Filter tasks that have locations between current position and destination
    return tasks.filter((task) => {
      const distToTask = provider.calculateDistance(
        context.currentLocation!,
        task.location.coordinates
      );
      const distToDest = provider.calculateDistance(
        context.currentLocation!,
        destination.coordinates
      );
      const taskToDestDist = provider.calculateDistance(
        task.location.coordinates,
        destination.coordinates
      );

      // Task is "on the way" if going via task doesn't add more than 30% to the trip
      const directDistance = distToDest;
      const viaTaskDistance = distToTask + taskToDestDist;
      return viaTaskDistance <= directDistance * 1.3;
    });
  }

  /**
   * Get nearby errands based on current location
   */
  async getNearbyErrands(tasks: ErrandTask[], radiusKm = 2): Promise<ErrandTask[]> {
    const context = await this.getLocationContext();
    if (!context.currentLocation) return [];

    const provider = getLocationProvider();

    return tasks
      .filter((task) => {
        const distance = provider.calculateDistance(
          context.currentLocation!,
          task.location.coordinates
        );
        return distance <= radiusKm;
      })
      .sort((a, b) => {
        const distA = provider.calculateDistance(
          context.currentLocation!,
          a.location.coordinates
        );
        const distB = provider.calculateDistance(
          context.currentLocation!,
          b.location.coordinates
        );
        return distA - distB;
      });
  }

  /**
   * Save a location to user preferences
   */
  async saveLocation(location: SavedLocation): Promise<void> {
    // Use API layer instead of direct Supabase
    const prefs = await this.getPreferences();

    if (location.type === 'home') {
      await updateUserPreferences({
        home_location: location as unknown as Record<string, unknown>,
      });
      this.preferences = { ...prefs, homeLocation: location };
    } else if (location.type === 'work') {
      await updateUserPreferences({
        work_location: location as unknown as Record<string, unknown>,
      });
      this.preferences = { ...prefs, workLocation: location };
    } else {
      const updatedLocations = [...prefs.savedLocations.filter((l) => l.id !== location.id), location];
      await updateUserPreferences({
        saved_locations: updatedLocations as unknown as Record<string, unknown>[],
      });
      this.preferences = { ...prefs, savedLocations: updatedLocations };
    }
  }

  /**
   * Remove a saved location
   */
  async removeLocation(locationId: string): Promise<void> {
    // Use API layer instead of direct Supabase
    const prefs = await this.getPreferences();
    const updatedLocations = prefs.savedLocations.filter((l) => l.id !== locationId);

    await updateUserPreferences({
      saved_locations: updatedLocations as unknown as Record<string, unknown>[],
    });

    this.preferences = { ...prefs, savedLocations: updatedLocations };
  }

  /**
   * Calculate leave-by time for an appointment
   */
  async calculateLeaveByTime(
    appointmentLocation: Coordinates,
    appointmentTime: Date,
    bufferMinutes = 10
  ): Promise<Date | null> {
    const context = await this.getLocationContext();
    if (!context.currentLocation) return null;

    const estimate = await this.estimateCommute(
      context.currentLocation,
      appointmentLocation,
      appointmentTime
    );

    // Subtract buffer time
    return new Date(estimate.leaveByTime.getTime() - bufferMinutes * 60000);
  }

  /**
   * Check if user is leaving work (for "on your way home" suggestions)
   */
  async isLeavingWork(): Promise<boolean> {
    const context = await this.getLocationContext();
    const prefs = await this.getPreferences();

    if (!context.currentLocation || !prefs.workLocation) return false;

    // User is "leaving work" if they were at work recently but are now moving away
    // This is a simplified check - would need location history for accurate detection
    const provider = getLocationProvider();
    const distanceFromWork = provider.calculateDistance(
      context.currentLocation,
      prefs.workLocation.coordinates
    );

    // Within 500m of work but not inside the geofence
    return distanceFromWork > 0.1 && distanceFromWork < 0.5;
  }
}

export const locationService = new LocationService();

