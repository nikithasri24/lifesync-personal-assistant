/**
 * Meal Planning API
 * CRUD operations for meal plans, planned meals, recipes, and pantry with Supabase
 */

import { supabase } from '../lib/supabase';
import type { MealPlanData, PlannedMealData, RecipeData, PantryItemData } from '../services/types';

// =====================================================
// MEAL PLANS CRUD OPERATIONS
// =====================================================

/**
 * Get all meal plans for the current user
 */
export async function getMealPlans(): Promise<MealPlanData[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('meal_plans')
    .select('*, planned_meals(*)')
    .eq('user_id', user.id)
    .order('week_start_date', { ascending: false });

  if (error) throw error;
  return (data ?? []) as MealPlanData[];
}

/**
 * Get a single meal plan by ID
 */
export async function getMealPlan(id: string): Promise<MealPlanData> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('meal_plans')
    .select('*, planned_meals(*)')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error) throw error;
  if (!data) throw new Error('Meal plan not found');
  return data as MealPlanData;
}

/**
 * Create a new meal plan
 */
export async function createMealPlan(
  plan: Omit<MealPlanData, 'id' | 'created_at' | 'updated_at' | 'planned_meals' | 'user_id'>
): Promise<MealPlanData> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

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

  const { data, error } = await supabase
    .from('meal_plans')
    .insert({
      user_id: user.id,
      ...plan,
    })
    .select('*, planned_meals(*)')
    .single();

  if (error) throw error;
  if (!data) throw new Error('Failed to create meal plan');
  return data as MealPlanData;
}

/**
 * Update a meal plan
 */
export async function updateMealPlan(
  id: string,
  updates: Partial<MealPlanData>
): Promise<MealPlanData> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('meal_plans')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select('*, planned_meals(*)')
    .single();

  if (error) throw error;
  if (!data) throw new Error('Meal plan not found or update failed');
  return data as MealPlanData;
}

/**
 * Delete a meal plan
 */
export async function deleteMealPlan(id: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('meal_plans')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) throw error;
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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Verify meal plan ownership
  const { data: plan, error: planError } = await supabase
    .from('meal_plans')
    .select('id')
    .eq('id', meal.meal_plan_id)
    .eq('user_id', user.id)
    .single();

  if (planError || !plan) throw new Error('Meal plan not found or access denied');

  const { data, error } = await supabase
    .from('planned_meals')
    .insert(meal)
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error('Failed to create planned meal');
  return data as PlannedMealData;
}

/**
 * Update a planned meal
 */
export async function updatePlannedMeal(
  id: string,
  updates: Partial<PlannedMealData>
): Promise<PlannedMealData> {
  const { data, error } = await supabase
    .from('planned_meals')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error('Planned meal not found or update failed');
  return data as PlannedMealData;
}

/**
 * Delete a planned meal
 */
export async function deletePlannedMeal(id: string): Promise<void> {
  const { error } = await supabase
    .from('planned_meals')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// =====================================================
// RECIPES CRUD OPERATIONS
// =====================================================

/**
 * Get all recipes for the current user
 */
export async function getRecipes(): Promise<RecipeData[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as RecipeData[];
}

/**
 * Create a new recipe
 */
export async function createRecipe(
  recipe: Omit<RecipeData, 'id' | 'created_at' | 'updated_at'>
): Promise<RecipeData> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('recipes')
    .insert({
      user_id: user.id,
      ...recipe,
    })
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error('Failed to create recipe');
  return data as RecipeData;
}

/**
 * Update a recipe
 */
export async function updateRecipe(
  id: string,
  updates: Partial<RecipeData>
): Promise<RecipeData> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('recipes')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error('Recipe not found or update failed');
  return data as RecipeData;
}

/**
 * Delete a recipe
 */
export async function deleteRecipe(id: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('recipes')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) throw error;
}

// =====================================================
// PANTRY ITEMS CRUD OPERATIONS
// =====================================================

/**
 * Get all pantry items for the current user
 */
export async function getPantryItems(): Promise<PantryItemData[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('pantry_items')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as PantryItemData[];
}

/**
 * Create a new pantry item
 */
export async function createPantryItem(
  item: Omit<PantryItemData, 'id' | 'created_at' | 'updated_at' | 'user_id'>
): Promise<PantryItemData> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('pantry_items')
    .insert({
      user_id: user.id,
      ...item,
    })
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error('Failed to create pantry item');
  return data as PantryItemData;
}

/**
 * Update a pantry item
 */
export async function updatePantryItem(
  id: string,
  updates: Partial<PantryItemData>
): Promise<PantryItemData> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('pantry_items')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error('Pantry item not found or update failed');
  return data as PantryItemData;
}

/**
 * Delete a pantry item
 */
export async function deletePantryItem(id: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('pantry_items')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) throw error;
}

