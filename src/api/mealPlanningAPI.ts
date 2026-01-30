/**
 * Meal Planning API
 * CRUD operations for meal plans, planned meals, recipes, and pantry with Supabase
 *
 * Supports "merged" mode where connected users share the same meal plans.
 * When both users set meals to "merged", they see and edit the same data.
 */

import { supabase } from '../lib/supabase';
import type { MealPlanData, PlannedMealData, RecipeData, PantryItemData, MealBacklogData, MealTrackingData } from '../services/types';
import { apiCall, requireAuth, handleSupabaseResponse } from './apiWrapper';
import { getMergedConnectionId, type MergedConnectionResult } from '../shared/api/SharedDataProvider';
import {
  RecipeDataArraySchema,
  MealPlanDataArraySchema,
  PantryItemDataArraySchema,
  MealTrackingDataArraySchema,
  MealBacklogDataArraySchema,
  validateArrayWithFilter,
} from '../schemas/mealPlanning';

// Cache for merged connection to avoid repeated checks within same session
let cachedMergedConnection: MergedConnectionResult | null | undefined = undefined;

/**
 * Get the merged connection ID for meals if both users have enabled merged mode.
 * Results are cached for the session to avoid repeated database calls.
 */
export async function getMealsMergedConnection(): Promise<MergedConnectionResult | null> {
  if (cachedMergedConnection !== undefined) {
    console.log('[MealPlanningAPI] Using cached merged connection:', cachedMergedConnection);
    return cachedMergedConnection;
  }
  cachedMergedConnection = await getMergedConnectionId('meals');
  console.log('[MealPlanningAPI] Fetched merged connection:', cachedMergedConnection);
  return cachedMergedConnection;
}

/**
 * Clear the cached merged connection (call when permissions change)
 */
export function clearMergedConnectionCache(): void {
  cachedMergedConnection = undefined;
}

// =====================================================
// MEAL PLANS CRUD OPERATIONS
// =====================================================

/**
 * Check and migrate personal meals to shared plans if needed.
 * This handles the case where shared plans already exist but are empty.
 */
async function checkAndMigratePersonalMeals(
  sharedPlans: MealPlanData[],
  userId: string,
  mergedConnection: MergedConnectionResult
): Promise<MealPlanData[]> {
  // Find shared plans that are empty (no planned_meals)
  const emptySharedPlans = sharedPlans.filter(
    plan => !plan.planned_meals || plan.planned_meals.length === 0
  );

  if (emptySharedPlans.length === 0) {
    return sharedPlans; // All plans have meals, nothing to migrate
  }

  console.log('[MealPlanningAPI] Found', emptySharedPlans.length, 'empty shared plans, checking for personal meals to migrate');

  let needsRefetch = false;

  for (const sharedPlan of emptySharedPlans) {
    console.log('[MealPlanningAPI] Checking for personal plans for week:', sharedPlan.week_start_date);
    console.log('[MealPlanningAPI] Looking for plans from users:', userId, 'or', mergedConnection.partnerId);

    // Check if there are personal plans for this week from either user
    const { data: personalPlans, error: personalPlansError } = await supabase
      .from('meal_plans')
      .select('id, user_id, planned_meals(*)')
      .eq('week_start_date', sharedPlan.week_start_date)
      .in('user_id', [userId, mergedConnection.partnerId]);

    console.log('[MealPlanningAPI] Personal plans query result:', personalPlans, 'error:', personalPlansError);

    if (!personalPlans || personalPlans.length === 0) {
      console.log('[MealPlanningAPI] No personal plans found for week:', sharedPlan.week_start_date);
      continue; // No personal plans for this week
    }

    console.log('[MealPlanningAPI] Found', personalPlans.length, 'personal plans for week:', sharedPlan.week_start_date);

    // Collect meals from personal plans
    const mealsToMigrate: Array<{
      meal_plan_id: string;
      date: string;
      meal_type: string;
      recipe_id?: string;
      custom_meal?: string;
      servings?: number;
      people_count?: number;
      status?: string;
      notes?: string;
    }> = [];

    for (const personalPlan of personalPlans) {
      const meals = personalPlan.planned_meals as Array<{
        date: string;
        meal_type: string;
        recipe_id?: string;
        custom_meal?: string;
        servings?: number;
        people_count?: number;
        status?: string;
        notes?: string;
      }> | null;

      if (meals && meals.length > 0) {
        for (const meal of meals) {
          mealsToMigrate.push({
            meal_plan_id: sharedPlan.id!,
            date: meal.date,
            meal_type: meal.meal_type,
            recipe_id: meal.recipe_id,
            custom_meal: meal.custom_meal,
            servings: meal.servings,
            people_count: meal.people_count,
            status: meal.status,
            notes: meal.notes,
          });
        }
      }
    }

    if (mealsToMigrate.length > 0) {
      console.log('[MealPlanningAPI] Migrating', mealsToMigrate.length, 'meals to shared plan for week:', sharedPlan.week_start_date);

      const { error: insertError } = await supabase
        .from('planned_meals')
        .insert(mealsToMigrate);

      if (insertError) {
        console.error('[MealPlanningAPI] Error migrating meals:', insertError);
        continue;
      }

      // Delete old personal plans
      const personalPlanIds = personalPlans.map(p => p.id);
      await supabase
        .from('meal_plans')
        .delete()
        .in('id', personalPlanIds);

      console.log('[MealPlanningAPI] Migration complete for week:', sharedPlan.week_start_date);
      needsRefetch = true;
    }
  }

  // If we migrated anything, refetch the shared plans to get updated data
  if (needsRefetch) {
    const { data: updatedPlans } = await supabase
      .from('meal_plans')
      .select('*, planned_meals(*)')
      .eq('connection_id', mergedConnection.connectionId)
      .order('week_start_date', { ascending: false })
      .order('date', { foreignTable: 'planned_meals', ascending: true })
      .order('created_at', { foreignTable: 'planned_meals', ascending: true });

    return (updatedPlans ?? sharedPlans) as MealPlanData[];
  }

  return sharedPlans;
}

