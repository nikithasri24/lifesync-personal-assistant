/**
 * Meal Search Query
 * 
 * React Query hook for searching meals across recipes, custom meals, and food items.
 */

import { useQuery } from '@tanstack/react-query';
import * as mealPlanningAPI from '@/api/mealPlanningAPI';
import { mealPlanningKeys } from './keys';

/**
 * Search for meals across recipes, custom meals, and food items.
 * Used for autocomplete in the meal planning grid.
 */
export function useMealSearchQuery(
  query: string,
  options?: { enabled?: boolean }
): ReturnType<typeof useQuery<mealPlanningAPI.MealSearchResult[]>> {
  return useQuery({
    queryKey: mealPlanningKeys.mealSearch(query),
    queryFn: () => mealPlanningAPI.searchMeals(query, 10),
    enabled: (options?.enabled ?? true) && query.trim().length >= 2,
    staleTime: 1000 * 60 * 5, // 5 minutes - search results don't change often
  });
}

