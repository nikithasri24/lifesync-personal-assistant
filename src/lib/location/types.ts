/**
 * Location types for commute intelligence and location-based features
 */

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface SavedLocation {
  id: string;
  name: string;
  address?: string;
  coordinates: Coordinates;
  type: 'home' | 'work' | 'store' | 'custom';
  tags?: string[];
  radius?: number; // Geofence radius in meters
}

export interface LocationPreferences {
  homeLocation: SavedLocation | null;
  workLocation: SavedLocation | null;
  savedLocations: SavedLocation[];
  commuteMode: 'driving' | 'walking' | 'transit' | 'cycling';
  defaultCommuteMinutes: number;
}

export interface LocationContext {
  currentLocation: Coordinates | null;
  isAtHome: boolean;
  isAtWork: boolean;
  nearbyLocations: SavedLocation[];
  lastUpdated: Date;
}

export interface CommuteEstimate {
  durationMinutes: number;
  distanceKm: number;
  leaveByTime: Date;
  arrivalTime: Date;
  mode: 'driving' | 'walking' | 'transit' | 'cycling';
}

export interface LocationReminder {
  id: string;
  taskId: string;
  taskTitle: string;
  location: SavedLocation;
  triggerType: 'arriving' | 'leaving' | 'nearby';
  triggered: boolean;
  createdAt: Date;
}

export interface ErrandTask {
  taskId: string;
  title: string;
  location: SavedLocation;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: Date;
}

