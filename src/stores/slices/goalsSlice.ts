/**
 * Goals Zustand Slice - UI STATE ONLY
 *
 * ⚠️ DEPRECATED: Server state removed - use React Query hooks instead
 * 
 * This slice now contains ONLY UI state (view modes, filters, etc.)
 * All server data (goals, dreams, loading states, CRUD operations) should use React Query.
 *
 * ✅ Use React Query hooks from @/hooks/useLifeGoalsQuery.ts:
 * - useLifeGoalsQuery() - Get all life goals (full-featured)
 * - useLifeDreamsQuery() - Get all life dreams
 * - useCreateGoalMutation() - Create goal
 * - useUpdateGoalMutation() - Update goal
 * - useDeleteGoalMutation() - Delete goal
 * - useCreateLifeDreamMutation() - Create dream
 * - useUpdateLifeDreamMutation() - Update dream
 * - useDeleteLifeDreamMutation() - Delete dream
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
 * - Proper separation: Server state (React Query) vs UI state (Zustand)
 */

import { type StateCreator } from 'zustand';

export interface GoalsSlice {
  // UI State only - no server data!
  goalsViewMode: 'grid' | 'list' | 'timeline';
  goalsFilterStatus: 'all' | 'active' | 'completed' | 'on_hold';
  goalsFilterCategory: string | null;
  goalsFilterTimeframe: 'all' | 'short_term' | 'long_term';
  goalsSortBy: 'created_at' | 'target_date' | 'progress' | 'title';
  goalsSortOrder: 'asc' | 'desc';
  goalsShowArchived: boolean;
  goalsSelectedGoal: string | null;

  // Dreams UI State
  dreamsViewMode: 'grid' | 'list';
  dreamsFilterCategory: string | null;
  dreamsSortBy: 'created_at' | 'title';
  dreamsSortOrder: 'asc' | 'desc';

  // UI Actions - Goals
  setGoalsViewMode: (mode: 'grid' | 'list' | 'timeline') => void;
  setGoalsFilterStatus: (status: 'all' | 'active' | 'completed' | 'on_hold') => void;
  setGoalsFilterCategory: (category: string | null) => void;
  setGoalsFilterTimeframe: (timeframe: 'all' | 'short_term' | 'long_term') => void;
  setGoalsSortBy: (sortBy: 'created_at' | 'target_date' | 'progress' | 'title') => void;
  setGoalsSortOrder: (order: 'asc' | 'desc') => void;
  setGoalsShowArchived: (show: boolean) => void;
  setGoalsSelectedGoal: (goalId: string | null) => void;
  resetGoalsFilters: () => void;

  // UI Actions - Dreams
  setDreamsViewMode: (mode: 'grid' | 'list') => void;
  setDreamsFilterCategory: (category: string | null) => void;
  setDreamsSortBy: (sortBy: 'created_at' | 'title') => void;
  setDreamsSortOrder: (order: 'asc' | 'desc') => void;
  resetDreamsFilters: () => void;
}

export const createGoalsSlice: StateCreator<GoalsSlice, [], [], GoalsSlice> = (set) => ({
  // Initial UI state - Goals
  goalsViewMode: 'grid',
  goalsFilterStatus: 'all',
  goalsFilterCategory: null,
  goalsFilterTimeframe: 'all',
  goalsSortBy: 'created_at',
  goalsSortOrder: 'desc',
  goalsShowArchived: false,
  goalsSelectedGoal: null,

  // Initial UI state - Dreams
  dreamsViewMode: 'grid',
  dreamsFilterCategory: null,
  dreamsSortBy: 'created_at',
  dreamsSortOrder: 'desc',

  // UI Actions - Goals
  setGoalsViewMode: (mode) => set({ goalsViewMode: mode }),
  setGoalsFilterStatus: (status) => set({ goalsFilterStatus: status }),
  setGoalsFilterCategory: (category) => set({ goalsFilterCategory: category }),
  setGoalsFilterTimeframe: (timeframe) => set({ goalsFilterTimeframe: timeframe }),
  setGoalsSortBy: (sortBy) => set({ goalsSortBy: sortBy }),
  setGoalsSortOrder: (order) => set({ goalsSortOrder: order }),
  setGoalsShowArchived: (show) => set({ goalsShowArchived: show }),
  setGoalsSelectedGoal: (goalId) => set({ goalsSelectedGoal: goalId }),
  resetGoalsFilters: () =>
    set({
      goalsFilterStatus: 'all',
      goalsFilterCategory: null,
      goalsFilterTimeframe: 'all',
      goalsShowArchived: false,
      goalsSelectedGoal: null,
    }),

  // UI Actions - Dreams
  setDreamsViewMode: (mode) => set({ dreamsViewMode: mode }),
  setDreamsFilterCategory: (category) => set({ dreamsFilterCategory: category }),
  setDreamsSortBy: (sortBy) => set({ dreamsSortBy: sortBy }),
  setDreamsSortOrder: (order) => set({ dreamsSortOrder: order }),
  resetDreamsFilters: () =>
    set({
      dreamsFilterCategory: null,
    }),
});