/**
 * Get all meal plans for the current user.
 * If merged mode is enabled with a partner, returns shared plans instead.
 * Also handles migration of personal meals to shared plans.
 * Validates API responses with Zod schemas.
 */
export async function getMealPlans(): Promise<MealPlanData[]> {
  return apiCall(
    async () => {
      const user = await requireAuth();
      const mergedConnection = await getMealsMergedConnection();

      console.log('[MealPlanningAPI] getMealPlans - user:', user.id, 'mergedConnection:', mergedConnection);

      if (mergedConnection) {
        // Merged mode: fetch plans by connection_id
        console.log('[MealPlanningAPI] Fetching MERGED plans for connection:', mergedConnection.connectionId);
        const { data, error } = await supabase
          .from('meal_plans')
          .select('*, planned_meals(*)')
          .eq('connection_id', mergedConnection.connectionId)
          .order('week_start_date', { ascending: false })
          .order('date', { foreignTable: 'planned_meals', ascending: true })
          .order('created_at', { foreignTable: 'planned_meals', ascending: true });

        if (error) throw error;
        console.log('[MealPlanningAPI] MERGED plans found:', data?.length ?? 0, data);

        // Validate API response
        const validated = validateArrayWithFilter<MealPlanData>(MealPlanDataArraySchema.element, data ?? [], 'getMealPlans (merged)');

        // Check if we need to migrate personal meals to shared plans
        const migratedPlans = await checkAndMigratePersonalMeals(validated, user.id, mergedConnection);

        return migratedPlans;
      }

      // Normal mode: fetch plans by user_id
      console.log('[MealPlanningAPI] Fetching PERSONAL plans for user:', user.id);
      const { data, error } = await supabase
        .from('meal_plans')
        .select('*, planned_meals(*)')
        .eq('user_id', user.id)
        .order('week_start_date', { ascending: false })
        .order('date', { foreignTable: 'planned_meals', ascending: true })
        .order('created_at', { foreignTable: 'planned_meals', ascending: true });

      if (error) throw error;
      console.log('[MealPlanningAPI] PERSONAL plans found:', data?.length ?? 0, data);

      // Validate API response
      return validateArrayWithFilter<MealPlanData>(MealPlanDataArraySchema.element, data ?? [], 'getMealPlans (personal)');
    },
    { domain: 'MealPlanningAPI', operation: 'getMealPlans' }
  );
}

/**
 * Migrate meals from personal plans to a shared plan.
 * Called when merged mode is first enabled and a shared plan is created.
 */
