/**
 * Meal Backlog Queries and Mutations
 * 
 * React Query hooks for shared meal backlog in merged mode.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as mealPlanningAPI from '@/api/mealPlanningAPI';
import { logger } from '@/services/logger';
import { mealPlanningKeys } from './keys';
import type { MealBacklogItem, PlannedMeal } from './types';
import { mapBacklogItemFromAPI, mapPlannedMealDataToPlannedMeal } from './mappers';

/**
 * Get all backlog items for the user's merged connection.
 */
export function useBacklogQuery(
  options?: { enabled?: boolean }
): ReturnType<typeof useQuery<MealBacklogItem[]>> {
  return useQuery({
    queryKey: mealPlanningKeys.backlogList(),
    queryFn: async () => {
      const data = await mealPlanningAPI.getBacklogItems();
      return data.map(mapBacklogItemFromAPI);
    },
    enabled: options?.enabled ?? true,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Add a meal to the shared backlog.
 */
export function useAddToBacklogMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (item: {
      mealName: string;
      recipeId?: string;
      originalDate?: string;
      originalMealType?: string;
      reason?: string;
      servings?: number;
      peopleCount?: number;
    }) => {
      const data = await mealPlanningAPI.addToBacklog(item);
      return mapBacklogItemFromAPI(data);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: mealPlanningKeys.backlog() });
    },
    onError: (err) => {
      logger.error('MealPlanning', 'Error adding to backlog', { error: err });
    },
  });
}

/**
 * Remove a meal from the backlog.
 */
export function useRemoveFromBacklogMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (backlogId: string) => {
      await mealPlanningAPI.removeFromBacklog(backlogId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: mealPlanningKeys.backlog() });
    },
    onError: (err) => {
      logger.error('MealPlanning', 'Error removing from backlog', { error: err });
    },
  });
}

/**
 * Use a backlog item - creates a planned meal and removes from backlog.
 */
export function useUseBacklogItemMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      backlogId,
      planId,
      date,
      mealType,
    }: {
      backlogId: string;
      planId: string;
      date: string;
      mealType: string;
    }): Promise<PlannedMeal> => {
      const data = await mealPlanningAPI.useBacklogItem(backlogId, planId, date, mealType);
      return mapPlannedMealDataToPlannedMeal(data);
    },
    onSuccess: () => {
      // Invalidate both backlog and meal plans
      void queryClient.invalidateQueries({ queryKey: mealPlanningKeys.backlog() });
      void queryClient.invalidateQueries({ queryKey: mealPlanningKeys.mealPlans() });
    },
    onError: (err) => {
      logger.error('MealPlanning', 'Error using backlog item', { error: err });
    },
  });
}

