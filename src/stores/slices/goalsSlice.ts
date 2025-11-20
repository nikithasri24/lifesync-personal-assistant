/**
 * Goals & Dreams Store Slice
 *
 * Manages goals and dreams state and actions.
 * Extracted from useRealAppStore to improve maintainability.
 */

import { StateCreator } from 'zustand';
import type { Goal, Dream } from '../../types';

const createId = () => Math.random().toString(36).substring(2, 15);

// State interface
export interface GoalsSlice {
  // State
  goals: Goal[];
  dreams: Dream[];
  goalsLoaded: boolean;
  goalsLoading: boolean;
  dreamsLoaded: boolean;
  dreamsLoading: boolean;

  // Actions - Lazy Loading
  loadGoals: () => Promise<void>;
  loadDreams: () => Promise<void>;

  // Actions - Goals
  addGoal: (goal: Omit<Goal, 'id' | 'createdAt'>) => Promise<void>;
  updateGoal: (id: string, updates: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;

  // Actions - Dreams
  addDream: (dream: Omit<Dream, 'id' | 'createdAt' | 'lastUpdated'>) => Promise<void>;
  updateDream: (id: string, updates: Partial<Dream>) => Promise<void>;
  deleteDream: (id: string) => Promise<void>;

  // Internal setters
  _setGoals: (goals: Goal[]) => void;
  _setDreams: (dreams: Dream[]) => void;
}

// Create the slice
export const createGoalsSlice: StateCreator<GoalsSlice> = (set, get) => ({
  // Initial state
  goals: [],
  dreams: [],
  goalsLoaded: false,
  goalsLoading: false,
  dreamsLoaded: false,
  dreamsLoading: false,

  // Internal setters (used by initializeData)
  _setGoals: (goals) => set({ goals, goalsLoaded: true }),
  _setDreams: (dreams) => set({ dreams, dreamsLoaded: true }),

  // ==================== Lazy Loading ====================

  loadGoals: async () => {
    if (get().goalsLoaded || get().goalsLoading) return;

    set({ goalsLoading: true });
    try {
      const { getGoals } = await import('../../api/goalsAPI');
      const goals = await getGoals();
      set({ goals, goalsLoaded: true, goalsLoading: false });
    } catch (error) {
      console.error('Error loading goals:', error);
      set({ goalsLoading: false });
    }
  },

  loadDreams: async () => {
    if (get().dreamsLoaded || get().dreamsLoading) return;

    set({ dreamsLoading: true });
    try {
      const { getDreams } = await import('../../api/goalsAPI');
      const dreams = await getDreams();
      set({ dreams, dreamsLoaded: true, dreamsLoading: false });
    } catch (error) {
      console.error('Error loading dreams:', error);
      set({ dreamsLoading: false });
    }
  },

  // ==================== Goals ====================

  addGoal: async (goalInput) => {
    try {
      // Import dynamically to avoid circular dependencies
      const { createGoal } = await import('../../api/goalsAPI');

      const goal = await createGoal({
        title: goalInput.title,
        description: goalInput.description,
        category: goalInput.category,
        targetDate: goalInput.targetDate,
        status: goalInput.status,
        progress: goalInput.progress,
        priority: goalInput.priority,
      });

      set((state) => ({ goals: [...state.goals, goal] }));
    } catch (error) {
      console.error('Error creating goal:', error);
      // Fallback to local storage for backwards compatibility
      const goal: Goal = {
        ...goalInput,
        id: createId(),
        createdAt: new Date(),
      };
      set((state) => ({ goals: [...state.goals, goal] }));
    }
  },

  updateGoal: async (id, updates) => {
    try {
      const { updateGoal } = await import('../../api/goalsAPI');

      const updatedGoal = await updateGoal(id, {
        title: updates.title,
        description: updates.description,
        category: updates.category,
        targetDate: updates.targetDate,
        status: updates.status,
        progress: updates.progress,
        priority: updates.priority,
      });

      set((state) => ({
        goals: state.goals.map((goal) => (goal.id === id ? updatedGoal : goal)),
      }));
    } catch (error) {
      console.error('Error updating goal:', error);
      // Fallback to local update
      set((state) => ({
        goals: state.goals.map((goal) =>
          goal.id === id ? { ...goal, ...updates, createdAt: goal.createdAt } : goal
        ),
      }));
    }
  },

  deleteGoal: async (id) => {
    try {
      const { deleteGoal } = await import('../../api/goalsAPI');
      await deleteGoal(id);
      set((state) => ({ goals: state.goals.filter((goal) => goal.id !== id) }));
    } catch (error) {
      console.error('Error deleting goal:', error);
      // Still remove from local state even if API fails
      set((state) => ({ goals: state.goals.filter((goal) => goal.id !== id) }));
    }
  },

  // ==================== Dreams ====================

  addDream: async (dreamInput) => {
    try {
      // Import dynamically to avoid circular dependencies
      const { createDream } = await import('../../api/goalsAPI');

      const dream = await createDream({
        title: dreamInput.title,
        description: dreamInput.description,
        category: dreamInput.category,
        notes: dreamInput.notes,
      });

      set((state) => ({ dreams: [...state.dreams, dream] }));
    } catch (error) {
      console.error('Error creating dream:', error);
      // Fallback to local storage for backwards compatibility
      const dream: Dream = {
        ...dreamInput,
        id: createId(),
        createdAt: new Date(),
        lastUpdated: new Date(),
        notes: dreamInput.notes ?? '',
      };
      set((state) => ({ dreams: [...state.dreams, dream] }));
    }
  },

  updateDream: async (id, updates) => {
    try {
      const { updateDream } = await import('../../api/goalsAPI');

      const updatedDream = await updateDream(id, {
        title: updates.title,
        description: updates.description,
        category: updates.category,
        notes: updates.notes,
      });

      set((state) => ({
        dreams: state.dreams.map((dream) => (dream.id === id ? updatedDream : dream)),
      }));
    } catch (error) {
      console.error('Error updating dream:', error);
      // Fallback to local update
      set((state) => ({
        dreams: state.dreams.map((dream) =>
          dream.id === id ? { ...dream, ...updates, lastUpdated: new Date() } : dream
        ),
      }));
    }
  },

  deleteDream: async (id) => {
    try {
      const { deleteDream } = await import('../../api/goalsAPI');
      await deleteDream(id);
      set((state) => ({ dreams: state.dreams.filter((dream) => dream.id !== id) }));
    } catch (error) {
      console.error('Error deleting dream:', error);
      // Still remove from local state even if API fails
      set((state) => ({ dreams: state.dreams.filter((dream) => dream.id !== id) }));
    }
  },
});
