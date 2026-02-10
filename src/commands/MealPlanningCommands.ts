/**
 * Meal Planning Commands - Reversible meal planning operations
 *
 * Implements Command Pattern for meal create, update, delete, move operations.
 */

import type { Command } from '../contexts/UndoRedoContext';
import type { PlannedMeal, Recipe } from '../types';
import type { PlannedMealInput, MealTracking } from '../hooks/useMealPlanningQuery';
import type { MealTrackingStatus, PlannedMealData } from '../services/types';
import * as mealPlanningAPI from '../api/mealPlanningAPI';
import { logger } from '../services/logger';
import { queryClient } from '../lib/react-query';
import { mealPlanningKeys } from '../hooks/useMealPlanningQuery';
import { buildPlannedMealUpdatePayload } from '../hooks/mealPlanning/mappers';

// Helper to invalidate meal planning queries
const invalidateMealPlanning = async () => {
  await queryClient.invalidateQueries({ queryKey: mealPlanningKeys.mealPlansList() });
};

// Helper to invalidate recipe queries
const invalidateRecipes = async () => {
  await queryClient.invalidateQueries({ queryKey: mealPlanningKeys.recipes() });
};

// Helper to invalidate backlog queries
const invalidateBacklog = async () => {
  await queryClient.invalidateQueries({ queryKey: mealPlanningKeys.backlog() });
};

// Helper to convert Recipe (UI type) to API payload (RecipeData)
// Handles type conversions: instructions (string[] -> string), nutritionInfo (Record<string,unknown> -> Record<string,number>)
function recipeToApiPayload(recipe: Partial<Recipe>): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  if (recipe.name !== undefined) payload.name = recipe.name;
  if (recipe.description !== undefined) payload.description = recipe.description;
  if (recipe.cuisine !== undefined) payload.cuisine = recipe.cuisine;
  if (recipe.difficulty !== undefined) payload.difficulty = recipe.difficulty;
  if (recipe.prepTime !== undefined) payload.prep_time = recipe.prepTime;
  if (recipe.cookTime !== undefined) payload.cook_time = recipe.cookTime;
  if (recipe.servings !== undefined) payload.servings = recipe.servings;
  if (recipe.calories !== undefined) payload.calories_per_serving = recipe.calories;
  if (recipe.instructions !== undefined) payload.instructions = recipe.instructions.join('\n');
  if (recipe.ingredients !== undefined) payload.ingredients = recipe.ingredients;
  if (recipe.tags !== undefined) payload.tags = recipe.tags;
  if (recipe.isFavorite !== undefined) payload.is_favorite = recipe.isFavorite;
  if (recipe.dietaryRestrictions !== undefined) payload.dietary_restrictions = recipe.dietaryRestrictions;
  if (recipe.nutritionInfo !== undefined) payload.nutrition_info = recipe.nutritionInfo as Record<string, number>;
  if (recipe.sourceType !== undefined) payload.source_type = recipe.sourceType;
  if (recipe.sourceUrl !== undefined) payload.source_url = recipe.sourceUrl;
  if (recipe.videoThumbnail !== undefined) payload.video_thumbnail = recipe.videoThumbnail;
  if (recipe.image !== undefined) payload.image = recipe.image;
  if (recipe.rating !== undefined) payload.rating = recipe.rating;
  if (recipe.notes !== undefined) payload.notes = recipe.notes;
  if (recipe.flowChart !== undefined) payload.flow_chart = recipe.flowChart;
  return payload;
}

/**
 * Update Planned Meal Command
 */
export class UpdatePlannedMealCommand implements Command {
  id: string;
  description: string;
  timestamp: number;
  private mealId: string;
  private updates: Partial<PlannedMeal>;
  private previousState: Partial<PlannedMeal>;

  constructor(mealId: string, mealName: string, updates: Partial<PlannedMeal>, previousState: Partial<PlannedMeal>) {
    this.id = `update-meal-${mealId}-${Date.now()}`;
    this.description = `Update meal: ${mealName}`;
    this.timestamp = Date.now();
    this.mealId = mealId;
    this.updates = updates;
    this.previousState = previousState;
  }

  async execute(): Promise<void> {
    logger.debug('MealPlanning', '[UpdatePlannedMealCommand] Executing', { mealId: this.mealId, updates: this.updates });
    const payload = buildPlannedMealUpdatePayload(this.updates);
    await mealPlanningAPI.updatePlannedMeal(this.mealId, payload);
    await invalidateMealPlanning();
  }

