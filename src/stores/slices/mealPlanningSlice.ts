/**
 * Meal Planning Store Slice
 *
 * Manages recipes, meal plans, and pantry items state and actions.
 * Extracted from useRealAppStore to improve maintainability.
 */

import { StateCreator } from 'zustand';
import { startOfWeek, formatDate } from 'date-fns';
import { apiClient } from '../../services/apiClient';
import type { Recipe, MealPlanWeek, PlannedMeal, PantryItem, MealColumn } from '../../types';
import { isSupabaseConfigured } from '../../lib/supabase';

const createId = () => Math.random().toString(36).substring(2, 15);

// Helper types
type RecipeData = Awaited<ReturnType<typeof apiClient.getRecipes>>[number];
type MealPlanData = Awaited<ReturnType<typeof apiClient.getMealPlans>>[number];
type PantryItemData = Awaited<ReturnType<typeof apiClient.getPantryItems>>[number];

// Helper function to sanitize objects
const sanitize = (obj: any) => {
  const clean: any = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) clean[k] = v;
  }
  return clean;
};

// Helper: Map RecipeData to Recipe
const mapRecipeDataToRecipe = (recipe: RecipeData): Recipe => ({
  id: recipe.id ?? createId(),
  name: recipe.name,
  description: recipe.description ?? '',
  ingredients: Array.isArray(recipe.ingredients)
    ? recipe.ingredients.map((ing: any) => ({
        name: ing.name,
        amount: ing.amount ?? undefined,
        unit: ing.unit ?? undefined,
      }))
    : [],
  instructions: recipe.instructions
    ? recipe.instructions
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
    : [],
  prepTime: recipe.prep_time ?? 0,
  cookTime: recipe.cook_time ?? 0,
  servings: recipe.servings ?? 1,
  difficulty: (recipe.difficulty as Recipe['difficulty']) ?? 'medium',
  tags: recipe.tags ?? [],
  rating: undefined,
  notes: undefined,
  image: recipe.video_thumbnail ?? undefined,
  calories: recipe.calories_per_serving ?? undefined,
  cuisine: recipe.cuisine ?? undefined,
  dietaryRestrictions: recipe.dietary_restrictions ?? undefined,
  nutritionInfo: recipe.nutrition_info ?? undefined,
  flowChart: [],
  sourceType: (recipe.source_type as Recipe['sourceType']) ?? undefined,
  sourceUrl: recipe.source_url ?? undefined,
  authorName: recipe.author_name ?? undefined,
  videoThumbnail: recipe.video_thumbnail ?? undefined,
  createdAt: recipe.created_at ? new Date(recipe.created_at) : new Date(),
});

// Helper: Build recipe insert payload
const buildRecipeInsertPayload = (
  recipe: Omit<Recipe, 'id' | 'createdAt'>
): Omit<RecipeData, 'id' | 'created_at' | 'updated_at'> =>
  sanitize({
    name: recipe.name,
    description: recipe.description ?? '',
    cuisine: recipe.cuisine ?? null,
    difficulty: recipe.difficulty ?? 'medium',
    prep_time: recipe.prepTime ?? null,
    cook_time: recipe.cookTime ?? null,
    servings: recipe.servings ?? 1,
    calories_per_serving: recipe.calories ?? null,
    instructions: recipe.instructions.join('\n'),
    ingredients: Array.isArray(recipe.ingredients) && recipe.ingredients.length > 0
      ? recipe.ingredients.map((ing) => ({
          name: ing.name,
          amount: ing.amount ?? undefined,
          unit: ing.unit ?? undefined,
        }))
      : null,
    tags: recipe.tags ?? [],
    dietary_restrictions: recipe.dietaryRestrictions ?? [],
    nutrition_info: recipe.nutritionInfo ?? null,
    source_type: recipe.sourceType ?? null,
    source_url: recipe.sourceUrl ?? null,
    author_name: recipe.authorName ?? null,
    video_thumbnail: recipe.videoThumbnail ?? null,
  });

