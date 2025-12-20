/**
 * Nutrition Service
 * Business logic for food logging, calorie/macro tracking, and nutrition goals
 *
 * This service uses the API layer for data access and provides
 * higher-level business logic operations.
 */

import { format, subDays } from 'date-fns';
import * as nutritionAPI from '@/api/nutritionAPI';
import { logger } from '@/services/logger';

// Re-export types from API
export type {
  FoodItem,
  FoodLogEntry,
  NutritionGoal,
  MealType,
  GoalType,
  LogFoodInput
} from '@/api/nutritionAPI';

// ============================================================================
// Additional Types for Business Logic
// ============================================================================

export interface DailyNutrition {
  date: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  meals: {
    breakfast: nutritionAPI.FoodLogEntry[];
    lunch: nutritionAPI.FoodLogEntry[];
    dinner: nutritionAPI.FoodLogEntry[];
    snack: nutritionAPI.FoodLogEntry[];
  };
}

// ============================================================================
// Nutrition Service
// ============================================================================

class NutritionService {
  // --------------------------------------------------------------------------
  // Delegated API Functions
  // --------------------------------------------------------------------------

  async searchFoods(query: string): Promise<nutritionAPI.FoodItem[]> {
    try {
      return await nutritionAPI.searchFoods(query);
    } catch (error) {
      logger.error('NutritionService', 'Failed to search foods', { error });
      return [];
    }
  }

  async createCustomFood(
    food: Omit<nutritionAPI.FoodItem, 'id' | 'user_id' | 'is_custom' | 'created_at'>
  ): Promise<nutritionAPI.FoodItem | null> {
    try {
      return await nutritionAPI.createFoodItem(food);
    } catch (error) {
      logger.error('NutritionService', 'Failed to create food', { error });
      return null;
    }
  }

  async logFood(entry: nutritionAPI.LogFoodInput): Promise<nutritionAPI.FoodLogEntry | null> {
    try {
      const result = await nutritionAPI.logFood(entry);
      logger.info('NutritionService', 'Food logged', { meal: entry.meal_type, calories: entry.calories });
      return result;
    } catch (error) {
      logger.error('NutritionService', 'Failed to log food', { error });
      return null;
    }
  }

  async deleteLogEntry(entryId: string): Promise<boolean> {
    try {
      await nutritionAPI.deleteLogEntry(entryId);
      return true;
    } catch {
      return false;
    }
  }

  async getDailyLog(date: string): Promise<nutritionAPI.FoodLogEntry[]> {
    try {
      return await nutritionAPI.getDailyLog(date);
    } catch (error) {
      logger.error('NutritionService', 'Failed to get daily log', { error });
      return [];
    }
  }

  async getActiveGoal(): Promise<nutritionAPI.NutritionGoal | null> {
    try {
      return await nutritionAPI.getActiveGoal();
    } catch (error) {
      logger.error('NutritionService', 'Failed to get goal', { error });
      return null;
    }
  }

  async setGoal(goal: {
    calories_target: number;
    protein_target_g?: number;
    carbs_target_g?: number;
    fat_target_g?: number;
    goal_type?: 'lose' | 'maintain' | 'gain';
  }): Promise<nutritionAPI.NutritionGoal | null> {
    try {
      const result = await nutritionAPI.setNutritionGoal(goal);
      logger.info('NutritionService', 'Goal set', { calories: goal.calories_target });
      return result;
    } catch (error) {
      logger.error('NutritionService', 'Failed to set goal', { error });
      return null;
    }
  }

  /**
   * Get daily nutrition summary with meal breakdown
   * Business logic: aggregates entries by meal type and calculates totals
   */
  async getDailyNutrition(date: string): Promise<DailyNutrition> {
    const entries = await this.getDailyLog(date);

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

  /**
   * Get weekly nutrition summary
   * Business logic: aggregates daily nutrition for the past 7 days
   */
  async getWeeklyNutrition(): Promise<DailyNutrition[]> {
    const results: DailyNutrition[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
      results.push(await this.getDailyNutrition(date));
    }
    return results;
  }

  /**
   * Get today's progress against goals
   * Business logic: compares consumed vs target and calculates remaining
   */
  async getTodayProgress(): Promise<{
    consumed: { calories: number; protein_g: number; carbs_g: number; fat_g: number };
    goal: nutritionAPI.NutritionGoal | null;
    remaining: { calories: number; protein_g: number; carbs_g: number; fat_g: number };
  }> {
    const today = format(new Date(), 'yyyy-MM-dd');
    const [daily, goal] = await Promise.all([
      this.getDailyNutrition(today),
      this.getActiveGoal(),
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