  async undo(): Promise<void> {
    logger.debug('MealPlanning', '[UpdatePlannedMealCommand] Undoing', { mealId: this.mealId, previousState: this.previousState });
    const payload = buildPlannedMealUpdatePayload(this.previousState);
    await mealPlanningAPI.updatePlannedMeal(this.mealId, payload);
    await invalidateMealPlanning();
  }
}

/**
 * Delete Planned Meal Command
 */
export class DeletePlannedMealCommand implements Command {
  id: string;
  description: string;
  timestamp: number;
  private meal: PlannedMeal;
  private planId: string;
  private currentMealId: string; // Track the current ID (may change after undo/redo)

  constructor(meal: PlannedMeal, planId: string) {
    this.id = `delete-meal-${meal.id}-${Date.now()}`;
    this.description = `Delete meal: ${meal.customMeal || 'meal'}`;
    this.timestamp = Date.now();
    this.meal = { ...meal };
    this.planId = planId;
    this.currentMealId = meal.id;
  }

  async execute(): Promise<void> {
    logger.debug('MealPlanning', '[DeletePlannedMealCommand] Executing', { mealId: this.currentMealId });
    await mealPlanningAPI.deletePlannedMeal(this.currentMealId);
    await invalidateMealPlanning();
  }

  async undo(): Promise<void> {
    logger.debug('MealPlanning', '[DeletePlannedMealCommand] Undoing - recreating meal', { originalMealId: this.meal.id });
    // Recreate the meal
    const { id, createdAt, ...mealData } = this.meal;
    const newMeal = await mealPlanningAPI.createPlannedMeal({
      meal_plan_id: this.planId,
      date: mealData.date.toISOString().split('T')[0],
      meal_type: mealData.mealType,
      recipe_id: mealData.recipeId,
      custom_meal: mealData.customMeal,
      servings: mealData.servings,
      people_count: mealData.peopleCount,
      status: mealData.status,
      notes: mealData.notes,
      actual_food_log_id: mealData.actualFoodLogId,
      substituted_with: mealData.substitutedWith,
      is_postponed: mealData.isPostponed || false,
      postponed_reason: mealData.postponedReason,
      original_date: mealData.originalDate?.toISOString().split('T')[0],
    });
    // Update the current meal ID to the new one so redo works correctly
    if (newMeal.id) {
      this.currentMealId = newMeal.id;
      logger.debug('MealPlanning', '[DeletePlannedMealCommand] Meal recreated with new ID', { newMealId: this.currentMealId });
    }
    await invalidateMealPlanning();
  }
}

/**
 * Move Planned Meal Command (drag and drop to different date/mealType)
 */
export class MovePlannedMealCommand implements Command {
  id: string;
  description: string;
  timestamp: number;
  private mealId: string;
  private mealName: string;
  private newDate: Date;
  private newMealType: string;
  private previousDate: Date;
  private previousMealType: string;
  private wasPostponed: boolean;

  constructor(
    mealId: string,
    mealName: string,
    newDate: Date,
    newMealType: string,
    previousDate: Date,
    previousMealType: string,
    wasPostponed: boolean = false
  ) {
    this.id = `move-meal-${mealId}-${Date.now()}`;
    this.description = wasPostponed
      ? `Reschedule meal: ${mealName}`
      : `Move meal: ${mealName}`;
    this.timestamp = Date.now();
    this.mealId = mealId;
    this.mealName = mealName;
    this.newDate = newDate;
    this.newMealType = newMealType;
    this.previousDate = previousDate;
    this.previousMealType = previousMealType;
    this.wasPostponed = wasPostponed;
  }

  async execute(): Promise<void> {
    logger.debug('MealPlanning', '[MovePlannedMealCommand] Executing', {
      mealId: this.mealId,
      newDate: this.newDate,
      newMealType: this.newMealType
    });
    const updates: Partial<PlannedMealData> = {
      date: this.newDate.toISOString().split('T')[0],
      meal_type: this.newMealType,
    };
    if (this.wasPostponed) {
      updates.is_postponed = false;
      updates.status = 'planned';
      updates.postponed_reason = null;
    }
    await mealPlanningAPI.updatePlannedMeal(this.mealId, updates);
    await invalidateMealPlanning();
  }

  async undo(): Promise<void> {
    logger.debug('MealPlanning', '[MovePlannedMealCommand] Undoing', {
      mealId: this.mealId,
      previousDate: this.previousDate
    });
    const updates: Partial<PlannedMealData> = {
      date: this.previousDate.toISOString().split('T')[0],
      meal_type: this.previousMealType,
    };
    if (this.wasPostponed) {
      updates.is_postponed = true;
      updates.status = 'postponed';
    }
    await mealPlanningAPI.updatePlannedMeal(this.mealId, updates);
    await invalidateMealPlanning();
  }
}

