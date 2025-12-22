/**
 * National Parks Zustand Slice - UI STATE ONLY
 *
 * ⚠️ DEPRECATED: Server state removed - use React Query hooks instead
 * 
 * This slice now contains ONLY UI state (view modes, filters, search, etc.)
 * All server data (parks, visited parks, stats, CRUD operations) should use React Query.
 *
 * ✅ Use React Query hooks from @/hooks/useNationalParksQuery.ts (if exists) or create them:
 * - useNationalParksQuery() - Get all national parks
 * - useNationalParkQuery(id) - Get single park
 * - useSearchParksQuery(query) - Search parks
 * - useVisitedParksQuery() - Get visited parks
 * - useAddVisitedParkMutation() - Mark park as visited
 * - useUpdateVisitedParkMutation() - Update visit details
 * - useDeleteVisitedParkMutation() - Remove visit
 * - useIsParkVisitedQuery(parkId) - Check if park is visited
 * - useVisitStatsQuery() - Get visit statistics
 *
 * Additional React Query Features:
 * - Park recommendations
 * - Trip planning integration
 * - Weather and seasonal info
 * - Photo gallery management
 *
 * Benefits of React Query:
 * - Better parks data caching and synchronization
 * - Optimistic updates for visit tracking
 * - Automatic invalidation when visits change
 * - Proper separation: Server state (React Query) vs UI state (Zustand)
 */

import { type StateCreator } from 'zustand';

export interface NationalParksSlice {
  // UI State only - no server data!
  parksViewMode: 'grid' | 'list' | 'map';
  parksFilterState: string | null;
  parksFilterVisited: 'all' | 'visited' | 'not_visited';
  parksFilterActivities: string[];
  parksSearchQuery: string;
  parksSortBy: 'name' | 'state' | 'visit_date' | 'rating';
  parksSortOrder: 'asc' | 'desc';
  parksSelectedPark: string | null;
  parksSelectedTab: 'info' | 'visits' | 'photos' | 'stats';

  // UI Actions
  setParksViewMode: (mode: 'grid' | 'list' | 'map') => void;
  setParksFilterState: (state: string | null) => void;
  setParksFilterVisited: (filter: 'all' | 'visited' | 'not_visited') => void;
  setParksFilterActivities: (activities: string[]) => void;
  setParksSearchQuery: (query: string) => void;
  setParksSortBy: (sortBy: 'name' | 'state' | 'visit_date' | 'rating') => void;
  setParksSortOrder: (order: 'asc' | 'desc') => void;
  setParksSelectedPark: (parkId: string | null) => void;
  setParksSelectedTab: (tab: 'info' | 'visits' | 'photos' | 'stats') => void;
  resetParksFilters: () => void;
}

export const createNationalParksSlice: StateCreator<NationalParksSlice, [], [], NationalParksSlice> = (set) => ({
  // Initial UI state
  parksViewMode: 'grid',
  parksFilterState: null,
  parksFilterVisited: 'all',
  parksFilterActivities: [],
  parksSearchQuery: '',
  parksSortBy: 'name',
  parksSortOrder: 'asc',
  parksSelectedPark: null,
  parksSelectedTab: 'info',

  // UI Actions
  setParksViewMode: (mode) => set({ parksViewMode: mode }),
  setParksFilterState: (state) => set({ parksFilterState: state }),
  setParksFilterVisited: (filter) => set({ parksFilterVisited: filter }),
  setParksFilterActivities: (activities) => set({ parksFilterActivities: activities }),
  setParksSearchQuery: (query) => set({ parksSearchQuery: query }),
  setParksSortBy: (sortBy) => set({ parksSortBy: sortBy }),
  setParksSortOrder: (order) => set({ parksSortOrder: order }),
  setParksSelectedPark: (parkId) => set({ parksSelectedPark: parkId }),
  setParksSelectedTab: (tab) => set({ parksSelectedTab: tab }),
  resetParksFilters: () =>
    set({
      parksFilterState: null,
      parksFilterVisited: 'all',
      parksFilterActivities: [],
      parksSearchQuery: '',
      parksSelectedPark: null,
    }),
});
