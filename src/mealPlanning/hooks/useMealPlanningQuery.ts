/**
 * Meal Planning React Query Hooks
 *
 * Comprehensive hooks for Meal Planning domain covering 4 sub-domains:
 * - Recipes
 * - Meal Plans
 * - Planned Meals
 * - Pantry Items
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../services/apiClient';
import { startOfWeek, format as formatDate } from 'date-fns';
import type {
  RecipeData,
  MealPlanData,
  PlannedMealData,
  PantryItemData,
} from '../../services/types';
import { logger } from '@/services/logger';

// ==================== Types ====================

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
  sourceType?: 'manual' | 'url' | 'ai';
  sourceUrl?: string;
  authorName?: string;
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
  status: 'planned' | 'prepped' | 'cooked' | 'eaten';
  notes?: string;
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
  createdAt: Date;
  updatedAt: Date;
}

export interface PantryItem {
  id: string;
  name: string;
  quantity: number;
  unit?: string;
  category: 'produce' | 'dairy' | 'meat' | 'pantry' | 'other';
  location?: string;
  expirationDate?: Date;
  notes?: string;
  isLowStock?: boolean;
  lowStockThreshold?: number;
  updatedAt: Date;
}

export type RecipeInput = Omit<Recipe, 'id' | 'createdAt'>;
export type RecipeUpdate = Partial<Omit<Recipe, 'id' | 'createdAt'>>;
export type MealPlanInput = Omit<MealPlanWeek, 'id' | 'createdAt' | 'updatedAt' | 'meals'>;
export type MealPlanUpdate = Partial<Omit<MealPlanWeek, 'id' | 'createdAt' | 'updatedAt' | 'meals'>>;
export type PlannedMealInput = Omit<PlannedMeal, 'id' | 'mealPlanId' | 'createdAt'>;
export type PlannedMealUpdate = Partial<Omit<PlannedMeal, 'id' | 'mealPlanId' | 'createdAt'>>;
export type PantryItemInput = Omit<PantryItem, 'id' | 'updatedAt'>;
export type PantryItemUpdate = Partial<Omit<PantryItem, 'id' | 'updatedAt'>>;

// ==================== Query Keys ====================

export const mealPlanningKeys = {
  all: ['mealPlanning'] as const,

  recipes: () => [...mealPlanningKeys.all, 'recipes'] as const,
  recipesList: () => [...mealPlanningKeys.recipes(), 'list'] as const,
  recipeDetail: (id: string) => [...mealPlanningKeys.recipes(), 'detail', id] as const,

  mealPlans: () => [...mealPlanningKeys.all, 'mealPlans'] as const,
  mealPlansList: () => [...mealPlanningKeys.mealPlans(), 'list'] as const,
  mealPlanDetail: (id: string) => [...mealPlanningKeys.mealPlans(), 'detail', id] as const,
  mealPlanForWeek: (weekStart: string) => [...mealPlanningKeys.mealPlans(), 'week', weekStart] as const,

  pantry: () => [...mealPlanningKeys.all, 'pantry'] as const,
  pantryList: () => [...mealPlanningKeys.pantry(), 'list'] as const,
};

// ==================== Mappers ====================

const DEFAULT_MEAL_COLUMNS: MealColumn[] = [
  {
    id: 'breakfast',
    name: 'Breakfast',
    defaultServings: 2,
    defaultPeopleCount: 2,
    color: '#f97316',
    icon: '☀️',
    order: 1,
  },
  {
    id: 'lunch',
    name: 'Lunch',
    defaultServings: 2,
    defaultPeopleCount: 2,
    color: '#10b981',
    icon: '🥗',
    order: 2,
  },
  {
    id: 'dinner',
    name: 'Dinner',
    defaultServings: 4,
    defaultPeopleCount: 4,
    color: '#8b5cf6',
    icon: '🍽️',
    order: 3,
  },
  {
    id: 'snack',
    name: 'Snacks',
    defaultServings: 1,
    defaultPeopleCount: 1,
    color: '#6b7280',
    icon: '🍿',
    order: 4,
  },
];

const toDate = (value?: string | Date | null): Date | undefined => {
  if (!value) return undefined;
  if (value instanceof Date) return value;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

const sanitize = <T extends Record<string, unknown>>(payload: T): T => {
  const entries = Object.entries(payload).filter(([, value]) => value !== undefined);
  return Object.fromEntries(entries) as T;
};

const normalisePantryCategory = (category?: string | null): PantryItem['category'] => {
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

const normaliseMealColumns = (columns: MealPlanData['meal_columns']): MealColumn[] => {
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

const serializeMealColumns = (columns: MealColumn[]): Record<string, unknown> =>
  Object.fromEntries(
    columns.map((column) => [column.id, { ...column }]),
  );

function mapRecipeDataToRecipe(data: RecipeData): Recipe {
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
      ? data.instructions
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean)
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
    authorName: data.author_name ?? undefined,
    videoThumbnail: data.video_thumbnail ?? undefined,
    image: data.video_thumbnail ?? undefined,
    rating: undefined,
    notes: undefined,
    flowChart: [],
    createdAt: toDate(data.created_at) ?? new Date(),
  };
}

function mapPlannedMealDataToPlannedMeal(data: PlannedMealData): PlannedMeal {
  // Handle date-only strings (yyyy-MM-dd) as local dates
  const d = data.date && data.date.length === 10
    ? new Date(Number(data.date.slice(0, 4)), Number(data.date.slice(5, 7)) - 1, Number(data.date.slice(8, 10)))
    : toDate(data.date);

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
    createdAt: toDate(data.created_at) ?? new Date(),
  };
}

function mapMealPlanDataToMealPlanWeek(data: MealPlanData): MealPlanWeek {
  const wsd = data.week_start_date;
  const weekStart = wsd && wsd.length === 10
    ? new Date(Number(wsd.slice(0, 4)), Number(wsd.slice(5, 7)) - 1, Number(wsd.slice(8, 10)))
    : toDate(wsd);

  return {
    id: data.id ?? crypto.randomUUID(),
    name: data.name,
    weekStartDate: weekStart ?? new Date(),
    mealColumns: normaliseMealColumns(data.meal_columns),
    meals: (data.planned_meals ?? []).map(mapPlannedMealDataToPlannedMeal),
    notes: data.notes ?? undefined,
    shoppingListGenerated: data.shopping_list_generated ?? false,
    totalEstimatedCost: data.total_estimated_cost ?? undefined,
    createdAt: toDate(data.created_at) ?? new Date(),
    updatedAt: toDate(data.updated_at) ?? new Date(),
  };
}

function mapPantryItemDataToPantryItem(data: PantryItemData): PantryItem {
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
    updatedAt: toDate(data.updated_at) ?? new Date(),
  };
}

function buildRecipeInsertPayload(input: RecipeInput): Omit<RecipeData, 'id' | 'created_at' | 'updated_at'> {
  return sanitize({
    name: input.name,
    description: input.description ?? '',
    cuisine: input.cuisine ?? null,
    difficulty: input.difficulty ?? 'medium',
    prep_time: input.prepTime ?? null,
    cook_time: input.cookTime ?? null,
    servings: input.servings ?? 1,
    calories_per_serving: input.calories ?? null,
    instructions: input.instructions.join('\n'),
    ingredients: Array.isArray(input.ingredients) && input.ingredients.length > 0
      ? input.ingredients.map((ing) => ({
          name: ing.name,
          amount: ing.amount ?? undefined,
          unit: ing.unit ?? undefined,
        }))
      : null,
    tags: input.tags ?? [],
    is_favorite: input.isFavorite ?? false,
    dietary_restrictions: input.dietaryRestrictions ?? [],
    nutrition_info: input.nutritionInfo ?? null,
    source_type: input.sourceType ?? null,
    source_url: input.sourceUrl ?? null,
    author_name: input.authorName ?? null,
    video_thumbnail: input.videoThumbnail ?? null,
  });
}

function buildRecipeUpdatePayload(updates: RecipeUpdate): Partial<RecipeData> {
  return sanitize({
    name: updates.name,
    description: updates.description,
    cuisine: updates.cuisine,
    difficulty: updates.difficulty,
    prep_time: updates.prepTime,
    cook_time: updates.cookTime,
    servings: updates.servings,
    calories_per_serving: updates.calories,
    instructions: updates.instructions ? updates.instructions.join('\n') : undefined,
    ingredients: updates.ingredients
      ? updates.ingredients.map((ing) => ({
          name: ing.name,
          amount: ing.amount ?? undefined,
          unit: ing.unit ?? undefined,
        }))
      : undefined,
    tags: updates.tags,
    is_favorite: updates.isFavorite,
    dietary_restrictions: updates.dietaryRestrictions,
    nutrition_info: updates.nutritionInfo,
    source_type: updates.sourceType,
    source_url: updates.sourceUrl,
    author_name: updates.authorName,
    video_thumbnail: updates.videoThumbnail,
  });
}

function buildMealPlanInsertPayload(
  weekStartDate: Date,
  name: string,
): Omit<MealPlanData, 'id' | 'created_at' | 'updated_at'> {
  return sanitize({
    name,
    week_start_date: formatDate(weekStartDate, 'yyyy-MM-dd'),
    meal_columns: serializeMealColumns(DEFAULT_MEAL_COLUMNS),
  });
}

function buildMealPlanUpdatePayload(updates: MealPlanUpdate): Partial<MealPlanData> {
  return sanitize({
    name: updates.name,
    notes: updates.notes,
    meal_columns: updates.mealColumns ? serializeMealColumns(updates.mealColumns) : undefined,
    shopping_list_generated: updates.shoppingListGenerated,
    total_estimated_cost: updates.totalEstimatedCost,
  });
}

function buildPlannedMealInsertPayload(
  planId: string,
  meal: PlannedMealInput,
): Omit<PlannedMealData, 'id' | 'created_at' | 'updated_at'> {
  return sanitize({
    meal_plan_id: planId,
    meal_type: meal.mealType,
    date: formatDate(meal.date, 'yyyy-MM-dd'),
    recipe_id: meal.recipeId ?? null,
    custom_meal: meal.customMeal ?? null,
    servings: meal.servings,
    people_count: meal.peopleCount,
    status: meal.status ?? 'planned',
    notes: meal.notes ?? undefined,
  });
}

function buildPlannedMealUpdatePayload(updates: PlannedMealUpdate): Partial<PlannedMealData> {
  return sanitize({
    date: updates.date ? formatDate(updates.date, 'yyyy-MM-dd') : undefined,
    meal_type: updates.mealType,
    recipe_id: updates.recipeId,
    custom_meal: updates.customMeal,
    servings: updates.servings,
    people_count: updates.peopleCount,
    status: updates.status,
    notes: updates.notes,
    prepared_at: updates.preparedAt ? updates.preparedAt.toISOString() : undefined,
    consumed_at: updates.consumedAt ? updates.consumedAt.toISOString() : undefined,
  });
}

function buildPantryItemInsertPayload(
  item: PantryItemInput,
): Omit<PantryItemData, 'id' | 'created_at' | 'updated_at' | 'user_id'> {
  return sanitize({
    name: item.name,
    quantity: item.quantity,
    unit: item.unit ?? null,
    category: item.category,
    location: item.location ?? null,
    expiration_date: item.expirationDate ? item.expirationDate.toISOString() : null,
    notes: item.notes ?? null,
    is_low_stock: item.isLowStock ?? null,
    low_stock_threshold: item.lowStockThreshold ?? null,
  });
}

function buildPantryItemUpdatePayload(updates: PantryItemUpdate): Partial<PantryItemData> {
  return sanitize({
    name: updates.name,
    quantity: updates.quantity,
    unit: updates.unit,
    category: updates.category,
    location: updates.location,
    expiration_date: updates.expirationDate ? updates.expirationDate.toISOString() : undefined,
    notes: updates.notes,
    is_low_stock: updates.isLowStock,
    low_stock_threshold: updates.lowStockThreshold,
  });
}

// ==================== Recipe Queries ====================

/**
 * Fetch all recipes (lazy loaded)
 */
