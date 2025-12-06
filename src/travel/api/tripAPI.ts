/**
 * Trip Planner API
 * CRUD operations for multi-country trip planning
 */

import { supabase } from '../../lib/supabase';
import type {
  Trip,
  TripDestination,
  TripVisaRequirement,
  TripWithDestinations,
  CreateTripInput,
  AddDestinationInput,
} from '../types/trip';

// Database row types from Supabase
interface TripRow {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

interface TripDestinationRow {
  id: string;
  trip_id: string;
  country_code: string;
  country_name: string;
  arrival_date: string | null;
  departure_date: string | null;
  days_staying: number | null;
  order_index: number;
  notes: string | null;
  created_at: string;
}

interface TripVisaRequirementRow {
  id: string;
  trip_id: string;
  destination_id: string;
  visa_type: string;
  days_allowed: number | null;
  estimated_cost: number | null;
  processing_days: number | null;
  access_via: string;
  notes: string | null;
  created_at: string;
}

// Type guard functions
function isTripRow(row: unknown): row is TripRow {
  if (typeof row !== 'object' || row === null) return false;
  const r = row as Record<string, unknown>;
  return (
    typeof r.id === 'string' &&
    typeof r.user_id === 'string' &&
    typeof r.name === 'string' &&
    (r.description === null || typeof r.description === 'string') &&
    (r.start_date === null || typeof r.start_date === 'string') &&
    (r.end_date === null || typeof r.end_date === 'string') &&
    typeof r.created_at === 'string' &&
    typeof r.updated_at === 'string'
  );
}

function isTripDestinationRow(row: unknown): row is TripDestinationRow {
  if (typeof row !== 'object' || row === null) return false;
  const r = row as Record<string, unknown>;
  return (
    typeof r.id === 'string' &&
    typeof r.trip_id === 'string' &&
    typeof r.country_code === 'string' &&
    typeof r.country_name === 'string' &&
    (r.arrival_date === null || typeof r.arrival_date === 'string') &&
    (r.departure_date === null || typeof r.departure_date === 'string') &&
    (r.days_staying === null || typeof r.days_staying === 'number') &&
    typeof r.order_index === 'number' &&
    (r.notes === null || typeof r.notes === 'string') &&
    typeof r.created_at === 'string'
  );
}

function isTripVisaRequirementRow(row: unknown): row is TripVisaRequirementRow {
  if (typeof row !== 'object' || row === null) return false;
  const r = row as Record<string, unknown>;
  return (
    typeof r.id === 'string' &&
    typeof r.trip_id === 'string' &&
    typeof r.destination_id === 'string' &&
    typeof r.visa_type === 'string' &&
    (r.days_allowed === null || typeof r.days_allowed === 'number') &&
    (r.estimated_cost === null || typeof r.estimated_cost === 'number') &&
    (r.processing_days === null || typeof r.processing_days === 'number') &&
    typeof r.access_via === 'string' &&
    (r.notes === null || typeof r.notes === 'string') &&
    typeof r.created_at === 'string'
  );
}

// Helper function to get authenticated user
async function getAuthenticatedUser(): Promise<{ id: string }> {
  const result = await supabase.auth.getUser();
  const userData = result.data as { user: { id: string } | null };
  if (!userData.user) throw new Error('Not authenticated');
  return userData.user;
}

// Conversion functions from DB rows to domain types
function convertTripRow(row: TripRow): Trip {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    description: row.description ?? undefined,
    startDate: row.start_date ?? undefined,
    endDate: row.end_date ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function convertDestinationRow(row: TripDestinationRow): TripDestination {
  return {
    id: row.id,
    tripId: row.trip_id,
    countryCode: row.country_code,
    countryName: row.country_name,
    arrivalDate: row.arrival_date ?? undefined,
    departureDate: row.departure_date ?? undefined,
    daysStaying: row.days_staying ?? undefined,
    orderIndex: row.order_index,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
  };
}

function convertVisaRequirementRow(row: TripVisaRequirementRow): TripVisaRequirement {
  return {
    id: row.id,
    tripId: row.trip_id,
    destinationId: row.destination_id,
    visaType: row.visa_type as TripVisaRequirement['visaType'],
    daysAllowed: row.days_allowed ?? undefined,
    estimatedCost: row.estimated_cost ?? undefined,
    processingDays: row.processing_days ?? undefined,
    accessVia: row.access_via,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
  };
}

/**
 * Get all trips for current user
 */
export async function getUserTrips(): Promise<Trip[]> {
  const user = await getAuthenticatedUser();

  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;

  const rows = (data ?? []) as unknown[];
  return rows
    .filter((row): row is TripRow => isTripRow(row))
    .map(row => convertTripRow(row));
}

/**
 * Get trip by ID with all destinations
 */
export async function getTripById(tripId: string): Promise<TripWithDestinations | null> {
  const user = await getAuthenticatedUser();

  // Get trip
  const tripResult = await supabase
    .from('trips')
    .select('*')
    .eq('id', tripId)
    .eq('user_id', user.id)
    .single();

  if (tripResult.error) throw tripResult.error;
  if (!tripResult.data) return null;

  const tripRow = tripResult.data as unknown;
  if (!isTripRow(tripRow)) {
    throw new Error('Invalid trip data from database');
  }

  // Get destinations
  const { data: destinationsData, error: destError } = await supabase
    .from('trip_destinations')
    .select('*')
    .eq('trip_id', tripId)
    .order('order_index', { ascending: true });

  if (destError) throw destError;

  // Get visa requirements for all destinations
  const { data: visaReqsData, error: visaError } = await supabase
    .from('trip_visa_requirements')
    .select('*')
    .eq('trip_id', tripId);

  if (visaError) throw visaError;

  // Map visa requirements by destination ID
  const visaReqsByDestId = new Map<string, TripVisaRequirement>();
  const visaRows = (visaReqsData ?? []) as unknown[];
  visaRows
    .filter((row): row is TripVisaRequirementRow => isTripVisaRequirementRow(row))
    .forEach(req => {
      visaReqsByDestId.set(req.destination_id, convertVisaRequirementRow(req));
    });

  const destRows = (destinationsData ?? []) as unknown[];
  const destinations = destRows
    .filter((row): row is TripDestinationRow => isTripDestinationRow(row))
    .map(dest => ({
      ...convertDestinationRow(dest),
      visaRequirement: visaReqsByDestId.get(dest.id),
    }));

  return {
    ...convertTripRow(tripRow),
    destinations,
  };
}

/**
 * Create a new trip
 */
export async function createTrip(input: CreateTripInput): Promise<Trip> {
  const user = await getAuthenticatedUser();

  const result = await supabase
    .from('trips')
    .insert({
      user_id: user.id,
      name: input.name,
      description: input.description ?? null,
      start_date: input.startDate ?? null,
      end_date: input.endDate ?? null,
    })
    .select()
    .single();

  if (result.error) throw result.error;

  const row = result.data as unknown;
  if (!isTripRow(row)) {
    throw new Error('Invalid trip data from database');
  }

  return convertTripRow(row);
}

/**
 * Update trip
 */
export async function updateTrip(tripId: string, input: Partial<CreateTripInput>): Promise<Trip> {
  const user = await getAuthenticatedUser();

  const result = await supabase
    .from('trips')
    .update({
      name: input.name,
      description: input.description ?? null,
      start_date: input.startDate ?? null,
      end_date: input.endDate ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', tripId)
    .eq('user_id', user.id)
    .select()
    .single();

  if (result.error) throw result.error;

  const row = result.data as unknown;
  if (!isTripRow(row)) {
    throw new Error('Invalid trip data from database');
  }

  return convertTripRow(row);
}

/**
 * Delete trip
 */
export async function deleteTrip(tripId: string): Promise<void> {
  const user = await getAuthenticatedUser();

  const { error } = await supabase
    .from('trips')
    .delete()
    .eq('id', tripId)
    .eq('user_id', user.id);

  if (error) throw error;
}

/**
 * Add destination to trip
 */
export async function addDestination(input: AddDestinationInput): Promise<TripDestination> {
  await getAuthenticatedUser();

  const result = await supabase
    .from('trip_destinations')
    .insert({
      trip_id: input.tripId,
      country_code: input.countryCode,
      country_name: input.countryName,
      arrival_date: input.arrivalDate ?? null,
      departure_date: input.departureDate ?? null,
      days_staying: input.daysStaying ?? null,
      order_index: input.orderIndex,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (result.error) throw result.error;

  const row = result.data as unknown;
  if (!isTripDestinationRow(row)) {
    throw new Error('Invalid destination data from database');
  }

  return convertDestinationRow(row);
}

/**
 * Remove destination from trip
 */
export async function removeDestination(destinationId: string): Promise<void> {
  await getAuthenticatedUser();

  const { error } = await supabase
    .from('trip_destinations')
    .delete()
    .eq('id', destinationId);

  if (error) throw error;
}

/**
 * Add/update visa requirement for destination
 */
export async function saveVisaRequirement(
  tripId: string,
  destinationId: string,
  visaReq: {
    visaType: string;
    daysAllowed?: number;
    estimatedCost?: number;
    processingDays?: number;
    accessVia?: string;
    notes?: string;
  }
): Promise<TripVisaRequirement> {
  await getAuthenticatedUser();

  // Check if requirement already exists
  const { data: existing, error: _checkError } = await supabase
    .from('trip_visa_requirements')
    .select('id')
    .eq('trip_id', tripId)
    .eq('destination_id', destinationId)
    .maybeSingle();

  const existingRow = existing as unknown;
  const existingId = existingRow !== null &&
                     typeof existingRow === 'object' &&
                     'id' in existingRow &&
                     typeof existingRow.id === 'string'
                     ? existingRow.id
                     : null;

  if (existingId !== null) {
    // Update existing
    const result = await supabase
      .from('trip_visa_requirements')
      .update({
        visa_type: visaReq.visaType,
        days_allowed: visaReq.daysAllowed ?? null,
        estimated_cost: visaReq.estimatedCost ?? null,
        processing_days: visaReq.processingDays ?? null,
        access_via: visaReq.accessVia ?? 'passport',
        notes: visaReq.notes ?? null,
      })
      .eq('id', existingId)
      .select()
      .single();

    if (result.error) throw result.error;

    const row = result.data as unknown;
    if (!isTripVisaRequirementRow(row)) {
      throw new Error('Invalid visa requirement data from database');
    }

    return convertVisaRequirementRow(row);
  } else {
    // Insert new
    const result = await supabase
      .from('trip_visa_requirements')
      .insert({
        trip_id: tripId,
        destination_id: destinationId,
        visa_type: visaReq.visaType,
        days_allowed: visaReq.daysAllowed ?? null,
        estimated_cost: visaReq.estimatedCost ?? null,
        processing_days: visaReq.processingDays ?? null,
        access_via: visaReq.accessVia ?? 'passport',
        notes: visaReq.notes ?? null,
      })
      .select()
      .single();

    if (result.error) throw result.error;

    const row = result.data as unknown;
    if (!isTripVisaRequirementRow(row)) {
      throw new Error('Invalid visa requirement data from database');
    }

    return convertVisaRequirementRow(row);
  }
}
