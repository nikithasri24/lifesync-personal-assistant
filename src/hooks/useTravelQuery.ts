/**
 * React Query hooks for Travel tracking
 *
 * Provides automatic caching, loading states, and cache invalidation
 * for trips, itineraries, documents, and packing lists.
 *
 * Pattern reference: /src/hooks/useSkincareQuery.ts
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import { queryKeys, queryOptions } from '@/lib/react-query';
import {
  getTrips,
  getTrip,
  createTrip,
  updateTrip,
  deleteTrip,
  getTripDays,
  createTripDay,
  getTravelDocuments,
  createTravelDocument,
  getPackingLists,
  createPackingList,
  getTripBudgetSummary,
} from '@/api/travelAPI';
import { logger } from '@/services/logger';
import type { Trip, TripDay, TravelDocument, PackingList } from '@/services/types';

// =====================================================
// TRIPS QUERY HOOKS
// =====================================================

export interface TripFilters extends Record<string, unknown> {
  status?: Trip['status'];
}

/**
 * Get all trips with optional filters
 */
export function useTrips(filters?: TripFilters): UseQueryResult<Trip[], Error> {
  return useQuery({
    queryKey: queryKeys.travel.trips.list(filters),
    queryFn: () => getTrips(filters),
    ...queryOptions.user,
  });
}

/**
 * Get a single trip by ID
 */
export function useTrip(id: string | null): UseQueryResult<Trip, Error> {
  return useQuery({
    queryKey: queryKeys.travel.trips.detail(id ?? ''),
    queryFn: () => {
      if (!id) throw new Error('Trip ID is required');
      return getTrip(id);
    },
    enabled: !!id,
    ...queryOptions.user,
  });
}

/**
 * Create a new trip
 */
export function useCreateTrip(): UseMutationResult<
  Trip,
  Error,
  Omit<Trip, 'id' | 'user_id' | 'created_at' | 'updated_at'>
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: Omit<Trip, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      logger.debug('Travel', 'Creating trip', { name: input.name, destinations: input.destination_countries });
      const result = await createTrip(input);
      return result;
    },
    onSuccess: (newTrip) => {
      logger.info('Travel', 'Trip created successfully', { id: newTrip.id, name: newTrip.name });

      // Invalidate all trips lists
      void queryClient.invalidateQueries({ queryKey: queryKeys.travel.trips.all() });

      // Optimistically add to cache
      queryClient.setQueryData<Trip[]>(queryKeys.travel.trips.list(undefined), (old) => {
        return old ? [newTrip, ...old] : [newTrip];
      });
    },
    onError: (error: Error) => {
      logger.error('Travel', 'Failed to create trip', { error: error.message });
    },
  });
}

/**
 * Update a trip
 */
export function useUpdateTrip(): UseMutationResult<
  Trip,
  Error,
  { id: string; updates: Partial<Trip> }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Trip> }) => {
      logger.debug('Travel', 'Updating trip', { id, updates: Object.keys(updates) });
      const result = await updateTrip(id, updates);
      return result;
    },
    onSuccess: (updatedTrip) => {
      logger.info('Travel', 'Trip updated successfully', { id: updatedTrip.id });

      // Invalidate all trips lists
      void queryClient.invalidateQueries({ queryKey: queryKeys.travel.trips.all() });

      // Update specific trip in cache
      queryClient.setQueryData<Trip>(
        queryKeys.travel.trips.detail(updatedTrip.id),
        updatedTrip
      );
    },
    onError: (error: Error) => {
      logger.error('Travel', 'Failed to update trip', { error: error.message });
    },
  });
}

/**
 * Delete a trip
 */
export function useDeleteTrip(): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      logger.debug('Travel', 'Deleting trip', { id });
      await deleteTrip(id);
    },
    onSuccess: (_, deletedId) => {
      logger.info('Travel', 'Trip deleted successfully', { id: deletedId });

      // Invalidate all trips lists
      void queryClient.invalidateQueries({ queryKey: queryKeys.travel.trips.all() });

      // Remove from cache
      queryClient.removeQueries({ queryKey: queryKeys.travel.trips.detail(deletedId) });
    },
    onError: (error: Error) => {
      logger.error('Travel', 'Failed to delete trip', { error: error.message });
    },
  });
}

// =====================================================
// TRIP DAYS (ITINERARY) QUERY HOOKS
// =====================================================

/**
 * Get all trip days for a specific trip
 */