async function migratePersonalMealsToSharedPlan(
  sharedPlanId: string,
  weekStartDate: string,
  userId: string,
  partnerId: string
): Promise<void> {
  console.log('[MealPlanningAPI] Migrating personal meals to shared plan:', sharedPlanId);

  // Find personal plans for this week from both users
  const { data: personalPlans } = await supabase
    .from('meal_plans')
    .select('id, user_id, planned_meals(*)')
    .eq('week_start_date', weekStartDate)
    .in('user_id', [userId, partnerId]);

  if (!personalPlans || personalPlans.length === 0) {
    console.log('[MealPlanningAPI] No personal plans to migrate');
    return;
  }

  console.log('[MealPlanningAPI] Found', personalPlans.length, 'personal plans to migrate');

  // Collect all meals from personal plans
  const mealsToMigrate: Array<{
    date: string;
    meal_type: string;
    recipe_id?: string;
    custom_meal?: string;
    servings?: number;
    people_count?: number;
    status?: string;
    notes?: string;
  }> = [];

  for (const personalPlan of personalPlans) {
    const meals = personalPlan.planned_meals as Array<{
      date: string;
      meal_type: string;
      recipe_id?: string;
      custom_meal?: string;
      servings?: number;
      people_count?: number;
      status?: string;
      notes?: string;
    }> | null;

    if (meals && meals.length > 0) {
      for (const meal of meals) {
        mealsToMigrate.push({
          date: meal.date,
          meal_type: meal.meal_type,
          recipe_id: meal.recipe_id,
          custom_meal: meal.custom_meal,
          servings: meal.servings,
          people_count: meal.people_count,
          status: meal.status,
          notes: meal.notes,
        });
      }
    }
  }

  if (mealsToMigrate.length === 0) {
    console.log('[MealPlanningAPI] No meals to migrate');
    return;
  }

  console.log('[MealPlanningAPI] Migrating', mealsToMigrate.length, 'meals');

  // Insert meals into the shared plan
  const mealsWithPlanId = mealsToMigrate.map(meal => ({
    ...meal,
    meal_plan_id: sharedPlanId,
  }));

  const { error: insertError } = await supabase
    .from('planned_meals')
    .insert(mealsWithPlanId);

  if (insertError) {
    console.error('[MealPlanningAPI] Error migrating meals:', insertError);
    return;
  }

  console.log('[MealPlanningAPI] Successfully migrated meals');

  // Optionally: Delete the old personal plans (or keep them as archive)
  // For now, we'll delete them to avoid confusion
  const personalPlanIds = personalPlans.map(p => p.id);
  const { error: deleteError } = await supabase
    .from('meal_plans')
    .delete()
    .in('id', personalPlanIds);

  if (deleteError) {
    console.error('[MealPlanningAPI] Error deleting old personal plans:', deleteError);
  } else {
    console.log('[MealPlanningAPI] Deleted old personal plans');
  }
}

/**
 * Create a new meal plan.
 * If merged mode is enabled, creates a shared plan owned by the connection.
 * Also migrates existing personal meals to the shared plan.
 */
