/**
 * Planned Meal Mutations
 * 
 * React Query hooks for planned meal CRUD operations.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as mealPlanningAPI from '@/api/mealPlanningAPI';
import type { PlannedMealData } from '@/services/types';
import { logger } from '@/services/logger';
import { mealPlanningKeys } from './keys';
import type { PlannedMeal, PlannedMealInput, PlannedMealUpdate, MealPlanWeek } from './types';
import { mapPlannedMealDataToPlannedMeal, buildPlannedMealInsertPayload, buildPlannedMealUpdatePayload } from './mappers';

/**
 * Add a planned meal to a meal plan
 */
export function useCreatePlannedMealMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ planId, meal }: { planId: string; meal: PlannedMealInput }) => {
      const payload = buildPlannedMealInsertPayload(planId, meal) as Omit<PlannedMealData, 'id' | 'created_at' | 'updated_at'>;
      const created = await mealPlanningAPI.createPlannedMeal(payload);
      return mapPlannedMealDataToPlannedMeal(created);
    },
    onMutate: async ({ planId, meal }) => {
      await queryClient.cancelQueries({ queryKey: mealPlanningKeys.mealPlansList() });
      const previousPlans = queryClient.getQueryData<MealPlanWeek[]>(mealPlanningKeys.mealPlansList());

      const optimisticId = `temp-${Date.now()}`;
      const optimisticMeal: PlannedMeal = {
        id: optimisticId,
        mealPlanId: planId,
        ...meal,
        createdAt: new Date(),
      };

      queryClient.setQueryData<MealPlanWeek[]>(mealPlanningKeys.mealPlansList(), (old) => {
        if (!old) return [];
        return old.map((plan) =>
          plan.id === planId
            ? { ...plan, meals: [...plan.meals, optimisticMeal], updatedAt: new Date() }
            : plan
        );
      });

      return { previousPlans, optimisticId };
    },
    onError: (err, _variables, context) => {
      if (context?.previousPlans) {
        queryClient.setQueryData(mealPlanningKeys.mealPlansList(), context.previousPlans);
      }
      logger.error('MealPlanning', 'Error creating planned meal', { error: err });
    },
    onSuccess: (newMeal, _variables, context) => {
      queryClient.setQueryData<MealPlanWeek[]>(mealPlanningKeys.mealPlansList(), (old) => {
        if (!old) return [];
        return old.map((plan) =>
          plan.id === newMeal.mealPlanId
            ? {
                ...plan,
                meals: context?.optimisticId
                  ? plan.meals.map((m) => (m.id === context.optimisticId ? newMeal : m))
                  : plan.meals,
                updatedAt: new Date(),
              }
            : plan
        );
      });
    },
  });
}

/**
 * Update a planned meal
 */
export function useUpdatePlannedMealMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ mealId, updates }: { mealId: string; updates: PlannedMealUpdate }) => {
      const payload = buildPlannedMealUpdatePayload(updates) as Partial<PlannedMealData>;
      await mealPlanningAPI.updatePlannedMeal(mealId, payload);
      return { mealId, updates };
    },
    onMutate: async ({ mealId, updates }) => {
      await queryClient.cancelQueries({ queryKey: mealPlanningKeys.mealPlansList() });
      const previousPlans = queryClient.getQueryData<MealPlanWeek[]>(mealPlanningKeys.mealPlansList());

      queryClient.setQueryData<MealPlanWeek[]>(mealPlanningKeys.mealPlansList(), (old) => {
        if (!old) return [];
        return old.map((plan) => ({
          ...plan,
          meals: plan.meals.map((m) => (m.id === mealId ? { ...m, ...updates } : m)),
          updatedAt: new Date(),
        }));
      });

      return { previousPlans };
    },
    onError: (err, _variables, context) => {
      if (context?.previousPlans) {
        queryClient.setQueryData(mealPlanningKeys.mealPlansList(), context.previousPlans);
      }
      logger.error('MealPlanning', 'Error updating planned meal', { error: err });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: mealPlanningKeys.mealPlansList() });
    },
  });
}

/**
 * Delete a planned meal
 */
export function useDeletePlannedMealMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (mealId: string) => {
      await mealPlanningAPI.deletePlannedMeal(mealId);
      return mealId;
    },
    onMutate: async (mealId) => {
      await queryClient.cancelQueries({ queryKey: mealPlanningKeys.mealPlansList() });
      const previousPlans = queryClient.getQueryData<MealPlanWeek[]>(mealPlanningKeys.mealPlansList());

      queryClient.setQueryData<MealPlanWeek[]>(mealPlanningKeys.mealPlansList(), (old) => {
        if (!old) return [];
        return old.map((plan) => ({
          ...plan,
          meals: plan.meals.filter((m) => m.id !== mealId),
        }));
      });

      return { previousPlans };
    },
    onError: (err, _mealId, context) => {
      if (context?.previousPlans) {
        queryClient.setQueryData(mealPlanningKeys.mealPlansList(), context.previousPlans);
      }
      logger.error('MealPlanning', 'Error deleting planned meal', { error: err });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: mealPlanningKeys.mealPlansList() });
    },
  });
}

/**
 * Postpone a planned meal to backlog
 */
export function usePostponePlannedMealMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ mealId, reason }: { mealId: string; reason?: string }) => {
      const data = await mealPlanningAPI.postponePlannedMeal(mealId, reason);
      return mapPlannedMealDataToPlannedMeal(data);
    },
    onMutate: async ({ mealId, reason }) => {
      await queryClient.cancelQueries({ queryKey: mealPlanningKeys.mealPlansList() });
      const previousPlans = queryClient.getQueryData<MealPlanWeek[]>(mealPlanningKeys.mealPlansList());

      // Optimistically update the meal status
      queryClient.setQueryData<MealPlanWeek[]>(mealPlanningKeys.mealPlansList(), (old) => {
        if (!old) return [];
        return old.map((plan) => ({
          ...plan,
          meals: plan.meals.map((m) =>
            m.id === mealId
              ? { ...m, status: 'postponed' as const, isPostponed: true, postponedReason: reason, originalDate: m.originalDate || m.date }
              : m
          ),
        }));
      });

      return { previousPlans };
    },
    onError: (err, _variables, context) => {
      if (context?.previousPlans) {
        queryClient.setQueryData(mealPlanningKeys.mealPlansList(), context.previousPlans);
      }
      logger.error('MealPlanning', 'Error postponing planned meal', { error: err });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: mealPlanningKeys.mealPlansList() });
    },
  });
}

