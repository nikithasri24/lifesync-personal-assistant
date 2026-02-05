/**
 * Zod Schemas for Meal Planning API Response Validation
 * 
 * These schemas validate data coming from the Supabase API to ensure
 * type safety at runtime. They match the types in @/services/types.ts.
 */

import { z } from 'zod';

// ==================== Base Schemas ====================

/**
 * ISO date string (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss.sssZ)
 */
const isoDateString = z.string().refine(
  (val) => !isNaN(Date.parse(val)),
  { message: 'Invalid date string' }
);

/**
 * UUID string
 */
const uuid = z.string().uuid();

// ==================== Recipe Schemas ====================

export const RecipeIngredientSchema = z.object({
  name: z.string(),
  amount: z.string().optional(),
  unit: z.string().optional(),
});

export const RecipeDataSchema = z.object({
  id: uuid.optional(),
  user_id: uuid.optional().nullable(),
  connection_id: uuid.optional().nullable(),
  name: z.string().min(1, 'Recipe name is required'),
  description: z.string().optional().nullable(),
  cuisine: z.string().optional().nullable(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional().nullable(),
  prep_time: z.number().int().nonnegative().optional().nullable(),
  cook_time: z.number().int().nonnegative().optional().nullable(),
  servings: z.number().int().positive().optional().nullable(),
  calories_per_serving: z.number().nonnegative().optional().nullable(),
  instructions: z.string().optional().nullable(),
  ingredients: z.array(RecipeIngredientSchema).optional().nullable(),
  tags: z.array(z.string()).optional().nullable(),
  is_favorite: z.boolean().optional().nullable(),
  dietary_restrictions: z.array(z.string()).optional().nullable(),
  nutrition_info: z.record(z.string(), z.number()).optional().nullable(),
  source_type: z.string().optional().nullable(),
  source_url: z.string().url().optional().nullable().or(z.literal('')),
  video_thumbnail: z.string().url().optional().nullable().or(z.literal('')),
  image: z.string().optional().nullable(),
  rating: z.number().min(0).max(5).optional().nullable(),
  notes: z.string().optional().nullable(),
  flow_chart: z.array(z.unknown()).optional().nullable(),
  created_at: isoDateString.optional().nullable(),
  updated_at: isoDateString.optional().nullable(),
});

export type ValidatedRecipeData = z.infer<typeof RecipeDataSchema>;

// ==================== Meal Plan Schemas ====================

export const MealStatusSchema = z.enum([
  'planned', 'prepped', 'cooked', 'eaten', 'substituted', 'postponed'
]);

export const PlannedMealDataSchema = z.object({
  id: uuid.optional(),
  meal_plan_id: uuid,
  recipe_id: uuid.optional().nullable(),
  meal_type: z.string().min(1),
  date: isoDateString,
  servings: z.number().int().positive().optional().nullable(),
  custom_meal: z.string().optional().nullable(),
  people_count: z.number().int().positive().optional().nullable(),
  status: MealStatusSchema.optional().nullable(),
  notes: z.string().optional().nullable(),
  prepared_at: isoDateString.optional().nullable(),
  consumed_at: isoDateString.optional().nullable(),
  actual_food_log_id: uuid.optional().nullable(),
  substituted_with: z.string().optional().nullable(),
  is_postponed: z.boolean().optional().nullable(),
  postponed_reason: z.string().optional().nullable(),
  original_date: isoDateString.optional().nullable(),
  created_at: isoDateString.optional().nullable(),
  updated_at: isoDateString.optional().nullable(),
});

export type ValidatedPlannedMealData = z.infer<typeof PlannedMealDataSchema>;

export const MealColumnSchema = z.object({
  id: z.string(),
  name: z.string(),
  defaultServings: z.number().int().positive(),
  defaultPeopleCount: z.number().int().positive(),
  color: z.string(),
  icon: z.string().optional(),
  order: z.number().int().nonnegative(),
});

export const MealPlanDataSchema = z.object({
  id: uuid.optional(),
  user_id: uuid.optional().nullable(),
  connection_id: uuid.optional().nullable(),
  name: z.string().min(1, 'Meal plan name is required'),
  week_start_date: isoDateString,
  notes: z.string().optional().nullable(),
  meal_columns: z.record(z.string(), z.unknown()).optional().nullable(),
  shopping_list_generated: z.boolean().optional().nullable(),
  total_estimated_cost: z.number().nonnegative().optional().nullable(),
  created_at: isoDateString.optional().nullable(),
  updated_at: isoDateString.optional().nullable(),
  planned_meals: z.array(PlannedMealDataSchema).optional().nullable(),
});

export type ValidatedMealPlanData = z.infer<typeof MealPlanDataSchema>;

// ==================== Pantry Schemas ====================

export const PantryItemDataSchema = z.object({
  id: uuid.optional(),
  user_id: uuid.optional().nullable(),
  connection_id: uuid.optional().nullable(),
  name: z.string().min(1, 'Item name is required'),
  quantity: z.number().nonnegative().optional().nullable(),
  unit: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  subcategory: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  expiration_date: isoDateString.optional().nullable(),
  notes: z.string().optional().nullable(),
  is_low_stock: z.boolean().optional().nullable(),
  low_stock_threshold: z.number().nonnegative().optional().nullable(),
  auto_restock: z.boolean().optional().nullable(),
  restock_quantity: z.number().nonnegative().optional().nullable(),
  last_purchased_at: isoDateString.optional().nullable(),
  last_used_at: isoDateString.optional().nullable(),
  created_at: isoDateString.optional().nullable(),
  updated_at: isoDateString.optional().nullable(),
});

export type ValidatedPantryItemData = z.infer<typeof PantryItemDataSchema>;

// ==================== Meal Tracking Schemas ====================

export const MealTrackingStatusSchema = z.enum(['pending', 'eaten', 'skipped', 'swapped']);

export const MealTrackingDataSchema = z.object({
  id: uuid.optional(),
  user_id: uuid,
  planned_meal_id: uuid,
  status: MealTrackingStatusSchema,
  swapped_meal: z.string().optional().nullable(),
  swapped_recipe_id: uuid.optional().nullable(),
  servings_consumed: z.number().nonnegative().optional().nullable(),
  calories_consumed: z.number().nonnegative().optional().nullable(),
  notes: z.string().optional().nullable(),
  tracked_at: isoDateString.optional().nullable(),
  created_at: isoDateString.optional().nullable(),
  updated_at: isoDateString.optional().nullable(),
});

export type ValidatedMealTrackingData = z.infer<typeof MealTrackingDataSchema>;

// ==================== Meal Backlog Schemas ====================

export const MealBacklogDataSchema = z.object({
  id: uuid.optional(),
  connection_id: uuid,
  meal_name: z.string().min(1, 'Meal name is required'),
  recipe_id: uuid.optional().nullable(),
  saved_by_user_id: uuid,
  original_date: isoDateString.optional().nullable(),
  original_meal_type: z.string().optional().nullable(),
  reason: z.string().optional().nullable(),
  servings: z.number().int().positive().optional().nullable(),
  people_count: z.number().int().positive().optional().nullable(),
  created_at: isoDateString.optional().nullable(),
  updated_at: isoDateString.optional().nullable(),
});

export type ValidatedMealBacklogData = z.infer<typeof MealBacklogDataSchema>;

// ==================== Meal Search Schema ====================

export const MealSearchResultSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['recipe', 'custom', 'food']),
  recipeId: z.string().optional().nullable(),
  calories: z.number().optional().nullable(),
  servings: z.number().optional().nullable(),
  cuisine: z.string().optional().nullable(),
  difficulty: z.string().optional().nullable(),
});