/**
 * Create Planned Meal Command
 */
export class CreatePlannedMealCommand implements Command {
  id: string;
  description: string;
  timestamp: number;
  private planId: string;
  private meal: PlannedMealInput;
  private mealName: string;
  private createdMealId: string | null = null;

  constructor(planId: string, meal: PlannedMealInput, mealName: string) {
    this.id = `create-meal-${Date.now()}`;
    this.description = `Add meal: ${mealName}`;
    this.timestamp = Date.now();
    this.planId = planId;
    this.meal = meal;
    this.mealName = mealName;
  }

  async execute(): Promise<void> {
    logger.debug('MealPlanning', '[CreatePlannedMealCommand] Executing', { planId: this.planId, meal: this.mealName });
    const created = await mealPlanningAPI.createPlannedMeal({
      meal_plan_id: this.planId,
      date: this.meal.date instanceof Date ? this.meal.date.toISOString().split('T')[0] : this.meal.date,
      meal_type: this.meal.mealType,
      recipe_id: this.meal.recipeId,
      custom_meal: this.meal.customMeal,
      servings: this.meal.servings ?? 2,
      people_count: this.meal.peopleCount ?? 2,
      status: this.meal.status ?? 'planned',
      notes: this.meal.notes,
    });
    this.createdMealId = created.id ?? null;
    logger.debug('MealPlanning', '[CreatePlannedMealCommand] Created meal with ID', { mealId: this.createdMealId });
    await invalidateMealPlanning();
  }

  async undo(): Promise<void> {
    if (!this.createdMealId) {
      logger.warn('MealPlanning', '[CreatePlannedMealCommand] Cannot undo - no meal ID');
      return;
    }
    logger.debug('MealPlanning', '[CreatePlannedMealCommand] Undoing - deleting meal', { mealId: this.createdMealId });
    await mealPlanningAPI.deletePlannedMeal(this.createdMealId);
    await invalidateMealPlanning();
  }

  /** Get the created meal ID (for chaining commands) */
  getCreatedMealId(): string | null {
    return this.createdMealId;
  }
}

/**
 * Create Recipe Command
 */
export class CreateRecipeCommand implements Command {
  id: string;
  description: string;
  timestamp: number;
  private recipe: Partial<Recipe>;
  private createdRecipeId: string | null = null;

  constructor(recipe: Partial<Recipe>) {
    this.id = `create-recipe-${Date.now()}`;
    this.description = `Create recipe: ${recipe.name || 'New recipe'}`;
    this.timestamp = Date.now();
    this.recipe = recipe;
  }

  async execute(): Promise<void> {
    logger.debug('MealPlanning', '[CreateRecipeCommand] Executing', { name: this.recipe.name });
    const payload = recipeToApiPayload(this.recipe) as Parameters<typeof mealPlanningAPI.createRecipe>[0];
    payload.name = this.recipe.name || 'New Recipe';
    const created = await mealPlanningAPI.createRecipe(payload);
    this.createdRecipeId = created.id ?? null;
    logger.debug('MealPlanning', '[CreateRecipeCommand] Created recipe with ID', { recipeId: this.createdRecipeId });
    await invalidateRecipes();
  }

  async undo(): Promise<void> {
    if (!this.createdRecipeId) {
      logger.warn('MealPlanning', '[CreateRecipeCommand] Cannot undo - no recipe ID');
      return;
    }
    logger.debug('MealPlanning', '[CreateRecipeCommand] Undoing - deleting recipe', { recipeId: this.createdRecipeId });
    await mealPlanningAPI.deleteRecipe(this.createdRecipeId);
    await invalidateRecipes();
  }

  /** Get the created recipe ID */
  getCreatedRecipeId(): string | null {
    return this.createdRecipeId;
  }
}



/**
 * Update Recipe Command
 */
export class UpdateRecipeCommand implements Command {
  id: string;
  description: string;
  timestamp: number;
  private recipeId: string;
  private updates: Partial<Recipe>;
  private previousState: Partial<Recipe>;

  constructor(recipeId: string, recipeName: string, updates: Partial<Recipe>, previousState: Partial<Recipe>) {
    this.id = `update-recipe-${recipeId}-${Date.now()}`;
    this.description = `Update recipe: ${recipeName}`;
    this.timestamp = Date.now();
    this.recipeId = recipeId;
    this.updates = updates;
    this.previousState = previousState;
  }

