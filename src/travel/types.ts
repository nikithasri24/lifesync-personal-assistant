/**
 * Travel tracking type definitions
 */

// Location types
export type LocationType = 'country' | 'state' | 'city' | 'region' | 'national_park' | 'island';

export type VisitStatus = 'visited' | 'lived' | 'transit' | 'wishlist';

// Core entities
export type VisitedLocation = {
  id: string;
  userId: string;

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

export type Trip = {
  id: string;
  userId: string;

  // Basic info
  name: string;
  description?: string;

  // Dates
  startDate: string; // ISO date
  endDate?: string; // ISO date (null for ongoing trips)

  // Location
  countries: string[]; // Array of country codes
  cities?: string[];

  // Trip metadata
  tripType: 'vacation' | 'business' | 'weekend' | 'road_trip' | 'backpacking' | 'cruise' | 'other';
  travelCompanions?: string[]; // Names of people you traveled with

  // Budget & Expenses
  budgetAmount?: number;
  budgetCurrency: string; // ISO 4217 (e.g., 'USD', 'EUR')
  totalSpent?: number; // Calculated from expenses

  // Media
  coverPhotoUrl?: string;
  photoUrls?: string[];

  // Status
  status: 'planning' | 'ongoing' | 'completed' | 'cancelled';

  // Rating & memories
  rating?: number; // 1-5
  highlights?: string[];

  createdAt: string;
  updatedAt: string;
};

export type Itinerary = {
  id: string;
  userId: string;
  tripId: string;

  date: string; // ISO date

  activities: ItineraryActivity[];

  notes?: string;

  createdAt: string;
  updatedAt: string;
};

export type ItineraryActivity = {
  id: string;
  time?: string; // HH:MM format
  title: string;
  description?: string;
  location?: string;
  type: 'accommodation' | 'transportation' | 'activity' | 'meal' | 'other';
  bookingReference?: string;
  cost?: number;
  currency?: string;
  notes?: string;
};

// Input types for forms
export type VisitedLocationInput = Omit<
  VisitedLocation,
  'id' | 'userId' | 'createdAt' | 'updatedAt'
>;

export type TripInput = Omit<Trip, 'id' | 'userId' | 'totalSpent' | 'createdAt' | 'updatedAt'>;

export type ItineraryInput = Omit<Itinerary, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;

// Stats & Analytics
export type TravelStats = {
  userId: string;

  // Location stats
  countriesVisited: number;
  statesVisited: number;
  citiesVisited: number;
  continentsVisited: number;

  // Trip stats
  totalTrips: number;
  completedTrips: number;
  upcomingTrips: number;
  totalTravelDays: number;

  // Expense stats
  totalSpent: number;
  averageTripCost: number;
  budgetAdherence: number; // Percentage

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
