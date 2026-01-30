/**
 * Meal Planning Query Keys
 * 
 * Centralized query key factory for React Query cache management.
 * Enables precise cache invalidation after mutations.
 */

export const mealPlanningKeys = {
  all: ['mealPlanning'] as const,

  // Recipes
  recipes: () => [...mealPlanningKeys.all, 'recipes'] as const,
  recipesList: () => [...mealPlanningKeys.recipes(), 'list'] as const,
  recipeDetail: (id: string) => [...mealPlanningKeys.recipes(), 'detail', id] as const,

  // Meal Plans
  mealPlans: () => [...mealPlanningKeys.all, 'mealPlans'] as const,
  mealPlansList: () => [...mealPlanningKeys.mealPlans(), 'list'] as const,
  mealPlanDetail: (id: string) => [...mealPlanningKeys.mealPlans(), 'detail', id] as const,
  mealPlanForWeek: (weekStart: string) => [...mealPlanningKeys.mealPlans(), 'week', weekStart] as const,

  // Pantry
  pantry: () => [...mealPlanningKeys.all, 'pantry'] as const,
  pantryList: () => [...mealPlanningKeys.pantry(), 'list'] as const,

  // Meal Search
  mealSearch: (query: string) => [...mealPlanningKeys.all, 'search', query] as const,

  // Merged connection info (for merged mode)
  mergedConnection: () => [...mealPlanningKeys.all, 'mergedConnection'] as const,

  // Personal meal tracking (for merged mode)
  mealTracking: () => [...mealPlanningKeys.all, 'mealTracking'] as const,
  mealTrackingForMeals: (mealIds: string[]) => 
    [...mealPlanningKeys.mealTracking(), 'forMeals', mealIds.sort().join(',')] as const,
  partnerMealTracking: () => [...mealPlanningKeys.all, 'partnerMealTracking'] as const,
  partnerMealTrackingForMeals: (mealIds: string[], partnerId: string) =>
    [...mealPlanningKeys.partnerMealTracking(), 'forMeals', partnerId, mealIds.sort().join(',')] as const,

  // Shared meal backlog (for merged mode)
  backlog: () => [...mealPlanningKeys.all, 'backlog'] as const,
  backlogList: () => [...mealPlanningKeys.backlog(), 'list'] as const,
};

