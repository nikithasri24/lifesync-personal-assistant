/**
 * Travel tracking type definitions
 */

// Location types
export type LocationType = 'country' | 'state' | 'city' | 'region' | 'national_park' | 'island';

export type VisitStatus = 'visited' | 'lived' | 'transit' | 'wishlist';

// Core entities
export type VisitedLocation = {
  id: string;
  userId?: string | null; // Owner of the location entry
  connectionId?: string | null; // For backward compatibility with old merged mode
  visitedBy?: string[]; // Array of user IDs who have visited this location (for collaborative tracking)

  // Location details
  locationType: LocationType;
  countryCode: string; // ISO 3166-1 alpha-2 (e.g., 'US', 'FR')
  countryName: string;
  stateCode?: string; // For US states, Canadian provinces, etc.
  stateName?: string;
  cityName?: string;
  regionName?: string;
  islandName?: string; // For Hawaii, Greek islands, etc.
  nationalParkId?: string; // ID from national parks database
  nationalParkName?: string;

  // Visit info
  status: VisitStatus;
  firstVisitDate?: string; // ISO date
  lastVisitDate?: string;
  visitCount: number;
  totalDays?: number;

  // Notes
  notes?: string;
  rating?: number; // 1-5
  favoritePlace?: boolean;

  createdAt: string;
  updatedAt: string;
};

// Helper type to categorize locations by who visited them
export type LocationVisitCategory = 'mine' | 'partner' | 'both';

export type CategorizedLocation = VisitedLocation & {
  visitCategory: LocationVisitCategory;
};

// Input types for forms
export type VisitedLocationInput = Omit<
  VisitedLocation,
  'id' | 'userId' | 'createdAt' | 'updatedAt'
>;

// Stats & Analytics
export type TravelStats = {
  userId: string;

  // Location stats
  countriesVisited: number;
  statesVisited: number;
  citiesVisited: number;
  continentsVisited: number;

  // Journal stats
  journalEntries: number;
  photosUploaded: number;

  // Achievements
  visitedAllContinents: boolean;
  visited50Countries: boolean;
  visited100Countries: boolean;
};

export type CountryInfo = {
  code: string; // ISO 3166-1 alpha-2
  name: string;
  continent: string;
  region?: string;
  flag?: string; // Emoji or URL
};

// Map data
export type WorldMapData = {
  visited: string[]; // Country codes
  lived: string[]; // Country codes
  transit: string[]; // Country codes
  wishlist: string[]; // Country codes
};
