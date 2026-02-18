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

// Trip management
export type TripStatus = 'planning' | 'upcoming' | 'in_progress' | 'completed' | 'cancelled';

export type Trip = {
  id: string;
  userId: string;
  connectionId?: string | null; // For shared trips
  visitedBy?: string[]; // Array of user IDs participating in this trip

  // Trip details
  name: string;
  description?: string;
  startDate: string; // ISO date
  endDate: string; // ISO date
  status: TripStatus;

  // Associated locations (many-to-many relationship)
  locationIds?: string[]; // IDs of VisitedLocation entries

  // Trip metadata
  budget?: number;
  currency?: string; // ISO 4217 (e.g., 'USD', 'EUR')
  coverPhoto?: string; // URL
  tags?: string[]; // e.g., ['backpacking', 'business', 'family']

  // Notes and memories
  notes?: string;
  highlights?: string[]; // Key moments or experiences
  rating?: number; // 1-5

  createdAt: string;
  updatedAt: string;
};

// Helper type to categorize trips by participants
export type TripCategory = 'mine' | 'partner' | 'both';

export type CategorizedTrip = Trip & {
  tripCategory: TripCategory;
};

// Input type for creating/updating trips
export type TripInput = Omit<Trip, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;

// Bucket List - Dream destinations to visit
export type BucketListPriority = 'low' | 'medium' | 'high' | 'urgent';
export type BucketListCategory = 'beach' | 'mountain' | 'city' | 'cultural' | 'adventure' | 'relaxation' | 'food' | 'wildlife' | 'other';

export type BucketListDestination = {
  id: string;
  userId: string;
  connectionId?: string | null;
  sharedWith?: string[]; // Array of user IDs who can see/edit this

  // Destination details
  name: string; // e.g., "Santorini, Greece" or "Northern Lights in Iceland"
  description?: string;
  countryCode?: string; // ISO 3166-1 alpha-2
  countryName?: string;
  cityName?: string;
  regionName?: string;

  // Bucket list metadata
  priority: BucketListPriority;
  category: BucketListCategory;
  estimatedBudget?: number;
  currency?: string; // ISO 4217
  targetYear?: number; // Year hoping to visit
  targetSeason?: string; // e.g., 'summer', 'winter', 'spring', 'fall'

  // Planning
  isVisited: boolean;
  visitedDate?: string; // ISO date when marked as visited
  notes?: string;
  inspirationUrl?: string; // Link to blog, video, etc.
  tags?: string[];

  // Wishlist items for this destination
  mustDo?: string[]; // Activities/experiences (e.g., ["Sunset at Oia", "Wine tasting"])
  mustEat?: string[]; // Foods to try
  mustSee?: string[]; // Places to visit

  createdAt: string;
  updatedAt: string;
};

// Helper type to categorize bucket list by ownership
export type BucketListCategory_Ownership = 'mine' | 'partner' | 'shared';

export type CategorizedBucketListDestination = BucketListDestination & {
  ownershipCategory: BucketListCategory_Ownership;
};

// Input type for creating/updating bucket list destinations
export type BucketListDestinationInput = Omit<BucketListDestination, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;
