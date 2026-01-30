/**
 * Meal Tracking Queries and Mutations
 * 
 * React Query hooks for personal meal tracking in merged mode.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as mealPlanningAPI from '@/api/mealPlanningAPI';
import type { MealTrackingStatus } from '@/services/types';
import { logger } from '@/services/logger';
import { mealPlanningKeys } from './keys';
import type { MealTracking } from './types';
import { mapMealTrackingFromAPI, filterValidMealIds } from './mappers';

/**
 * Get meal tracking records for a list of planned meals.
 * Returns a map of plannedMealId -> MealTracking for easy lookup.
 */
export function useMealTrackingQuery(
  plannedMealIds: string[],
  options?: { enabled?: boolean }
): ReturnType<typeof useQuery<Map<string, MealTracking>>> {
  // Filter out temporary IDs that haven't been persisted yet
  const validIds = filterValidMealIds(plannedMealIds);

  return useQuery({
    queryKey: mealPlanningKeys.mealTrackingForMeals(validIds),
    queryFn: async () => {
      if (validIds.length === 0) return new Map<string, MealTracking>();
      const data = await mealPlanningAPI.getMealTracking(validIds);
      const map = new Map<string, MealTracking>();
      for (const item of data) {
        map.set(item.planned_meal_id, mapMealTrackingFromAPI(item));
      }
      return map;
    },
    enabled: (options?.enabled ?? true) && validIds.length > 0,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

/**
 * Get partner's meal tracking records for a list of planned meals.
 * Used in merged mode to show what the partner ate.
 */
export function usePartnerMealTrackingQuery(
  plannedMealIds: string[],
  partnerId: string | undefined,
  options?: { enabled?: boolean }
): ReturnType<typeof useQuery<Map<string, MealTracking>>> {
  // Filter out temporary IDs that haven't been persisted yet
  const validIds = filterValidMealIds(plannedMealIds);

  return useQuery({
    queryKey: mealPlanningKeys.partnerMealTrackingForMeals(validIds, partnerId ?? ''),
    queryFn: async () => {
      if (!partnerId || validIds.length === 0) return new Map<string, MealTracking>();
      const data = await mealPlanningAPI.getPartnerMealTracking(validIds, partnerId);
      const map = new Map<string, MealTracking>();
      for (const item of data) {
        map.set(item.planned_meal_id, mapMealTrackingFromAPI(item));
      }
      return map;
    },
    enabled: (options?.enabled ?? true) && validIds.length > 0 && !!partnerId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

/**
 * Track a meal (mark as eaten, skipped, or swapped).
 */
export function useTrackMealMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      plannedMealId,
      status,
      swappedMeal,
      swappedRecipeId,
      servingsConsumed,
      caloriesConsumed,
      notes,
    }: {
      plannedMealId: string;
      status: MealTrackingStatus;
      swappedMeal?: string;
      swappedRecipeId?: string;
      servingsConsumed?: number;
      caloriesConsumed?: number;
      notes?: string;
    }) => {
      const data = await mealPlanningAPI.trackMeal(plannedMealId, {
        status,
        swappedMeal,
        swappedRecipeId,
        servingsConsumed,
        caloriesConsumed,
        notes,
      });
      return mapMealTrackingFromAPI(data);
    },
    onSuccess: () => {
      // Invalidate all meal tracking queries
      void queryClient.invalidateQueries({ queryKey: mealPlanningKeys.mealTracking() });
    },
    onError: (err) => {
      logger.error('MealPlanning', 'Error tracking meal', { error: err });
    },
  });
}

/**
 * Delete a meal tracking record (reset to untracked state).
 */
export function useDeleteMealTrackingMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (trackingId: string) => {
      await mealPlanningAPI.deleteMealTracking(trackingId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: mealPlanningKeys.mealTracking() });
    },
    onError: (err) => {
      logger.error('MealPlanning', 'Error deleting meal tracking', { error: err });
    },
  });
}