export function useRecipesQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: mealPlanningKeys.recipesList(),
    queryFn: async () => {
      const data = await apiClient.getRecipes();
      return data.map(mapRecipeDataToRecipe);
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
    enabled: options?.enabled ?? true,
  });
}

/**
 * Fetch a single recipe by ID
 */
export function useRecipeQuery(recipeId: string | undefined) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: mealPlanningKeys.recipeDetail(recipeId!),
    queryFn: async () => {
      // Try to get from cache first
      const cachedRecipes = queryClient.getQueryData<Recipe[]>(mealPlanningKeys.recipesList());
      if (cachedRecipes) {
        const cached = cachedRecipes.find(r => r.id === recipeId);
        if (cached) return cached;
      }

      // If not in cache, we'd need a getRecipe endpoint
      throw new Error('Recipe not found in cache and no single-recipe endpoint available');
    },
    enabled: !!recipeId,
    staleTime: 1000 * 60 * 10,
  });
}

// ==================== Recipe Mutations ====================

/**
 * Create a new recipe
 */
export function useCreateRecipeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: RecipeInput) => {
      const payload = buildRecipeInsertPayload(input);
      const created = await apiClient.createRecipe(payload);
      return mapRecipeDataToRecipe(created);
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: mealPlanningKeys.recipesList() });
      const previousRecipes = queryClient.getQueryData<Recipe[]>(mealPlanningKeys.recipesList());

      const optimisticRecipe: Recipe = {
        id: `temp-${Date.now()}`,
        ...input,
        instructions: input.instructions ?? [],
        ingredients: input.ingredients ?? [],
        createdAt: new Date(),
      };

      queryClient.setQueryData<Recipe[]>(mealPlanningKeys.recipesList(), (old) => {
        if (!old) return [optimisticRecipe];
        return [optimisticRecipe, ...old];
      });

      return { previousRecipes };
    },
    onError: (err, variables, context) => {
      if (context?.previousRecipes) {
        queryClient.setQueryData(mealPlanningKeys.recipesList(), context.previousRecipes);
      }
      logger.error('[useCreateRecipeMutation] Error creating recipe:', err);
    },
    onSuccess: (newRecipe) => {
      queryClient.setQueryData<Recipe[]>(mealPlanningKeys.recipesList(), (old) => {
        if (!old) return [newRecipe];
        return old.map((r) => (r.id.startsWith('temp-') ? newRecipe : r));
      });
    },
  });
}

