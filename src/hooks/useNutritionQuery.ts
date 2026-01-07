/**
 * React Query hooks for Nutrition Tracking
 *
 * Provides automatic caching, loading states, and cache invalidation
 * for food tracking and nutrition goals.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import { queryOptions } from '@/lib/react-query';
import {
  searchFoods,
  createFoodItem,
  logFood,
  getDailyLog,
  deleteLogEntry,
  getActiveGoal,
  setNutritionGoal,
  type FoodItem,
  type FoodLogEntry,
  type NutritionGoal,
  type LogFoodInput,
} from '@/api/nutritionAPI';
import { logger } from '@/services/logger';

// ==================== Query Keys ====================

export const nutritionKeys = {
  all: ['nutrition'] as const,
  foods: () => [...nutritionKeys.all, 'foods'] as const,
  foodSearch: (query: string) => [...nutritionKeys.all, 'foods', 'search', query] as const,
  log: () => [...nutritionKeys.all, 'log'] as const,
  dailyLog: (date: string) => [...nutritionKeys.all, 'log', date] as const,
  goal: () => [...nutritionKeys.all, 'goal'] as const,
};

// ==================== Food Search Hooks ====================

export function useFoodSearchQuery(
  query: string,
  options?: { enabled?: boolean }
): UseQueryResult<FoodItem[], Error> {
  return useQuery({
    queryKey: nutritionKeys.foodSearch(query),
    queryFn: () => searchFoods(query),
    enabled: options?.enabled !== false && query.length >= 2,
    staleTime: queryOptions.user.staleTime,
  });
}

// ==================== Food Log Hooks ====================

export function useDailyLogQuery(date: string): UseQueryResult<FoodLogEntry[], Error> {
  return useQuery({
    queryKey: nutritionKeys.dailyLog(date),
    queryFn: () => getDailyLog(date),
    staleTime: queryOptions.realtime.staleTime,
  });
}

export function useLogFoodMutation(): UseMutationResult<FoodLogEntry, Error, LogFoodInput> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logFood,
    onSuccess: (data) => {
      // Invalidate the daily log for the logged date
      queryClient.invalidateQueries({ queryKey: nutritionKeys.dailyLog(data.logged_date) });
      queryClient.invalidateQueries({ queryKey: nutritionKeys.log() });
      logger.info('NutritionQuery', 'Food logged successfully', { id: data.id });
    },
    onError: (error) => {
      logger.error('NutritionQuery', 'Failed to log food', { error });
    },
  });
}

export function useDeleteLogEntryMutation(): UseMutationResult<void, Error, { id: string; date: string }> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }) => deleteLogEntry(id),
    onSuccess: (_, { date }) => {
      queryClient.invalidateQueries({ queryKey: nutritionKeys.dailyLog(date) });
      queryClient.invalidateQueries({ queryKey: nutritionKeys.log() });
      logger.info('NutritionQuery', 'Log entry deleted');
    },
    onError: (error) => {
      logger.error('NutritionQuery', 'Failed to delete log entry', { error });
    },
  });
}

// ==================== Custom Food Hooks ====================

export function useCreateFoodItemMutation(): UseMutationResult<
  FoodItem,
  Error,
  Omit<FoodItem, 'id' | 'user_id' | 'is_custom' | 'created_at'>
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createFoodItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: nutritionKeys.foods() });
      logger.info('NutritionQuery', 'Custom food item created');
    },
    onError: (error) => {
      logger.error('NutritionQuery', 'Failed to create food item', { error });
    },
  });
}

// ==================== Nutrition Goal Hooks ====================

export function useNutritionGoalQuery(): UseQueryResult<NutritionGoal | null, Error> {
  return useQuery({
    queryKey: nutritionKeys.goal(),
    queryFn: getActiveGoal,
    staleTime: queryOptions.static.staleTime,
  });
}

export function useSetNutritionGoalMutation(): UseMutationResult<
  NutritionGoal,
  Error,
  Parameters<typeof setNutritionGoal>[0]
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: setNutritionGoal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: nutritionKeys.goal() });
      logger.info('NutritionQuery', 'Nutrition goal updated');
    },
    onError: (error) => {
      logger.error('NutritionQuery', 'Failed to set nutrition goal', { error });
    },
  });
}

// Re-export types for convenience
export type { FoodItem, FoodLogEntry, NutritionGoal, LogFoodInput };

