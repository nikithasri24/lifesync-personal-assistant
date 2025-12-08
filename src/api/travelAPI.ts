/**
 * Travel API
 * CRUD operations for trips, itineraries, documents, and packing lists
 */

import { supabase } from '../lib/supabase';
import type { Trip, TripDay, TravelDocument, PackingList, VisaRequirement } from '../services/types';
import { logger } from '../services/logger';

// =====================================================
// TRIPS
// =====================================================

/**
 * Get all trips for the current user
 * @param filters - Optional filters for trip status
 * @returns Promise<Trip[]> - Array of trips matching the filters
 * @throws Error if user not authenticated
 */
export async function getTrips(filters?: {
  status?: Trip['status'];
}): Promise<Trip[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  let query = supabase
    .from('trips')
    .select('*')
    .eq('user_id', user.id)
    .order('start_date', { ascending: false });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  const { data, error } = await query;
  if (error) {
    logger.error('TravelAPI', error, { context: 'getTrips', filters });
    throw error;
  }

  return (data ?? []) as Trip[];
}

/**
 * Get a single trip by ID
 * @param id - Trip ID
 * @returns Promise<Trip> - The requested trip
 * @throws Error if trip not found or user not authenticated
 */
export async function getTrip(id: string): Promise<Trip> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error) {
    logger.error('TravelAPI', error, { context: 'getTrip', id });
    throw error;
  }

  return data as Trip;
}

/**
 * Create a new trip
 * @param trip - Trip data
 * @returns Promise<Trip> - The created trip
 * @throws Error if creation fails or user not authenticated
 */
export async function createTrip(
  trip: Omit<Trip, 'id' | 'user_id' | 'created_at' | 'updated_at'>
): Promise<Trip> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('trips')
    .insert({ ...trip, user_id: user.id })
    .select()
    .single();

  if (error) {
    logger.error('TravelAPI', error, { context: 'createTrip', trip });
    throw error;
  }

  logger.info('TravelAPI', 'Trip created', { id: data.id, name: data.name });
  return data as Trip;
}

/**
 * Update an existing trip
 * @param id - Trip ID to update
 * @param updates - Partial trip data to update
 * @returns Promise<Trip> - The updated trip
 * @throws Error if trip not found or user not authenticated
 */
export async function updateTrip(
  id: string,
  updates: Partial<Trip>
): Promise<Trip> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('trips')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    logger.error('TravelAPI', error, { context: 'updateTrip', id, updates });
    throw error;
  }

  logger.info('TravelAPI', 'Trip updated', { id });
  return data as Trip;
}

/**
 * Delete a trip
 * @param id - Trip ID to delete
 * @returns Promise<void>
 * @throws Error if deletion fails or user not authenticated
 */
export async function deleteTrip(id: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('trips')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    logger.error('TravelAPI', error, { context: 'deleteTrip', id });
    throw error;
  }

  logger.info('TravelAPI', 'Trip deleted', { id });
}

// =====================================================
// TRIP DAYS (ITINERARY)
// =====================================================

/**
 * Get all trip days (itinerary) for a trip
 * @param tripId - Trip ID
 * @returns Promise<TripDay[]> - Array of trip days ordered by date
 * @throws Error if query fails
 */
export async function getTripDays(tripId: string): Promise<TripDay[]> {
  const { data, error } = await supabase
    .from('trip_days')
    .select('*')
    .eq('trip_id', tripId)
    .order('date', { ascending: true });

  if (error) {
    logger.error('TravelAPI', error, { context: 'getTripDays', tripId });
    throw error;
  }

  return (data ?? []) as TripDay[];
}

/**
 * Create a new trip day
 * @param tripDay - Trip day data
 * @returns Promise<TripDay> - The created trip day
 * @throws Error if creation fails
 */
export async function createTripDay(
  tripDay: Omit<TripDay, 'id' | 'created_at'>
): Promise<TripDay> {
  const { data, error } = await supabase
    .from('trip_days')
    .insert(tripDay)
    .select()
    .single();

  if (error) {
    logger.error('TravelAPI', error, { context: 'createTripDay', tripDay });
    throw error;
  }

  logger.info('TravelAPI', 'Trip day created', { id: data.id, date: data.date });
  return data as TripDay;
}

/**
 * Update an existing trip day
 * @param id - Trip day ID to update
 * @param updates - Partial trip day data to update
 * @returns Promise<TripDay> - The updated trip day
 * @throws Error if trip day not found
 */