/**
 * Update an existing recipe
 */
export function useUpdateRecipeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ recipeId, updates }: { recipeId: string; updates: RecipeUpdate }) => {
      const payload = buildRecipeUpdatePayload(updates);
      const updated = await apiClient.updateRecipe(recipeId, payload);
      return mapRecipeDataToRecipe(updated);
    },
    onMutate: async ({ recipeId, updates }) => {
      await queryClient.cancelQueries({ queryKey: mealPlanningKeys.recipesList() });
      const previousRecipes = queryClient.getQueryData<Recipe[]>(mealPlanningKeys.recipesList());

      queryClient.setQueryData<Recipe[]>(mealPlanningKeys.recipesList(), (old) => {
        if (!old) return [];
        return old.map((r) => (r.id === recipeId ? { ...r, ...updates } : r));
      });

      return { previousRecipes };
    },
    onError: (err, variables, context) => {
      if (context?.previousRecipes) {
        queryClient.setQueryData(mealPlanningKeys.recipesList(), context.previousRecipes);
      }
      logger.error('[useUpdateRecipeMutation] Error updating recipe:', err);
    },
    onSuccess: (updatedRecipe) => {
      queryClient.setQueryData<Recipe[]>(mealPlanningKeys.recipesList(), (old) => {
        if (!old) return [updatedRecipe];
        return old.map((r) => (r.id === updatedRecipe.id ? updatedRecipe : r));
      });
    },
  });
}

