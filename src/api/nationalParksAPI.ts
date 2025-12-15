/**
 * National Parks API
 * CRUD operations for national parks data and visited parks tracking
 */

import { supabase } from '../lib/supabase';
import type { NationalPark } from '../types/nationalParks';
import type { NationalPark as TravelPark } from '../travel/data/nationalParks';
import { logger } from '../services/logger';

/**
 * Maps travel data park format to the NationalPark type used by the app
 */
function mapTravelParkToNationalPark(park: TravelPark): NationalPark {
  // Extract state abbreviation from stateCode (e.g., "US-CA" -> "CA")
  const state = park.stateCode ? park.stateCode.split('-')[1] ?? park.stateCode : 'Unknown';

  return {
    id: park.id,
    name: park.name,
    state,
    coordinates: [park.lat, park.lon],
    established: park.established ? park.established.toString() : 'Unknown',
    description: park.description ?? '',
    visitors: 'Unknown', // Travel data doesn't include visitor counts
    features: [], // Travel data doesn't include features
  };
}

// Database types
export interface VisitedParkData {
  id: string;
  user_id: string;
  park_id: string;
  visit_date: string;
  notes?: string;
  rating?: number;
  photos?: string[];
  created_at: string;
  updated_at: string;
}

export interface ParkFilters {
  state?: string;
  features?: string[];
  searchQuery?: string;
}

// =====================================================
// PARKS CRUD OPERATIONS
// =====================================================

/**
 * Get all national parks with optional filters
 * @param filters - Optional filters for state, features, and search
 * @returns Promise<NationalPark[]> - Array of national parks matching the filters
 */
export async function getParks(filters?: ParkFilters): Promise<NationalPark[]> {
  try {
    // Note: National parks data is typically static and loaded from a data file
    // This function can be extended to fetch from Supabase if parks are stored in DB
    const { nationalParks } = await import('../travel/data/nationalParks');

    // Map travel parks to app NationalPark format
    let parks = nationalParks.map(mapTravelParkToNationalPark);

    // Apply filters
    if (filters) {
      if (filters.state) {
        parks = parks.filter((park) =>
          park.state.toLowerCase().includes(filters.state!.toLowerCase())
        );
      }

      if (filters.features && filters.features.length > 0) {
        parks = parks.filter((park) =>
          filters.features!.some((feature) =>
            park.features.some((parkFeature) =>
              parkFeature.toLowerCase().includes(feature.toLowerCase())
            )
          )
        );
      }

      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        parks = parks.filter(
          (park) =>
            park.name.toLowerCase().includes(query) ||
            park.state.toLowerCase().includes(query) ||
            park.description.toLowerCase().includes(query)
        );
      }
    }

    return parks;
  } catch (error) {
    logger.error('NationalParksAPI', 'Operation failed', { error, context: 'getParks', filters });
    throw error;
  }
}

/**
 * Get a single national park by ID
 * @param id - Park ID
 * @returns Promise<NationalPark> - The requested national park
 * @throws Error if park not found
 */
export async function getPark(id: string): Promise<NationalPark> {
  try {
    const { nationalParks } = await import('../travel/data/nationalParks');
    const park = nationalParks.find((p) => p.id === id);

    if (!park) {
      throw new Error('Park not found');
    }

    return mapTravelParkToNationalPark(park);
  } catch (error) {
    logger.error('NationalParksAPI', 'Operation failed', { error, context: 'getPark', id });
    throw error;
  }
}

/**
 * Search parks by name or state
 * @param query - Search query string
 * @param filters - Optional additional filters
 * @returns Promise<NationalPark[]> - Array of parks matching the search
 */
export async function searchParks(
  query: string,
  filters?: Omit<ParkFilters, 'searchQuery'>
): Promise<NationalPark[]> {
  return getParks({ ...filters, searchQuery: query });
}

// =====================================================
// VISITED PARKS CRUD OPERATIONS
// =====================================================

/**
 * Get all visited parks for the current user
 * @returns Promise<VisitedParkData[]> - Array of visited parks
 * @throws Error if user not authenticated
 */
export async function getVisitedParks(): Promise<VisitedParkData[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('visited_parks')
    .select('*')
    .eq('user_id', user.id)
    .order('visit_date', { ascending: false });

  if (error) {
    logger.error('NationalParksAPI', error, { context: 'getVisitedParks' });
    throw error;
  }

  return (data ?? []) as VisitedParkData[];
}

