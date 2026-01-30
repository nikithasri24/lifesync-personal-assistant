/**
 * Meal Plan Queries and Mutations
 * 
 * React Query hooks for meal plan CRUD operations.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { startOfWeek, format as formatDate } from 'date-fns';
import * as mealPlanningAPI from '@/api/mealPlanningAPI';
import { logger } from '@/services/logger';
import { mealPlanningKeys } from './keys';
import type { MealPlanWeek, MealPlanUpdate, MergedConnectionInfo } from './types';
import {
  mapMealPlanDataToMealPlanWeek,
  buildMealPlanInsertPayload,
  buildMealPlanUpdatePayload,
  DEFAULT_MEAL_COLUMNS,
} from './mappers';

/**
 * Fetch the merged connection info for meals module.
 * Returns partnerId and connectionId if both users have merged mode enabled.
 */
export function useMergedConnectionQuery(options?: { enabled?: boolean }): ReturnType<typeof useQuery<MergedConnectionInfo | null>> {
  return useQuery({
    queryKey: mealPlanningKeys.mergedConnection(),
    queryFn: async () => {
      const result = await mealPlanningAPI.getMealsMergedConnection();
      return result;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes - merged connection doesn't change often
    enabled: options?.enabled ?? true,
  });
}

/**
 * Fetch all meal plans (lazy loaded)
 */
export function useMealPlansQuery(options?: { enabled?: boolean }): ReturnType<typeof useQuery<MealPlanWeek[]>> {
  return useQuery({
    queryKey: mealPlanningKeys.mealPlansList(),
    queryFn: async () => {
      const data = await mealPlanningAPI.getMealPlans();
      return data.map(mapMealPlanDataToMealPlanWeek);
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: options?.enabled ?? true,
  });
}

/**
 * Create a new meal plan
 */
export function useCreateMealPlanMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { weekStartDate: Date; name: string; weekStartsOn?: 0 | 1 }) => {
      const weekStart = startOfWeek(input.weekStartDate, { weekStartsOn: input.weekStartsOn ?? 0 });
      const payload = buildMealPlanInsertPayload(weekStart, input.name);
      const created = await mealPlanningAPI.createMealPlan(payload);
      return mapMealPlanDataToMealPlanWeek(created);
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: mealPlanningKeys.mealPlansList() });
      const previousPlans = queryClient.getQueryData<MealPlanWeek[]>(mealPlanningKeys.mealPlansList());

      const weekStart = startOfWeek(input.weekStartDate, { weekStartsOn: input.weekStartsOn ?? 0 });
      const optimisticPlan: MealPlanWeek = {
        id: `temp-${Date.now()}`,
        name: input.name,
        weekStartDate: weekStart,
        mealColumns: DEFAULT_MEAL_COLUMNS,
        meals: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      queryClient.setQueryData<MealPlanWeek[]>(mealPlanningKeys.mealPlansList(), (old) => {
        if (!old) return [optimisticPlan];
        return [optimisticPlan, ...old];
      });

      return { previousPlans };
    },
    onError: (err, _variables, context) => {
      if (context?.previousPlans) {
        queryClient.setQueryData(mealPlanningKeys.mealPlansList(), context.previousPlans);
      }
      logger.error('MealPlanning', 'Error creating meal plan', { error: err });
    },
    onSuccess: (newPlan) => {
      queryClient.setQueryData<MealPlanWeek[]>(mealPlanningKeys.mealPlansList(), (old) => {
        if (!old) return [newPlan];
        return old.map((p) => (p.id.startsWith('temp-') ? newPlan : p));
      });

      // Also update the week-specific cache
      const weekKey = formatDate(newPlan.weekStartDate, 'yyyy-MM-dd');
      queryClient.setQueryData(mealPlanningKeys.mealPlanForWeek(weekKey), newPlan);
    },
  });
}

/**
 * Update an existing meal plan
 */
export function useUpdateMealPlanMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ mealPlanId, updates }: { mealPlanId: string; updates: MealPlanUpdate }) => {
      const payload = buildMealPlanUpdatePayload(updates);
      const updated = await mealPlanningAPI.updateMealPlan(mealPlanId, payload);
      return mapMealPlanDataToMealPlanWeek(updated);
    },
    onMutate: async ({ mealPlanId, updates }) => {
      await queryClient.cancelQueries({ queryKey: mealPlanningKeys.mealPlansList() });
      const previousPlans = queryClient.getQueryData<MealPlanWeek[]>(mealPlanningKeys.mealPlansList());

      queryClient.setQueryData<MealPlanWeek[]>(mealPlanningKeys.mealPlansList(), (old) => {
        if (!old) return [];
        return old.map((p) =>
          p.id === mealPlanId ? { ...p, ...updates, updatedAt: new Date() } : p
        );
      });

      return { previousPlans };
    },
    onError: (err, _variables, context) => {
      if (context?.previousPlans) {
        queryClient.setQueryData(mealPlanningKeys.mealPlansList(), context.previousPlans);
      }
      logger.error('MealPlanning', 'Error updating meal plan', { error: err });
    },
    onSuccess: (updatedPlan) => {
      queryClient.setQueryData<MealPlanWeek[]>(mealPlanningKeys.mealPlansList(), (old) => {
        if (!old) return [updatedPlan];
        return old.map((p) => (p.id === updatedPlan.id ? updatedPlan : p));
      });

      // Update week-specific cache
      const weekKey = formatDate(updatedPlan.weekStartDate, 'yyyy-MM-dd');
      queryClient.setQueryData(mealPlanningKeys.mealPlanForWeek(weekKey), updatedPlan);
    },
  });
}

/**
 * Delete a meal plan
 */
export function useDeleteMealPlanMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (mealPlanId: string) => {
      await mealPlanningAPI.deleteMealPlan(mealPlanId);
      return mealPlanId;
    },
    onMutate: async (mealPlanId) => {
      await queryClient.cancelQueries({ queryKey: mealPlanningKeys.mealPlansList() });
      const previousPlans = queryClient.getQueryData<MealPlanWeek[]>(mealPlanningKeys.mealPlansList());

      queryClient.setQueryData<MealPlanWeek[]>(mealPlanningKeys.mealPlansList(), (old) => {
        if (!old) return [];
        return old.filter((p) => p.id !== mealPlanId);
      });

      return { previousPlans };
    },
    onError: (err, _mealPlanId, context) => {
      if (context?.previousPlans) {
        queryClient.setQueryData(mealPlanningKeys.mealPlansList(), context.previousPlans);
      }
      logger.error('MealPlanning', 'Error deleting meal plan', { error: err });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: mealPlanningKeys.mealPlansList() });
    },
  });
}