/**
 * Delete a recipe
 */
export function useDeleteRecipeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (recipeId: string) => {
      await apiClient.deleteRecipe(recipeId);
      return recipeId;
    },
    onMutate: async (recipeId) => {
      await queryClient.cancelQueries({ queryKey: mealPlanningKeys.recipesList() });
      const previousRecipes = queryClient.getQueryData<Recipe[]>(mealPlanningKeys.recipesList());

      queryClient.setQueryData<Recipe[]>(mealPlanningKeys.recipesList(), (old) => {
        if (!old) return [];
        return old.filter((r) => r.id !== recipeId);
      });

      return { previousRecipes };
    },
    onError: (err, recipeId, context) => {
      if (context?.previousRecipes) {
        queryClient.setQueryData(mealPlanningKeys.recipesList(), context.previousRecipes);
      }
      logger.error('[useDeleteRecipeMutation] Error deleting recipe:', err);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mealPlanningKeys.recipesList() });
    },
  });
}

/**
 * Delete all recipes (bulk operation)
 */
export function useDeleteAllRecipesMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const recipes = queryClient.getQueryData<Recipe[]>(mealPlanningKeys.recipesList()) || [];

      // Delete sequentially to avoid rate limits
      for (const recipe of recipes) {
        try {
          await apiClient.deleteRecipe(recipe.id);
        } catch (e) {
          logger.warn('Failed to delete recipe', recipe.id, e);
        }
      }
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: mealPlanningKeys.recipesList() });
      const previousRecipes = queryClient.getQueryData<Recipe[]>(mealPlanningKeys.recipesList());

      queryClient.setQueryData<Recipe[]>(mealPlanningKeys.recipesList(), []);

      return { previousRecipes };
    },
    onError: (err, variables, context) => {
      if (context?.previousRecipes) {
        queryClient.setQueryData(mealPlanningKeys.recipesList(), context.previousRecipes);
      }
      logger.error('[useDeleteAllRecipesMutation] Error deleting all recipes:', err);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mealPlanningKeys.recipesList() });
    },
  });
}

