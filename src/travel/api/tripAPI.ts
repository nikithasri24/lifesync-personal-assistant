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

/**
 * Get all trips for current user
 */
export async function getUserTrips(): Promise<Trip[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map(row => ({
    id: row.id,
    userId: row.user_id,
    name: row.name,
    description: row.description,
    startDate: row.start_date,
    endDate: row.end_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

/**
 * Get trip by ID with all destinations
 */
export async function getTripById(tripId: string): Promise<TripWithDestinations | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Get trip
  const { data: tripData, error: tripError } = await supabase
    .from('trips')
    .select('*')
    .eq('id', tripId)
    .eq('user_id', user.id)
    .single();

  if (tripError) throw tripError;
  if (!tripData) return null;

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
  (visaReqsData || []).forEach(req => {
    visaReqsByDestId.set(req.destination_id, {
      id: req.id,
      tripId: req.trip_id,
      destinationId: req.destination_id,
      visaType: req.visa_type,
      daysAllowed: req.days_allowed,
      estimatedCost: req.estimated_cost,
      processingDays: req.processing_days,
      accessVia: req.access_via,
      notes: req.notes,
      createdAt: req.created_at,
    });
  });

  const destinations = (destinationsData || []).map(dest => ({
    id: dest.id,
    tripId: dest.trip_id,
    countryCode: dest.country_code,
    countryName: dest.country_name,
    arrivalDate: dest.arrival_date,
    departureDate: dest.departure_date,
    daysStaying: dest.days_staying,
    orderIndex: dest.order_index,
    notes: dest.notes,
    createdAt: dest.created_at,
    visaRequirement: visaReqsByDestId.get(dest.id),
  }));

  return {
    id: tripData.id,
    userId: tripData.user_id,
    name: tripData.name,
    description: tripData.description,
    startDate: tripData.start_date,
    endDate: tripData.end_date,
    createdAt: tripData.created_at,
    updatedAt: tripData.updated_at,
    destinations,
  };
}

/**
 * Create a new trip
 */
export async function createTrip(input: CreateTripInput): Promise<Trip> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('trips')
    .insert({
      user_id: user.id,
      name: input.name,
      description: input.description,
      start_date: input.startDate,
      end_date: input.endDate,
    })
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    userId: data.user_id,
    name: data.name,
    description: data.description,
    startDate: data.start_date,
    endDate: data.end_date,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Update trip
 */
export async function updateTrip(tripId: string, input: Partial<CreateTripInput>): Promise<Trip> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('trips')
    .update({
      name: input.name,
      description: input.description,
      start_date: input.startDate,
      end_date: input.endDate,
      updated_at: new Date().toISOString(),
    })
    .eq('id', tripId)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    userId: data.user_id,
    name: data.name,
    description: data.description,
    startDate: data.start_date,
    endDate: data.end_date,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Delete trip
 */
export async function deleteTrip(tripId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('trip_destinations')
    .insert({
      trip_id: input.tripId,
      country_code: input.countryCode,
      country_name: input.countryName,
      arrival_date: input.arrivalDate,
      departure_date: input.departureDate,
      days_staying: input.daysStaying,
      order_index: input.orderIndex,
      notes: input.notes,
    })
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    tripId: data.trip_id,
    countryCode: data.country_code,
    countryName: data.country_name,
    arrivalDate: data.arrival_date,
    departureDate: data.departure_date,
    daysStaying: data.days_staying,
    orderIndex: data.order_index,
    notes: data.notes,
    createdAt: data.created_at,
  };
}

/**
 * Remove destination from trip
 */
export async function removeDestination(destinationId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Check if requirement already exists
  const { data: existing, error: checkError } = await supabase
    .from('trip_visa_requirements')
    .select('id')
    .eq('trip_id', tripId)
    .eq('destination_id', destinationId)
    .maybeSingle();

  if (existing) {
    // Update existing
    const { data, error } = await supabase
      .from('trip_visa_requirements')
      .update({
        visa_type: visaReq.visaType,
        days_allowed: visaReq.daysAllowed,
        estimated_cost: visaReq.estimatedCost,
        processing_days: visaReq.processingDays,
        access_via: visaReq.accessVia || 'passport',
        notes: visaReq.notes,
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      tripId: data.trip_id,
      destinationId: data.destination_id,
      visaType: data.visa_type,
      daysAllowed: data.days_allowed,
      estimatedCost: data.estimated_cost,
      processingDays: data.processing_days,
      accessVia: data.access_via,
      notes: data.notes,
      createdAt: data.created_at,
    };
  } else {
    // Insert new
    const { data, error } = await supabase
      .from('trip_visa_requirements')
      .insert({
        trip_id: tripId,
        destination_id: destinationId,
        visa_type: visaReq.visaType,
        days_allowed: visaReq.daysAllowed,
        estimated_cost: visaReq.estimatedCost,
        processing_days: visaReq.processingDays,
        access_via: visaReq.accessVia || 'passport',
        notes: visaReq.notes,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      tripId: data.trip_id,
      destinationId: data.destination_id,
      visaType: data.visa_type,
      daysAllowed: data.days_allowed,
      estimatedCost: data.estimated_cost,
      processingDays: data.processing_days,
      accessVia: data.access_via,
      notes: data.notes,
      createdAt: data.created_at,
    };
  }
}
