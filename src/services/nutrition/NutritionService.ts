/**
 * Nutrition Service
 * Handles food logging, calorie/macro tracking, and nutrition goals
 */

import { supabase } from '@/lib/supabase';
import { logger } from '@/services/logger';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

// ============================================================================
// Types
// ============================================================================

export interface FoodItem {
  id: string;
  user_id: string | null;
  name: string;
  brand?: string;
  serving_size: number;
  serving_unit: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g?: number;
  sugar_g?: number;
  sodium_mg?: number;
  category?: string;
  barcode?: string;
  is_verified: boolean;
}

export interface FoodLogEntry {
  id: string;
  user_id: string;
  food_item_id?: string;
  custom_food_name?: string;
  quantity: number;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  logged_date: string;
  logged_time?: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  notes?: string;
  food_item?: FoodItem;
}

export interface NutritionGoal {
  id: string;
  user_id: string;
  calories_target: number;
  protein_target_g: number;
  carbs_target_g: number;
  fat_target_g: number;
  fiber_target_g: number;
  goal_type: 'lose' | 'maintain' | 'gain';
  is_active: boolean;
}

export interface DailyNutrition {
  date: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  meals: {
    breakfast: FoodLogEntry[];
    lunch: FoodLogEntry[];
    dinner: FoodLogEntry[];
    snack: FoodLogEntry[];
  };
}

// ============================================================================
// Nutrition Service
// ============================================================================

class NutritionService {
  // --------------------------------------------------------------------------
  // Food Items
  // --------------------------------------------------------------------------

  async searchFoods(query: string, userId: string): Promise<FoodItem[]> {
    const { data, error } = await supabase
      .from('food_items')
      .select('*')
      .or(`user_id.is.null,user_id.eq.${userId}`)
      .ilike('name', `%${query}%`)
      .limit(20);

    if (error) {
      logger.error('NutritionService', 'Failed to search foods', { error });
      return [];
    }

    return data || [];
  }

  async createCustomFood(userId: string, food: Omit<FoodItem, 'id' | 'user_id' | 'is_verified'>): Promise<FoodItem | null> {
    const { data, error } = await supabase
      .from('food_items')
      .insert({ ...food, user_id: userId, is_verified: false })
      .select()
      .single();

    if (error) {
      logger.error('NutritionService', 'Failed to create food', { error });
      return null;
    }

    return data;
  }

  // --------------------------------------------------------------------------
  // Food Logging
  // --------------------------------------------------------------------------

  async logFood(
    userId: string,
    entry: {
      food_item_id?: string;
      custom_food_name?: string;
      quantity: number;
      meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
      logged_date?: string;
      calories: number;
      protein_g?: number;
      carbs_g?: number;
      fat_g?: number;
      notes?: string;
    }
  ): Promise<FoodLogEntry | null> {
    const { data, error } = await supabase
      .from('food_log')
      .insert({
        user_id: userId,
        food_item_id: entry.food_item_id,
        custom_food_name: entry.custom_food_name,
        quantity: entry.quantity,
        meal_type: entry.meal_type,
        logged_date: entry.logged_date || format(new Date(), 'yyyy-MM-dd'),
        logged_time: format(new Date(), 'HH:mm:ss'),
        calories: entry.calories,
        protein_g: entry.protein_g || 0,
        carbs_g: entry.carbs_g || 0,
        fat_g: entry.fat_g || 0,
        notes: entry.notes,
      })
      .select()
      .single();

    if (error) {
      logger.error('NutritionService', 'Failed to log food', { error });
      return null;
    }

    logger.info('NutritionService', 'Food logged', { meal: entry.meal_type, calories: entry.calories });
    return data;
  }

  async deleteLogEntry(entryId: string): Promise<boolean> {
    const { error } = await supabase.from('food_log').delete().eq('id', entryId);
    return !error;
  }

  async getDailyLog(userId: string, date: string): Promise<FoodLogEntry[]> {
    const { data, error } = await supabase
      .from('food_log')
      .select('*, food_item:food_items(*)')
      .eq('user_id', userId)
      .eq('logged_date', date)
      .order('logged_time', { ascending: true });

    if (error) {
      logger.error('NutritionService', 'Failed to get daily log', { error });
      return [];
    }

    return data || [];
  }

  async getDailyNutrition(userId: string, date: string): Promise<DailyNutrition> {
    const entries = await this.getDailyLog(userId, date);

    const meals = {
      breakfast: entries.filter(e => e.meal_type === 'breakfast'),
      lunch: entries.filter(e => e.meal_type === 'lunch'),
      dinner: entries.filter(e => e.meal_type === 'dinner'),
      snack: entries.filter(e => e.meal_type === 'snack'),
    };

    const totals = entries.reduce(
      (acc, e) => ({
        calories: acc.calories + e.calories,
        protein_g: acc.protein_g + e.protein_g,
        carbs_g: acc.carbs_g + e.carbs_g,
        fat_g: acc.fat_g + e.fat_g,
      }),
      { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
    );

    return { date, ...totals, meals };
  }

  async getWeeklyNutrition(userId: string): Promise<DailyNutrition[]> {
    const results: DailyNutrition[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
      results.push(await this.getDailyNutrition(userId, date));
    }
    return results;
  }

  // --------------------------------------------------------------------------
  // Nutrition Goals
  // --------------------------------------------------------------------------

  async getActiveGoal(userId: string): Promise<NutritionGoal | null> {
    const { data, error } = await supabase
      .from('nutrition_goals')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') {
      logger.error('NutritionService', 'Failed to get goal', { error });
    }

    return data;
  }

  async setGoal(
    userId: string,
    goal: {
      calories_target: number;
      protein_target_g?: number;
      carbs_target_g?: number;
      fat_target_g?: number;
      goal_type?: 'lose' | 'maintain' | 'gain';
    }
  ): Promise<NutritionGoal | null> {
    // Deactivate existing goals
    await supabase
      .from('nutrition_goals')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('is_active', true);

    // Create new goal
    const { data, error } = await supabase
      .from('nutrition_goals')
      .insert({
        user_id: userId,
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
      logger.error('NutritionService', 'Failed to set goal', { error });
      return null;
    }

    logger.info('NutritionService', 'Goal set', { calories: goal.calories_target });
    return data;
  }

  // --------------------------------------------------------------------------
  // Progress Tracking
  // --------------------------------------------------------------------------

  async getTodayProgress(userId: string): Promise<{
    consumed: { calories: number; protein_g: number; carbs_g: number; fat_g: number };
    goal: NutritionGoal | null;
    remaining: { calories: number; protein_g: number; carbs_g: number; fat_g: number };
  }> {
    const today = format(new Date(), 'yyyy-MM-dd');
    const [daily, goal] = await Promise.all([
      this.getDailyNutrition(userId, today),
      this.getActiveGoal(userId),
    ]);

    const consumed = {
      calories: daily.calories,
      protein_g: daily.protein_g,
      carbs_g: daily.carbs_g,
      fat_g: daily.fat_g,
    };

    const remaining = goal
      ? {
          calories: Math.max(0, goal.calories_target - consumed.calories),
          protein_g: Math.max(0, goal.protein_target_g - consumed.protein_g),
          carbs_g: Math.max(0, goal.carbs_target_g - consumed.carbs_g),
          fat_g: Math.max(0, goal.fat_target_g - consumed.fat_g),
        }
      : { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 };

    return { consumed, goal, remaining };
  }
}

export const nutritionService = new NutritionService();