// ==================== Meal Plan Queries ====================

/**
 * Fetch all meal plans (lazy loaded)
 */
export function useMealPlansQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: mealPlanningKeys.mealPlansList(),
    queryFn: async () => {
      const data = await apiClient.getMealPlans();
      return data.map(mapMealPlanDataToMealPlanWeek);
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: options?.enabled ?? true,
  });
}

/**
 * Fetch a single meal plan by ID
 */
export function useMealPlanQuery(mealPlanId: string | undefined) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: mealPlanningKeys.mealPlanDetail(mealPlanId!),
    queryFn: async () => {
      const cachedPlans = queryClient.getQueryData<MealPlanWeek[]>(mealPlanningKeys.mealPlansList());
      if (cachedPlans) {
        const cached = cachedPlans.find(p => p.id === mealPlanId);
        if (cached) return cached;
      }

      throw new Error('Meal plan not found in cache and no single-plan endpoint available');
    },
    enabled: !!mealPlanId,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Smart hook to ensure a meal plan exists for a given week
 * Cache-first, creates if missing, handles concurrency
 */
export function useMealPlanForWeek(weekStartDate: Date, weekStartsOn: 0 | 1 = 0) {
  const queryClient = useQueryClient();
  const weekStart = startOfWeek(weekStartDate, { weekStartsOn });
  const weekKey = formatDate(weekStart, 'yyyy-MM-dd');

  return useQuery({
    queryKey: mealPlanningKeys.mealPlanForWeek(weekKey),
    queryFn: async () => {
      // First, check all meal plans cache
      const cachedPlans = queryClient.getQueryData<MealPlanWeek[]>(mealPlanningKeys.mealPlansList());
      if (cachedPlans) {
        const existing = cachedPlans.find((plan) => {
          const planWeekStart = startOfWeek(plan.weekStartDate, { weekStartsOn });
          return formatDate(planWeekStart, 'yyyy-MM-dd') === weekKey;
        });
        if (existing) return existing;
      }

      // If not found, create new plan
      const payload = buildMealPlanInsertPayload(weekStart, 'Meal plan');
      try {
        const created = await apiClient.createMealPlan(payload);
        const plan = mapMealPlanDataToMealPlanWeek(created);

        // Update the meal plans list cache
        queryClient.setQueryData<MealPlanWeek[]>(mealPlanningKeys.mealPlansList(), (old) => {
          if (!old) return [plan];
          const alreadyExists = old.some(p => p.id === plan.id);
          if (alreadyExists) return old;
          return [...old, plan];
        });

        return plan;
      } catch (e) {
        logger.warn('[MealPlanForWeek] Cloud create failed; falling back to local-only plan', e);
        const localPlan: MealPlanWeek = {
          id: `local-${Date.now()}`,
          name: 'Meal plan',
          weekStartDate: weekStart,
          mealColumns: DEFAULT_MEAL_COLUMNS,
          meals: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // Add to cache
        queryClient.setQueryData<MealPlanWeek[]>(mealPlanningKeys.mealPlansList(), (old) => {
          if (!old) return [localPlan];
          return [...old, localPlan];
        });

        return localPlan;
      }
    },
    staleTime: 1000 * 60 * 5,
  });
}

// ==================== Meal Plan Mutations ====================

/**
 * Create a new meal plan
 */
export function useCreateMealPlanMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { weekStartDate: Date; name: string; weekStartsOn?: 0 | 1 }) => {
      const weekStart = startOfWeek(input.weekStartDate, { weekStartsOn: input.weekStartsOn ?? 0 });
      const payload = buildMealPlanInsertPayload(weekStart, input.name);
      const created = await apiClient.createMealPlan(payload);
      return mapMealPlanDataToMealPlanWeek(created);
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: mealPlanningKeys.mealPlansList() });
      const previousPlans = queryClient.getQueryData<MealPlanWeek[]>(mealPlanningKeys.mealPlansList());

      const weekStart = startOfWeek(input.weekStartDate, { weekStartsOn: input.weekStartsOn ?? 0 });
      const optimisticPlan: MealPlanWeek = {
        id: `temp-${Date.now()}`,
        name: input.name,
        weekStartDate: weekStart,
        mealColumns: DEFAULT_MEAL_COLUMNS,
        meals: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      queryClient.setQueryData<MealPlanWeek[]>(mealPlanningKeys.mealPlansList(), (old) => {
        if (!old) return [optimisticPlan];
        return [optimisticPlan, ...old];
      });

      return { previousPlans };
    },
    onError: (err, variables, context) => {
      if (context?.previousPlans) {
        queryClient.setQueryData(mealPlanningKeys.mealPlansList(), context.previousPlans);
      }
      logger.error('[useCreateMealPlanMutation] Error creating meal plan:', err);
    },
    onSuccess: (newPlan) => {
      queryClient.setQueryData<MealPlanWeek[]>(mealPlanningKeys.mealPlansList(), (old) => {
        if (!old) return [newPlan];
        return old.map((p) => (p.id.startsWith('temp-') ? newPlan : p));
      });

      // Also update the week-specific cache
      const weekKey = formatDate(newPlan.weekStartDate, 'yyyy-MM-dd');
      queryClient.setQueryData(mealPlanningKeys.mealPlanForWeek(weekKey), newPlan);
    },
  });
}

