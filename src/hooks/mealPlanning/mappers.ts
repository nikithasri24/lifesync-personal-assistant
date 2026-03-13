/**
 * Meal Planning Data Mappers
 *
 * Functions to transform between API (snake_case) and UI (camelCase) types.
 */

import { format as formatDate } from 'date-fns';
import type {
  RecipeData,
  MealPlanData,
  PlannedMealData,
  PantryItemData,
  MealTrackingData,
  MealBacklogData,
} from '@/services/types';
import type {
  Recipe,
  PlannedMeal,
  MealPlanWeek,
  MealColumn,
  MealTracking,
  MealBacklogItem,
  RecipeInput,
  RecipeUpdate,
  MealPlanUpdate,
  PlannedMealInput,
  PlannedMealUpdate,
  PantryItemInput,
  PantryItemUpdate,
} from './types';
import { sanitizeInput, sanitizeText, sanitizeArray } from '@/utils/sanitize';
import type { PantryItem } from '@/types';

// ==================== Constants ====================

export const DEFAULT_MEAL_COLUMNS: MealColumn[] = [
  { id: 'breakfast', name: 'Breakfast', defaultServings: 2, defaultPeopleCount: 2, color: '#f97316', icon: '☀️', order: 1 },
  { id: 'lunch', name: 'Lunch', defaultServings: 2, defaultPeopleCount: 2, color: '#10b981', icon: '🥗', order: 2 },
  { id: 'dinner', name: 'Dinner', defaultServings: 4, defaultPeopleCount: 4, color: '#8b5cf6', icon: '🍽️', order: 3 },
  { id: 'snack', name: 'Snacks', defaultServings: 1, defaultPeopleCount: 1, color: '#6b7280', icon: '🍿', order: 4 },
];

// ==================== Utility Functions ====================

