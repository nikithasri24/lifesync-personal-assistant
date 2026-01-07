/**
 * Meals Zustand Slice - UI STATE ONLY
 *
 * ⚠️ DEPRECATED: Server state removed - use React Query hooks instead
 * 
 * This slice now contains ONLY UI state (view modes, filters, etc.)
 * All server data (meal plans, planned meals, loading states, CRUD operations) should use React Query.
 *
 * ✅ Use React Query hooks from @/hooks/useMealPlanningQuery.ts:
 * - useMealPlansQuery() - Get all meal plans
 * - useMealPlanQuery(id) - Get single meal plan
 * - usePlannedMealsQuery(mealPlanId) - Get planned meals for a plan
 * - useCreateMealPlanMutation() - Create meal plan
 * - useUpdateMealPlanMutation() - Update meal plan
 * - useDeleteMealPlanMutation() - Delete meal plan
 * - useCreatePlannedMealMutation() - Add planned meal
 * - useUpdatePlannedMealMutation() - Update planned meal
 * - useDeletePlannedMealMutation() - Delete planned meal
 *
 * Additional React Query Features:
 * - Recipe management hooks
 * - Grocery list generation hooks
 * - Nutrition tracking hooks
 * - Meal prep scheduling hooks
 *
 * Benefits of React Query:
 * - Better meal plan caching and synchronization
 * - Optimistic updates for meal planning
 * - Automatic invalidation when meals change
 * - Proper separation: Server state (React Query) vs UI state (Zustand)
 */

import { type StateCreator } from 'zustand';

export interface MealsSlice {
  // UI State only - no server data!
  mealsViewMode: 'calendar' | 'list' | 'grid';
  mealsFilterDateRange: { start: string; end: string } | null;
  mealsFilterMealType: 'all' | 'breakfast' | 'lunch' | 'dinner' | 'snack';
  mealsFilterDietaryPreference: string | null;
  mealsShowRecipes: boolean;
  mealsSelectedMealPlan: string | null;
  mealsSelectedDate: string | null;

  // UI Actions
  setMealsViewMode: (mode: 'calendar' | 'list' | 'grid') => void;
  setMealsFilterDateRange: (range: { start: string; end: string } | null) => void;
  setMealsFilterMealType: (type: 'all' | 'breakfast' | 'lunch' | 'dinner' | 'snack') => void;
  setMealsFilterDietaryPreference: (preference: string | null) => void;
  setMealsShowRecipes: (show: boolean) => void;
  setMealsSelectedMealPlan: (planId: string | null) => void;
  setMealsSelectedDate: (date: string | null) => void;
  resetMealsFilters: () => void;
}

export const createMealsSlice: StateCreator<MealsSlice, [], [], MealsSlice> = (set) => ({
  // Initial UI state
  mealsViewMode: 'calendar',
  mealsFilterDateRange: null,
  mealsFilterMealType: 'all',
  mealsFilterDietaryPreference: null,
  mealsShowRecipes: false,
  mealsSelectedMealPlan: null,
  mealsSelectedDate: null,

  // UI Actions
  setMealsViewMode: (mode) => set({ mealsViewMode: mode }),
  setMealsFilterDateRange: (range) => set({ mealsFilterDateRange: range }),
  setMealsFilterMealType: (type) => set({ mealsFilterMealType: type }),
  setMealsFilterDietaryPreference: (preference) => set({ mealsFilterDietaryPreference: preference }),
  setMealsShowRecipes: (show) => set({ mealsShowRecipes: show }),
  setMealsSelectedMealPlan: (planId) => set({ mealsSelectedMealPlan: planId }),
  setMealsSelectedDate: (date) => set({ mealsSelectedDate: date }),
  resetMealsFilters: () =>
    set({
      mealsFilterDateRange: null,
      mealsFilterMealType: 'all',
      mealsFilterDietaryPreference: null,
      mealsShowRecipes: false,
      mealsSelectedMealPlan: null,
      mealsSelectedDate: null,
    }),
});
