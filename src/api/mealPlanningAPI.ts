/**
 * Meal Planning API
 * CRUD operations for meal plans, planned meals, recipes, and pantry with Supabase
 */

import { supabase } from '../lib/supabase';
import type { MealPlanData, PlannedMealData, RecipeData, PantryItemData } from '../services/types';
import { apiCall, requireAuth, handleSupabaseResponse } from './apiWrapper';

// =====================================================
// MEAL PLANS CRUD OPERATIONS
// =====================================================

/**
 * Get all meal plans for the current user
 */
export async function getMealPlans(): Promise<MealPlanData[]> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const { data, error } = await supabase
        .from('meal_plans')
        .select('*, planned_meals(*)')
        .eq('user_id', user.id)
        .order('week_start_date', { ascending: false })
        .order('date', { foreignTable: 'planned_meals', ascending: true })
        .order('created_at', { foreignTable: 'planned_meals', ascending: true });

      if (error) throw error;

      return (data ?? []) as MealPlanData[];
    },
    { domain: 'MealPlanningAPI', operation: 'getMealPlans' }
  );
}

/**
 * Create a new meal plan
 */
export async function createMealPlan(
  plan: Omit<MealPlanData, 'id' | 'created_at' | 'updated_at' | 'planned_meals' | 'user_id'>
): Promise<MealPlanData> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      // Check if a plan already exists for this week
      const { data: existing } = await supabase
        .from('meal_plans')
        .select('*, planned_meals(*)')
        .eq('user_id', user.id)
        .eq('week_start_date', plan.week_start_date)
        .limit(1);

      if (existing && existing.length > 0) {
        return existing[0] as MealPlanData;
      }

      const result = await supabase
        .from('meal_plans')
        .insert({
          user_id: user.id,
          ...plan,
        })
        .select('*, planned_meals(*)')
        .single();

      const data = handleSupabaseResponse(result, 'Meal Plan');
      return data as MealPlanData;
    },
    { domain: 'MealPlanningAPI', operation: 'createMealPlan', data: { week_start_date: plan.week_start_date } }
  );
}

/**
 * Update a meal plan
 */
export async function updateMealPlan(
  id: string,
  updates: Partial<MealPlanData>
): Promise<MealPlanData> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const result = await supabase
        .from('meal_plans')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select('*, planned_meals(*)')
        .single();

      const data = handleSupabaseResponse(result, 'Meal Plan', id);
      return data as MealPlanData;
    },
    { domain: 'MealPlanningAPI', operation: 'updateMealPlan', data: { id } }
  );
}

/**
 * Delete a meal plan
 */
export async function deleteMealPlan(id: string): Promise<void> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const { error } = await supabase
        .from('meal_plans')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    { domain: 'MealPlanningAPI', operation: 'deleteMealPlan', data: { id } }
  );
}

// =====================================================
// PLANNED MEALS CRUD OPERATIONS
// =====================================================

/**
 * Create a planned meal
 */
export async function createPlannedMeal(
  meal: Omit<PlannedMealData, 'id' | 'created_at' | 'updated_at'>
): Promise<PlannedMealData> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      // Verify meal plan ownership
      const { data: plan, error: planError } = await supabase
        .from('meal_plans')
        .select('id')
        .eq('id', meal.meal_plan_id)
        .eq('user_id', user.id)
        .single();

      if (planError || !plan) throw new Error('Meal plan not found or access denied');

      const result = await supabase
        .from('planned_meals')
        .insert(meal)
        .select()
        .single();

      const data = handleSupabaseResponse(result, 'Planned Meal');
      return data as PlannedMealData;
    },
    { domain: 'MealPlanningAPI', operation: 'createPlannedMeal', data: { meal_plan_id: meal.meal_plan_id } }
  );
}

/**
 * Update a planned meal
 */
