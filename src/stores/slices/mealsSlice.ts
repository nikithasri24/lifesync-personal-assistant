import type { StateCreator } from 'zustand';
import type { MealPlanData, PlannedMealData } from '@/services/types';
import { apiClient } from '@/services/apiClient';

type MealPlanInput = Omit<MealPlanData, 'id' | 'created_at' | 'updated_at' | 'planned_meals' | 'user_id'>;
type PlannedMealInput = Omit<PlannedMealData, 'id' | 'created_at' | 'updated_at'>;

export interface MealsSlice {
  mealPlans: MealPlanData[];
  mealPlansLoaded: boolean;
  mealPlansLoading: boolean;
  mealPlansError: string | null;

  loadMealPlans: () => Promise<void>;
  addMealPlan: (plan: MealPlanInput) => Promise<MealPlanData>;
  updateMealPlan: (id: string, updates: Partial<MealPlanData>) => Promise<MealPlanData>;
  deleteMealPlan: (id: string) => Promise<void>;

  addPlannedMeal: (meal: PlannedMealInput) => Promise<PlannedMealData>;
  updatePlannedMeal: (id: string, updates: Partial<PlannedMealData>) => Promise<PlannedMealData>;
  deletePlannedMeal: (id: string) => Promise<void>;
  getMealPlanById: (id: string) => MealPlanData | undefined;
}

export const createMealsSlice: StateCreator<MealsSlice, [], [], MealsSlice> = (set, get) => ({
  mealPlans: [],
  mealPlansLoaded: false,
  mealPlansLoading: false,
  mealPlansError: null,

  loadMealPlans: async () => {
    if (get().mealPlansLoading) return;
    set({ mealPlansLoading: true, mealPlansError: null });
    try {
      const mealPlans = await apiClient.getMealPlans();
      set({ mealPlans, mealPlansLoaded: true, mealPlansLoading: false });
    } catch (error) {
      set({
        mealPlansError: error instanceof Error ? error.message : 'Failed to load meal plans',
        mealPlansLoading: false,
      });
      throw error;
    }
  },

  addMealPlan: async (plan) => {
    const created = await apiClient.createMealPlan(plan);
    set((state) => ({ mealPlans: [created, ...state.mealPlans] }));
    return created;
  },

  updateMealPlan: async (id, updates) => {
    const updated = await apiClient.updateMealPlan(id, updates);
    set((state) => ({
      mealPlans: state.mealPlans.map((plan) => (plan.id === id ? { ...plan, ...updated } : plan)),
    }));
    return updated;
  },

  deleteMealPlan: async (id) => {
    await apiClient.deleteMealPlan(id);
    set((state) => ({
      mealPlans: state.mealPlans.filter((plan) => plan.id !== id),
    }));
  },

  addPlannedMeal: async (meal) => {
    const created = await apiClient.createPlannedMeal(meal);
    set((state) => {
      const planId = created.meal_plan_id;
      return {
        mealPlans: state.mealPlans.map((plan) =>
          plan.id === planId
            ? { ...plan, planned_meals: plan.planned_meals ? [created, ...plan.planned_meals] : [created] }
            : plan
        ),
      };
    });
    return created;
  },

  updatePlannedMeal: async (id, updates) => {
    const updated = await apiClient.updatePlannedMeal(id, updates);
    set((state) => ({
      mealPlans: state.mealPlans.map((plan) =>
        plan.planned_meals?.some((meal) => meal.id === id)
          ? {
              ...plan,
              planned_meals: plan.planned_meals?.map((meal) => (meal.id === id ? { ...meal, ...updated } : meal)),
            }
          : plan
      ),
    }));
    return updated;
  },

  deletePlannedMeal: async (id) => {
    await apiClient.deletePlannedMeal(id);
    set((state) => ({
      mealPlans: state.mealPlans.map((plan) => ({
        ...plan,
        planned_meals: plan.planned_meals?.filter((meal) => meal.id !== id),
      })),
    }));
  },

  getMealPlanById: (id) => get().mealPlans.find((plan) => plan.id === id),
});
