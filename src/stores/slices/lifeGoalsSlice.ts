/**
 * Life Goals Slice
 * Manages long-term life goals state and operations
 */

import type { StateCreator } from 'zustand';
import type { LifeGoal } from '@/services/types';
import {
  getLifeGoals,
  createLifeGoal as apiCreateLifeGoal,
  updateLifeGoal as apiUpdateLifeGoal,
  deleteLifeGoal as apiDeleteLifeGoal,
} from '@/api/lifeGoalsAPI';
import { logger } from '@/services/logger';

export interface LifeGoalsSlice {
  // State
  lifeGoals: LifeGoal[];
  lifeGoalsLoaded: boolean;
  lifeGoalsLoading: boolean;
  lifeGoalsError: string | null;

  // Actions
  loadLifeGoals: (filters?: Parameters<typeof getLifeGoals>[0]) => Promise<void>;
  addLifeGoal: (goal: Omit<LifeGoal, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<LifeGoal>;
  updateLifeGoal: (id: string, updates: Partial<LifeGoal>) => Promise<LifeGoal>;
  deleteLifeGoal: (id: string) => Promise<void>;
  getLifeGoalById: (id: string) => LifeGoal | undefined;
}

export const createLifeGoalsSlice: StateCreator<LifeGoalsSlice, [], [], LifeGoalsSlice> = (
  set,
  get
) => ({
  // Initial state
  lifeGoals: [],
  lifeGoalsLoaded: false,
  lifeGoalsLoading: false,
  lifeGoalsError: null,

  // Load all life goals
  loadLifeGoals: async (filters): Promise<void> => {
    if (get().lifeGoalsLoading) return;

    set({ lifeGoalsLoading: true, lifeGoalsError: null });
    try {
      const goals = await getLifeGoals(filters);
      set({ lifeGoals: goals, lifeGoalsLoaded: true, lifeGoalsLoading: false });
      logger.info('LifeGoalsSlice', 'Life goals loaded', { count: goals.length });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load life goals';
      logger.error('LifeGoalsSlice', error as Error, { context: 'loadLifeGoals' });
      set({
        lifeGoalsError: errorMessage,
        lifeGoalsLoading: false,
      });
      throw error;
    }
  },

  // Add a new life goal
  addLifeGoal: async (goal): Promise<LifeGoal> => {
    try {
      const created = await apiCreateLifeGoal(goal);
      set((state) => ({ lifeGoals: [created, ...state.lifeGoals] }));
      logger.info('LifeGoalsSlice', 'Life goal created', { id: created.id, title: created.title });
      return created;
    } catch (error) {
      logger.error('LifeGoalsSlice', error as Error, { context: 'addLifeGoal' });
      throw error;
    }
  },

  // Update a life goal
  updateLifeGoal: async (id, updates): Promise<LifeGoal> => {
    try {
      const updated = await apiUpdateLifeGoal(id, updates);
      set((state) => ({
        lifeGoals: state.lifeGoals.map((g) => (g.id === id ? updated : g)),
      }));
      logger.info('LifeGoalsSlice', 'Life goal updated', { id });
      return updated;
    } catch (error) {
      logger.error('LifeGoalsSlice', error as Error, { context: 'updateLifeGoal', id });
      throw error;
    }
  },

  // Delete a life goal
  deleteLifeGoal: async (id): Promise<void> => {
    try {
      await apiDeleteLifeGoal(id);
      set((state) => ({
        lifeGoals: state.lifeGoals.filter((g) => g.id !== id),
      }));
      logger.info('LifeGoalsSlice', 'Life goal deleted', { id });
    } catch (error) {
      logger.error('LifeGoalsSlice', error as Error, { context: 'deleteLifeGoal', id });
      throw error;
    }
  },

  // Get life goal by ID
  getLifeGoalById: (id) => get().lifeGoals.find((g) => g.id === id),
});