export async function updatePlannedMeal(
  id: string,
  updates: Partial<PlannedMealData>
): Promise<PlannedMealData> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const { data: item, error: itemError } = await supabase
        .from('planned_meals')
        .select('meal_plan_id')
        .eq('id', id)
        .single();

      if (itemError || !item?.meal_plan_id) {
        throw new Error('Planned meal not found');
      }

      const { data: plan, error: planError } = await supabase
        .from('meal_plans')
        .select('id')
        .eq('id', item.meal_plan_id)
        .eq('user_id', user.id)
        .single();

      if (planError || !plan) {
        throw new Error('Planned meal not found or access denied');
      }

      const result = await supabase
        .from('planned_meals')
        .update(updates)
        .eq('id', id)
        .eq('meal_plan_id', item.meal_plan_id)
        .select()
        .single();

      const data = handleSupabaseResponse(result, 'Planned Meal', id);
      return data as PlannedMealData;
    },
    { domain: 'MealPlanningAPI', operation: 'updatePlannedMeal', data: { id } }
  );
}

/**
 * Delete a planned meal
 */
export async function deletePlannedMeal(id: string): Promise<void> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const { data: item, error: itemError } = await supabase
        .from('planned_meals')
        .select('meal_plan_id')
        .eq('id', id)
        .single();

      if (itemError || !item?.meal_plan_id) {
        throw new Error('Planned meal not found');
      }

      const { data: plan, error: planError } = await supabase
        .from('meal_plans')
        .select('id')
        .eq('id', item.meal_plan_id)
        .eq('user_id', user.id)
        .single();

      if (planError || !plan) {
        throw new Error('Planned meal not found or access denied');
      }

      const { error } = await supabase
        .from('planned_meals')
        .delete()
        .eq('id', id)
        .eq('meal_plan_id', item.meal_plan_id);

      if (error) throw error;
    },
    { domain: 'MealPlanningAPI', operation: 'deletePlannedMeal', data: { id } }
  );
}

/**
 * Postpone a planned meal to backlog
 */
export async function postponePlannedMeal(
  id: string,
  reason?: string
): Promise<PlannedMealData> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      // Get the current meal to save its original date
      const { data: currentMeal } = await supabase
        .from('planned_meals')
        .select('date, original_date, meal_plan_id')
        .eq('id', id)
        .single();

      if (!currentMeal?.meal_plan_id) {
        throw new Error('Planned meal not found');
      }

      const { data: plan, error: planError } = await supabase
        .from('meal_plans')
        .select('id')
        .eq('id', currentMeal.meal_plan_id)
        .eq('user_id', user.id)
        .single();

      if (planError || !plan) {
        throw new Error('Planned meal not found or access denied');
      }

      const result = await supabase
        .from('planned_meals')
        .update({
          status: 'postponed',
          is_postponed: true,
          postponed_reason: reason,
          original_date: currentMeal?.original_date || currentMeal?.date, // Preserve original date
        })
        .eq('id', id)
        .eq('meal_plan_id', currentMeal.meal_plan_id)
        .select()
        .single();

      const data = handleSupabaseResponse(result, 'Planned Meal', id);
      return data as PlannedMealData;
    },
    { domain: 'MealPlanningAPI', operation: 'postponePlannedMeal', data: { id, reason } }
  );
}

/**
 * Reschedule a postponed meal to a new date
 */
export async function reschedulePlannedMeal(
  id: string,
  newDate: Date,
  newMealType?: string
): Promise<PlannedMealData> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const { data: item, error: itemError } = await supabase
        .from('planned_meals')
        .select('meal_plan_id')
        .eq('id', id)
        .single();

      if (itemError || !item?.meal_plan_id) {
        throw new Error('Planned meal not found');
      }

      const { data: plan, error: planError } = await supabase
        .from('meal_plans')
        .select('id')
        .eq('id', item.meal_plan_id)
        .eq('user_id', user.id)
        .single();

      if (planError || !plan) {
        throw new Error('Planned meal not found or access denied');
      }

      const dateStr = newDate.toISOString().split('T')[0];

      const updates: Partial<PlannedMealData> = {
        date: dateStr,
        status: 'planned',
        is_postponed: false,
        postponed_reason: undefined,
      };

      if (newMealType) {
        updates.meal_type = newMealType;
      }

      const result = await supabase
        .from('planned_meals')
        .update(updates)
        .eq('id', id)
        .eq('meal_plan_id', item.meal_plan_id)
        .select()
        .single();

      const data = handleSupabaseResponse(result, 'Planned Meal', id);
      return data as PlannedMealData;
    },
    { domain: 'MealPlanningAPI', operation: 'reschedulePlannedMeal', data: { id, newDate } }
  );
}