export async function createMealPlan(
  plan: Omit<MealPlanData, 'id' | 'created_at' | 'updated_at' | 'planned_meals' | 'user_id'>
): Promise<MealPlanData> {
  return apiCall(
    async () => {
      const user = await requireAuth();
      const mergedConnection = await getMealsMergedConnection();

      if (mergedConnection) {
        // Merged mode: check if a shared plan already exists for this week
        const { data: existing } = await supabase
          .from('meal_plans')
          .select('*, planned_meals(*)')
          .eq('connection_id', mergedConnection.connectionId)
          .eq('week_start_date', plan.week_start_date)
          .limit(1);

        if (existing && existing.length > 0) {
          return existing[0] as MealPlanData;
        }

        // Create shared plan with connection_id (no user_id)
        const result = await supabase
          .from('meal_plans')
          .insert({
            connection_id: mergedConnection.connectionId,
            ...plan,
          })
          .select('*, planned_meals(*)')
          .single();

        const data = handleSupabaseResponse(result, 'Meal Plan');
        const sharedPlan = data as MealPlanData;

        // Migrate existing personal meals to the shared plan
        await migratePersonalMealsToSharedPlan(
          sharedPlan.id!,
          plan.week_start_date,
          user.id,
          mergedConnection.partnerId
        );

        // Re-fetch the plan to include migrated meals
        const { data: updatedPlan } = await supabase
          .from('meal_plans')
          .select('*, planned_meals(*)')
          .eq('id', sharedPlan.id)
          .single();

        return (updatedPlan ?? sharedPlan) as MealPlanData;
      }

      // Normal mode: check if a personal plan already exists for this week
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
 * Update a meal plan.
 * Handles both personal plans (by user_id) and shared plans (by connection_id).
 */
export async function updateMealPlan(
  id: string,
  updates: Partial<MealPlanData>
): Promise<MealPlanData> {
  return apiCall(
    async () => {
      const user = await requireAuth();
      const mergedConnection = await getMealsMergedConnection();

      // First, try to find the plan to determine its type
      const { data: existingPlan } = await supabase
        .from('meal_plans')
        .select('id, user_id, connection_id')
        .eq('id', id)
        .single();

      if (!existingPlan) {
        throw new Error('Meal plan not found');
      }

      // Verify access
      if (existingPlan.connection_id) {
        // Shared plan - verify connection access
        if (!mergedConnection || existingPlan.connection_id !== mergedConnection.connectionId) {
          throw new Error('Access denied to shared meal plan');
        }
      } else if (existingPlan.user_id !== user.id) {
        throw new Error('Access denied to meal plan');
      }

      // Update the plan (RLS will also verify access)
      const result = await supabase
        .from('meal_plans')
        .update(updates)
        .eq('id', id)
        .select('*, planned_meals(*)')
        .single();

      const data = handleSupabaseResponse(result, 'Meal Plan', id);
      return data as MealPlanData;
    },
    { domain: 'MealPlanningAPI', operation: 'updateMealPlan', data: { id } }
  );
}

/**
 * Delete a meal plan.
 * Handles both personal plans and shared plans.
 */
export async function deleteMealPlan(id: string): Promise<void> {
  return apiCall(
    async () => {
      const user = await requireAuth();
      const mergedConnection = await getMealsMergedConnection();

      // First, verify access
      const { data: existingPlan } = await supabase
        .from('meal_plans')
        .select('id, user_id, connection_id')
        .eq('id', id)
        .single();

      if (!existingPlan) {
        throw new Error('Meal plan not found');
      }

      if (existingPlan.connection_id) {
        if (!mergedConnection || existingPlan.connection_id !== mergedConnection.connectionId) {
          throw new Error('Access denied to shared meal plan');
        }
      } else if (existingPlan.user_id !== user.id) {
        throw new Error('Access denied to meal plan');
      }

      // Delete the plan (RLS will also verify access)
      const { error } = await supabase
        .from('meal_plans')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    { domain: 'MealPlanningAPI', operation: 'deleteMealPlan', data: { id } }
  );
}

// =====================================================
// PLANNED MEALS CRUD OPERATIONS
// =====================================================

/**
 * Helper to verify access to a meal plan.
 * Returns true if user has access (either owner or merged connection).
 */
async function verifyMealPlanAccess(
  mealPlanId: string,
  userId: string,
  mergedConnection: MergedConnectionResult | null
): Promise<boolean> {
  const { data: plan } = await supabase
    .from('meal_plans')
    .select('id, user_id, connection_id')
    .eq('id', mealPlanId)
    .single();

  if (!plan) return false;

  // Check if it's a personal plan owned by the user
  if (plan.user_id === userId) return true;

  // Check if it's a shared plan via merged connection
  if (plan.connection_id && mergedConnection && plan.connection_id === mergedConnection.connectionId) {
    return true;
  }

  return false;
}

/**
 * Create a planned meal.
 * Works with both personal and shared meal plans.
 */
export async function createPlannedMeal(
  meal: Omit<PlannedMealData, 'id' | 'created_at' | 'updated_at'>
): Promise<PlannedMealData> {
  return apiCall(
    async () => {
      const user = await requireAuth();
      const mergedConnection = await getMealsMergedConnection();

      // Verify meal plan access
      const hasAccess = await verifyMealPlanAccess(meal.meal_plan_id, user.id, mergedConnection);
      if (!hasAccess) throw new Error('Meal plan not found or access denied');

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
 * Update a planned meal.
 * Works with both personal and shared meal plans.
 */
export async function updatePlannedMeal(
  id: string,
  updates: Partial<PlannedMealData>
): Promise<PlannedMealData> {
  return apiCall(
    async () => {
      const user = await requireAuth();
      const mergedConnection = await getMealsMergedConnection();

      const { data: item, error: itemError } = await supabase
        .from('planned_meals')
        .select('meal_plan_id')
        .eq('id', id)
        .single();

      if (itemError || !item?.meal_plan_id) {
        throw new Error('Planned meal not found');
      }

      // Verify access to the parent meal plan
      const hasAccess = await verifyMealPlanAccess(item.meal_plan_id, user.id, mergedConnection);
      if (!hasAccess) {
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
 * Delete a planned meal.
 * Works with both personal and shared meal plans.
 */
export async function deletePlannedMeal(id: string): Promise<void> {
  return apiCall(
    async () => {
      const user = await requireAuth();
      const mergedConnection = await getMealsMergedConnection();

      const { data: item, error: itemError } = await supabase
        .from('planned_meals')
        .select('meal_plan_id')
        .eq('id', id)
        .single();

      if (itemError || !item?.meal_plan_id) {
        throw new Error('Planned meal not found');
      }

      // Verify access to the parent meal plan
      const hasAccess = await verifyMealPlanAccess(item.meal_plan_id, user.id, mergedConnection);
      if (!hasAccess) {
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
 * Postpone a planned meal to backlog.
 * Works with both personal and shared meal plans.
 */
export async function postponePlannedMeal(
  id: string,
  reason?: string
): Promise<PlannedMealData> {
  return apiCall(
    async () => {
      const user = await requireAuth();
      const mergedConnection = await getMealsMergedConnection();

      // Get the current meal to save its original date
      const { data: currentMeal } = await supabase
        .from('planned_meals')
        .select('date, original_date, meal_plan_id')
        .eq('id', id)
        .single();

      if (!currentMeal?.meal_plan_id) {
        throw new Error('Planned meal not found');
      }

      // Verify access to the parent meal plan
      const hasAccess = await verifyMealPlanAccess(currentMeal.meal_plan_id, user.id, mergedConnection);
      if (!hasAccess) {
        throw new Error('Planned meal not found or access denied');
      }

      const result = await supabase
        .from('planned_meals')
        .update({
          status: 'postponed',
          is_postponed: true,
          postponed_reason: reason,
          original_date: currentMeal?.original_date || currentMeal?.date,
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
 * Reschedule a postponed meal to a new date.
 * Works with both personal and shared meal plans.
 */
export async function reschedulePlannedMeal(
  id: string,
  newDate: Date,
  newMealType?: string
): Promise<PlannedMealData> {
  return apiCall(
    async () => {
      const user = await requireAuth();
      const mergedConnection = await getMealsMergedConnection();

      const { data: item, error: itemError } = await supabase
        .from('planned_meals')
        .select('meal_plan_id')
        .eq('id', id)
        .single();

      if (itemError || !item?.meal_plan_id) {
        throw new Error('Planned meal not found');
      }

      // Verify access to the parent meal plan
      const hasAccess = await verifyMealPlanAccess(item.meal_plan_id, user.id, mergedConnection);
      if (!hasAccess) {
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
 * Check and migrate personal recipes to shared when merged mode is enabled.
 * This handles the case where users had personal recipes before enabling merged mode.
 */
async function checkAndMigratePersonalRecipes(
  sharedRecipes: RecipeData[],
  userId: string,
  mergedConnection: MergedConnectionResult
): Promise<RecipeData[]> {
  // If there are already shared recipes, no need to migrate
  if (sharedRecipes.length > 0) {
    console.log('[MealPlanningAPI] Shared recipes already exist, skipping migration');
    return sharedRecipes;
  }

  console.log('[MealPlanningAPI] No shared recipes, checking for personal recipes to migrate');
  console.log('[MealPlanningAPI] Looking for recipes from users:', userId, 'or', mergedConnection.partnerId);

  // Check for personal recipes from either user
  const { data: personalRecipes, error: personalRecipesError } = await supabase
    .from('recipes')
    .select('*')
    .in('user_id', [userId, mergedConnection.partnerId]);

  console.log('[MealPlanningAPI] Personal recipes query result:', personalRecipes?.length ?? 0, 'error:', personalRecipesError);

  if (!personalRecipes || personalRecipes.length === 0) {
    console.log('[MealPlanningAPI] No personal recipes found to migrate');
    return sharedRecipes;
  }

  console.log('[MealPlanningAPI] Found', personalRecipes.length, 'personal recipes to migrate');

  // Migrate each recipe to shared
  const migratedRecipes: RecipeData[] = [];

  for (const recipe of personalRecipes) {
    // Update the recipe to be shared (set connection_id, clear user_id)
    const { data: updatedRecipe, error: updateError } = await supabase
      .from('recipes')
      .update({
        connection_id: mergedConnection.connectionId,
        user_id: null,
      })
      .eq('id', recipe.id)
      .select()
      .single();

    if (updateError) {
      console.error('[MealPlanningAPI] Error migrating recipe:', recipe.id, updateError);
      continue;
    }

    if (updatedRecipe) {
      migratedRecipes.push(updatedRecipe as RecipeData);
    }
  }

  console.log('[MealPlanningAPI] Successfully migrated', migratedRecipes.length, 'recipes to shared');
  return migratedRecipes;
}

/**
 * Get all recipes for the current user.
 * If merged mode is enabled, returns shared recipes instead.
 * Validates API responses with Zod schemas (invalid items are filtered out).
 */
export async function getRecipes(): Promise<RecipeData[]> {
  return apiCall(
    async () => {
      const user = await requireAuth();
      const mergedConnection = await getMealsMergedConnection();

      console.log('[MealPlanningAPI] getRecipes - user:', user.id, 'mergedConnection:', mergedConnection);

      if (mergedConnection) {
        // Merged mode: fetch recipes by connection_id
        console.log('[MealPlanningAPI] Fetching MERGED recipes for connection:', mergedConnection.connectionId);
        const { data, error } = await supabase
          .from('recipes')
          .select('*')
          .eq('connection_id', mergedConnection.connectionId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        console.log('[MealPlanningAPI] MERGED recipes found:', data?.length ?? 0);

        // Validate API response
        const validated = validateArrayWithFilter<RecipeData>(RecipeDataArraySchema.element, data ?? [], 'getRecipes (merged)');

        // Check if we need to migrate personal recipes to shared
        const migratedRecipes = await checkAndMigratePersonalRecipes(validated, user.id, mergedConnection);

        return migratedRecipes;
      }

      // Normal mode: fetch recipes by user_id
      console.log('[MealPlanningAPI] Fetching PERSONAL recipes for user:', user.id);
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      console.log('[MealPlanningAPI] PERSONAL recipes found:', data?.length ?? 0);

      // Validate API response
      return validateArrayWithFilter<RecipeData>(RecipeDataArraySchema.element, data ?? [], 'getRecipes (personal)');
    },
    { domain: 'MealPlanningAPI', operation: 'getRecipes' }
  );
}

/**
 * Create a new recipe.
 * If merged mode is enabled, creates a shared recipe owned by the connection.
 */
export async function createRecipe(
  recipe: Omit<RecipeData, 'id' | 'created_at' | 'updated_at'>
): Promise<RecipeData> {
  return apiCall(
    async () => {
      const user = await requireAuth();
      const mergedConnection = await getMealsMergedConnection();

      if (mergedConnection) {
        // Merged mode: create shared recipe with connection_id (no user_id)
        console.log('[MealPlanningAPI] Creating MERGED recipe for connection:', mergedConnection.connectionId);
        const result = await supabase
          .from('recipes')
          .insert({
            connection_id: mergedConnection.connectionId,
            ...recipe,
          })
          .select()
          .single();

        const data = handleSupabaseResponse(result, 'Recipe');
        return data as RecipeData;
      }

      // Normal mode: create personal recipe with user_id
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
 * Update a recipe.
 * Supports both personal and shared recipes.
 */
export async function updateRecipe(
  id: string,
  updates: Partial<RecipeData>
): Promise<RecipeData> {
  return apiCall(
    async () => {
      const user = await requireAuth();
      const mergedConnection = await getMealsMergedConnection();

      if (mergedConnection) {
        // Merged mode: update by id only (RLS will ensure access)
        const result = await supabase
          .from('recipes')
          .update(updates)
          .eq('id', id)
          .select()
          .single();

        const data = handleSupabaseResponse(result, 'Recipe', id);
        return data as RecipeData;
      }

      // Normal mode: update with user_id check
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
 * Delete a recipe.
 * Supports both personal and shared recipes.
 */
export async function deleteRecipe(id: string): Promise<void> {
  return apiCall(
    async () => {
      const user = await requireAuth();
      const mergedConnection = await getMealsMergedConnection();

      if (mergedConnection) {
        // Merged mode: delete by id only (RLS will ensure access)
        const { error } = await supabase
          .from('recipes')
          .delete()
          .eq('id', id);

        if (error) throw error;
        return;
      }

      // Normal mode: delete with user_id check
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
// MEAL TRACKING CRUD OPERATIONS (Personal tracking of shared meals)
// =====================================================

import type { MealTrackingStatus } from '../services/types';

/**
 * Get meal tracking records for a list of planned meal IDs.
 * Returns only the current user's tracking records.
 * Validates API responses with Zod schemas.
 */
export async function getMealTracking(plannedMealIds: string[]): Promise<MealTrackingData[]> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      if (plannedMealIds.length === 0) {
        return [];
      }

      const { data, error } = await supabase
        .from('meal_tracking')
        .select('*')
        .eq('user_id', user.id)
        .in('planned_meal_id', plannedMealIds);

      if (error) throw error;

      // Validate API response
      return validateArrayWithFilter<MealTrackingData>(MealTrackingDataArraySchema.element, data ?? [], 'getMealTracking');
    },
    { domain: 'MealPlanningAPI', operation: 'getMealTracking' }
  );
}

/**
 * Get partner's meal tracking records for a list of planned meal IDs.
 * Used in merged mode to show what the partner ate.
 * Validates API responses with Zod schemas.
 */
export async function getPartnerMealTracking(
  plannedMealIds: string[],
  partnerId: string
): Promise<MealTrackingData[]> {
  return apiCall(
    async () => {
      await requireAuth();

      if (plannedMealIds.length === 0 || !partnerId) {
        return [];
      }

      const { data, error } = await supabase
        .from('meal_tracking')
        .select('*')
        .eq('user_id', partnerId)
        .in('planned_meal_id', plannedMealIds);

      if (error) throw error;

      // Validate API response
      return validateArrayWithFilter<MealTrackingData>(MealTrackingDataArraySchema.element, data ?? [], 'getPartnerMealTracking');
    },
    { domain: 'MealPlanningAPI', operation: 'getPartnerMealTracking' }
  );
}

/**
 * Track a meal (mark as eaten, skipped, or swapped).
 * Creates or updates the tracking record for the current user.
 */
export async function trackMeal(
  plannedMealId: string,
  tracking: {
    status: MealTrackingStatus;
    swappedMeal?: string;
    swappedRecipeId?: string;
    servingsConsumed?: number;
    caloriesConsumed?: number;
    notes?: string;
  }
): Promise<MealTrackingData> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      // Use upsert to create or update
      const result = await supabase
        .from('meal_tracking')
        .upsert(
          {
            user_id: user.id,
            planned_meal_id: plannedMealId,
            status: tracking.status,
            swapped_meal: tracking.swappedMeal,
            swapped_recipe_id: tracking.swappedRecipeId,
            servings_consumed: tracking.servingsConsumed,
            calories_consumed: tracking.caloriesConsumed,
            notes: tracking.notes,
            tracked_at: new Date().toISOString(),
          },
          {
            onConflict: 'user_id,planned_meal_id',
          }
        )
        .select()
        .single();

      const data = handleSupabaseResponse(result, 'Meal Tracking');
      return data as MealTrackingData;
    },
    { domain: 'MealPlanningAPI', operation: 'trackMeal', data: { plannedMealId, status: tracking.status } }
  );
}

/**
 * Update an existing meal tracking record.
 */
export async function updateMealTracking(
  id: string,
  updates: Partial<{
    status: MealTrackingStatus;
    swappedMeal?: string;
    swappedRecipeId?: string;
    servingsConsumed?: number;
    caloriesConsumed?: number;
    notes?: string;
  }>
): Promise<MealTrackingData> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const result = await supabase
        .from('meal_tracking')
        .update({
          status: updates.status,
          swapped_meal: updates.swappedMeal,
          swapped_recipe_id: updates.swappedRecipeId,
          servings_consumed: updates.servingsConsumed,
          calories_consumed: updates.caloriesConsumed,
          notes: updates.notes,
          tracked_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      const data = handleSupabaseResponse(result, 'Meal Tracking', id);
      return data as MealTrackingData;
    },
    { domain: 'MealPlanningAPI', operation: 'updateMealTracking', data: { id } }
  );
}

/**
 * Delete a meal tracking record (reset to untracked state).
 */
export async function deleteMealTracking(id: string): Promise<void> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const { error } = await supabase
        .from('meal_tracking')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    { domain: 'MealPlanningAPI', operation: 'deleteMealTracking', data: { id } }
  );
}

// =====================================================
// PANTRY ITEMS CRUD OPERATIONS
// =====================================================

/**
 * Get all pantry items for the current user.
 * Validates API responses with Zod schemas.
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

      // Validate API response
      return validateArrayWithFilter<PantryItemData>(PantryItemDataArraySchema.element, data ?? [], 'getPantryItems');
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

// =====================================================
// MEAL BACKLOG CRUD OPERATIONS (Shared between partners)
// =====================================================

/**
 * Get all backlog items for the user's merged connection.
 * Returns items saved by either partner.
 * Validates API responses with Zod schemas.
 */
export async function getBacklogItems(): Promise<MealBacklogData[]> {
  return apiCall(
    async () => {
      await requireAuth();

      // Get the merged connection
      const mergedConnection = await getMealsMergedConnection();
      if (!mergedConnection) {
        console.log('[MealPlanningAPI] No merged connection, returning empty backlog');
        return [];
      }

      const { data, error } = await supabase
        .from('meal_backlog')
        .select('*')
        .eq('connection_id', mergedConnection.connectionId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Validate API response
      return validateArrayWithFilter<MealBacklogData>(MealBacklogDataArraySchema.element, data ?? [], 'getBacklogItems');
    },
    { domain: 'MealPlanningAPI', operation: 'getBacklogItems' }
  );
}

/**
 * Add a meal to the shared backlog.
 * Used when a user swaps a meal and chooses "Save for later".
 */
export async function addToBacklog(item: {
  mealName: string;
  recipeId?: string;
  originalDate?: string;
  originalMealType?: string;
  reason?: string;
  servings?: number;
  peopleCount?: number;
}): Promise<MealBacklogData> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      // Get the merged connection
      const mergedConnection = await getMealsMergedConnection();
      if (!mergedConnection) {
        throw new Error('Cannot add to backlog: No merged connection found');
      }

      const result = await supabase
        .from('meal_backlog')
        .insert({
          connection_id: mergedConnection.connectionId,
          meal_name: item.mealName,
          recipe_id: item.recipeId,
          saved_by_user_id: user.id,
          original_date: item.originalDate,
          original_meal_type: item.originalMealType,
          reason: item.reason,
          servings: item.servings ?? 2,
          people_count: item.peopleCount ?? 2,
        })
        .select()
        .single();

      const data = handleSupabaseResponse(result, 'Meal Backlog');
      return data as MealBacklogData;
    },
    { domain: 'MealPlanningAPI', operation: 'addToBacklog', data: { mealName: item.mealName } }
  );
}

/**
 * Remove a meal from the backlog (e.g., when used or discarded).
 */
export async function removeFromBacklog(id: string): Promise<void> {
  return apiCall(
    async () => {
      await requireAuth();

      const { error } = await supabase
        .from('meal_backlog')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    { domain: 'MealPlanningAPI', operation: 'removeFromBacklog', data: { id } }
  );
}

/**
 * Use a backlog item - creates a planned meal and removes from backlog.
 * Returns the created planned meal.
 */
export async function useBacklogItem(
  backlogId: string,
  planId: string,
  date: string,
  mealType: string
): Promise<PlannedMealData> {
  return apiCall(
    async () => {
      await requireAuth();

      // Get the backlog item first
      const { data: backlogItem, error: fetchError } = await supabase
        .from('meal_backlog')
        .select('*')
        .eq('id', backlogId)
        .single();

      if (fetchError) throw fetchError;
      if (!backlogItem) throw new Error('Backlog item not found');

      const item = backlogItem as MealBacklogData;

      // Create the planned meal
      const mealResult = await supabase
        .from('planned_meals')
        .insert({
          meal_plan_id: planId,
          recipe_id: item.recipe_id,
          custom_meal: item.recipe_id ? undefined : item.meal_name,
          date,
          meal_type: mealType,
          servings: item.servings ?? 2,
          people_count: item.people_count ?? 2,
          status: 'planned',
          notes: `From backlog: ${item.reason ?? 'Saved for later'}`,
        })
        .select()
        .single();

      const plannedMeal = handleSupabaseResponse(mealResult, 'Planned Meal');

      // Remove from backlog
      const { error: deleteError } = await supabase
        .from('meal_backlog')
        .delete()
        .eq('id', backlogId);

      if (deleteError) {
        console.error('[MealPlanningAPI] Failed to remove backlog item after use:', deleteError);
        // Don't throw - the meal was created successfully
      }

      return plannedMeal as PlannedMealData;
    },
    { domain: 'MealPlanningAPI', operation: 'useBacklogItem', data: { backlogId, planId, date, mealType } }
  );
}