// Helper: Build recipe update payload
const buildRecipeUpdatePayload = (updates: Partial<Recipe>): Partial<RecipeData> =>
  sanitize({
    name: updates.name,
    description: updates.description ?? undefined,
    cuisine: updates.cuisine ?? undefined,
    difficulty: updates.difficulty ?? undefined,
    prep_time: updates.prepTime ?? undefined,
    cook_time: updates.cookTime ?? undefined,
    servings: updates.servings ?? undefined,
    calories_per_serving: updates.calories ?? undefined,
    instructions: updates.instructions ? updates.instructions.join('\n') : undefined,
    ingredients: updates.ingredients
      ? updates.ingredients.map((ing) => ({
          name: ing.name,
          amount: ing.amount ?? undefined,
          unit: ing.unit ?? undefined,
        }))
      : undefined,
    tags: updates.tags ?? undefined,
    dietary_restrictions: updates.dietaryRestrictions ?? undefined,
    nutrition_info: updates.nutritionInfo ?? undefined,
    source_type: updates.sourceType ?? undefined,
    source_url: updates.sourceUrl ?? undefined,
    author_name: updates.authorName ?? undefined,
    video_thumbnail: updates.videoThumbnail ?? undefined,
  });

// Helper: Map MealPlanData to MealPlanWeek
const mapMealPlanDataToMealPlanWeek = (plan: MealPlanData): MealPlanWeek => ({
  id: plan.id ?? createId(),
  name: plan.name ?? 'Week Plan',
  weekStartDate: plan.week_start_date ? new Date(plan.week_start_date) : new Date(),
  mealColumns: (plan.meal_columns as MealColumn[]) ?? [],
  meals: [],
  notes: plan.notes ?? undefined,
  createdAt: plan.created_at ? new Date(plan.created_at) : new Date(),
  updatedAt: plan.updated_at ? new Date(plan.updated_at) : new Date(),
});

// Helper: Map PantryItemData to PantryItem
const mapPantryItemDataToPantryItem = (item: PantryItemData): PantryItem => ({
  id: item.id ?? createId(),
  name: item.name,
  quantity: item.quantity ?? 0,
  unit: item.unit ?? undefined,
  category: (item.category as PantryItem['category']) ?? 'other',
  location: item.location ?? undefined,
  expirationDate: item.expiration_date ? new Date(item.expiration_date) : undefined,
  notes: item.notes ?? undefined,
  isLowStock: item.is_low_stock ?? false,
  lowStockThreshold: item.low_stock_threshold ?? undefined,
  updatedAt: item.updated_at ? new Date(item.updated_at) : new Date(),
});

// Lock to prevent concurrent creation of meal plans for the same week
const creationLocks = new Map<string, Promise<MealPlanWeek>>();

// State interface
export interface MealPlanningSlice {
  // State
  recipes: Recipe[];
  mealPlans: MealPlanWeek[];
  pantryItems: PantryItem[];
  recipesLoaded: boolean;
  recipesLoading: boolean;
  mealPlansLoaded: boolean;
  mealPlansLoading: boolean;
  pantryLoaded: boolean;
  pantryLoading: boolean;

  // Actions - Recipes
  loadRecipes: () => Promise<void>;
  addRecipe: (recipe: Omit<Recipe, 'id' | 'createdAt'>) => Promise<Recipe>;
  updateRecipe: (id: string, updates: Partial<Recipe>) => Promise<void>;
  deleteRecipe: (id: string) => Promise<void>;
  deleteAllRecipes: () => Promise<void>;

  // Actions - Meal Plans
  loadMealPlans: () => Promise<void>;
  ensureMealPlanForWeek: (weekStartDate: Date) => Promise<MealPlanWeek>;
  addPlannedMeal: (
    planId: string,
    meal: Omit<PlannedMeal, 'id' | 'mealPlanId' | 'createdAt'>
  ) => Promise<PlannedMeal>;
  updatePlannedMeal: (mealId: string, updates: Partial<PlannedMeal>) => Promise<void>;
  deletePlannedMeal: (mealId: string) => Promise<void>;

  // Internal setters
  _setRecipes: (recipes: Recipe[]) => void;
  _setMealPlans: (mealPlans: MealPlanWeek[]) => void;
  _setPantryItems: (pantryItems: PantryItem[]) => void;
  _getWeekStartsOn: () => number; // Callback to get weekStartsOn from parent store
}