// =====================================================
// RECIPES CRUD OPERATIONS
// =====================================================

/**
 * Get all recipes for the current user
 */
export async function getRecipes(): Promise<RecipeData[]> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data ?? []) as RecipeData[];
    },
    { domain: 'MealPlanningAPI', operation: 'getRecipes' }
  );
}

/**
 * Create a new recipe
 */
export async function createRecipe(
  recipe: Omit<RecipeData, 'id' | 'created_at' | 'updated_at'>
): Promise<RecipeData> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const result = await supabase
        .from('recipes')
        .insert({
          user_id: user.id,
          ...recipe,
        })
        .select()
        .single();

      const data = handleSupabaseResponse(result, 'Recipe');
      return data as RecipeData;
    },
    { domain: 'MealPlanningAPI', operation: 'createRecipe', data: { name: recipe.name } }
  );
}

/**
 * Update a recipe
 */
export async function updateRecipe(
  id: string,
  updates: Partial<RecipeData>
): Promise<RecipeData> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const result = await supabase
        .from('recipes')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      const data = handleSupabaseResponse(result, 'Recipe', id);
      return data as RecipeData;
    },
    { domain: 'MealPlanningAPI', operation: 'updateRecipe', data: { id } }
  );
}

/**
 * Delete a recipe
 */
export async function deleteRecipe(id: string): Promise<void> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const { error } = await supabase
        .from('recipes')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    { domain: 'MealPlanningAPI', operation: 'deleteRecipe', data: { id } }
  );
}

// =====================================================
// PANTRY ITEMS CRUD OPERATIONS
// =====================================================

/**
 * Get all pantry items for the current user
 */
export async function getPantryItems(): Promise<PantryItemData[]> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const { data, error } = await supabase
        .from('pantry_items')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data ?? []) as PantryItemData[];
    },
    { domain: 'MealPlanningAPI', operation: 'getPantryItems' }
  );
}

/**
 * Create a new pantry item
 */
export async function createPantryItem(
  item: Omit<PantryItemData, 'id' | 'created_at' | 'updated_at' | 'user_id'>
): Promise<PantryItemData> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const result = await supabase
        .from('pantry_items')
        .insert({
          user_id: user.id,
          ...item,
        })
        .select()
        .single();

      const data = handleSupabaseResponse(result, 'Pantry Item');
      return data as PantryItemData;
    },
    { domain: 'MealPlanningAPI', operation: 'createPantryItem', data: { name: item.name } }
  );
}

/**
 * Update a pantry item
 */
export async function updatePantryItem(
  id: string,
  updates: Partial<PantryItemData>
): Promise<PantryItemData> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const result = await supabase
        .from('pantry_items')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      const data = handleSupabaseResponse(result, 'Pantry Item', id);
      return data as PantryItemData;
    },
    { domain: 'MealPlanningAPI', operation: 'updatePantryItem', data: { id } }
  );
}

/**
 * Delete a pantry item
 */
export async function deletePantryItem(id: string): Promise<void> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const { error } = await supabase
        .from('pantry_items')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    { domain: 'MealPlanningAPI', operation: 'deletePantryItem', data: { id } }
  );
}

// =====================================================
// MEAL SEARCH (Unified autocomplete)
// =====================================================

