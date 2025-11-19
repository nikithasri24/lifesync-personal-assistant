/**
 * Travel data layer - Supabase integration
 */

import { supabase } from '../lib/supabase';
import type {
  VisitedLocation,
  VisitedLocationInput,
  Trip,
  TripInput,
  TripExpense,
  TripExpenseInput,
  JournalEntry,
  JournalEntryInput,
  WorldMapData,
  TravelStats,
} from './types';

// Helper functions for case conversion
function toCamelCase<T>(obj: any): T {
  if (!obj) return obj;
  if (Array.isArray(obj)) return obj.map(toCamelCase) as any;
  if (typeof obj !== 'object') return obj;

  const camelObj: any = {};
  for (const key in obj) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    camelObj[camelKey] = toCamelCase(obj[key]);
  }
  return camelObj;
}

function toSnakeCase(obj: any): any {
  if (!obj) return obj;
  if (Array.isArray(obj)) return obj.map(toSnakeCase);
  if (typeof obj !== 'object') return obj;

  const snakeObj: any = {};
  for (const key in obj) {
    const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
    snakeObj[snakeKey] = toSnakeCase(obj[key]);
  }
  return snakeObj;
}

export const travelAPI = {
  // ============= VISITED LOCATIONS =============

  async listVisitedLocations(): Promise<VisitedLocation[]> {
    const { data, error } = await supabase
      .from('visited_locations')
      .select('*')
      .order('country_name', { ascending: true });

    if (error) throw error;
    return toCamelCase(data || []);
  },

  async getWorldMapData(): Promise<WorldMapData> {
    const { data, error } = await supabase
      .from('visited_locations')
      .select('country_code, status')
      .eq('location_type', 'country');

    if (error) throw error;

    const mapData: WorldMapData = {
      visited: [],
      lived: [],
      transit: [],
      wishlist: [],
    };

    data?.forEach((loc: any) => {
      const code = loc.country_code;
      const status = loc.status;

      if (status === 'visited') mapData.visited.push(code);
      else if (status === 'lived') mapData.lived.push(code);
      else if (status === 'transit') mapData.transit.push(code);
      else if (status === 'wishlist') mapData.wishlist.push(code);
    });

    return mapData;
  },

  async markLocation(location: VisitedLocationInput): Promise<VisitedLocation> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Not authenticated');

    // Check if location already exists
    const { data: existing } = await supabase
      .from('visited_locations')
      .select('*')
      .eq('user_id', userData.user.id)
      .eq('location_type', location.locationType)
      .eq('country_code', location.countryCode)
      .eq('state_code', location.stateCode || '')
      .eq('city_name', location.cityName || '')
      .maybeSingle();

    if (existing) {
      // Update existing
      const { data, error } = await supabase
        .from('visited_locations')
        .update(toSnakeCase(location))
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      return toCamelCase(data);
    } else {
      // Create new
      const { data, error } = await supabase
        .from('visited_locations')
        .insert(toSnakeCase({ ...location, userId: userData.user.id }))
        .select()
        .single();

      if (error) throw error;
      return toCamelCase(data);
    }
  },

  async deleteLocation(id: string): Promise<void> {
    const { error } = await supabase.from('visited_locations').delete().eq('id', id);
    if (error) throw error;
  },

  // ============= TRIPS =============

  async listTrips(status?: string): Promise<Trip[]> {
    let query = supabase
      .from('trips')
      .select('*')
      .order('start_date', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return toCamelCase(data || []);
  },

  async getTrip(id: string): Promise<Trip | null> {
    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return toCamelCase(data);
  },

  async createTrip(trip: TripInput): Promise<Trip> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Not authenticated');

    const { data, error} = await supabase
      .from('trips')
      .insert(toSnakeCase({ ...trip, userId: userData.user.id }))
      .select()
      .single();

    if (error) throw error;
    return toCamelCase(data);
  },

  async updateTrip(id: string, updates: Partial<TripInput>): Promise<Trip> {
    const { data, error } = await supabase
      .from('trips')
      .update(toSnakeCase(updates))
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return toCamelCase(data);
  },

  async deleteTrip(id: string): Promise<void> {
    const { error } = await supabase.from('trips').delete().eq('id', id);
    if (error) throw error;
  },

  // ============= EXPENSES =============

  async listExpenses(tripId: string): Promise<TripExpense[]> {
    const { data, error } = await supabase
      .from('trip_expenses')
      .select('*')
      .eq('trip_id', tripId)
      .order('date', { ascending: false });

    if (error) throw error;
    return toCamelCase(data || []);
  },

  async createExpense(expense: TripExpenseInput): Promise<TripExpense> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('trip_expenses')
      .insert(toSnakeCase({ ...expense, userId: userData.user.id }))
      .select()
      .single();

    if (error) throw error;
    return toCamelCase(data);
  },

  async updateExpense(id: string, updates: Partial<TripExpenseInput>): Promise<TripExpense> {
    const { data, error } = await supabase
      .from('trip_expenses')
      .update(toSnakeCase(updates))
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return toCamelCase(data);
  },

  async deleteExpense(id: string): Promise<void> {
    const { error } = await supabase.from('trip_expenses').delete().eq('id', id);
    if (error) throw error;
  },

  // ============= JOURNAL ENTRIES =============

  async listJournalEntries(tripId?: string): Promise<JournalEntry[]> {
    let query = supabase
      .from('travel_journal_entries')
      .select('*')
      .order('date', { ascending: false });

    if (tripId) {
      query = query.eq('trip_id', tripId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return toCamelCase(data || []);
  },

  async createJournalEntry(entry: JournalEntryInput): Promise<JournalEntry> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('travel_journal_entries')
      .insert(toSnakeCase({ ...entry, userId: userData.user.id }))
      .select()
      .single();

    if (error) throw error;
    return toCamelCase(data);
  },

  async updateJournalEntry(id: string, updates: Partial<JournalEntryInput>): Promise<JournalEntry> {
    const { data, error } = await supabase
      .from('travel_journal_entries')
      .update(toSnakeCase(updates))
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return toCamelCase(data);
  },

  async deleteJournalEntry(id: string): Promise<void> {
    const { error } = await supabase.from('travel_journal_entries').delete().eq('id', id);
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

    const { data: trips } = await supabase
      .from('trips')
      .select('status, total_spent, start_date, end_date')
      .eq('user_id', userData.user.id);

    const { data: entries } = await supabase
      .from('travel_journal_entries')
      .select('id, photo_urls')
      .eq('user_id', userData.user.id);

    if (!locations || !trips || !entries) return null;

    const countriesVisited = new Set(
      locations
        .filter(l => l.location_type === 'country' && l.status === 'visited')
        .map(l => l.country_code)
    ).size;

    const totalSpent = trips
      .filter(t => t.status === 'completed')
      .reduce((sum, t) => sum + (t.total_spent || 0), 0);

    const completedTrips = trips.filter(t => t.status === 'completed').length;
    const averageTripCost = completedTrips > 0 ? totalSpent / completedTrips : 0;

    const photosUploaded = entries.reduce((sum, e) => sum + (e.photo_urls?.length || 0), 0);

    const continents = new Set<string>();
    // Note: You'd need a continent mapping here
    const continentsVisited = continents.size;

    return {
      userId: userData.user.id,
      countriesVisited,
      statesVisited: 0, // Calculate from locations
      citiesVisited: 0, // Calculate from locations
      continentsVisited,
      totalTrips: trips.length,
      completedTrips,
      upcomingTrips: trips.filter(t => t.status === 'planning' || t.status === 'ongoing').length,
      totalTravelDays: 0, // Calculate from trip dates
      totalSpent,
      averageTripCost,
      budgetAdherence: 0, // Calculate from budget vs spent
      journalEntries: entries.length,
      photosUploaded,
      visitedAllContinents: continentsVisited === 7,
      visited50Countries: countriesVisited >= 50,
      visited100Countries: countriesVisited >= 100,
    };
  },
};
