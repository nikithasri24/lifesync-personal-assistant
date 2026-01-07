/**
 * Life Goals Zustand Slice - UI STATE ONLY
 *
 * ⚠️ DEPRECATED: Server state removed - use React Query hooks instead
 * 
 * This slice now contains ONLY UI state (view modes, filters, etc.)
 * All server data (life goals, loading states, CRUD operations) should use React Query.
 *
 * ✅ Use React Query hooks from @/hooks/useLifeGoalsQuery.ts:
 * - useLifeGoalsQuery() - Get all life goals
 * - useLifeGoalQuery(id) - Get single life goal
 * - useCreateLifeGoalMutation() - Create life goal
 * - useUpdateLifeGoalMutation() - Update life goal
 * - useDeleteLifeGoalMutation() - Delete life goal
 * - useLifeGoalMilestonesQuery(goalId) - Get milestones for a goal
 * - useCreateMilestoneMutation() - Create milestone
 * - useUpdateMilestoneMutation() - Update milestone
 *
 * Additional React Query Features:
 * - Progress tracking hooks
 * - Vision board integration
 * - Goal templates and categories
 * - Achievement tracking
 *
 * Benefits of React Query:
 * - Better life goals data caching and synchronization
 * - Optimistic updates for progress tracking
 * - Automatic invalidation when goals change
 * - Proper separation: Server state (React Query) vs UI state (Zustand)
 */

import { type StateCreator } from 'zustand';

export interface LifeGoalsSlice {
  // UI State only - no server data!
  lifeGoalsViewMode: 'grid' | 'list' | 'timeline' | 'vision_board';
  lifeGoalsFilterCategory: string | null;
  lifeGoalsFilterStatus: 'all' | 'active' | 'completed' | 'on_hold';
  lifeGoalsFilterTimeframe: 'all' | '1_year' | '5_years' | '10_years' | 'lifetime';
  lifeGoalsSortBy: 'created_at' | 'target_date' | 'progress' | 'title';
  lifeGoalsSortOrder: 'asc' | 'desc';
  lifeGoalsShowArchived: boolean;
  lifeGoalsSelectedGoal: string | null;
  lifeGoalsShowMilestones: boolean;

  // UI Actions
  setLifeGoalsViewMode: (mode: 'grid' | 'list' | 'timeline' | 'vision_board') => void;
  setLifeGoalsFilterCategory: (category: string | null) => void;
  setLifeGoalsFilterStatus: (status: 'all' | 'active' | 'completed' | 'on_hold') => void;
  setLifeGoalsFilterTimeframe: (timeframe: 'all' | '1_year' | '5_years' | '10_years' | 'lifetime') => void;
  setLifeGoalsSortBy: (sortBy: 'created_at' | 'target_date' | 'progress' | 'title') => void;
  setLifeGoalsSortOrder: (order: 'asc' | 'desc') => void;
  setLifeGoalsShowArchived: (show: boolean) => void;
  setLifeGoalsSelectedGoal: (goalId: string | null) => void;
  setLifeGoalsShowMilestones: (show: boolean) => void;
  resetLifeGoalsFilters: () => void;
}

export const createLifeGoalsSlice: StateCreator<LifeGoalsSlice, [], [], LifeGoalsSlice> = (set) => ({
  // Initial UI state
  lifeGoalsViewMode: 'grid',
  lifeGoalsFilterCategory: null,
  lifeGoalsFilterStatus: 'all',
  lifeGoalsFilterTimeframe: 'all',
  lifeGoalsSortBy: 'created_at',
  lifeGoalsSortOrder: 'desc',
  lifeGoalsShowArchived: false,
  lifeGoalsSelectedGoal: null,
  lifeGoalsShowMilestones: true,

  // UI Actions
  setLifeGoalsViewMode: (mode) => set({ lifeGoalsViewMode: mode }),
  setLifeGoalsFilterCategory: (category) => set({ lifeGoalsFilterCategory: category }),
  setLifeGoalsFilterStatus: (status) => set({ lifeGoalsFilterStatus: status }),
  setLifeGoalsFilterTimeframe: (timeframe) => set({ lifeGoalsFilterTimeframe: timeframe }),
  setLifeGoalsSortBy: (sortBy) => set({ lifeGoalsSortBy: sortBy }),
  setLifeGoalsSortOrder: (order) => set({ lifeGoalsSortOrder: order }),
  setLifeGoalsShowArchived: (show) => set({ lifeGoalsShowArchived: show }),
  setLifeGoalsSelectedGoal: (goalId) => set({ lifeGoalsSelectedGoal: goalId }),
  setLifeGoalsShowMilestones: (show) => set({ lifeGoalsShowMilestones: show }),
  resetLifeGoalsFilters: () =>
    set({
      lifeGoalsFilterCategory: null,
      lifeGoalsFilterStatus: 'all',
      lifeGoalsFilterTimeframe: 'all',
      lifeGoalsShowArchived: false,
      lifeGoalsSelectedGoal: null,
    }),
});