/**
 * Update an existing meal plan
 */
export function useUpdateMealPlanMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ mealPlanId, updates }: { mealPlanId: string; updates: MealPlanUpdate }) => {
      const payload = buildMealPlanUpdatePayload(updates);
      const updated = await apiClient.updateMealPlan(mealPlanId, payload);
      return mapMealPlanDataToMealPlanWeek(updated);
    },
    onMutate: async ({ mealPlanId, updates }) => {
      await queryClient.cancelQueries({ queryKey: mealPlanningKeys.mealPlansList() });
      const previousPlans = queryClient.getQueryData<MealPlanWeek[]>(mealPlanningKeys.mealPlansList());

      queryClient.setQueryData<MealPlanWeek[]>(mealPlanningKeys.mealPlansList(), (old) => {
        if (!old) return [];
        return old.map((p) =>
          p.id === mealPlanId
            ? { ...p, ...updates, updatedAt: new Date() }
            : p
        );
      });

      return { previousPlans };
    },
    onError: (err, variables, context) => {
      if (context?.previousPlans) {
        queryClient.setQueryData(mealPlanningKeys.mealPlansList(), context.previousPlans);
      }
      logger.error('[useUpdateMealPlanMutation] Error updating meal plan:', err);
    },
    onSuccess: (updatedPlan) => {
      queryClient.setQueryData<MealPlanWeek[]>(mealPlanningKeys.mealPlansList(), (old) => {
        if (!old) return [updatedPlan];
        return old.map((p) => (p.id === updatedPlan.id ? updatedPlan : p));
      });

      // Update week-specific cache
      const weekKey = formatDate(updatedPlan.weekStartDate, 'yyyy-MM-dd');
      queryClient.setQueryData(mealPlanningKeys.mealPlanForWeek(weekKey), updatedPlan);
    },
  });
}

/**
 * Delete a meal plan
 */
export function useDeleteMealPlanMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (mealPlanId: string) => {
      await apiClient.deleteMealPlan(mealPlanId);
      return mealPlanId;
    },
    onMutate: async (mealPlanId) => {
      await queryClient.cancelQueries({ queryKey: mealPlanningKeys.mealPlansList() });
      const previousPlans = queryClient.getQueryData<MealPlanWeek[]>(mealPlanningKeys.mealPlansList());

      queryClient.setQueryData<MealPlanWeek[]>(mealPlanningKeys.mealPlansList(), (old) => {
        if (!old) return [];
        return old.filter((p) => p.id !== mealPlanId);
      });

      return { previousPlans };
    },
    onError: (err, mealPlanId, context) => {
      if (context?.previousPlans) {
        queryClient.setQueryData(mealPlanningKeys.mealPlansList(), context.previousPlans);
      }
      logger.error('[useDeleteMealPlanMutation] Error deleting meal plan:', err);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mealPlanningKeys.mealPlansList() });
    },
  });
}

// ==================== Planned Meal Mutations ====================

/**
 * Add a planned meal to a meal plan
 */
