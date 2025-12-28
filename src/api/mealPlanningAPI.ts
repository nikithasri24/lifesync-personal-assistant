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
        .order('week_start_date', { ascending: false });

      if (error) throw error;
      return (data ?? []) as MealPlanData[];
    },
    { domain: 'MealPlanningAPI', operation: 'getMealPlans' }
  );
}

/**
 * Get a single meal plan by ID
 */
export async function getMealPlan(id: string): Promise<MealPlanData> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const result = await supabase
        .from('meal_plans')
        .select('*, planned_meals(*)')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      const data = handleSupabaseResponse(result, 'Meal Plan', id);
      return data as MealPlanData;
    },
    { domain: 'MealPlanningAPI', operation: 'getMealPlan', data: { id } }
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
      const result = await supabase
        .from('planned_meals')
        .update(updates)
        .eq('id', id)
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
      const { error } = await supabase
        .from('planned_meals')
        .delete()
        .eq('id', id);

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
      // Get the current meal to save its original date
      const { data: currentMeal } = await supabase
        .from('planned_meals')
        .select('date, original_date')
        .eq('id', id)
        .single();

      const result = await supabase
        .from('planned_meals')
        .update({
          status: 'postponed',
          is_postponed: true,
          postponed_reason: reason,
          original_date: currentMeal?.original_date || currentMeal?.date, // Preserve original date
        })
        .eq('id', id)
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

