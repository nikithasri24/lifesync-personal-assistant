/**
 * Travel data layer - Supabase integration
 * Supports collaborative mode where partners can see each other's travel data
 * and track individual vs joint visits.
 */

import { logger } from '../../services/logger';
import { supabase } from '../../lib/supabase';
import type {
  VisitedLocation,
  VisitedLocationInput,
  WorldMapData,
  TravelStats,
  CategorizedLocation,
  LocationVisitCategory,
} from '../types';

// Cache for partner ID to avoid repeated checks within same session
let cachedPartnerId: string | null | undefined = undefined;

/**
 * Get the partner's user ID if they have granted view/collaborate permission for travel.
 * Results are cached for the session to avoid repeated database calls.
 */
export async function getTravelPartner(): Promise<string | null> {
  if (cachedPartnerId !== undefined) {
    return cachedPartnerId;
  }

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    cachedPartnerId = null;
    return null;
  }

  // Find active connection with travel permission (view, collaborate, or merged)
  const { data: connections, error } = await supabase
    .from('profile_connections')
    .select(`
      id,
      requester_id,
      receiver_id,
      module_permissions!inner(module, permission_level, user_id)
    `)
    .eq('status', 'active')
    .or(`requester_id.eq.${userData.user.id},receiver_id.eq.${userData.user.id}`)
    .eq('module_permissions.module', 'travel')
    .in('module_permissions.permission_level', ['view', 'collaborate', 'merged']);

  if (error || !connections || connections.length === 0) {
    cachedPartnerId = null;
    return null;
  }

  // Get partner's ID (the other person in the connection)
  const connection = connections[0];
  const partnerId = connection.requester_id === userData.user.id
    ? connection.receiver_id
    : connection.requester_id;

  cachedPartnerId = partnerId;
  return partnerId;
}

/**
 * Categorize a location based on who visited it
 */
export function categorizeLocation(location: VisitedLocation, currentUserId: string, partnerId: string | null): LocationVisitCategory {
  const visitedBy = location.visitedBy || [];
  const visitedByMe = visitedBy.includes(currentUserId);
  const visitedByPartner = partnerId ? visitedBy.includes(partnerId) : false;

  if (visitedByMe && visitedByPartner) return 'both';
  if (visitedByMe) return 'mine';
  if (visitedByPartner) return 'partner';

  // Fallback: if no visited_by data, use user_id
  if (location.userId === currentUserId) return 'mine';
  if (partnerId && location.userId === partnerId) return 'partner';

  return 'mine'; // Default
}

/**
 * Determine if a new status should replace an existing status
 * Priority: lived > visited > transit > wishlist
 */
function shouldReplaceStatus(existingStatus: string, newStatus: string): boolean {
  const statusPriority: Record<string, number> = {
    lived: 4,
    visited: 3,
    transit: 2,
    wishlist: 1,
  };

  return (statusPriority[newStatus] || 0) > (statusPriority[existingStatus] || 0);
}

// Helper functions for case conversion
function toCamelCase<T>(obj: unknown): T {
  if (!obj) return obj as T;
  if (Array.isArray(obj)) return obj.map((item: unknown) => toCamelCase(item)) as T;
  if (typeof obj !== 'object') return obj as T;

  const camelObj: Record<string, unknown> = {};
  for (const key in obj as Record<string, unknown>) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
    camelObj[camelKey] = toCamelCase((obj as Record<string, unknown>)[key]);
  }
  return camelObj as T;
}

function toSnakeCase(obj: unknown): unknown {
  if (!obj) return obj;
  if (Array.isArray(obj)) return obj.map((item: unknown) => toSnakeCase(item));
  if (typeof obj !== 'object') return obj;

  const snakeObj: Record<string, unknown> = {};
  for (const key in obj as Record<string, unknown>) {
    const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
    snakeObj[snakeKey] = toSnakeCase((obj as Record<string, unknown>)[key]);
  }
  return snakeObj;
}

/**
 * Migrate old locations to use visited_by array.
 * This is a one-time migration for existing data.
 */
