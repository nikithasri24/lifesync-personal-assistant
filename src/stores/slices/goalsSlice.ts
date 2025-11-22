/**
 * Goals Slice
 *
 * Manages goals and dreams state and operations
 */

import { type StateCreator } from 'zustand';
import type {
  Goal,
  Dream,
  GoalInput,
  DreamInput,
  GoalFilters,
} from '@/goals/api/lifeGoalsAPI';
import { logger } from '@/services/logger';

export interface GoalsSlice {
  // State - Goals
  goals: Goal[];
  goalsLoaded: boolean;
  goalsLoading: boolean;

  // State - Dreams
  dreams: Dream[];
  dreamsLoaded: boolean;
  dreamsLoading: boolean;

  // Actions - Goals
  loadGoals: () => Promise<void>;
  addGoal: (input: GoalInput) => Promise<Goal>;
  updateGoal: (id: string, updates: Partial<GoalInput>) => Promise<Goal>;
  deleteGoal: (id: string) => Promise<void>;
  searchGoals: (filters: GoalFilters) => Promise<Goal[]>;
  getGoalById: (id: string) => Goal | undefined;

  // Actions - Dreams
  loadDreams: () => Promise<void>;
  addDream: (input: DreamInput) => Promise<Dream>;
  updateDream: (id: string, updates: Partial<DreamInput>) => Promise<Dream>;
  deleteDream: (id: string) => Promise<void>;
  getDreamById: (id: string) => Dream | undefined;
}

export const createGoalsSlice: StateCreator<GoalsSlice, [], [], GoalsSlice> = (
  set,
  get
) => ({
  // Initial state - Goals
  goals: [],
  goalsLoaded: false,
  goalsLoading: false,

  // Initial state - Dreams
  dreams: [],
  dreamsLoaded: false,
  dreamsLoading: false,

  // Actions - Goals
  loadGoals: async () => {
    if (get().goalsLoaded || get().goalsLoading) return;

    set({ goalsLoading: true });
    try {
      const { getGoals } = await import('@/goals/api/lifeGoalsAPI');
      const goals = await getGoals();
      set({ goals, goalsLoaded: true, goalsLoading: false });
    } catch (error) {
      logger.error('Goals', error as Error, { context: 'loadGoals' });
      set({ goalsLoading: false });
      throw error;
    }
  },

  addGoal: async (input) => {
    try {
      const { createGoal } = await import('@/goals/api/lifeGoalsAPI');
      const goal = await createGoal(input);
      set((state) => ({ goals: [...state.goals, goal] }));
      return goal;
    } catch (error) {
      logger.error('Goals', error as Error, { context: 'addGoal' });
      throw error;
    }
  },

  updateGoal: async (id, updates) => {
    try {
      const { updateGoal } = await import('@/goals/api/lifeGoalsAPI');
      const updatedGoal = await updateGoal(id, updates);
      set((state) => ({
        goals: state.goals.map((g) => (g.id === id ? updatedGoal : g)),
      }));
      return updatedGoal;
    } catch (error) {
      logger.error('Goals', error as Error, { context: 'updateGoal' });
      throw error;
    }
  },

  deleteGoal: async (id) => {
    try {
      const { deleteGoal } = await import('@/goals/api/lifeGoalsAPI');
      await deleteGoal(id);
      set((state) => ({
        goals: state.goals.filter((g) => g.id !== id),
      }));
    } catch (error) {
      logger.error('Goals', error as Error, { context: 'deleteGoal' });
      throw error;
    }
  },

  searchGoals: async (filters) => {
    try {
      const { searchGoals } = await import('@/goals/api/lifeGoalsAPI');
      return await searchGoals(filters);
    } catch (error) {
      logger.error('Goals', error as Error, { context: 'searchGoals' });
      throw error;
    }
  },

  getGoalById: (id) => {
    return get().goals.find((g) => g.id === id);
  },

  // Actions - Dreams
  loadDreams: async () => {
    if (get().dreamsLoaded || get().dreamsLoading) return;

    set({ dreamsLoading: true });
    try {
      const { getDreams } = await import('@/goals/api/lifeGoalsAPI');
      const dreams = await getDreams();
      set({ dreams, dreamsLoaded: true, dreamsLoading: false });
    } catch (error) {
      logger.error('Dreams', error as Error, { context: 'loadDreams' });
      set({ dreamsLoading: false });
      throw error;
    }
  },

  addDream: async (input) => {
    try {
      const { createDream } = await import('@/goals/api/lifeGoalsAPI');
      const dream = await createDream(input);
      set((state) => ({ dreams: [...state.dreams, dream] }));
      return dream;
    } catch (error) {
      logger.error('Dreams', error as Error, { context: 'addDream' });
      throw error;
    }
  },

  updateDream: async (id, updates) => {
    try {
      const { updateDream } = await import('@/goals/api/lifeGoalsAPI');
      const updatedDream = await updateDream(id, updates);
      set((state) => ({
        dreams: state.dreams.map((d) => (d.id === id ? updatedDream : d)),
      }));
      return updatedDream;
    } catch (error) {
      logger.error('Dreams', error as Error, { context: 'updateDream' });
      throw error;
    }
  },

  deleteDream: async (id) => {
    try {
      const { deleteDream } = await import('@/goals/api/lifeGoalsAPI');
      await deleteDream(id);
      set((state) => ({
        dreams: state.dreams.filter((d) => d.id !== id),
      }));
    } catch (error) {
      logger.error('Dreams', error as Error, { context: 'deleteDream' });
      throw error;
    }
  },

  getDreamById: (id) => {
    return get().dreams.find((d) => d.id === id);
  },
});
