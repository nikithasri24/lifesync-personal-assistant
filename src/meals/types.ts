/**
 * Meal Planning Types
 * Type definitions for meals, recipes, and meal planning
 */

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type MealStatus = 'planned' | 'logged' | 'skipped';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type Cuisine = 'italian' | 'mexican' | 'asian' | 'american' | 'indian' | 'mediterranean' | 'other';

export interface NutritionInfo {
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  sugar?: number;
}

export interface Ingredient {
  id: string;
  name: string;
  amount: string;
  unit?: string;
  category?: string;
}

export interface Recipe {
  id: string;
  name: string;
  cuisine?: Cuisine;
  prepTime?: number; // minutes
  cookTime?: number; // minutes
  difficulty?: Difficulty;
  servings?: number;
  ingredients: Ingredient[];
  instructions: string[];
  nutritionInfo?: NutritionInfo;
  tags?: string[];
  imageUrl?: string;
  isFavorite: boolean;
  createdAt: Date;
  updatedAt: Date;
  user_id: string;
}

export interface PlannedMeal {
  id: string;
  date: string; // ISO date string (YYYY-MM-DD)
  mealType: MealType;
  recipeId?: string; // If linked to a recipe
  customName?: string; // For custom meals without recipes
  servings?: number;
  status: MealStatus;
  notes?: string;
  actualNutrition?: NutritionInfo; // Logged nutrition if different from recipe
  loggedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  user_id: string;
}

export interface GroceryItem {
  id: string;
  name: string;
  amount: string;
  unit?: string;
  category: string;
  isChecked: boolean;
  isAtHome: boolean;
  recipeIds: string[]; // Which recipes need this ingredient
}

export interface WeekPlan {
  id: string;
  weekStartDate: string; // ISO date string (YYYY-MM-DD)
  meals: PlannedMeal[];
  groceryList: GroceryItem[];
  createdAt: Date;
  updatedAt: Date;
  user_id: string;
}

export interface MealSwap {
  originalMealId: string;
  newRecipeId: string;
  swappedAt: Date;
}

export type TabView = 'today' | 'week' | 'recipes' | 'grocery';

// ============================================================
// Batch Cook Feature Types
// ============================================================

export interface BatchCookDish {
  id: string;
  sessionId: string;
  recipeId?: string;
  recipeName?: string; // denormalised from recipe for display
  customName?: string;
  servingsCooked: number;
  servingsRemaining: number;
  notes?: string;
  createdAt: Date;
}

export interface BatchCookSession {
  id: string;
  userId: string;
  name: string;
  cookDate: string; // yyyy-MM-dd
  notes?: string;
  dishes: BatchCookDish[];
  createdAt: Date;
  updatedAt: Date;
}

export interface MealLog {
  id: string;
  userId: string;
  loggedDate: string; // yyyy-MM-dd
  mealType: MealType;
  batchDishId?: string;
  recipeId?: string;
  customName?: string;
  servingsConsumed: number;
  notes?: string;
  createdAt: Date;
}

export interface BatchCookSessionInput {
  name: string;
  cookDate: string; // yyyy-MM-dd
  notes?: string;
  dishes: Array<{
    recipeId?: string;
    customName?: string;
    servingsCooked: number;
    notes?: string;
  }>;
}

export interface MealLogInput {
  loggedDate: string;
  mealType: MealType;
  batchDishId?: string;
  recipeId?: string;
  customName?: string;
  servingsConsumed: number;
  notes?: string;
}