export function useCreatePlannedMealMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ planId, meal }: { planId: string; meal: PlannedMealInput }) => {
      const payload = buildPlannedMealInsertPayload(planId, meal);
      const created = await apiClient.createPlannedMeal(payload);
      return mapPlannedMealDataToPlannedMeal(created);
    },
    onMutate: async ({ planId, meal }) => {
      await queryClient.cancelQueries({ queryKey: mealPlanningKeys.mealPlansList() });
      const previousPlans = queryClient.getQueryData<MealPlanWeek[]>(mealPlanningKeys.mealPlansList());

      const optimisticMeal: PlannedMeal = {
        id: `temp-${Date.now()}`,
        mealPlanId: planId,
        ...meal,
        createdAt: new Date(),
      };

      queryClient.setQueryData<MealPlanWeek[]>(mealPlanningKeys.mealPlansList(), (old) => {
        if (!old) return [];
        return old.map((plan) =>
          plan.id === planId
            ? { ...plan, meals: [...plan.meals, optimisticMeal], updatedAt: new Date() }
            : plan
        );
      });

      return { previousPlans };
    },
    onError: (err, variables, context) => {
      if (context?.previousPlans) {
        queryClient.setQueryData(mealPlanningKeys.mealPlansList(), context.previousPlans);
      }
      logger.error('[useCreatePlannedMealMutation] Error creating planned meal:', err);
    },
    onSuccess: (newMeal) => {
      queryClient.setQueryData<MealPlanWeek[]>(mealPlanningKeys.mealPlansList(), (old) => {
        if (!old) return [];
        return old.map((plan) =>
          plan.id === newMeal.mealPlanId
            ? {
                ...plan,
                meals: plan.meals.map((m) => (m.id.startsWith('temp-') ? newMeal : m)),
                updatedAt: new Date(),
              }
            : plan
        );
      });
    },
  });
}

/**
 * Update a planned meal
 */
export function useUpdatePlannedMealMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ mealId, updates }: { mealId: string; updates: PlannedMealUpdate }) => {
      const payload = buildPlannedMealUpdatePayload(updates);
      await apiClient.updatePlannedMeal(mealId, payload);
      return { mealId, updates };
    },
    onMutate: async ({ mealId, updates }) => {
      await queryClient.cancelQueries({ queryKey: mealPlanningKeys.mealPlansList() });
      const previousPlans = queryClient.getQueryData<MealPlanWeek[]>(mealPlanningKeys.mealPlansList());

      queryClient.setQueryData<MealPlanWeek[]>(mealPlanningKeys.mealPlansList(), (old) => {
        if (!old) return [];
        return old.map((plan) => ({
          ...plan,
          meals: plan.meals.map((m) =>
            m.id === mealId ? { ...m, ...updates } : m
          ),
          updatedAt: new Date(),
        }));
      });

      return { previousPlans };
    },
    onError: (err, variables, context) => {
      if (context?.previousPlans) {
        queryClient.setQueryData(mealPlanningKeys.mealPlansList(), context.previousPlans);
      }
      logger.error('[useUpdatePlannedMealMutation] Error updating planned meal:', err);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mealPlanningKeys.mealPlansList() });
    },
  });
}

/**
 * Delete a planned meal
 */
export function useDeletePlannedMealMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (mealId: string) => {
      await apiClient.deletePlannedMeal(mealId);
      return mealId;
    },
    onMutate: async (mealId) => {
      await queryClient.cancelQueries({ queryKey: mealPlanningKeys.mealPlansList() });
      const previousPlans = queryClient.getQueryData<MealPlanWeek[]>(mealPlanningKeys.mealPlansList());

      queryClient.setQueryData<MealPlanWeek[]>(mealPlanningKeys.mealPlansList(), (old) => {
        if (!old) return [];
        return old.map((plan) => ({
          ...plan,
          meals: plan.meals.filter((m) => m.id !== mealId),
        }));
      });

      return { previousPlans };
    },
    onError: (err, mealId, context) => {
      if (context?.previousPlans) {
        queryClient.setQueryData(mealPlanningKeys.mealPlansList(), context.previousPlans);
      }
      logger.error('[useDeletePlannedMealMutation] Error deleting planned meal:', err);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mealPlanningKeys.mealPlansList() });
    },
  });
}

// ==================== Pantry Queries ====================

/**
 * Fetch all pantry items
 */
export function usePantryItemsQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: mealPlanningKeys.pantryList(),
    queryFn: async () => {
      const data = await apiClient.getPantryItems();
      return data.map(mapPantryItemDataToPantryItem);
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: options?.enabled ?? true,
  });
}

// ==================== Pantry Mutations ====================

/**
 * Create a new pantry item
 */
