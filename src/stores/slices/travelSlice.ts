/**
 * Travel Zustand Slice - UI STATE ONLY
 *
 * ⚠️ DEPRECATED: Server state removed - use React Query hooks instead
 * 
 * This slice now contains ONLY UI state (view modes, filters, selected items, etc.)
 * All server data (trips, itineraries, documents, packing lists, CRUD operations) should use React Query.
 *
 * ✅ Use React Query hooks from @/hooks/useTravelQuery.ts:
 * - useTripsQuery() - Get all trips
 * - useTripQuery(id) - Get single trip
 * - useCreateTripMutation() - Create trip
 * - useUpdateTripMutation() - Update trip
 * - useDeleteTripMutation() - Delete trip
 * - useTripDaysQuery(tripId) - Get trip itinerary
 * - useTravelDocumentsQuery(tripId) - Get travel documents
 * - usePackingListsQuery(tripId) - Get packing lists
 * - useTripBudgetQuery(tripId) - Get budget summary
 *
 * Additional React Query Features:
 * - Trip templates and suggestions
 * - Weather integration hooks
 * - Flight/hotel tracking
 * - Expense tracking
 *
 * Benefits of React Query:
 * - Better travel data caching and synchronization
 * - Optimistic updates for trip planning
 * - Automatic invalidation when trips change
 * - Proper separation: Server state (React Query) vs UI state (Zustand)
 */

import { type StateCreator } from 'zustand';

export interface TravelSlice {
  // UI State only - no server data!
  travelViewMode: 'grid' | 'list' | 'timeline' | 'map';
  travelFilterStatus: 'all' | 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  travelFilterDestination: string | null;
  travelFilterDateRange: { start: string; end: string } | null;
  travelSortBy: 'start_date' | 'end_date' | 'created_at' | 'destination';
  travelSortOrder: 'asc' | 'desc';
  travelShowArchived: boolean;
  travelSelectedTrip: string | null;
  travelSelectedTab: 'overview' | 'itinerary' | 'documents' | 'packing' | 'budget';

  // UI Actions
  setTravelViewMode: (mode: 'grid' | 'list' | 'timeline' | 'map') => void;
  setTravelFilterStatus: (status: 'all' | 'upcoming' | 'ongoing' | 'completed' | 'cancelled') => void;
  setTravelFilterDestination: (destination: string | null) => void;
  setTravelFilterDateRange: (range: { start: string; end: string } | null) => void;
  setTravelSortBy: (sortBy: 'start_date' | 'end_date' | 'created_at' | 'destination') => void;
  setTravelSortOrder: (order: 'asc' | 'desc') => void;
  setTravelShowArchived: (show: boolean) => void;
  setTravelSelectedTrip: (tripId: string | null) => void;
  setTravelSelectedTab: (tab: 'overview' | 'itinerary' | 'documents' | 'packing' | 'budget') => void;
  resetTravelFilters: () => void;
}

export const createTravelSlice: StateCreator<TravelSlice, [], [], TravelSlice> = (set) => ({
  // Initial UI state
  travelViewMode: 'grid',
  travelFilterStatus: 'all',
  travelFilterDestination: null,
  travelFilterDateRange: null,
  travelSortBy: 'start_date',
  travelSortOrder: 'asc',
  travelShowArchived: false,
  travelSelectedTrip: null,
  travelSelectedTab: 'overview',

  // UI Actions
  setTravelViewMode: (mode) => set({ travelViewMode: mode }),
  setTravelFilterStatus: (status) => set({ travelFilterStatus: status }),
  setTravelFilterDestination: (destination) => set({ travelFilterDestination: destination }),
  setTravelFilterDateRange: (range) => set({ travelFilterDateRange: range }),
  setTravelSortBy: (sortBy) => set({ travelSortBy: sortBy }),
  setTravelSortOrder: (order) => set({ travelSortOrder: order }),
  setTravelShowArchived: (show) => set({ travelShowArchived: show }),
  setTravelSelectedTrip: (tripId) => set({ travelSelectedTrip: tripId }),
  setTravelSelectedTab: (tab) => set({ travelSelectedTab: tab }),
  resetTravelFilters: () =>
    set({
      travelFilterStatus: 'all',
      travelFilterDestination: null,
      travelFilterDateRange: null,
      travelShowArchived: false,
      travelSelectedTrip: null,
    }),
});