  async execute(): Promise<void> {
    logger.debug('MealPlanning', '[UpdateRecipeCommand] Executing', { recipeId: this.recipeId });
    await mealPlanningAPI.updateRecipe(this.recipeId, recipeToApiPayload(this.updates));
    await invalidateRecipes();
  }

  async undo(): Promise<void> {
    logger.debug('MealPlanning', '[UpdateRecipeCommand] Undoing', { recipeId: this.recipeId });
    await mealPlanningAPI.updateRecipe(this.recipeId, recipeToApiPayload(this.previousState));
    await invalidateRecipes();
  }
}

/**
 * Delete Recipe Command
 */
export class DeleteRecipeCommand implements Command {
  id: string;
  description: string;
  timestamp: number;
  private recipe: Recipe;
  private currentRecipeId: string;

  constructor(recipe: Recipe) {
    this.id = `delete-recipe-${recipe.id}-${Date.now()}`;
    this.description = `Delete recipe: ${recipe.name}`;
    this.timestamp = Date.now();
    this.recipe = { ...recipe };
    this.currentRecipeId = recipe.id;
  }

  async execute(): Promise<void> {
    logger.debug('MealPlanning', '[DeleteRecipeCommand] Executing', { recipeId: this.currentRecipeId });
    await mealPlanningAPI.deleteRecipe(this.currentRecipeId);
    await invalidateRecipes();
  }

  async undo(): Promise<void> {
    logger.debug('MealPlanning', '[DeleteRecipeCommand] Undoing - recreating recipe', { originalRecipeId: this.recipe.id });
    const { id, createdAt, ...recipeData } = this.recipe;
    // Build API payload and add required name field
    const payload = recipeToApiPayload(recipeData) as Parameters<typeof mealPlanningAPI.createRecipe>[0];
    payload.name = recipeData.name; // Ensure name is included
    const newRecipe = await mealPlanningAPI.createRecipe(payload);
    this.currentRecipeId = newRecipe.id!;
    logger.debug('MealPlanning', '[DeleteRecipeCommand] Recipe recreated with new ID', { newRecipeId: this.currentRecipeId });
    await invalidateRecipes();
  }
}

/**
 * Track Meal Command (eaten, skipped, or swapped)
 */
export class TrackMealCommand implements Command {
  id: string;
  description: string;
  timestamp: number;
  private plannedMealId: string;
  private mealName: string;
  private tracking: {
    status: MealTrackingStatus;
    swappedMeal?: string;
    swappedRecipeId?: string;
    servingsConsumed?: number;
    caloriesConsumed?: number;
    notes?: string;
  };
  private previousTracking: MealTracking | null;
  private createdTrackingId: string | null = null;

  constructor(
    plannedMealId: string,
    mealName: string,
    tracking: {
      status: MealTrackingStatus;
      swappedMeal?: string;
      swappedRecipeId?: string;
      servingsConsumed?: number;
      caloriesConsumed?: number;
      notes?: string;
    },
    previousTracking: MealTracking | null = null
  ) {
    this.id = `track-meal-${plannedMealId}-${Date.now()}`;
    this.description = tracking.status === 'eaten'
      ? `Mark as eaten: ${mealName}`
      : tracking.status === 'skipped'
        ? `Skip meal: ${mealName}`
        : `Swap meal: ${mealName}`;
    this.timestamp = Date.now();
    this.plannedMealId = plannedMealId;
    this.mealName = mealName;
    this.tracking = tracking;
    this.previousTracking = previousTracking;
  }

  async execute(): Promise<void> {
    logger.debug('MealPlanning', '[TrackMealCommand] Executing', {
      plannedMealId: this.plannedMealId,
      status: this.tracking.status
    });
    const result = await mealPlanningAPI.trackMeal(this.plannedMealId, this.tracking);
    this.createdTrackingId = result.id ?? null;
    await invalidateMealPlanning();
  }

  async undo(): Promise<void> {
    logger.debug('MealPlanning', '[TrackMealCommand] Undoing', {
      plannedMealId: this.plannedMealId,
      hadPreviousTracking: !!this.previousTracking
    });

    if (this.previousTracking) {
      // Restore previous tracking state
      await mealPlanningAPI.trackMeal(this.plannedMealId, {
        status: this.previousTracking.status,
        swappedMeal: this.previousTracking.swappedMeal,
        swappedRecipeId: this.previousTracking.swappedRecipeId,
        servingsConsumed: this.previousTracking.servingsConsumed,
        caloriesConsumed: this.previousTracking.caloriesConsumed,
        notes: this.previousTracking.notes,
      });
    } else if (this.createdTrackingId) {
      // Delete the tracking record if it was newly created
      await mealPlanningAPI.deleteMealTracking(this.createdTrackingId);
    }
    await invalidateMealPlanning();
  }
}