export type ValidatedMealSearchResult = z.infer<typeof MealSearchResultSchema>;

// ==================== Array Schemas ====================

export const RecipeDataArraySchema = z.array(RecipeDataSchema);
export const MealPlanDataArraySchema = z.array(MealPlanDataSchema);
export const PlannedMealDataArraySchema = z.array(PlannedMealDataSchema);
export const PantryItemDataArraySchema = z.array(PantryItemDataSchema);
export const MealTrackingDataArraySchema = z.array(MealTrackingDataSchema);
export const MealBacklogDataArraySchema = z.array(MealBacklogDataSchema);
export const MealSearchResultArraySchema = z.array(MealSearchResultSchema);

// ==================== Validation Utilities ====================

import { logger } from '@/services/logger';

/**
 * Validate API response data with a Zod schema.
 * Returns validated data or throws an error with detailed info.
 * Note: Uses type assertion to convert Zod's inferred types back to expected types.
 */
export function validateApiResponse<T>(
  schema: z.ZodSchema<unknown>,
  data: unknown,
  context: string
): T {
  const result = schema.safeParse(data);

  if (!result.success) {
    const errors = result.error.errors.map(e =>
      `${e.path.join('.')}: ${e.message}`
    ).join(', ');

    logger.error('MealPlanningAPI', `Validation failed for ${context}`, {
      errors: result.error.errors,
      data
    });

    throw new Error(`API validation failed (${context}): ${errors}`);
  }

  return result.data as T;
}

/**
 * Safely validate API response data with a Zod schema.
 * Returns validated data or null on failure (logs error but doesn't throw).
 */
export function safeValidateApiResponse<T>(
  schema: z.ZodSchema<unknown>,
  data: unknown,
  context: string
): T | null {
  const result = schema.safeParse(data);

  if (!result.success) {
    logger.warn('MealPlanningAPI', `Validation warning for ${context}`, {
      errors: result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
    });
    return null;
  }

  return result.data as T;
}

/**
 * Validate and filter array items, returning only valid items.
 * Invalid items are logged and skipped.
 * Uses type assertion to convert Zod's inferred types back to expected types.
 */
export function validateArrayWithFilter<T>(
  schema: z.ZodSchema<unknown>,
  data: unknown[],
  context: string
): T[] {
  const validItems: T[] = [];

  for (let i = 0; i < data.length; i++) {
    const result = schema.safeParse(data[i]);
    if (result.success) {
      validItems.push(result.data as T);
    } else {
      logger.warn('MealPlanningAPI', `Invalid item at index ${i} in ${context}`, {
        errors: result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
      });
    }
  }

  return validItems;
}

