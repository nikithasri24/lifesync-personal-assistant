/**
 * Nutrition API with Merged Mode Support
 * CRUD operations for food tracking, meals, and nutrition goals
 *
 * Merged Mode: When both users in a connection set this module to "merged",
 * the API fetches food logs for both users. RLS policies ensure proper access control.
 *
 * Implementation:
 * - getNutritionMergedConnection() checks if merged mode is enabled
 * - Fetch functions include partner's food logs when merged
 * - RLS policies on food_log table handle security
 */

import { supabase } from '../lib/supabase';
import { logger } from '../services/logger';
import { format } from 'date-fns';
import { apiCall, requireAuth, handleSupabaseResponse } from './apiWrapper';
import { getMergedConnectionId, type MergedConnectionResult } from '../shared/api/SharedDataProvider';

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
// MERGED MODE SUPPORT
// =====================================================

// Merged connection cache for Nutrition
let cachedMergedConnection: MergedConnectionResult | null | undefined;

/**
 * Get merged connection for nutrition module
 * Returns connection info if both users have enabled merged mode, null otherwise
 */
export async function getNutritionMergedConnection(): Promise<MergedConnectionResult | null> {
  if (cachedMergedConnection !== undefined) {
    logger.debug('NutritionAPI', 'Returning cached merged connection', { cached: cachedMergedConnection });
    return cachedMergedConnection;
  }

  logger.debug('NutritionAPI', 'Fetching nutrition merged connection');
  cachedMergedConnection = await getMergedConnectionId('nutrition');
  logger.info('NutritionAPI', 'Nutrition merged connection fetched', {
    hasMergedMode: !!cachedMergedConnection,
    partnerId: cachedMergedConnection?.partnerId
  });

  return cachedMergedConnection;
}

/**
 * Clear cached merged connection (call when connection status changes)
 */
export function clearNutritionMergedConnectionCache(): void {
  logger.debug('NutritionAPI', 'Clearing nutrition merged connection cache');
  cachedMergedConnection = undefined;
}

// =====================================================
// FOOD ITEMS
// =====================================================

/**
 * Search for food items
 */
export async function searchFoods(query: string): Promise<FoodItem[]> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const { data, error } = await supabase
        .from('food_items')
        .select('*')
        .or(`user_id.is.null,user_id.eq.${user.id}`)
        .ilike('name', `%${query}%`)
        .limit(20);

      if (error) throw error;
      return data as FoodItem[];
    },
    { domain: 'NutritionAPI', operation: 'searchFoods', data: { query } }
  );
}

/**
 * Create a custom food item
 */
export async function createFoodItem(
  input: Omit<FoodItem, 'id' | 'user_id' | 'is_custom' | 'created_at'>
): Promise<FoodItem> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const result = await supabase
        .from('food_items')
        .insert({
          user_id: user.id,
          ...input,
          is_custom: true,
        })
        .select()
        .single();

      const data = handleSupabaseResponse(result, 'Food Item');
      logger.info('NutritionAPI', 'Food item created', { name: input.name });
      return data as FoodItem;
    },
    { domain: 'NutritionAPI', operation: 'createFoodItem', data: { name: input.name } }
  );
}

// =====================================================
// FOOD LOG
// =====================================================

/**
 * Log a food entry
 */
export async function logFood(input: LogFoodInput): Promise<FoodLogEntry> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const result = await supabase
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

      const data = handleSupabaseResponse(result, 'Food Log Entry');
      logger.info('NutritionAPI', 'Food logged', { meal_type: input.meal_type });
      return data as FoodLogEntry;
    },
    { domain: 'NutritionAPI', operation: 'logFood', data: { meal_type: input.meal_type } }
  );
}

/**
 * Get food log for a specific date (supports merged mode)
 * In merged mode, returns both users' food logs for comparison and shared tracking
 */
export async function getDailyLog(date: string): Promise<FoodLogEntry[]> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      // Check for merged connection
      const mergedConnection = await getNutritionMergedConnection();

      let query = supabase
        .from('food_log')
        .select('*')
        .eq('logged_date', date)
        .order('logged_time', { ascending: true });

      // If merged mode, get both users' logs
      // Otherwise, just get current user's logs
      if (mergedConnection) {
        logger.debug('NutritionAPI', 'Merged mode enabled - fetching food logs for both users');
        query = query.or(`user_id.eq.${user.id},user_id.eq.${mergedConnection.partnerId}`);
      } else {
        query = query.eq('user_id', user.id);
      }

      const { data, error } = await query;

      if (error) throw error;

      logger.info('NutritionAPI', 'Fetched daily log', {
        count: data?.length ?? 0,
        date,
        mergedMode: !!mergedConnection
      });

      return data as FoodLogEntry[];
    },
    { domain: 'NutritionAPI', operation: 'getDailyLog', data: { date } }
  );
}

/**
 * Delete a food log entry
 */
export async function deleteLogEntry(id: string): Promise<void> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const { error } = await supabase
        .from('food_log')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      logger.info('NutritionAPI', 'Food log entry deleted', { id });
    },
    { domain: 'NutritionAPI', operation: 'deleteLogEntry', data: { id } }
  );
}

// =====================================================
// NUTRITION GOALS
// =====================================================

/**
 * Get active nutrition goal
 */
export async function getActiveGoal(): Promise<NutritionGoal | null> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      // Use maybeSingle() instead of single() to avoid 406 errors
      // maybeSingle() returns null if no rows, single() throws error
      const { data, error } = await supabase
        .from('nutrition_goals')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        // Log the error for debugging
        logger.warn('NutritionAPI', 'Error fetching nutrition goal', {
          code: error.code,
          message: error.message,
          hint: error.hint,
          details: error.details
        });

        // Return null instead of throwing to prevent app crashes
        return null;
      }

      return data as NutritionGoal | null;
    },
    { domain: 'NutritionAPI', operation: 'getActiveGoal' }
  );
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
  return apiCall(
    async () => {
      const user = await requireAuth();

      // Deactivate existing goals
      await supabase
        .from('nutrition_goals')
        .update({ is_active: false })
        .eq('user_id', user.id)
        .eq('is_active', true);

      // Create new goal
      const result = await supabase
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

      const data = handleSupabaseResponse(result, 'Nutrition Goal');
      logger.info('NutritionAPI', 'Nutrition goal set', { calories_target: goal.calories_target });
      return data as NutritionGoal;
    },
    { domain: 'NutritionAPI', operation: 'setNutritionGoal', data: { calories_target: goal.calories_target } }
  );
}