export async function updateTripDay(
  id: string,
  updates: Partial<TripDay>
): Promise<TripDay> {
  const { data, error } = await supabase
    .from('trip_days')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    logger.error('TravelAPI', error, { context: 'updateTripDay', id, updates });
    throw error;
  }

  logger.info('TravelAPI', 'Trip day updated', { id });
  return data as TripDay;
}

// =====================================================
// TRAVEL DOCUMENTS
// =====================================================

/**
 * Get travel documents for the current user, optionally filtered by trip
 * @param tripId - Optional trip ID to filter documents
 * @returns Promise<TravelDocument[]> - Array of travel documents
 * @throws Error if user not authenticated
 */
export async function getTravelDocuments(tripId?: string): Promise<TravelDocument[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  let query = supabase
    .from('travel_documents')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (tripId) {
    query = query.eq('trip_id', tripId);
  }

  const { data, error } = await query;
  if (error) {
    logger.error('TravelAPI', error, { context: 'getTravelDocuments', tripId });
    throw error;
  }

  return (data ?? []) as TravelDocument[];
}

/**
 * Create a new travel document
 * @param document - Travel document data
 * @returns Promise<TravelDocument> - The created travel document
 * @throws Error if creation fails or user not authenticated
 */
export async function createTravelDocument(
  document: Omit<TravelDocument, 'id' | 'user_id' | 'created_at'>
): Promise<TravelDocument> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('travel_documents')
    .insert({ ...document, user_id: user.id })
    .select()
    .single();

  if (error) {
    logger.error('TravelAPI', error, { context: 'createTravelDocument', document });
    throw error;
  }

  logger.info('TravelAPI', 'Travel document created', { id: data.id, name: data.name });
  return data as TravelDocument;
}

// =====================================================
// PACKING LISTS
// =====================================================

/**
 * Get packing lists for the current user, optionally filtered by trip
 * @param tripId - Optional trip ID to filter packing lists
 * @returns Promise<PackingList[]> - Array of packing lists with items
 * @throws Error if user not authenticated
 */
export async function getPackingLists(tripId?: string): Promise<PackingList[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  let query = supabase
    .from('packing_lists')
    .select('*, items:packing_items(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (tripId) {
    query = query.eq('trip_id', tripId);
  }

  const { data, error } = await query;
  if (error) {
    logger.error('TravelAPI', error, { context: 'getPackingLists', tripId });
    throw error;
  }

  return (data ?? []) as PackingList[];
}

/**
 * Create a new packing list
 * @param list - Packing list data
 * @returns Promise<PackingList> - The created packing list
 * @throws Error if creation fails or user not authenticated
 */
export async function createPackingList(
  list: Omit<PackingList, 'id' | 'user_id' | 'created_at' | 'items'>
): Promise<PackingList> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('packing_lists')
    .insert({ ...list, user_id: user.id })
    .select()
    .single();

  if (error) {
    logger.error('TravelAPI', error, { context: 'createPackingList', list });
    throw error;
  }

  logger.info('TravelAPI', 'Packing list created', { id: data.id, name: data.name });
  return { ...data, items: [] } as PackingList;
}

// =====================================================
// VISA REQUIREMENTS
// =====================================================

/**
 * Check visa requirements for travel between countries
 * @param passportCountry - Passport country code
 * @param destinationCountry - Destination country code
 * @returns Promise<VisaRequirement | null> - Visa requirement info or null if not found
 * @throws Error if user not authenticated
 */
export async function checkVisaRequirement(
  passportCountry: string,
  destinationCountry: string
): Promise<VisaRequirement | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('visa_requirements')
    .select('*')
    .eq('user_id', user.id)
    .eq('passport_country', passportCountry)
    .eq('destination_country', destinationCountry)
    .maybeSingle();

  if (error) {
    logger.error('TravelAPI', error, { context: 'checkVisaRequirement', passportCountry, destinationCountry });
    throw error;
  }

  return data as VisaRequirement | null;
}

// =====================================================
// TRIP BUDGET SUMMARY
// =====================================================

/**
 * Get budget summary for a trip
 * @param tripId - Trip ID
 * @returns Promise with budget statistics
 * @throws Error if trip not found or user not authenticated
 */
export async function getTripBudgetSummary(tripId: string): Promise<{
  budget: number;
  actualCost: number;
  remaining: number;
  percentageSpent: number;
}> {
  const trip = await getTrip(tripId);

  const budget = trip.budget || 0;
  const actualCost = trip.actual_cost || 0;
  const remaining = budget - actualCost;
  const percentageSpent = budget > 0 ? (actualCost / budget) * 100 : 0;

  return {
    budget,
    actualCost,
    remaining,
    percentageSpent,
  };
}
