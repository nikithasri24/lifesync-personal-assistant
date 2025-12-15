/**
 * Goals Zustand Slice
 *
 * MIGRATION STATUS: React Query hooks available
 * - New React Query hooks:
 *   - /src/goals/hooks/useGoalsQuery.ts (simplified API)
 *   - /src/goals/hooks/useLifeGoalsQuery.ts (full-featured API)
 * - Recommended: Use React Query hooks for new features
 * - This slice is maintained for backward compatibility
 *
 * Migration Guide:
 * - Replace `loadGoals()` with `useGoalsQuery()` or `useLifeGoalsQuery()`
 * - Replace `addGoal()` with `useCreateGoalMutation()`
 * - Replace `updateGoal()` with `useUpdateGoalMutation()`
 * - Replace `deleteGoal()` with `useDeleteGoalMutation()`
 * - Replace `loadDreams()` with `useLifeDreamsQuery()`
 * - Replace `addDream()` with `useCreateLifeDreamMutation()`
 * - Replace `updateDream()` with `useUpdateLifeDreamMutation()`
 * - Replace `deleteDream()` with `useDeleteLifeDreamMutation()`
 *
 * Additional React Query Features:
 * - Milestone management hooks
 * - Check-in tracking hooks
 * - Streak recording hooks
 * - Goal templates and analytics
 *
 * Benefits of React Query:
 * - Better milestone and check-in tracking
 * - Optimistic updates for progress tracking
 * - Automatic XP calculation updates
 * - Streak management with automatic invalidation
 */

import { type StateCreator } from 'zustand';
import type {
  LifeGoal,
  LifeDream,
  CreateLifeGoalInput,
  UpdateLifeGoalInput,
  CreateLifeDreamInput,
  UpdateLifeDreamInput,
} from '@/goals/types/lifeGoals';
import { logger } from '@/services/logger';

export interface GoalsSlice {
  // State - Goals
  goals: LifeGoal[];
  goalsLoaded: boolean;
  goalsLoading: boolean;

  // State - Dreams
  dreams: LifeDream[];
  dreamsLoaded: boolean;
  dreamsLoading: boolean;

  // Actions - Goals
  loadGoals: () => Promise<void>;
  addGoal: (input: CreateLifeGoalInput) => Promise<LifeGoal>;
  updateGoal: (id: string, updates: UpdateLifeGoalInput) => Promise<LifeGoal>;
  deleteGoal: (id: string) => Promise<void>;
  getGoalById: (id: string) => LifeGoal | undefined;

  // Actions - Dreams
  loadDreams: () => Promise<void>;
  addDream: (input: CreateLifeDreamInput) => Promise<LifeDream>;
  updateDream: (id: string, updates: UpdateLifeDreamInput) => Promise<LifeDream>;
  deleteDream: (id: string) => Promise<void>;
  getDreamById: (id: string) => LifeDream | undefined;
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
  loadGoals: async (): Promise<void> => {
    if (get().goalsLoaded || get().goalsLoading) return;

    set({ goalsLoading: true });
    try {
      const { getUserLifeGoals } = await import('@/goals/api/lifeGoalsAPI');
      const goals = await getUserLifeGoals();
      set({ goals, goalsLoaded: true, goalsLoading: false });
    } catch (error) {
      logger.error('Goals', 'Operation failed', { error, context: 'loadGoals' });
      set({ goalsLoading: false });
      throw error;
    }
  },

  addGoal: async (input: CreateLifeGoalInput): Promise<LifeGoal> => {
    try {
      const { createLifeGoal } = await import('@/goals/api/lifeGoalsAPI');
      const goal = await createLifeGoal(input);
      set((state) => ({ goals: [...state.goals, goal] }));
      return goal;
    } catch (error) {
      logger.error('Goals', 'Operation failed', { error, context: 'addGoal' });
      throw error;
    }
  },

  updateGoal: async (id: string, updates: UpdateLifeGoalInput): Promise<LifeGoal> => {
    try {
      const { updateLifeGoal } = await import('@/goals/api/lifeGoalsAPI');
      const updatedGoal = await updateLifeGoal(id, updates);
      set((state) => ({
        goals: state.goals.map((g) => (g.id === id ? updatedGoal : g)),
      }));
      return updatedGoal;
    } catch (error) {
      logger.error('Goals', 'Operation failed', { error, context: 'updateGoal' });
      throw error;
    }
  },

  deleteGoal: async (id: string): Promise<void> => {
    try {
      const { deleteLifeGoal } = await import('@/goals/api/lifeGoalsAPI');
      await deleteLifeGoal(id);
      set((state) => ({
        goals: state.goals.filter((g) => g.id !== id),
      }));
    } catch (error) {
      logger.error('Goals', 'Operation failed', { error, context: 'deleteGoal' });
      throw error;
    }
  },

  getGoalById: (id: string): LifeGoal | undefined => {
    return get().goals.find((g) => g.id === id);
  },

  // Actions - Dreams
  loadDreams: async (): Promise<void> => {
    if (get().dreamsLoaded || get().dreamsLoading) return;

    set({ dreamsLoading: true });
    try {
      const { getUserLifeDreams } = await import('@/goals/api/lifeGoalsAPI');
      const dreams = await getUserLifeDreams();
      set({ dreams, dreamsLoaded: true, dreamsLoading: false });
    } catch (error) {
      logger.error('Dreams', 'Operation failed', { error, context: 'loadDreams' });
      set({ dreamsLoading: false });
      throw error;
    }
  },

  addDream: async (input: CreateLifeDreamInput): Promise<LifeDream> => {
    try {
      const { createLifeDream } = await import('@/goals/api/lifeGoalsAPI');
      const dream = await createLifeDream(input);
      set((state) => ({ dreams: [...state.dreams, dream] }));
      return dream;
    } catch (error) {
      logger.error('Dreams', 'Operation failed', { error, context: 'addDream' });
      throw error;
    }
  },

  updateDream: async (id: string, updates: UpdateLifeDreamInput): Promise<LifeDream> => {
    try {
      const { updateLifeDream } = await import('@/goals/api/lifeGoalsAPI');
      const updatedDream = await updateLifeDream(id, updates);
      set((state) => ({
        dreams: state.dreams.map((d) => (d.id === id ? updatedDream : d)),
      }));
      return updatedDream;
    } catch (error) {
      logger.error('Dreams', 'Operation failed', { error, context: 'updateDream' });
      throw error;
    }
  },

  deleteDream: async (id: string): Promise<void> => {
    try {
      const { deleteLifeDream } = await import('@/goals/api/lifeGoalsAPI');
      await deleteLifeDream(id);
      set((state) => ({
        dreams: state.dreams.filter((d) => d.id !== id),
      }));
    } catch (error) {
      logger.error('Dreams', 'Operation failed', { error, context: 'deleteDream' });
      throw error;
    }
  },

  getDreamById: (id: string): LifeDream | undefined => {
    return get().dreams.find((d) => d.id === id);
  },
});