export function useCreatePantryItemMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: PantryItemInput) => {
      const payload = buildPantryItemInsertPayload(input);
      const created = await apiClient.createPantryItem(payload);
      return mapPantryItemDataToPantryItem(created);
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: mealPlanningKeys.pantryList() });
      const previousItems = queryClient.getQueryData<PantryItem[]>(mealPlanningKeys.pantryList());

      const optimisticItem: PantryItem = {
        id: `temp-${Date.now()}`,
        ...input,
        updatedAt: new Date(),
      };

      queryClient.setQueryData<PantryItem[]>(mealPlanningKeys.pantryList(), (old) => {
        if (!old) return [optimisticItem];
        return [optimisticItem, ...old];
      });

      return { previousItems };
    },
    onError: (err, variables, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData(mealPlanningKeys.pantryList(), context.previousItems);
      }
      logger.error('[useCreatePantryItemMutation] Error creating pantry item:', err);
    },
    onSuccess: (newItem) => {
      queryClient.setQueryData<PantryItem[]>(mealPlanningKeys.pantryList(), (old) => {
        if (!old) return [newItem];
        return old.map((item) => (item.id.startsWith('temp-') ? newItem : item));
      });
    },
  });
}

/**
 * Update a pantry item
 */
export function useUpdatePantryItemMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemId, updates }: { itemId: string; updates: PantryItemUpdate }) => {
      const payload = buildPantryItemUpdatePayload(updates);
      const updated = await apiClient.updatePantryItem(itemId, payload);
      return mapPantryItemDataToPantryItem(updated);
    },
    onMutate: async ({ itemId, updates }) => {
      await queryClient.cancelQueries({ queryKey: mealPlanningKeys.pantryList() });
      const previousItems = queryClient.getQueryData<PantryItem[]>(mealPlanningKeys.pantryList());

      queryClient.setQueryData<PantryItem[]>(mealPlanningKeys.pantryList(), (old) => {
        if (!old) return [];
        return old.map((item) =>
          item.id === itemId
            ? { ...item, ...updates, updatedAt: new Date() }
            : item
        );
      });

      return { previousItems };
    },
    onError: (err, variables, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData(mealPlanningKeys.pantryList(), context.previousItems);
      }
      logger.error('[useUpdatePantryItemMutation] Error updating pantry item:', err);
    },
    onSuccess: (updatedItem) => {
      queryClient.setQueryData<PantryItem[]>(mealPlanningKeys.pantryList(), (old) => {
        if (!old) return [updatedItem];
        return old.map((item) => (item.id === updatedItem.id ? updatedItem : item));
      });
    },
  });
}

/**
 * Delete a pantry item
 */
export function useDeletePantryItemMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (itemId: string) => {
      await apiClient.deletePantryItem(itemId);
      return itemId;
    },
    onMutate: async (itemId) => {
      await queryClient.cancelQueries({ queryKey: mealPlanningKeys.pantryList() });
      const previousItems = queryClient.getQueryData<PantryItem[]>(mealPlanningKeys.pantryList());

      queryClient.setQueryData<PantryItem[]>(mealPlanningKeys.pantryList(), (old) => {
        if (!old) return [];
        return old.filter((item) => item.id !== itemId);
      });

      return { previousItems };
    },
    onError: (err, itemId, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData(mealPlanningKeys.pantryList(), context.previousItems);
      }
      logger.error('[useDeletePantryItemMutation] Error deleting pantry item:', err);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mealPlanningKeys.pantryList() });
    },
  });
}

// ==================== Helper Hooks ====================

/**
 * Get recipes filtered by tags or favorites
 */
export function useFilteredRecipes(options?: {
  tags?: string[];
  favoritesOnly?: boolean;
}) {
  const { data: recipes = [], ...rest } = useRecipesQuery();

  const filtered = recipes.filter((recipe) => {
    if (options?.favoritesOnly && !recipe.isFavorite) return false;
    if (options?.tags && options.tags.length > 0) {
      return options.tags.some((tag) => recipe.tags?.includes(tag));
    }
    return true;
  });

  return { data: filtered, ...rest };
}

/**
 * Get pantry items filtered by category or low stock
 */
export function useFilteredPantryItems(options?: {
  category?: PantryItem['category'];
  lowStockOnly?: boolean;
}) {
  const { data: items = [], ...rest } = usePantryItemsQuery();

  const filtered = items.filter((item) => {
    if (options?.category && item.category !== options.category) return false;
    if (options?.lowStockOnly && !item.isLowStock) return false;
    return true;
  });

  return { data: filtered, ...rest };
}
