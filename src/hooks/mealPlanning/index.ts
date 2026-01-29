/**
 * Meal Planning Hooks - Barrel Export
 * 
 * Re-exports all meal planning React Query hooks and types.
 * Import from this file for convenience:
 * 
 *   import { useRecipesQuery, Recipe } from '@/hooks/mealPlanning';
 */

// Query Keys
export { mealPlanningKeys } from './keys';

// Types
export type {
  Recipe,
  MealColumn,
  PlannedMeal,
  MealPlanWeek,
  MealTracking,
  MealBacklogItem,
  MergedConnectionInfo,
  RecipeInput,
  RecipeUpdate,
  MealPlanInput,
  MealPlanUpdate,
  PlannedMealInput,
  PlannedMealUpdate,
  PantryItemInput,
  PantryItemUpdate,
  PantryItem,
  MealTrackingStatus,
} from './types';

// Mappers and utilities
export {
  DEFAULT_MEAL_COLUMNS,
  toDate,
  sanitize,
  normalisePantryCategory,
  normaliseMealColumns,
  serializeMealColumns,
  filterValidMealIds,
  mapRecipeDataToRecipe,
  mapPlannedMealDataToPlannedMeal,
  mapMealPlanDataToMealPlanWeek,
  mapPantryItemDataToPantryItem,
  mapMealTrackingFromAPI,
  mapBacklogItemFromAPI,
  buildRecipeInsertPayload,
  buildRecipeUpdatePayload,
  buildMealPlanInsertPayload,
  buildMealPlanUpdatePayload,
  buildPlannedMealInsertPayload,
  buildPlannedMealUpdatePayload,
  buildPantryItemInsertPayload,
  buildPantryItemUpdatePayload,
} from './mappers';

// Recipe hooks
export {
  useRecipesQuery,
  useCreateRecipeMutation,
  useUpdateRecipeMutation,
  useDeleteRecipeMutation,
  useDeleteAllRecipesMutation,
} from './useRecipeQueries';

// Meal Plan hooks
export {
  useMergedConnectionQuery,
  useMealPlansQuery,
  useCreateMealPlanMutation,
  useUpdateMealPlanMutation,
  useDeleteMealPlanMutation,
} from './useMealPlanQueries';

// Planned Meal hooks
export {
  useCreatePlannedMealMutation,
  useUpdatePlannedMealMutation,
  useDeletePlannedMealMutation,
  usePostponePlannedMealMutation,
} from './usePlannedMealQueries';

// Pantry hooks
export {
  usePantryItemsQuery,
  useCreatePantryItemMutation,
  useUpdatePantryItemMutation,
  useDeletePantryItemMutation,
} from './usePantryQueries';

// Meal Tracking hooks
export {
  useMealTrackingQuery,
  usePartnerMealTrackingQuery,
  useTrackMealMutation,
  useDeleteMealTrackingMutation,
} from './useTrackingQueries';

// Backlog hooks
export {
  useBacklogQuery,
  useAddToBacklogMutation,
  useRemoveFromBacklogMutation,
  useUseBacklogItemMutation,
} from './useBacklogQueries';

// Search hooks
export { useMealSearchQuery } from './useMealSearchQuery';

