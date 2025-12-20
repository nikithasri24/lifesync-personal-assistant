/**
 * Nutrition API
 * CRUD operations for food tracking, meals, and nutrition goals
 */

import { supabase } from '../lib/supabase';
import { logger } from '../services/logger';
import { format } from 'date-fns';

// =====================================================
// TYPES
// =====================================================

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type GoalType = 'lose' | 'maintain' | 'gain';

export interface FoodItem {
  id: string;
  user_id?: string;
  name: string;
  brand?: string;
  serving_size: string;
  serving_unit: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g?: number;
  sugar_g?: number;
  sodium_mg?: number;
  is_custom: boolean;
  barcode?: string;
  created_at: string;
}

export interface FoodLogEntry {
  id: string;
  user_id: string;
  food_item_id?: string;
  custom_food_name?: string;
  quantity: number;
  meal_type: MealType;
  logged_date: string;
  logged_time: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  notes?: string;
  image_url?: string;
  ai_analyzed?: boolean;
  ai_confidence?: number;
  created_at: string;
}

export interface NutritionGoal {
  id: string;
  user_id: string;
  calories_target: number;
  protein_target_g: number;
  carbs_target_g: number;
  fat_target_g: number;
  goal_type: GoalType;
  is_active: boolean;
  created_at: string;
}

export interface LogFoodInput {
  food_item_id?: string;
  custom_food_name?: string;
  quantity: number;
  meal_type: MealType;
  logged_date?: string;
  calories: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  notes?: string;
  image_url?: string;
  ai_analyzed?: boolean;
  ai_confidence?: number;
}

// =====================================================
// FOOD ITEMS
// =====================================================

/**
 * Search for food items
 */
export async function searchFoods(query: string): Promise<FoodItem[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('food_items')
    .select('*')
    .or(`user_id.is.null,user_id.eq.${user.id}`)
    .ilike('name', `%${query}%`)
    .limit(20);

  if (error) {
    logger.error('NutritionAPI', 'Failed to search foods', { error });
    throw error;
  }
  return data as FoodItem[];
}

/**
 * Create a custom food item
 */
export async function createFoodItem(
  input: Omit<FoodItem, 'id' | 'user_id' | 'is_custom' | 'created_at'>
): Promise<FoodItem> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('food_items')
    .insert({
      user_id: user.id,
      ...input,
      is_custom: true,
    })
    .select()
    .single();

  if (error) {
    logger.error('NutritionAPI', 'Failed to create food item', { error });
    throw error;
  }
  return data as FoodItem;
}

// =====================================================
// FOOD LOG
// =====================================================

/**
 * Log a food entry
 */
export async function logFood(input: LogFoodInput): Promise<FoodLogEntry> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('food_log')
    .insert({
      user_id: user.id,
      food_item_id: input.food_item_id,
      custom_food_name: input.custom_food_name,
      quantity: input.quantity,
      meal_type: input.meal_type,
      logged_date: input.logged_date || format(new Date(), 'yyyy-MM-dd'),
      logged_time: format(new Date(), 'HH:mm:ss'),
      calories: input.calories,
      protein_g: input.protein_g || 0,
      carbs_g: input.carbs_g || 0,
      fat_g: input.fat_g || 0,
      notes: input.notes,
      image_url: input.image_url,
      ai_analyzed: input.ai_analyzed || false,
      ai_confidence: input.ai_confidence,
    })
    .select()
    .single();

  if (error) {
    logger.error('NutritionAPI', 'Failed to log food', { error });
    throw error;
  }
  return data as FoodLogEntry;
}

/**
 * Get food log for a specific date
 */
export async function getDailyLog(date: string): Promise<FoodLogEntry[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('food_log')
    .select('*')
    .eq('user_id', user.id)
    .eq('logged_date', date)
    .order('logged_time', { ascending: true });

  if (error) {
    logger.error('NutritionAPI', 'Failed to get daily log', { error });
    throw error;
  }
  return data as FoodLogEntry[];
}

/**
 * Delete a food log entry
 */
export async function deleteLogEntry(id: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('food_log')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    logger.error('NutritionAPI', 'Failed to delete log entry', { error });
    throw error;
  }
}

// =====================================================
// NUTRITION GOALS
// =====================================================

/**
 * Get active nutrition goal
 */
export async function getActiveGoal(): Promise<NutritionGoal | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('nutrition_goals')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();

  if (error && error.code !== 'PGRST116') {
    logger.error('NutritionAPI', 'Failed to get active goal', { error });
    throw error;
  }
  return data as NutritionGoal | null;
}

/**
 * Set a new nutrition goal
 */
export async function setNutritionGoal(goal: {
  calories_target: number;
  protein_target_g?: number;
  carbs_target_g?: number;
  fat_target_g?: number;
  goal_type?: GoalType;
}): Promise<NutritionGoal> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Deactivate existing goals
  await supabase
    .from('nutrition_goals')
    .update({ is_active: false })
    .eq('user_id', user.id)
    .eq('is_active', true);

  // Create new goal
  const { data, error } = await supabase
    .from('nutrition_goals')
    .insert({
      user_id: user.id,
      calories_target: goal.calories_target,
      protein_target_g: goal.protein_target_g || 50,
      carbs_target_g: goal.carbs_target_g || 250,
      fat_target_g: goal.fat_target_g || 65,
      goal_type: goal.goal_type || 'maintain',
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    logger.error('NutritionAPI', 'Failed to set nutrition goal', { error });
    throw error;
  }
  return data as NutritionGoal;
}