export interface MealSearchResult {
  id: string;
  name: string;
  type: 'recipe' | 'custom_meal' | 'food_item';
  frequency?: number; // How many times used
  lastUsed?: string; // ISO date string
  calories?: number;
  recipeId?: string; // For recipes, the actual recipe ID
}

/**
 * Search for meals across recipes, historical custom meals, and food items
 * Returns results ranked by relevance and frequency
 */
export async function searchMeals(query: string, limit: number = 10): Promise<MealSearchResult[]> {
  return apiCall(
    async () => {
      if (!query || query.trim().length < 2) {
        return [];
      }

      const user = await requireAuth();
      const searchTerm = `%${query.trim()}%`;
      const results: MealSearchResult[] = [];

      // 1. Search recipes
      const { data: recipes, error: recipesError } = await supabase
        .from('recipes')
        .select('id, name, calories_per_serving')
        .eq('user_id', user.id)
        .ilike('name', searchTerm)
        .limit(limit);

      if (recipesError) {
        console.error('Recipe search error:', recipesError);
      }

      if (recipes) {
        recipes.forEach((recipe) => {
          results.push({
            id: `recipe:${recipe.id}`,
            name: recipe.name,
            type: 'recipe',
            calories: recipe.calories_per_serving ?? undefined,
            recipeId: recipe.id,
          });
        });
      }

      // 2. Search historical custom meals from planned_meals
      // Get distinct custom meals with frequency count
      const { data: customMeals } = await supabase
        .from('planned_meals')
        .select('custom_meal, date, meal_plans!inner(user_id)')
        .eq('meal_plans.user_id', user.id)
        .not('custom_meal', 'is', null)
        .ilike('custom_meal', searchTerm)
        .order('date', { ascending: false })
        .limit(50); // Get more to calculate frequency

      if (customMeals) {
        // Aggregate by custom_meal name (case-insensitive)
        const mealMap = new Map<string, { name: string; count: number; lastUsed: string }>();
        customMeals.forEach((meal) => {
          if (!meal.custom_meal) return;
          const key = meal.custom_meal.toLowerCase();
          const existing = mealMap.get(key);
          if (existing) {
            existing.count++;
            if (meal.date > existing.lastUsed) {
              existing.lastUsed = meal.date;
            }
          } else {
            mealMap.set(key, {
              name: meal.custom_meal,
              count: 1,
              lastUsed: meal.date,
            });
          }
        });

        mealMap.forEach((item, key) => {
          // Don't add if already in results as a recipe
          if (!results.some((r) => r.name.toLowerCase() === key)) {
            results.push({
              id: `custom:${key}`,
              name: item.name,
              type: 'custom_meal',
              frequency: item.count,
              lastUsed: item.lastUsed,
            });
          }
        });
      }

      // 3. Search food items (from nutrition tracking)
      const { data: foodItems } = await supabase
        .from('food_items')
        .select('id, name, calories')
        .or(`user_id.is.null,user_id.eq.${user.id}`)
        .ilike('name', searchTerm)
        .limit(limit);

      if (foodItems) {
        foodItems.forEach((food) => {
          // Don't add if already in results
          if (!results.some((r) => r.name.toLowerCase() === food.name.toLowerCase())) {
            results.push({
              id: `food:${food.id}`,
              name: food.name,
              type: 'food_item',
              calories: food.calories,
            });
          }
        });
      }

      // Sort results: recipes first, then by frequency, then alphabetically
      results.sort((a, b) => {
        // Recipes first
        if (a.type === 'recipe' && b.type !== 'recipe') return -1;
        if (b.type === 'recipe' && a.type !== 'recipe') return 1;

        // Then by frequency (higher first)
        const freqA = a.frequency ?? 0;
        const freqB = b.frequency ?? 0;
        if (freqA !== freqB) return freqB - freqA;

        // Then alphabetically
        return a.name.localeCompare(b.name);
      });

      return results.slice(0, limit);
    },
    { domain: 'MealPlanningAPI', operation: 'searchMeals', data: { query } }
  );
}