/**
 * Add a visited park record
 * @param parkId - National park ID
 * @param data - Visit data including date, notes, rating, photos
 * @returns Promise<VisitedParkData> - The created visited park record
 * @throws Error if creation fails or user not authenticated
 */
export async function addVisitedPark(
  parkId: string,
  data: {
    visitDate: Date | string;
    notes?: string;
    rating?: number;
    photos?: string[];
  }
): Promise<VisitedParkData> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const visitDate =
    typeof data.visitDate === 'string'
      ? data.visitDate
      : data.visitDate.toISOString().split('T')[0];

  const result = await supabase
    .from('visited_parks')
    .insert({
      user_id: user.id,
      park_id: parkId,
      visit_date: visitDate,
      notes: data.notes ?? null,
      rating: data.rating ?? null,
      photos: data.photos ?? [],
    })
    .select()
    .single();

  if (result.error) {
    logger.error('NationalParksAPI', result.error, { context: 'addVisitedPark', parkId, data });
    throw result.error;
  }

  logger.info('NationalParksAPI', 'Visited park added', { id: result.data.id, parkId });
  return result.data as VisitedParkData;
}

/**
 * Update a visited park record
 * @param id - Visited park record ID
 * @param updates - Partial data to update
 * @returns Promise<VisitedParkData> - The updated visited park record
 * @throws Error if record not found or user not authenticated
 */
export async function updateVisitedPark(
  id: string,
  updates: Partial<{
    visitDate: Date | string;
    notes: string;
    rating: number;
    photos: string[];
  }>
): Promise<VisitedParkData> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const updateData: Record<string, unknown> = {};

  if (updates.visitDate !== undefined) {
    updateData.visit_date =
      typeof updates.visitDate === 'string'
        ? updates.visitDate
        : updates.visitDate.toISOString().split('T')[0];
  }
  if (updates.notes !== undefined) updateData.notes = updates.notes;
  if (updates.rating !== undefined) updateData.rating = updates.rating;
  if (updates.photos !== undefined) updateData.photos = updates.photos;
  updateData.updated_at = new Date().toISOString();

  const result = await supabase
    .from('visited_parks')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (result.error) {
    logger.error('NationalParksAPI', result.error, { context: 'updateVisitedPark', id, updates });
    throw result.error;
  }

  logger.info('NationalParksAPI', 'Visited park updated', { id });
  return result.data as VisitedParkData;
}

/**
 * Delete a visited park record
 * @param id - Visited park record ID
 * @returns Promise<void>
 * @throws Error if deletion fails or user not authenticated
 */
export async function deleteVisitedPark(id: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('visited_parks')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    logger.error('NationalParksAPI', error, { context: 'deleteVisitedPark', id });
    throw error;
  }

  logger.info('NationalParksAPI', 'Visited park deleted', { id });
}

/**
 * Check if a park has been visited by the user
 * @param parkId - National park ID
 * @returns Promise<boolean> - True if park has been visited
 * @throws Error if user not authenticated
 */
export async function isParkVisited(parkId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('visited_parks')
    .select('id')
    .eq('user_id', user.id)
    .eq('park_id', parkId)
    .maybeSingle();

  if (error) {
    logger.error('NationalParksAPI', error, { context: 'isParkVisited', parkId });
    throw error;
  }

  return data !== null;
}

/**
 * Get visit statistics
 * @returns Promise with visit statistics
 * @throws Error if user not authenticated
 */
export async function getVisitStats(): Promise<{
  totalVisited: number;
  visitedByState: Record<string, number>;
  averageRating: number;
  recentVisits: VisitedParkData[];
}> {
  const visitedParks = await getVisitedParks();
  const allParks = await getParks();

  const visitedByState: Record<string, number> = {};
  let totalRating = 0;
  let ratingCount = 0;

  for (const visit of visitedParks) {
    const park = allParks.find((p) => p.id === visit.park_id);
    if (park) {
      visitedByState[park.state] = (visitedByState[park.state] || 0) + 1;
    }
    if (visit.rating) {
      totalRating += visit.rating;
      ratingCount++;
    }
  }

  return {
    totalVisited: visitedParks.length,
    visitedByState,
    averageRating: ratingCount > 0 ? totalRating / ratingCount : 0,
    recentVisits: visitedParks.slice(0, 10),
  };
}