/**
 * Add To Backlog Command
 */
export class AddToBacklogCommand implements Command {
  id: string;
  description: string;
  timestamp: number;
  private item: {
    mealName: string;
    recipeId?: string;
    originalDate?: string;
    originalMealType?: string;
    reason?: string;
    servings?: number;
    peopleCount?: number;
  };
  private createdBacklogId: string | null = null;

  constructor(item: {
    mealName: string;
    recipeId?: string;
    originalDate?: string;
    originalMealType?: string;
    reason?: string;
    servings?: number;
    peopleCount?: number;
  }) {
    this.id = `add-backlog-${Date.now()}`;
    this.description = `Save for later: ${item.mealName}`;
    this.timestamp = Date.now();
    this.item = item;
  }

  async execute(): Promise<void> {
    logger.debug('MealPlanning', '[AddToBacklogCommand] Executing', { mealName: this.item.mealName });
    const result = await mealPlanningAPI.addToBacklog(this.item);
    this.createdBacklogId = result.id ?? null;
    await invalidateBacklog();
  }

  async undo(): Promise<void> {
    if (!this.createdBacklogId) {
      logger.warn('MealPlanning', '[AddToBacklogCommand] Cannot undo - no backlog ID');
      return;
    }
    logger.debug('MealPlanning', '[AddToBacklogCommand] Undoing - removing from backlog', { backlogId: this.createdBacklogId });
    await mealPlanningAPI.removeFromBacklog(this.createdBacklogId);
    await invalidateBacklog();
  }

  /** Get the created backlog item ID */
  getCreatedBacklogId(): string | null {
    return this.createdBacklogId;
  }
}

/** Minimal backlog item data needed for UseBacklogItemCommand */
interface BacklogItemData {
  id: string;
  mealName: string;
  recipeId?: string;
  servings?: number;
  peopleCount?: number;
  originalDate?: Date;
  originalMealType?: string;
  reason?: string;
}

/**
 * Use Backlog Item Command (creates planned meal from backlog and removes backlog item)
 */
export class UseBacklogItemCommand implements Command {
  id: string;
  description: string;
  timestamp: number;
  private backlogItem: BacklogItemData;
  private planId: string;
  private date: Date;
  private mealType: string;
  private createdMealId: string | null = null;

  constructor(backlogItem: BacklogItemData, planId: string, date: Date, mealType: string) {
    this.id = `use-backlog-${backlogItem.id}-${Date.now()}`;
    this.description = `Schedule from backlog: ${backlogItem.mealName}`;
    this.timestamp = Date.now();
    this.backlogItem = { ...backlogItem };
    this.planId = planId;
    this.date = date;
    this.mealType = mealType;
  }

  async execute(): Promise<void> {
    logger.debug('MealPlanning', '[UseBacklogItemCommand] Executing', {
      backlogId: this.backlogItem.id,
      date: this.date,
      mealType: this.mealType
    });

    // Create planned meal from backlog item
    const created = await mealPlanningAPI.createPlannedMeal({
      meal_plan_id: this.planId,
      date: this.date.toISOString().split('T')[0],
      meal_type: this.mealType,
      recipe_id: this.backlogItem.recipeId,
      custom_meal: this.backlogItem.recipeId ? undefined : this.backlogItem.mealName,
      servings: this.backlogItem.servings ?? 2,
      people_count: this.backlogItem.peopleCount ?? 2,
      status: 'planned',
    });
    this.createdMealId = created.id ?? null;

    // Remove from backlog
    await mealPlanningAPI.removeFromBacklog(this.backlogItem.id);

    await invalidateMealPlanning();
    await invalidateBacklog();
  }

  async undo(): Promise<void> {
    logger.debug('MealPlanning', '[UseBacklogItemCommand] Undoing', {
      mealId: this.createdMealId,
      backlogItem: this.backlogItem.mealName
    });

    // Delete the created meal
    if (this.createdMealId) {
      await mealPlanningAPI.deletePlannedMeal(this.createdMealId);
    }

    // Recreate the backlog item
    await mealPlanningAPI.addToBacklog({
      mealName: this.backlogItem.mealName,
      recipeId: this.backlogItem.recipeId,
      originalDate: this.backlogItem.originalDate?.toISOString().split('T')[0],
      originalMealType: this.backlogItem.originalMealType,
      reason: this.backlogItem.reason,
      servings: this.backlogItem.servings,
      peopleCount: this.backlogItem.peopleCount,
    });

    await invalidateMealPlanning();
    await invalidateBacklog();
  }
}