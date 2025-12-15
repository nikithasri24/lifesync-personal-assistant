/**
 * Travel Slice
 * Manages trips, itineraries, documents, and packing lists
 */

import type { StateCreator } from 'zustand';
import type { Trip, TripDay, TravelDocument, PackingList } from '@/services/types';
import {
  getTrips,
  getTrip,
  createTrip as apiCreateTrip,
  updateTrip as apiUpdateTrip,
  deleteTrip as apiDeleteTrip,
  getTripDays,
  createTripDay as apiCreateTripDay,
  getTravelDocuments,
  createTravelDocument as apiCreateTravelDocument,
  getPackingLists,
  createPackingList as apiCreatePackingList,
  getTripBudgetSummary,
} from '@/api/travelAPI';
import { logger } from '@/services/logger';

export interface TravelSlice {
  // State
  trips: Trip[];
  tripDays: Record<string, TripDay[]>; // keyed by trip_id
  travelDocuments: TravelDocument[];
  packingLists: PackingList[];
  travelLoaded: boolean;
  travelLoading: boolean;
  travelError: string | null;

  // Trip Actions
  loadTrips: (filters?: Parameters<typeof getTrips>[0]) => Promise<void>;
  addTrip: (trip: Omit<Trip, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<Trip>;
  updateTrip: (id: string, updates: Partial<Trip>) => Promise<Trip>;
  deleteTrip: (id: string) => Promise<void>;
  getTripById: (id: string) => Trip | undefined;

  // Itinerary Actions
  loadTripDays: (tripId: string) => Promise<void>;
  addTripDay: (tripDay: Omit<TripDay, 'id' | 'created_at'>) => Promise<TripDay>;

  // Document Actions
  loadTravelDocuments: (tripId?: string) => Promise<void>;
  addTravelDocument: (document: Omit<TravelDocument, 'id' | 'user_id' | 'created_at'>) => Promise<TravelDocument>;

  // Packing List Actions
  loadPackingLists: (tripId?: string) => Promise<void>;
  addPackingList: (list: Omit<PackingList, 'id' | 'user_id' | 'created_at' | 'items'>) => Promise<PackingList>;

  // Budget Actions
  getTripBudget: (tripId: string) => Promise<ReturnType<typeof getTripBudgetSummary>>;
}

export const createTravelSlice: StateCreator<TravelSlice, [], [], TravelSlice> = (
  set,
  get
) => ({
  // Initial state
  trips: [],
  tripDays: {},
  travelDocuments: [],
  packingLists: [],
  travelLoaded: false,
  travelLoading: false,
  travelError: null,

  // Load all trips
  loadTrips: async (filters): Promise<void> => {
    if (get().travelLoading) return;

    set({ travelLoading: true, travelError: null });
    try {
      const trips = await getTrips(filters);
      set({ trips, travelLoaded: true, travelLoading: false });
      logger.info('TravelSlice', 'Trips loaded', { count: trips.length });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load trips';
      logger.error('TravelSlice', 'Operation failed', { error, context: 'loadTrips' });
      set({
        travelError: errorMessage,
        travelLoading: false,
      });
      throw error;
    }
  },

  // Add a new trip
  addTrip: async (trip): Promise<Trip> => {
    try {
      const created = await apiCreateTrip(trip);
      set((state) => ({ trips: [created, ...state.trips] }));
      logger.info('TravelSlice', 'Trip created', { id: created.id, name: created.name });
      return created;
    } catch (error) {
      logger.error('TravelSlice', 'Operation failed', { error, context: 'addTrip' });
      throw error;
    }
  },

  // Update a trip
  updateTrip: async (id, updates): Promise<Trip> => {
    try {
      const updated = await apiUpdateTrip(id, updates);
      set((state) => ({
        trips: state.trips.map((t) => (t.id === id ? updated : t)),
      }));
      logger.info('TravelSlice', 'Trip updated', { id });
      return updated;
    } catch (error) {
      logger.error('TravelSlice', 'Operation failed', { error, context: 'updateTrip', id });
      throw error;
    }
  },

  // Delete a trip
  deleteTrip: async (id): Promise<void> => {
    try {
      await apiDeleteTrip(id);
      set((state) => ({
        trips: state.trips.filter((t) => t.id !== id),
      }));
      logger.info('TravelSlice', 'Trip deleted', { id });
    } catch (error) {
      logger.error('TravelSlice', 'Operation failed', { error, context: 'deleteTrip', id });
      throw error;
    }
  },

  // Get trip by ID
  getTripById: (id) => get().trips.find((t) => t.id === id),

  // Load trip days (itinerary)
  loadTripDays: async (tripId): Promise<void> => {
    try {
      const days = await getTripDays(tripId);
      set((state) => ({
        tripDays: { ...state.tripDays, [tripId]: days },
      }));
      logger.info('TravelSlice', 'Trip days loaded', { tripId, count: days.length });
    } catch (error) {
      logger.error('TravelSlice', 'Operation failed', { error, context: 'loadTripDays', tripId });
      throw error;
    }
  },

  // Add a trip day
  addTripDay: async (tripDay): Promise<TripDay> => {
    try {
      const created = await apiCreateTripDay(tripDay);
      set((state) => ({
        tripDays: {
          ...state.tripDays,
          [tripDay.trip_id]: [...(state.tripDays[tripDay.trip_id] || []), created].sort(
            (a, b) => a.date.localeCompare(b.date)
          ),
        },
      }));
      logger.info('TravelSlice', 'Trip day created', { id: created.id, date: created.date });
      return created;
    } catch (error) {
      logger.error('TravelSlice', 'Operation failed', { error, context: 'addTripDay' });
      throw error;
    }
  },

  // Load travel documents
  loadTravelDocuments: async (tripId): Promise<void> => {
    try {
      const documents = await getTravelDocuments(tripId);
      set({ travelDocuments: documents });
      logger.info('TravelSlice', 'Travel documents loaded', { tripId, count: documents.length });
    } catch (error) {
      logger.error('TravelSlice', 'Operation failed', { error, context: 'loadTravelDocuments', tripId });
      throw error;
    }
  },

  // Add a travel document
  addTravelDocument: async (document): Promise<TravelDocument> => {
    try {
      const created = await apiCreateTravelDocument(document);
      set((state) => ({ travelDocuments: [created, ...state.travelDocuments] }));
      logger.info('TravelSlice', 'Travel document created', { id: created.id, name: created.name });
      return created;
    } catch (error) {
      logger.error('TravelSlice', 'Operation failed', { error, context: 'addTravelDocument' });
      throw error;
    }
  },

  // Load packing lists
  loadPackingLists: async (tripId): Promise<void> => {
    try {
      const lists = await getPackingLists(tripId);
      set({ packingLists: lists });
      logger.info('TravelSlice', 'Packing lists loaded', { tripId, count: lists.length });
    } catch (error) {
      logger.error('TravelSlice', 'Operation failed', { error, context: 'loadPackingLists', tripId });
      throw error;
    }
  },

  // Add a packing list
  addPackingList: async (list): Promise<PackingList> => {
    try {
      const created = await apiCreatePackingList(list);
      set((state) => ({ packingLists: [created, ...state.packingLists] }));
      logger.info('TravelSlice', 'Packing list created', { id: created.id, name: created.name });
      return created;
    } catch (error) {
      logger.error('TravelSlice', 'Operation failed', { error, context: 'addPackingList' });
      throw error;
    }
  },

  // Get trip budget summary
  getTripBudget: async (tripId): Promise<ReturnType<typeof getTripBudgetSummary>> => {
    try {
      const summary = await getTripBudgetSummary(tripId);
      logger.info('TravelSlice', 'Trip budget summary retrieved', { tripId, summary });
      return summary;
    } catch (error) {
      logger.error('TravelSlice', 'Operation failed', { error, context: 'getTripBudget', tripId });
      throw error;
    }
  },
});