async function migrateToVisitedBy(userId: string): Promise<void> {
  // Find locations owned by user that don't have visited_by set
  const { data: locationsToMigrate, error: fetchError } = await supabase
    .from('visited_locations')
    .select('id, visited_by')
    .eq('user_id', userId)
    .or('visited_by.is.null,visited_by.eq.[]');

  if (fetchError || !locationsToMigrate || locationsToMigrate.length === 0) {
    return;
  }

  logger.info('Travel', `Migrating ${locationsToMigrate.length} locations to use visited_by array`);

  // Update each location to include user in visited_by
  const { error: updateError } = await supabase
    .from('visited_locations')
    .update({ visited_by: [userId] })
    .eq('user_id', userId)
    .or('visited_by.is.null,visited_by.eq.[]');

  if (updateError) {
    logger.error('Travel', updateError instanceof Error ? updateError : new Error(String(updateError)), { context: 'migrateToVisitedBy' });
  } else {
    logger.info('Travel', 'Successfully migrated locations to visited_by');
  }
}

export const travelAPI = {
  // ============= VISITED LOCATIONS =============

  async listVisitedLocations(): Promise<CategorizedLocation[]> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Not authenticated');

    const partnerId = await getTravelPartner();

    logger.debug('Travel', 'listVisitedLocations', { userId: userData.user.id, partnerId });

    // Migrate old data to use visited_by array (one-time migration)
    await migrateToVisitedBy(userData.user.id);

    // Fetch own locations and partner's locations (if partner exists)
    let query = supabase
      .from('visited_locations')
      .select('*')
      .order('country_name', { ascending: true });

    if (partnerId) {
      // Fetch both own and partner's locations
      query = query.or(`user_id.eq.${userData.user.id},user_id.eq.${partnerId}`);
    } else {
      // Fetch only own locations
      query = query.eq('user_id', userData.user.id);
    }

    const { data, error } = await query;
    if (error) throw error;

    logger.debug('Travel', 'Locations found:', { count: data?.length ?? 0 });

    const locations = toCamelCase<VisitedLocation[]>(data || []);

    // Categorize each location
    const categorizedLocations: CategorizedLocation[] = locations.map(location => ({
      ...location,
      visitCategory: categorizeLocation(location, userData.user.id, partnerId),
    }));

    return categorizedLocations;
  },

  async getWorldMapData(): Promise<WorldMapData> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Not authenticated');

    const partnerId = await getTravelPartner();

    let query = supabase
      .from('visited_locations')
      .select('country_code, status, visited_by')
      .eq('location_type', 'country');

    if (partnerId) {
      // Fetch both own and partner's countries
      query = query.or(`user_id.eq.${userData.user.id},user_id.eq.${partnerId}`);
    } else {
      // Fetch only own countries
      query = query.eq('user_id', userData.user.id);
    }

    const { data, error } = await query;
    if (error) throw error;

    const mapData: WorldMapData = {
      visited: [],
      lived: [],
      transit: [],
      wishlist: [],
    };

    // Use a Set to avoid duplicates (same country visited by both partners)
    const processedCountries = new Map<string, string>(); // country_code -> status

    data?.forEach((loc: { country_code: string; status: string; visited_by?: string[] }) => {
      const code: string = loc.country_code;
      const status: string = loc.status;
      const visitedBy = loc.visited_by || [];

      // Only include if current user has visited it
      if (visitedBy.includes(userData.user.id)) {
        // If country already processed, keep the "higher" status (lived > visited > transit > wishlist)
        const existingStatus = processedCountries.get(code);
        if (!existingStatus || shouldReplaceStatus(existingStatus, status)) {
          processedCountries.set(code, status);
        }
      }
    });

    // Convert map to arrays
    processedCountries.forEach((status, code) => {
      if (status === 'visited') mapData.visited.push(code);
      else if (status === 'lived') mapData.lived.push(code);
      else if (status === 'transit') mapData.transit.push(code);
      else if (status === 'wishlist') mapData.wishlist.push(code);
    });

    return mapData;
  },

  /**
   * Mark a location as visited.
   * @param location - Location details
   * @param visitedByUserIds - Array of user IDs who visited (defaults to current user only)
   */
  async markLocation(
    location: VisitedLocationInput,
    visitedByUserIds?: string[]
  ): Promise<VisitedLocation> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Not authenticated');

    const partnerId = await getTravelPartner();

    // Default to current user if not specified
    const visitedBy = visitedByUserIds || [userData.user.id];

    // Check if location already exists (by any user)
    let existingQuery = supabase
      .from('visited_locations')
      .select('*')
      .eq('location_type', location.locationType)
      .eq('country_code', location.countryCode)
      .eq('state_code', location.stateCode ?? '')
      .eq('city_name', location.cityName ?? '');

    if (partnerId) {
      // Check both user's and partner's locations
      existingQuery = existingQuery.or(`user_id.eq.${userData.user.id},user_id.eq.${partnerId}`);
    } else {
      // Check only user's locations
      existingQuery = existingQuery.eq('user_id', userData.user.id);
    }

    const existingResponse = await existingQuery.maybeSingle();

    if (existingResponse.data) {
      // Location exists - update it and merge visited_by arrays
      const existing = toCamelCase<VisitedLocation>(existingResponse.data);
      const existingVisitedBy = existing.visitedBy || [];
      const mergedVisitedBy = Array.from(new Set([...existingVisitedBy, ...visitedBy]));

      const response = await supabase
        .from('visited_locations')
        .update(toSnakeCase({ ...location, visitedBy: mergedVisitedBy }))
        .eq('id', existing.id!)
        .select()
        .single();

      if (response.error) throw response.error;
      return toCamelCase<VisitedLocation>(response.data);
    } else {
      // Create new location
      const response = await supabase
        .from('visited_locations')
        .insert(toSnakeCase({
          ...location,
          userId: userData.user.id,
          visitedBy: visitedBy,
        }))
        .select()
        .single();

      if (response.error) throw response.error;
      return toCamelCase<VisitedLocation>(response.data);
    }
  },

  /**
   * Toggle whether current user has visited a location
   */
  async toggleMyVisit(locationId: string): Promise<VisitedLocation> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Not authenticated');

    // Get current location
    const { data: locationData, error: fetchError } = await supabase
      .from('visited_locations')
      .select('*')
      .eq('id', locationId)
      .single();

    if (fetchError) throw fetchError;

    const location = toCamelCase<VisitedLocation>(locationData);
    const visitedBy = location.visitedBy || [];
    const hasVisited = visitedBy.includes(userData.user.id);

    let newVisitedBy: string[];
    if (hasVisited) {
      // Remove user from visited_by
      newVisitedBy = visitedBy.filter(id => id !== userData.user.id);
    } else {
      // Add user to visited_by
      newVisitedBy = [...visitedBy, userData.user.id];
    }

    const { data: updatedData, error: updateError } = await supabase
      .from('visited_locations')
      .update({ visited_by: newVisitedBy })
      .eq('id', locationId)
      .select()
      .single();

    if (updateError) throw updateError;
    return toCamelCase<VisitedLocation>(updatedData);
  },

  async deleteLocation(id: string): Promise<void> {
    const { error } = await supabase.from('visited_locations').delete().eq('id', id);
    if (error) throw error;
  },

  // ============= STATS =============

  async getTravelStats(): Promise<TravelStats | null> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Not authenticated');

    // Get basic stats from visited locations
    const { data: locations } = await supabase
      .from('visited_locations')
      .select('location_type, country_code, status')
      .eq('user_id', userData.user.id);

    const { data: entries } = await supabase
      .from('travel_journal_entries')
      .select('id, photo_urls')
      .eq('user_id', userData.user.id);

    if (!locations || !entries) return null;

    type LocationRow = { location_type: string; country_code: string; status: string };
    type EntryRow = { id: string; photo_urls: string[] | null };

    const countriesVisited = new Set(
      (locations as LocationRow[])
        .filter((l: LocationRow) => l.location_type === 'country' && l.status === 'visited')
        .map((l: LocationRow) => l.country_code)
    ).size;

    const photosUploaded = (entries as EntryRow[]).reduce((sum: number, e: EntryRow) => sum + (e.photo_urls?.length ?? 0), 0);

    const continents = new Set<string>();
    // Note: You'd need a continent mapping here
    const continentsVisited = continents.size;

    return {
      userId: userData.user.id,
      countriesVisited,
      statesVisited: 0, // Calculate from locations
      citiesVisited: 0, // Calculate from locations
      continentsVisited,
      journalEntries: entries.length,
      photosUploaded,
      visitedAllContinents: continentsVisited === 7,
      visited50Countries: countriesVisited >= 50,
      visited100Countries: countriesVisited >= 100,
    };
  },
};