export function useTripDays(tripId: string | null): UseQueryResult<TripDay[], Error> {
  return useQuery({
    queryKey: queryKeys.travel.tripDays.list(tripId ?? ''),
    queryFn: () => {
      if (!tripId) throw new Error('Trip ID is required');
      return getTripDays(tripId);
    },
    enabled: !!tripId,
    ...queryOptions.user,
  });
}

/**
 * Create a new trip day
 */
export function useCreateTripDay(): UseMutationResult<
  TripDay,
  Error,
  Omit<TripDay, 'id' | 'created_at'>
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: Omit<TripDay, 'id' | 'created_at'>) => {
      logger.debug('Travel', 'Creating trip day', { tripId: input.trip_id, date: input.date });
      const result = await createTripDay(input);
      return result;
    },
    onSuccess: (newTripDay) => {
      logger.info('Travel', 'Trip day created successfully', { id: newTripDay.id, tripId: newTripDay.trip_id });

      // Invalidate trip days for this trip
      void queryClient.invalidateQueries({
        queryKey: queryKeys.travel.tripDays.list(newTripDay.trip_id),
      });
    },
    onError: (error: Error) => {
      logger.error('Travel', 'Failed to create trip day', { error: error.message });
    },
  });
}

// =====================================================
// TRAVEL DOCUMENTS QUERY HOOKS
// =====================================================

/**
 * Get all travel documents, optionally filtered by trip
 */
export function useTravelDocuments(tripId?: string): UseQueryResult<TravelDocument[], Error> {
  return useQuery({
    queryKey: queryKeys.travel.documents.list(tripId),
    queryFn: () => getTravelDocuments(tripId),
    ...queryOptions.user,
  });
}

/**
 * Create a new travel document
 */
export function useCreateTravelDocument(): UseMutationResult<
  TravelDocument,
  Error,
  Omit<TravelDocument, 'id' | 'user_id' | 'created_at'>
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: Omit<TravelDocument, 'id' | 'user_id' | 'created_at'>) => {
      logger.debug('Travel', 'Creating travel document', { type: input.type, tripId: input.trip_id });
      const result = await createTravelDocument(input);
      return result;
    },
    onSuccess: (newDocument) => {
      logger.info('Travel', 'Travel document created successfully', { id: newDocument.id });

      // Invalidate all documents lists
      void queryClient.invalidateQueries({ queryKey: queryKeys.travel.documents.all() });
    },
    onError: (error: Error) => {
      logger.error('Travel', 'Failed to create travel document', { error: error.message });
    },
  });
}

// =====================================================
// PACKING LISTS QUERY HOOKS
// =====================================================

/**
 * Get all packing lists, optionally filtered by trip
 */
export function usePackingLists(tripId?: string): UseQueryResult<PackingList[], Error> {
  return useQuery({
    queryKey: queryKeys.travel.packingLists.list(tripId),
    queryFn: () => getPackingLists(tripId),
    ...queryOptions.user,
  });
}

/**
 * Create a new packing list
 */
export function useCreatePackingList(): UseMutationResult<
  PackingList,
  Error,
  Omit<PackingList, 'id' | 'user_id' | 'created_at' | 'items'>
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: Omit<PackingList, 'id' | 'user_id' | 'created_at' | 'items'>) => {
      logger.debug('Travel', 'Creating packing list', { name: input.name, tripId: input.trip_id });
      const result = await createPackingList(input);
      return result;
    },
    onSuccess: (newList) => {
      logger.info('Travel', 'Packing list created successfully', { id: newList.id });

      // Invalidate all packing lists
      void queryClient.invalidateQueries({ queryKey: queryKeys.travel.packingLists.all() });
    },
    onError: (error: Error) => {
      logger.error('Travel', 'Failed to create packing list', { error: error.message });
    },
  });
}

// =====================================================
// TRIP BUDGET QUERY HOOKS
// =====================================================

/**
 * Get budget summary for a specific trip
 */
export function useTripBudget(tripId: string | null): UseQueryResult<
  Awaited<ReturnType<typeof getTripBudgetSummary>>,
  Error
> {
  return useQuery({
    queryKey: queryKeys.travel.budget(tripId ?? ''),
    queryFn: () => {
      if (!tripId) throw new Error('Trip ID is required');
      return getTripBudgetSummary(tripId);
    },
    enabled: !!tripId,
    ...queryOptions.user,
  });
}