// Create the slice
export const createMealPlanningSlice: StateCreator<MealPlanningSlice> = (set, get) => ({
  // Initial state
  recipes: [],
  mealPlans: [],
  pantryItems: [],
  recipesLoaded: false,
  recipesLoading: false,
  mealPlansLoaded: false,
  mealPlansLoading: false,
  pantryLoaded: false,
  pantryLoading: false,

  // Internal setters
  _setRecipes: (recipes) => set({ recipes, recipesLoaded: true }),
  _setMealPlans: (mealPlans) => set({ mealPlans, mealPlansLoaded: true }),
  _setPantryItems: (pantryItems) => set({ pantryItems, pantryLoaded: true }),
  _getWeekStartsOn: () => 0, // Default, will be overridden by parent store

  // ==================== Recipes ====================

  loadRecipes: async () => {
    // Don't reload if already loaded or loading
    if (get().recipesLoaded || get().recipesLoading) return;

    if (!isSupabaseConfigured) return;
    set({ recipesLoading: true });
    try {
      const recipesRaw = await apiClient.getRecipes();
      const recipes = recipesRaw.map(mapRecipeDataToRecipe);
      set({ recipes, recipesLoaded: true, recipesLoading: false });
    } catch (e) {
      console.warn('[Store] loadRecipes failed; showing empty list', e);
      set({ recipes: [], recipesLoading: false });
    }
  },

  addRecipe: async (recipeInput) => {
    if (!isSupabaseConfigured) {
      const recipe: Recipe = {
        ...recipeInput,
        id: createId(),
        createdAt: new Date(),
      };
      set((state) => ({ recipes: [...state.recipes, recipe] }));
      return recipe;
    }

    try {
      const payload = buildRecipeInsertPayload(recipeInput);
      const created = await apiClient.createRecipe(payload);
      const recipe = mapRecipeDataToRecipe(created);
      set((state) => ({ recipes: [...state.recipes, recipe] }));
      return recipe;
    } catch (error) {
      console.error('Error creating recipe:', error);
      throw error;
    }
  },

  updateRecipe: async (id, updates) => {
    if (!isSupabaseConfigured) {
      set((state) => ({
        recipes: state.recipes.map((r) => (r.id === id ? { ...r, ...updates } : r)),
      }));
      return;
    }

    try {
      const payload = buildRecipeUpdatePayload(updates);
      const updated = await apiClient.updateRecipe(id, payload);
      const recipe = mapRecipeDataToRecipe(updated);
      set((state) => ({
        recipes: state.recipes.map((r) => (r.id === id ? recipe : r)),
      }));
    } catch (error) {
      console.error('Error updating recipe:', error);
      throw error;
    }
  },

  deleteRecipe: async (id) => {
    if (!isSupabaseConfigured) {
      set((state) => ({ recipes: state.recipes.filter((r) => r.id !== id) }));
      return;
    }

    try {
      await apiClient.deleteRecipe(id);
      set((state) => ({ recipes: state.recipes.filter((r) => r.id !== id) }));
    } catch (e) {
      console.error('Failed to delete recipe', id, e);
      throw e;
    }
  },

  deleteAllRecipes: async () => {
    if (!isSupabaseConfigured) {
      set({ recipes: [] });
      return;
    }

    const state = get();
    for (const r of state.recipes) {
      try {
        await apiClient.deleteRecipe(r.id!);
      } catch (e) {
        console.warn('Failed to delete recipe', r.id, e);
      }
    }
    set({ recipes: [] });
  },

  // ==================== Meal Plans ====================

  loadMealPlans: async () => {
    // Don't reload if already loaded or loading
    if (get().mealPlansLoaded || get().mealPlansLoading) return;

    if (!isSupabaseConfigured) return;
    set({ mealPlansLoading: true });
    try {
      const mealPlansRaw = await apiClient.getMealPlans();
      const mealPlans = mealPlansRaw.map(mapMealPlanDataToMealPlanWeek);
      set({ mealPlans, mealPlansLoaded: true, mealPlansLoading: false });
    } catch (e) {
      console.warn('[Store] loadMealPlans failed; starting with none', e);
      set({ mealPlans: [], mealPlansLoading: false });
    }
  },

  ensureMealPlanForWeek: async (weekStartDate) => {
    const ws = get()._getWeekStartsOn();
    const weekKey = startOfWeek(weekStartDate, { weekStartsOn: ws }).toISOString();

    // Check if there's already a creation in progress for this week
    const ongoing = creationLocks.get(weekKey);
    if (ongoing) {
      return await ongoing;
    }

    // Check if we already have a meal plan for this week
    const existing = get().mealPlans.find((p) => {
      const planWeekKey = startOfWeek(p.weekStartDate, { weekStartsOn: ws }).toISOString();
      return planWeekKey === weekKey;
    });

    if (existing) {
      return existing;
    }

    // Create new meal plan
    const creationPromise = (async () => {
      try {
        const weekStart = startOfWeek(weekStartDate, { weekStartsOn: ws });

        if (!isSupabaseConfigured) {
          const localPlan: MealPlanWeek = {
            id: createId(),
            name: `Week of ${formatDate(weekStart, 'MMM d')}`,
            weekStartDate: weekStart,
            mealColumns: [],
            meals: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          set((state) => ({ mealPlans: [...state.mealPlans, localPlan] }));
          return localPlan;
        }

        const created = await apiClient.createMealPlan({
          name: `Week of ${formatDate(weekStart, 'MMM d')}`,
          week_start_date: formatDate(weekStart, 'yyyy-MM-dd'),
          meal_columns: [],
        });

        const newPlan = mapMealPlanDataToMealPlanWeek(created);
        set((state) => ({ mealPlans: [...state.mealPlans, newPlan] }));
        return newPlan;
      } finally {
        creationLocks.delete(weekKey);
      }
    })();

    creationLocks.set(weekKey, creationPromise);
    return await creationPromise;
  },

  addPlannedMeal: async (planId, mealInput) => {
    if (!isSupabaseConfigured) {
      const meal: PlannedMeal = {
        ...mealInput,
        id: createId(),
        mealPlanId: planId,
        createdAt: new Date(),
      };
      set((state) => ({
        mealPlans: state.mealPlans.map((plan) =>
          plan.id === planId
            ? { ...plan, meals: [...plan.meals, meal] }
            : plan
        ),
      }));
      return meal;
    }

    try {
      const created = await apiClient.addPlannedMeal(planId, {
        date: formatDate(mealInput.date, 'yyyy-MM-dd'),
        meal_type: mealInput.mealType,
        recipe_id: mealInput.recipeId ?? null,
        custom_meal: mealInput.customMeal ?? null,
        servings: mealInput.servings,
        people_count: mealInput.peopleCount,
        status: mealInput.status ?? 'planned',
        notes: mealInput.notes ?? undefined,
      });

      const meal: PlannedMeal = {
        id: created.id ?? createId(),
        mealPlanId: planId,
        date: new Date(created.date!),
        mealType: created.meal_type!,
        recipeId: created.recipe_id ?? undefined,
        customMeal: created.custom_meal ?? undefined,
        servings: created.servings ?? 1,
        peopleCount: created.people_count ?? 1,
        status: (created.status as PlannedMeal['status']) ?? 'planned',
        notes: created.notes ?? undefined,
        createdAt: created.created_at ? new Date(created.created_at) : new Date(),
      };

      set((state) => ({
        mealPlans: state.mealPlans.map((plan) =>
          plan.id === planId
            ? { ...plan, meals: [...plan.meals, meal] }
            : plan
        ),
      }));

      return meal;
    } catch (error) {
      console.error('Error adding planned meal:', error);
      throw error;
    }
  },

  updatePlannedMeal: async (mealId, updates) => {
    const state = get();
    const plan = state.mealPlans.find((p) => p.meals.some((m) => m.id === mealId));
    if (!plan) return;

    if (isSupabaseConfigured) {
      await apiClient.updatePlannedMeal(
        mealId,
        sanitize({
          date: updates.date ? formatDate(updates.date, 'yyyy-MM-dd') : undefined,
          meal_type: updates.mealType,
          recipe_id: updates.recipeId,
          custom_meal: updates.customMeal,
          servings: updates.servings,
          people_count: updates.peopleCount,
          status: updates.status,
          notes: updates.notes,
        })
      );
    }

    set((state) => ({
      mealPlans: state.mealPlans.map((p) =>
        p.id === plan.id
          ? {
              ...p,
              meals: p.meals.map((m) => (m.id === mealId ? { ...m, ...updates } : m)),
            }
          : p
      ),
    }));
  },

  deletePlannedMeal: async (mealId) => {
    if (isSupabaseConfigured) {
      await apiClient.deletePlannedMeal(mealId);
    }
    set((state) => ({
      mealPlans: state.mealPlans.map((plan) => ({
        ...plan,
        meals: plan.meals.filter((meal) => meal.id !== mealId),
      })),
    }));
  },
});
