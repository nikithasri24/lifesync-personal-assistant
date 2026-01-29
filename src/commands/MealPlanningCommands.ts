/**
 * Meal Planning Commands - Reversible meal planning operations
 *
 * Implements Command Pattern for meal create, update, delete, move operations.
 */

import type { Command } from '../contexts/UndoRedoContext';
import type { PlannedMeal } from '../types';
import * as mealPlanningAPI from '../api/mealPlanningAPI';
import { logger } from '../services/logger';
import { queryClient } from '../lib/react-query';
import { mealPlanningKeys } from '../hooks/useMealPlanningQuery';

// Helper to invalidate meal planning queries
const invalidateMealPlanning = async () => {
  await queryClient.invalidateQueries({ queryKey: mealPlanningKeys.mealPlansList() });
};

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
    await mealPlanningAPI.updatePlannedMeal(this.mealId, this.updates as any);
    await invalidateMealPlanning();
  }

  async undo(): Promise<void> {
    logger.debug('MealPlanning', '[UpdatePlannedMealCommand] Undoing', { mealId: this.mealId, previousState: this.previousState });
    await mealPlanningAPI.updatePlannedMeal(this.mealId, this.previousState as any);
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
    const updates: any = {
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
    const updates: any = {
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

