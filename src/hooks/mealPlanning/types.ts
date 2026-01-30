/**
 * Meal Planning Types and Mappers
 * 
 * Shared types, interfaces, and data transformation functions
 * for the meal planning domain.
 */

import type {
  RecipeData,
  MealPlanData,
  PlannedMealData,
  PantryItemData,
  MealTrackingData,
  MealBacklogData,
  MealTrackingStatus,
} from '@/services/types';
import type { MealStatus, PantryItem } from '@/types';

// ==================== UI Types ====================

export interface Recipe {
  id: string;
  name: string;
  description?: string;
  cuisine?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  prepTime?: number;
  cookTime?: number;
  servings?: number;
  calories?: number;
  instructions: string[];
  ingredients: Array<{
    name: string;
    amount?: string;
    unit?: string;
  }>;
  tags?: string[];
  isFavorite?: boolean;
  dietaryRestrictions?: string[];
  nutritionInfo?: Record<string, unknown>;
  sourceType?: 'manual' | 'url' | 'ai' | 'youtube';
  sourceUrl?: string;
  videoThumbnail?: string;
  image?: string;
  rating?: number;
  notes?: string;
  flowChart?: unknown[];
  createdAt: Date;
}

export interface MealColumn {
  id: string;
  name: string;
  defaultServings: number;
  defaultPeopleCount: number;
  color: string;
  icon?: string;
  order: number;
}

export interface PlannedMeal {
  id: string;
  mealPlanId: string;
  recipeId?: string;
  customMeal?: string;
  mealType: string;
  date: Date;
  servings: number;
  peopleCount: number;
  status: MealStatus;
  notes?: string;
  actualFoodLogId?: string;
  substitutedWith?: string;
  isPostponed?: boolean;
  postponedReason?: string;
  originalDate?: Date;
  preparedAt?: Date;
  consumedAt?: Date;
  createdAt: Date;
}

export interface MealPlanWeek {
  id: string;
  name: string;
  weekStartDate: Date;
  mealColumns: MealColumn[];
  meals: PlannedMeal[];
  notes?: string;
  shoppingListGenerated?: boolean;
  totalEstimatedCost?: number;
  connectionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MealTracking {
  id: string;
  userId: string;
  plannedMealId: string;
  status: MealTrackingStatus;
  swappedMeal?: string;
  swappedRecipeId?: string;
  servingsConsumed?: number;
  caloriesConsumed?: number;
  notes?: string;
  trackedAt?: Date;
}

export interface MealBacklogItem {
  id: string;
  connectionId: string;
  mealName: string;
  recipeId?: string;
  savedByUserId: string;
  originalDate?: Date;
  originalMealType?: string;
  reason?: string;
  servings: number;
  peopleCount: number;
  createdAt: Date;
}

export interface MergedConnectionInfo {
  connectionId: string;
  partnerId: string;
  partnerName?: string;
}

// ==================== Input/Update Types ====================

export type RecipeInput = Omit<Recipe, 'id' | 'createdAt'>;
export type RecipeUpdate = Partial<Omit<Recipe, 'id' | 'createdAt'>>;
export type MealPlanInput = Omit<MealPlanWeek, 'id' | 'createdAt' | 'updatedAt' | 'meals'>;
export type MealPlanUpdate = Partial<Omit<MealPlanWeek, 'id' | 'createdAt' | 'updatedAt' | 'meals'>>;
export type PlannedMealInput = Omit<PlannedMeal, 'id' | 'mealPlanId' | 'createdAt'>;
export type PlannedMealUpdate = Partial<Omit<PlannedMeal, 'id' | 'mealPlanId' | 'createdAt'>>;
export type PantryItemInput = Omit<PantryItem, 'id' | 'updatedAt'>;
export type PantryItemUpdate = Partial<Omit<PantryItem, 'id' | 'updatedAt'>>;

// Re-export PantryItem from central types
export type { PantryItem } from '@/types';

// Re-export API types needed by other modules
export type { MealTrackingStatus } from '@/services/types';

