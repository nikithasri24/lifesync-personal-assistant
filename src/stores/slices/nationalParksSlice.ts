/**
 * National Parks Slice
 * Manages national parks data and visited parks tracking
 */

import type { StateCreator } from 'zustand';
import type { NationalPark } from '@/types/nationalParks';
import type { VisitedParkData } from '@/api/nationalParksAPI';
import {
  getParks,
  getPark,
  searchParks,
  getVisitedParks,
  addVisitedPark as apiAddVisitedPark,
  updateVisitedPark as apiUpdateVisitedPark,
  deleteVisitedPark as apiDeleteVisitedPark,
  isParkVisited as apiIsParkVisited,
  getVisitStats,
} from '@/api/nationalParksAPI';
import { logger } from '@/services/logger';

export interface NationalParksSlice {
  // State
  parks: NationalPark[];
  visitedParks: VisitedParkData[];
  parksLoaded: boolean;
  parksLoading: boolean;
  parksError: string | null;
  visitedParksLoaded: boolean;

  // Parks Actions
  loadParks: (filters?: Parameters<typeof getParks>[0]) => Promise<void>;
  searchParks: (query: string, filters?: Omit<Parameters<typeof getParks>[0], 'searchQuery'>) => Promise<NationalPark[]>;
  getParkById: (id: string) => NationalPark | undefined;

  // Visited Parks Actions
  loadVisitedParks: () => Promise<void>;
  addVisitedPark: (
    parkId: string,
    data: {
      visitDate: Date | string;
      notes?: string;
      rating?: number;
      photos?: string[];
    }
  ) => Promise<VisitedParkData>;
  updateVisitedPark: (
    id: string,
    updates: Partial<{
      visitDate: Date | string;
      notes: string;
      rating: number;
      photos: string[];
    }>
  ) => Promise<VisitedParkData>;
  deleteVisitedPark: (id: string) => Promise<void>;
  isParkVisited: (parkId: string) => Promise<boolean>;
  getVisitStatistics: () => Promise<ReturnType<typeof getVisitStats>>;
}

export const createNationalParksSlice: StateCreator<
  NationalParksSlice,
  [],
  [],
  NationalParksSlice
> = (set, get) => ({
  // Initial state
  parks: [],
  visitedParks: [],
  parksLoaded: false,
  parksLoading: false,
  parksError: null,
  visitedParksLoaded: false,

  // Load all parks
  loadParks: async (filters): Promise<void> => {
    if (get().parksLoading) return;

    set({ parksLoading: true, parksError: null });
    try {
      const parks = await getParks(filters);
      set({ parks, parksLoaded: true, parksLoading: false });
      logger.info('NationalParksSlice', 'Parks loaded', { count: parks.length });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to load parks';
      set({ parksError: errorMessage, parksLoading: false });
      logger.error('NationalParksSlice', error as Error, { context: 'loadParks' });
      throw error;
    }
  },

  // Search parks
  searchParks: async (query, filters): Promise<NationalPark[]> => {
    try {
      const results = await searchParks(query, filters);
      logger.info('NationalParksSlice', 'Parks search completed', {
        query,
        resultCount: results.length,
      });
      return results;
    } catch (error) {
      logger.error('NationalParksSlice', error as Error, { context: 'searchParks', query });
      throw error;
    }
  },

  // Get park by ID
  getParkById: (id: string): NationalPark | undefined => {
    return get().parks.find((park) => park.id === id);
  },

  // Load visited parks
  loadVisitedParks: async (): Promise<void> => {
    try {
      const visitedParks = await getVisitedParks();
      set({ visitedParks, visitedParksLoaded: true });
      logger.info('NationalParksSlice', 'Visited parks loaded', {
        count: visitedParks.length,
      });
    } catch (error) {
      logger.error('NationalParksSlice', error as Error, { context: 'loadVisitedParks' });
      throw error;
    }
  },

  // Add visited park
  addVisitedPark: async (parkId, data): Promise<VisitedParkData> => {
    try {
      const visitedPark = await apiAddVisitedPark(parkId, data);
      const currentVisitedParks = get().visitedParks;
      set({ visitedParks: [visitedPark, ...currentVisitedParks] });
      logger.info('NationalParksSlice', 'Visited park added', { parkId });
      return visitedPark;
    } catch (error) {
      logger.error('NationalParksSlice', error as Error, {
        context: 'addVisitedPark',
        parkId,
      });
      throw error;
    }
  },

  // Update visited park
  updateVisitedPark: async (id, updates): Promise<VisitedParkData> => {
    try {
      const updatedPark = await apiUpdateVisitedPark(id, updates);
      const currentVisitedParks = get().visitedParks;
      set({
        visitedParks: currentVisitedParks.map((park) =>
          park.id === id ? updatedPark : park
        ),
      });
      logger.info('NationalParksSlice', 'Visited park updated', { id });
      return updatedPark;
    } catch (error) {
      logger.error('NationalParksSlice', error as Error, {
        context: 'updateVisitedPark',
        id,
      });
      throw error;
    }
  },

  // Delete visited park
  deleteVisitedPark: async (id: string): Promise<void> => {
    try {
      await apiDeleteVisitedPark(id);
      const currentVisitedParks = get().visitedParks;
      set({ visitedParks: currentVisitedParks.filter((park) => park.id !== id) });
      logger.info('NationalParksSlice', 'Visited park deleted', { id });
    } catch (error) {
      logger.error('NationalParksSlice', error as Error, {
        context: 'deleteVisitedPark',
        id,
      });
      throw error;
    }
  },

  // Check if park is visited
  isParkVisited: async (parkId: string): Promise<boolean> => {
    try {
      const isVisited = await apiIsParkVisited(parkId);
      logger.info('NationalParksSlice', 'Park visit check completed', {
        parkId,
        isVisited,
      });
      return isVisited;
    } catch (error) {
      logger.error('NationalParksSlice', error as Error, {
        context: 'isParkVisited',
        parkId,
      });
      throw error;
    }
  },

  // Get visit statistics
  getVisitStatistics: async () => {
    try {
      const stats = await getVisitStats();
      logger.info('NationalParksSlice', 'Visit stats retrieved', {
        totalVisited: stats.totalVisited,
      });
      return stats;
    } catch (error) {
      logger.error('NationalParksSlice', error as Error, { context: 'getVisitStatistics' });
      throw error;
    }
  },
});