export const toDate = (value?: string | Date | null): Date | undefined => {
  if (!value) return undefined;
  if (value instanceof Date) return value;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

export const sanitize = <T extends Record<string, unknown>>(payload: T): T => {
  const entries = Object.entries(payload).filter(([, value]) => value !== undefined);
  return Object.fromEntries(entries) as T;
};

export const normalisePantryCategory = (category?: string | null): PantryItem['category'] => {
  switch ((category ?? '').toLowerCase()) {
    case 'produce':
    case 'fruits':
    case 'vegetables':
      return 'produce';
    case 'dairy':
      return 'dairy';
    case 'meat':
    case 'protein':
      return 'meat';
    case 'pantry':
    case 'dry-goods':
      return 'pantry';
    default:
      return 'other';
  }
};

export const normaliseMealColumns = (columns: MealPlanData['meal_columns']): MealColumn[] => {
  if (!columns) return DEFAULT_MEAL_COLUMNS;
  if (Array.isArray(columns)) {
    return (columns as MealColumn[]).map((column, index) => ({
      ...column,
      order: column.order ?? index + 1,
    }));
  }
  if (typeof columns === 'object') {
    return Object.entries(columns).map(([id, value], index) => ({
      id,
      name: (value as { name?: string }).name ?? id,
      defaultServings: (value as { defaultServings?: number }).defaultServings ?? 2,
      defaultPeopleCount: (value as { defaultPeopleCount?: number }).defaultPeopleCount ?? 2,
      color: (value as { color?: string }).color ?? '#6366f1',
      icon: (value as { icon?: string }).icon ?? undefined,
      order: (value as { order?: number }).order ?? index + 1,
    }));
  }
  return DEFAULT_MEAL_COLUMNS;
};

export const serializeMealColumns = (columns: MealColumn[]): Record<string, unknown> =>
  Object.fromEntries(columns.map((column) => [column.id, { ...column }]));

// Helper to filter out temporary/optimistic IDs (they start with 'temp-')
export const filterValidMealIds = (ids: string[]): string[] =>
  ids.filter(id => !id.startsWith('temp-'));

// ==================== API to UI Mappers ====================

export function mapRecipeDataToRecipe(data: RecipeData): Recipe {
  return {
    id: data.id ?? crypto.randomUUID(),
    name: data.name,
    description: data.description ?? undefined,
    cuisine: data.cuisine ?? undefined,
    difficulty: (data.difficulty) ?? 'medium',
    prepTime: data.prep_time ?? undefined,
    cookTime: data.cook_time ?? undefined,
    servings: data.servings ?? 1,
    calories: data.calories_per_serving ?? undefined,
    instructions: data.instructions
      ? data.instructions.split('\n').map((line) => line.trim()).filter(Boolean)
      : [],
    ingredients: Array.isArray(data.ingredients)
      ? data.ingredients.map((ing) => ({
          name: ing.name,
          amount: ing.amount ?? undefined,
          unit: ing.unit ?? undefined,
        }))
      : [],
    tags: data.tags ?? [],
    isFavorite: data.is_favorite ?? false,
    dietaryRestrictions: data.dietary_restrictions ?? [],
    nutritionInfo: data.nutrition_info ?? undefined,
    sourceType: (data.source_type as Recipe['sourceType']) ?? undefined,
    sourceUrl: data.source_url ?? undefined,
    videoThumbnail: data.video_thumbnail ?? undefined,
    image: data.video_thumbnail ?? undefined,
    rating: undefined,
    notes: undefined,
    flowChart: [],
    createdAt: toDate(data.created_at) ?? new Date(),
  };
}

export function mapPlannedMealDataToPlannedMeal(data: PlannedMealData): PlannedMeal {
  // Handle date-only strings (yyyy-MM-dd) as local dates
  const d = data.date && data.date.length === 10
    ? new Date(Number(data.date.slice(0, 4)), Number(data.date.slice(5, 7)) - 1, Number(data.date.slice(8, 10)))
    : toDate(data.date);

  const originalDate = data.original_date && data.original_date.length === 10
    ? new Date(Number(data.original_date.slice(0, 4)), Number(data.original_date.slice(5, 7)) - 1, Number(data.original_date.slice(8, 10)))
    : toDate(data.original_date);

  return {
    id: data.id ?? crypto.randomUUID(),
    mealPlanId: data.meal_plan_id ?? 'unknown',
    date: d ?? new Date(),
    mealType: data.meal_type,
    recipeId: data.recipe_id ?? undefined,
    customMeal: data.custom_meal ?? undefined,
    servings: data.servings ?? 1,
    peopleCount: data.people_count ?? 1,
    status: (data.status as PlannedMeal['status']) ?? 'planned',
    notes: data.notes ?? undefined,
    preparedAt: toDate(data.prepared_at),
    consumedAt: toDate(data.consumed_at),
    actualFoodLogId: data.actual_food_log_id ?? undefined,
    substitutedWith: data.substituted_with ?? undefined,
    isPostponed: data.is_postponed ?? false,
    postponedReason: data.postponed_reason ?? undefined,
    originalDate: originalDate ?? undefined,
    createdAt: toDate(data.created_at) ?? new Date(),
  };
}

export function mapMealPlanDataToMealPlanWeek(data: MealPlanData): MealPlanWeek {
  const wsd = data.week_start_date;
  const weekStart = wsd && wsd.length === 10
    ? new Date(Number(wsd.slice(0, 4)), Number(wsd.slice(5, 7)) - 1, Number(wsd.slice(8, 10)))
    : toDate(wsd);

  const mealTypeOrder: Record<string, number> = { breakfast: 0, lunch: 1, dinner: 2, snack: 3 };

  return {
    id: data.id ?? crypto.randomUUID(),
    name: data.name,
    weekStartDate: weekStart ?? new Date(),
    mealColumns: normaliseMealColumns(data.meal_columns),
    meals: (data.planned_meals ?? [])
      .map(mapPlannedMealDataToPlannedMeal)
      .sort((a, b) => {
        const dateDiff = a.date.getTime() - b.date.getTime();
        if (dateDiff !== 0) return dateDiff;
        const mealOrderDiff = (mealTypeOrder[a.mealType] ?? 99) - (mealTypeOrder[b.mealType] ?? 99);
        if (mealOrderDiff !== 0) return mealOrderDiff;
        return a.createdAt.getTime() - b.createdAt.getTime();
      }),
    notes: data.notes ?? undefined,
    shoppingListGenerated: data.shopping_list_generated ?? false,
    totalEstimatedCost: data.total_estimated_cost ?? undefined,
    connectionId: data.connection_id ?? undefined,
    createdAt: toDate(data.created_at) ?? new Date(),
    updatedAt: toDate(data.updated_at) ?? new Date(),
  };
}

export function mapPantryItemDataToPantryItem(data: PantryItemData): PantryItem {
  return {
    id: data.id ?? crypto.randomUUID(),
    name: data.name,
    quantity: Number(data.quantity ?? 0),
    unit: data.unit ?? undefined,
    category: normalisePantryCategory(data.category),
    location: data.location ?? undefined,
    expirationDate: toDate(data.expiration_date),
    notes: data.notes ?? undefined,
    isLowStock: data.is_low_stock ?? undefined,
    lowStockThreshold: data.low_stock_threshold ?? undefined,
    createdAt: toDate(data.created_at) ?? new Date(),
    updatedAt: toDate(data.updated_at) ?? new Date(),
  };
}

export function mapMealTrackingFromAPI(data: MealTrackingData): MealTracking {
  return {
    id: data.id!,
    userId: data.user_id,
    plannedMealId: data.planned_meal_id,
    status: data.status,
    swappedMeal: data.swapped_meal,
    swappedRecipeId: data.swapped_recipe_id,
    servingsConsumed: data.servings_consumed,
    caloriesConsumed: data.calories_consumed,
    notes: data.notes,
    trackedAt: data.tracked_at ? new Date(data.tracked_at) : undefined,
  };
}

export function mapBacklogItemFromAPI(data: MealBacklogData): MealBacklogItem {
  return {
    id: data.id!,
    connectionId: data.connection_id,
    mealName: data.meal_name,
    recipeId: data.recipe_id,
    savedByUserId: data.saved_by_user_id,
    originalDate: data.original_date ? new Date(data.original_date) : undefined,
    originalMealType: data.original_meal_type,
    reason: data.reason,
    servings: data.servings ?? 2,
    peopleCount: data.people_count ?? 2,
    createdAt: data.created_at ? new Date(data.created_at) : new Date(),
  };
}


// ==================== UI to API Payload Builders ====================

export function buildRecipeInsertPayload(input: RecipeInput) {
  return sanitize({
    name: sanitizeInput(input.name),
    description: sanitizeText(input.description ?? ''),
    cuisine: input.cuisine ? sanitizeInput(input.cuisine) : null,
    difficulty: input.difficulty ?? 'medium',
    prep_time: input.prepTime ?? null,
    cook_time: input.cookTime ?? null,
    servings: input.servings ?? 1,
    calories_per_serving: input.calories ?? null,
    instructions: sanitizeArray(input.instructions).join('\n'),
    ingredients: Array.isArray(input.ingredients) && input.ingredients.length > 0
      ? input.ingredients.map((ing) => ({
          name: sanitizeInput(ing.name),
          amount: ing.amount ?? undefined,
          unit: ing.unit ? sanitizeInput(ing.unit) : undefined
        }))
      : null,
    tags: sanitizeArray(input.tags ?? []),
    is_favorite: input.isFavorite ?? false,
    dietary_restrictions: sanitizeArray(input.dietaryRestrictions ?? []),
    nutrition_info: input.nutritionInfo ?? null,
    source_url: input.sourceUrl ? sanitizeInput(input.sourceUrl) : null,
  });
}

export function buildRecipeUpdatePayload(updates: RecipeUpdate) {
  return sanitize({
    name: updates.name ? sanitizeInput(updates.name) : undefined,
    description: updates.description ? sanitizeText(updates.description) : undefined,
    cuisine: updates.cuisine ? sanitizeInput(updates.cuisine) : undefined,
    difficulty: updates.difficulty,
    prep_time: updates.prepTime,
    cook_time: updates.cookTime,
    servings: updates.servings,
    calories_per_serving: updates.calories,
    instructions: updates.instructions ? sanitizeArray(updates.instructions).join('\n') : undefined,
    ingredients: updates.ingredients
      ? updates.ingredients.map((ing) => ({
          name: sanitizeInput(ing.name),
          amount: ing.amount ?? undefined,
          unit: ing.unit ? sanitizeInput(ing.unit) : undefined
        }))
      : undefined,
    tags: updates.tags ? sanitizeArray(updates.tags) : undefined,
    is_favorite: updates.isFavorite,
    dietary_restrictions: updates.dietaryRestrictions ? sanitizeArray(updates.dietaryRestrictions) : undefined,
    nutrition_info: updates.nutritionInfo,
    source_url: updates.sourceUrl !== undefined
      ? (updates.sourceUrl ? sanitizeInput(updates.sourceUrl) : null)
      : undefined,
  });
}

export function buildMealPlanInsertPayload(weekStartDate: Date, name: string) {
  return sanitize({
    name,
    week_start_date: formatDate(weekStartDate, 'yyyy-MM-dd'),
    meal_columns: serializeMealColumns(DEFAULT_MEAL_COLUMNS),
  });
}

export function buildMealPlanUpdatePayload(updates: MealPlanUpdate) {
  return sanitize({
    name: updates.name,
    notes: updates.notes,
    meal_columns: updates.mealColumns ? serializeMealColumns(updates.mealColumns) : undefined,
    shopping_list_generated: updates.shoppingListGenerated,
    total_estimated_cost: updates.totalEstimatedCost,
  });
}

export function buildPlannedMealInsertPayload(planId: string, meal: PlannedMealInput) {
  // If date is already a yyyy-MM-dd string, use it directly to avoid UTC timezone shift.
  // formatDate(new Date('2026-03-11'), ...) treats the ISO string as UTC midnight, which
  // rolls back to the previous day in negative-offset timezones (e.g. US/Pacific UTC-8).
  const dateStr = meal.date instanceof Date
    ? formatDate(meal.date, 'yyyy-MM-dd')
    : meal.date;
  return sanitize({
    meal_plan_id: planId,
    meal_type: meal.mealType,
    date: dateStr,
    recipe_id: meal.recipeId && meal.recipeId.trim() !== '' ? meal.recipeId : null,
    custom_meal: meal.customMeal && meal.customMeal.trim() !== '' ? sanitizeInput(meal.customMeal) : null,
    servings: meal.servings,
    people_count: meal.peopleCount,
    status: meal.status ?? 'planned',
    notes: meal.notes ? sanitizeText(meal.notes) : undefined,
  });
}

export function buildPlannedMealUpdatePayload(updates: PlannedMealUpdate) {
  return sanitize({
    date: updates.date ? formatDate(updates.date, 'yyyy-MM-dd') : undefined,
    meal_type: updates.mealType,
    recipe_id: updates.recipeId !== undefined ? (updates.recipeId?.trim() !== '' ? updates.recipeId : null) : undefined,
    custom_meal: updates.customMeal !== undefined ? (updates.customMeal?.trim() !== '' ? sanitizeInput(updates.customMeal) : null) : undefined,
    servings: updates.servings,
    people_count: updates.peopleCount,
    status: updates.status,
    notes: updates.notes ? sanitizeText(updates.notes) : undefined,
    actual_food_log_id: updates.actualFoodLogId,
    substituted_with: updates.substitutedWith ? sanitizeInput(updates.substitutedWith) : undefined,
    is_postponed: updates.isPostponed,
    postponed_reason: updates.postponedReason ? sanitizeText(updates.postponedReason) : undefined,
    original_date: updates.originalDate ? formatDate(updates.originalDate, 'yyyy-MM-dd') : undefined,
    prepared_at: updates.preparedAt ? updates.preparedAt.toISOString() : undefined,
    consumed_at: updates.consumedAt ? updates.consumedAt.toISOString() : undefined,
  });
}

export function buildPantryItemInsertPayload(item: PantryItemInput) {
  return sanitize({
    name: sanitizeInput(item.name),
    quantity: item.quantity,
    unit: item.unit ? sanitizeInput(item.unit) : null,
    category: item.category,
    location: item.location ? sanitizeInput(item.location) : null,
    expiration_date: item.expirationDate ? item.expirationDate.toISOString() : null,
    notes: item.notes ? sanitizeText(item.notes) : null,
    is_low_stock: item.isLowStock ?? null,
    low_stock_threshold: item.lowStockThreshold ?? null,
  });
}

export function buildPantryItemUpdatePayload(updates: PantryItemUpdate) {
  return sanitize({
    name: updates.name ? sanitizeInput(updates.name) : undefined,
    quantity: updates.quantity,
    unit: updates.unit ? sanitizeInput(updates.unit) : undefined,
    category: updates.category,
    location: updates.location ? sanitizeInput(updates.location) : undefined,
    expiration_date: updates.expirationDate ? updates.expirationDate.toISOString() : undefined,
    notes: updates.notes ? sanitizeText(updates.notes) : undefined,
    is_low_stock: updates.isLowStock,
    low_stock_threshold: updates.lowStockThreshold,
  });
}