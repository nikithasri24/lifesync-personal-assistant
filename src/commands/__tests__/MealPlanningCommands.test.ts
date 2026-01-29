/* eslint-disable max-lines */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  UpdatePlannedMealCommand,
  DeletePlannedMealCommand,
  MovePlannedMealCommand,
  CreatePlannedMealCommand,
  CreateRecipeCommand,
  UpdateRecipeCommand,
  DeleteRecipeCommand,
  TrackMealCommand,
  AddToBacklogCommand,
  UseBacklogItemCommand,
} from '../MealPlanningCommands';
import type { PlannedMeal, Recipe } from '../../types';
import type { MealTracking } from '../../hooks/useMealPlanningQuery';

// Mock the mealPlanningAPI module
vi.mock('../../api/mealPlanningAPI', () => ({
  updatePlannedMeal: vi.fn(),
  deletePlannedMeal: vi.fn(),
  createPlannedMeal: vi.fn(),
  createRecipe: vi.fn(),
  updateRecipe: vi.fn(),
  deleteRecipe: vi.fn(),
  trackMeal: vi.fn(),
  deleteMealTracking: vi.fn(),
  addToBacklog: vi.fn(),
  removeFromBacklog: vi.fn(),
}));

// Mock the queryClient
vi.mock('../../lib/react-query', () => ({
  queryClient: {
    invalidateQueries: vi.fn().mockResolvedValue(undefined),
  },
}));

// Mock the mealPlanningKeys
vi.mock('../../hooks/useMealPlanningQuery', () => ({
  mealPlanningKeys: {
    mealPlansList: () => ['mealPlans', 'list'],
    recipes: () => ['mealPlans', 'recipes'],
    backlog: () => ['mealPlans', 'backlog'],
  },
}));

// Import mocked modules after vi.mock calls
import * as mealPlanningAPI from '../../api/mealPlanningAPI';
import { queryClient } from '../../lib/react-query';

describe('MealPlanningCommands', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('UpdatePlannedMealCommand', () => {
    const mockMealId = 'meal-123';
    const mockMealName = 'Test Meal';
    const mockUpdates = { servings: 4, notes: 'Updated notes' };
    const mockPreviousState = { servings: 2, notes: 'Original notes' };

    it('should execute update and invalidate queries', async () => {
      const command = new UpdatePlannedMealCommand(
        mockMealId,
        mockMealName,
        mockUpdates,
        mockPreviousState
      );

      await command.execute();

      expect(mealPlanningAPI.updatePlannedMeal).toHaveBeenCalledWith(mockMealId, mockUpdates);
      expect(queryClient.invalidateQueries).toHaveBeenCalled();
    });

    it('should undo by restoring previous state', async () => {
      const command = new UpdatePlannedMealCommand(
        mockMealId,
        mockMealName,
        mockUpdates,
        mockPreviousState
      );

      await command.undo();

      expect(mealPlanningAPI.updatePlannedMeal).toHaveBeenCalledWith(mockMealId, mockPreviousState);
      expect(queryClient.invalidateQueries).toHaveBeenCalled();
    });

    it('should have correct command properties', () => {
      const command = new UpdatePlannedMealCommand(
        mockMealId,
        mockMealName,
        mockUpdates,
        mockPreviousState
      );

      expect(command.id).toContain('update-meal-meal-123');
      expect(command.description).toBe('Update meal: Test Meal');
      expect(command.timestamp).toBeLessThanOrEqual(Date.now());
    });
  });

  describe('DeletePlannedMealCommand', () => {
    const mockPlanId = 'plan-123';
    const mockMeal: PlannedMeal = {
      id: 'meal-456',
      mealPlanId: mockPlanId,
      date: new Date('2026-01-29'),
      mealType: 'lunch',
      customMeal: 'Pasta Carbonara',
      servings: 2,
      peopleCount: 2,
      status: 'planned',
    };

    it('should execute delete and invalidate queries', async () => {
      const command = new DeletePlannedMealCommand(mockMeal, mockPlanId);

      await command.execute();

      expect(mealPlanningAPI.deletePlannedMeal).toHaveBeenCalledWith('meal-456');
      expect(queryClient.invalidateQueries).toHaveBeenCalled();
    });

    it('should undo by recreating the meal', async () => {
      vi.mocked(mealPlanningAPI.createPlannedMeal).mockResolvedValue({ id: 'meal-789' });

      const command = new DeletePlannedMealCommand(mockMeal, mockPlanId);
      await command.undo();

      expect(mealPlanningAPI.createPlannedMeal).toHaveBeenCalledWith(
        expect.objectContaining({
          meal_plan_id: mockPlanId,
          date: '2026-01-29',
          meal_type: 'lunch',
          custom_meal: 'Pasta Carbonara',
          servings: 2,
          people_count: 2,
          status: 'planned',
        })
      );
      expect(queryClient.invalidateQueries).toHaveBeenCalled();
    });

    it('should track new meal ID after undo for redo', async () => {
      vi.mocked(mealPlanningAPI.createPlannedMeal).mockResolvedValue({ id: 'new-meal-id' });

      const command = new DeletePlannedMealCommand(mockMeal, mockPlanId);
      await command.undo(); // Recreates meal with new ID

      // Clear mocks to check redo behavior
      vi.clearAllMocks();
      await command.execute(); // Should delete the new ID

      expect(mealPlanningAPI.deletePlannedMeal).toHaveBeenCalledWith('new-meal-id');
    });
  });

  describe('MovePlannedMealCommand', () => {
    const mockMealId = 'meal-123';
    const mockMealName = 'Grilled Chicken';
    const mockNewDate = new Date('2026-01-30');
    const mockNewMealType = 'dinner';
    const mockPreviousDate = new Date('2026-01-29');
    const mockPreviousMealType = 'lunch';

    it('should execute move and invalidate queries', async () => {
      const command = new MovePlannedMealCommand(
        mockMealId,
        mockMealName,
        mockNewDate,
        mockNewMealType,
        mockPreviousDate,
        mockPreviousMealType
      );

      await command.execute();

      expect(mealPlanningAPI.updatePlannedMeal).toHaveBeenCalledWith(mockMealId, {
        date: '2026-01-30',
        meal_type: 'dinner',
      });
      expect(queryClient.invalidateQueries).toHaveBeenCalled();
    });

    it('should undo by moving back to previous date/mealType', async () => {
      const command = new MovePlannedMealCommand(
        mockMealId,
        mockMealName,
        mockNewDate,
        mockNewMealType,
        mockPreviousDate,
        mockPreviousMealType
      );

      await command.undo();

      expect(mealPlanningAPI.updatePlannedMeal).toHaveBeenCalledWith(mockMealId, {
        date: '2026-01-29',
        meal_type: 'lunch',
      });
    });

    it('should handle postponed meal reschedule', async () => {
      const command = new MovePlannedMealCommand(
        mockMealId,
        mockMealName,
        mockNewDate,
        mockNewMealType,
        mockPreviousDate,
        mockPreviousMealType,
        true // wasPostponed
      );

      await command.execute();

      expect(mealPlanningAPI.updatePlannedMeal).toHaveBeenCalledWith(mockMealId, {
        date: '2026-01-30',
        meal_type: 'dinner',
        is_postponed: false,
        status: 'planned',
        postponed_reason: null,
      });
    });

    it('should restore postponed state on undo', async () => {
      const command = new MovePlannedMealCommand(
        mockMealId,
        mockMealName,
        mockNewDate,
        mockNewMealType,
        mockPreviousDate,
        mockPreviousMealType,
        true // wasPostponed
      );

      await command.undo();

      expect(mealPlanningAPI.updatePlannedMeal).toHaveBeenCalledWith(mockMealId, {
        date: '2026-01-29',
        meal_type: 'lunch',
        is_postponed: true,
        status: 'postponed',
      });
    });

    it('should have correct description for postponed meals', () => {
      const regularCommand = new MovePlannedMealCommand(
        mockMealId,
        mockMealName,
        mockNewDate,
        mockNewMealType,
        mockPreviousDate,
        mockPreviousMealType,
        false
      );

      const postponedCommand = new MovePlannedMealCommand(
        mockMealId,
        mockMealName,
        mockNewDate,
        mockNewMealType,
        mockPreviousDate,
        mockPreviousMealType,
        true
      );

      expect(regularCommand.description).toBe('Move meal: Grilled Chicken');
      expect(postponedCommand.description).toBe('Reschedule meal: Grilled Chicken');
    });
  });

  describe('CreatePlannedMealCommand', () => {
    const mockPlanId = 'plan-123';
    const mockMealInput = {
      date: new Date('2026-01-29'),
      mealType: 'breakfast' as const,
      customMeal: 'Oatmeal with Berries',
      servings: 1,
      peopleCount: 1,
    };

    it('should execute create and store created ID', async () => {
      vi.mocked(mealPlanningAPI.createPlannedMeal).mockResolvedValue({ id: 'created-meal-id' });

      const command = new CreatePlannedMealCommand(mockPlanId, mockMealInput, 'Oatmeal with Berries');
      await command.execute();

      expect(mealPlanningAPI.createPlannedMeal).toHaveBeenCalledWith(
        expect.objectContaining({
          meal_plan_id: mockPlanId,
          date: '2026-01-29',
          meal_type: 'breakfast',
          custom_meal: 'Oatmeal with Berries',
        })
      );
      expect(command.getCreatedMealId()).toBe('created-meal-id');
      expect(queryClient.invalidateQueries).toHaveBeenCalled();
    });

    it('should undo by deleting the created meal', async () => {
      vi.mocked(mealPlanningAPI.createPlannedMeal).mockResolvedValue({ id: 'created-meal-id' });

      const command = new CreatePlannedMealCommand(mockPlanId, mockMealInput, 'Oatmeal');
      await command.execute();
      vi.clearAllMocks();

      await command.undo();

      expect(mealPlanningAPI.deletePlannedMeal).toHaveBeenCalledWith('created-meal-id');
    });

    it('should not call delete if no meal was created', async () => {
      vi.mocked(mealPlanningAPI.createPlannedMeal).mockResolvedValue({});

      const command = new CreatePlannedMealCommand(mockPlanId, mockMealInput, 'Oatmeal');
      await command.execute();
      vi.clearAllMocks();

      await command.undo();

      expect(mealPlanningAPI.deletePlannedMeal).not.toHaveBeenCalled();
    });
  });

  describe('CreateRecipeCommand', () => {
    const mockRecipe: Partial<Recipe> = {
      name: 'Spaghetti Bolognese',
      description: 'Classic Italian pasta',
      cuisine: 'Italian',
      prepTime: 15,
      cookTime: 30,
      servings: 4,
      instructions: ['Boil pasta', 'Make sauce', 'Combine'],
      ingredients: ['pasta', 'tomatoes', 'beef'],
    };

    it('should execute create and store created ID', async () => {
      vi.mocked(mealPlanningAPI.createRecipe).mockResolvedValue({ id: 'recipe-123' });

      const command = new CreateRecipeCommand(mockRecipe);
      await command.execute();

      expect(mealPlanningAPI.createRecipe).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Spaghetti Bolognese',
          description: 'Classic Italian pasta',
          cuisine: 'Italian',
          prep_time: 15,
          cook_time: 30,
          servings: 4,
          instructions: 'Boil pasta\nMake sauce\nCombine',
          ingredients: ['pasta', 'tomatoes', 'beef'],
        })
      );
      expect(command.getCreatedRecipeId()).toBe('recipe-123');
    });

    it('should undo by deleting the created recipe', async () => {
      vi.mocked(mealPlanningAPI.createRecipe).mockResolvedValue({ id: 'recipe-123' });

      const command = new CreateRecipeCommand(mockRecipe);
      await command.execute();
      vi.clearAllMocks();

      await command.undo();

      expect(mealPlanningAPI.deleteRecipe).toHaveBeenCalledWith('recipe-123');
    });
  });

  describe('UpdateRecipeCommand', () => {
    const mockRecipeId = 'recipe-123';
    const mockRecipeName = 'Spaghetti';
    const mockUpdates: Partial<Recipe> = { name: 'Spaghetti Carbonara', servings: 6 };
    const mockPreviousState: Partial<Recipe> = { name: 'Spaghetti', servings: 4 };

    it('should execute update and invalidate queries', async () => {
      const command = new UpdateRecipeCommand(
        mockRecipeId,
        mockRecipeName,
        mockUpdates,
        mockPreviousState
      );

      await command.execute();

      expect(mealPlanningAPI.updateRecipe).toHaveBeenCalledWith(
        mockRecipeId,
        expect.objectContaining({
          name: 'Spaghetti Carbonara',
          servings: 6,
        })
      );
    });

    it('should undo by restoring previous state', async () => {
      const command = new UpdateRecipeCommand(
        mockRecipeId,
        mockRecipeName,
        mockUpdates,
        mockPreviousState
      );

      await command.undo();

      expect(mealPlanningAPI.updateRecipe).toHaveBeenCalledWith(
        mockRecipeId,
        expect.objectContaining({
          name: 'Spaghetti',
          servings: 4,
        })
      );
    });
  });

  describe('DeleteRecipeCommand', () => {
    const mockRecipe: Recipe = {
      id: 'recipe-789',
      name: 'Chicken Tikka',
      description: 'Indian dish',
      cuisine: 'Indian',
      prepTime: 20,
      cookTime: 25,
      servings: 4,
      calories: 350,
      instructions: ['Marinate', 'Grill'],
      ingredients: ['chicken', 'yogurt', 'spices'],
      tags: ['indian', 'grilled'],
      isFavorite: true,
      createdAt: new Date('2026-01-01'),
    };

    it('should execute delete', async () => {
      const command = new DeleteRecipeCommand(mockRecipe);
      await command.execute();

      expect(mealPlanningAPI.deleteRecipe).toHaveBeenCalledWith('recipe-789');
    });

    it('should undo by recreating the recipe', async () => {
      vi.mocked(mealPlanningAPI.createRecipe).mockResolvedValue({ id: 'new-recipe-id' });

      const command = new DeleteRecipeCommand(mockRecipe);
      await command.undo();

      expect(mealPlanningAPI.createRecipe).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Chicken Tikka',
          description: 'Indian dish',
          cuisine: 'Indian',
        })
      );
    });

    it('should track new recipe ID after undo for redo', async () => {
      vi.mocked(mealPlanningAPI.createRecipe).mockResolvedValue({ id: 'new-recipe-id' });

      const command = new DeleteRecipeCommand(mockRecipe);
      await command.undo();
      vi.clearAllMocks();

      await command.execute();

      expect(mealPlanningAPI.deleteRecipe).toHaveBeenCalledWith('new-recipe-id');
    });
  });

  describe('TrackMealCommand', () => {
    const mockPlannedMealId = 'planned-meal-123';
    const mockMealName = 'Grilled Salmon';

    it('should execute tracking for eaten meal', async () => {
      vi.mocked(mealPlanningAPI.trackMeal).mockResolvedValue({ id: 'tracking-123' });

      const command = new TrackMealCommand(
        mockPlannedMealId,
        mockMealName,
        { status: 'eaten', servingsConsumed: 1 },
        null
      );

      await command.execute();

      expect(mealPlanningAPI.trackMeal).toHaveBeenCalledWith(mockPlannedMealId, {
        status: 'eaten',
        servingsConsumed: 1,
      });
    });

    it('should execute tracking for skipped meal', async () => {
      vi.mocked(mealPlanningAPI.trackMeal).mockResolvedValue({ id: 'tracking-456' });

      const command = new TrackMealCommand(
        mockPlannedMealId,
        mockMealName,
        { status: 'skipped', notes: 'Not hungry' },
        null
      );

      await command.execute();

      expect(mealPlanningAPI.trackMeal).toHaveBeenCalledWith(mockPlannedMealId, {
        status: 'skipped',
        notes: 'Not hungry',
      });
    });

    it('should execute tracking for swapped meal', async () => {
      vi.mocked(mealPlanningAPI.trackMeal).mockResolvedValue({ id: 'tracking-789' });

      const command = new TrackMealCommand(
        mockPlannedMealId,
        mockMealName,
        { status: 'swapped', swappedMeal: 'Pizza', swappedRecipeId: 'recipe-pizza' },
        null
      );

      await command.execute();

      expect(mealPlanningAPI.trackMeal).toHaveBeenCalledWith(mockPlannedMealId, {
        status: 'swapped',
        swappedMeal: 'Pizza',
        swappedRecipeId: 'recipe-pizza',
      });
    });

    it('should undo by deleting tracking when no previous tracking', async () => {
      vi.mocked(mealPlanningAPI.trackMeal).mockResolvedValue({ id: 'tracking-123' });

      const command = new TrackMealCommand(
        mockPlannedMealId,
        mockMealName,
        { status: 'eaten' },
        null
      );

      await command.execute();
      vi.clearAllMocks();
      await command.undo();

      expect(mealPlanningAPI.deleteMealTracking).toHaveBeenCalledWith('tracking-123');
    });

    it('should undo by restoring previous tracking state', async () => {
      vi.mocked(mealPlanningAPI.trackMeal).mockResolvedValue({ id: 'tracking-new' });

      const previousTracking: MealTracking = {
        id: 'tracking-old',
        plannedMealId: mockPlannedMealId,
        userId: 'user-123',
        status: 'pending',
      };

      const command = new TrackMealCommand(
        mockPlannedMealId,
        mockMealName,
        { status: 'eaten' },
        previousTracking
      );

      await command.execute();
      vi.clearAllMocks();
      await command.undo();

      expect(mealPlanningAPI.trackMeal).toHaveBeenCalledWith(mockPlannedMealId, {
        status: 'pending',
        swappedMeal: undefined,
        swappedRecipeId: undefined,
        servingsConsumed: undefined,
        caloriesConsumed: undefined,
        notes: undefined,
      });
      expect(mealPlanningAPI.deleteMealTracking).not.toHaveBeenCalled();
    });

    it('should have correct description for different statuses', () => {
      const eatenCmd = new TrackMealCommand(mockPlannedMealId, 'Meal', { status: 'eaten' }, null);
      const skippedCmd = new TrackMealCommand(mockPlannedMealId, 'Meal', { status: 'skipped' }, null);
      const swappedCmd = new TrackMealCommand(mockPlannedMealId, 'Meal', { status: 'swapped' }, null);

      expect(eatenCmd.description).toBe('Mark as eaten: Meal');
      expect(skippedCmd.description).toBe('Skip meal: Meal');
      expect(swappedCmd.description).toBe('Swap meal: Meal');
    });
  });

  describe('AddToBacklogCommand', () => {
    const mockItem = {
      mealName: 'Leftover Pizza',
      recipeId: 'recipe-pizza',
      originalDate: '2026-01-28',
      originalMealType: 'dinner',
      reason: 'Ran out of time',
      servings: 2,
    };

    it('should execute add to backlog and store ID', async () => {
      vi.mocked(mealPlanningAPI.addToBacklog).mockResolvedValue({ id: 'backlog-123' });

      const command = new AddToBacklogCommand(mockItem);
      await command.execute();

      expect(mealPlanningAPI.addToBacklog).toHaveBeenCalledWith(mockItem);
      expect(command.getCreatedBacklogId()).toBe('backlog-123');
    });

    it('should undo by removing from backlog', async () => {
      vi.mocked(mealPlanningAPI.addToBacklog).mockResolvedValue({ id: 'backlog-123' });

      const command = new AddToBacklogCommand(mockItem);
      await command.execute();
      vi.clearAllMocks();

      await command.undo();

      expect(mealPlanningAPI.removeFromBacklog).toHaveBeenCalledWith('backlog-123');
    });

    it('should not call remove if no backlog ID', async () => {
      vi.mocked(mealPlanningAPI.addToBacklog).mockResolvedValue({});

      const command = new AddToBacklogCommand(mockItem);
      await command.execute();
      vi.clearAllMocks();

      await command.undo();

      expect(mealPlanningAPI.removeFromBacklog).not.toHaveBeenCalled();
    });

    it('should have correct description', () => {
      const command = new AddToBacklogCommand(mockItem);
      expect(command.description).toBe('Save for later: Leftover Pizza');
    });
  });

  describe('UseBacklogItemCommand', () => {
    const mockBacklogItem = {
      id: 'backlog-789',
      mealName: 'Saved Recipe',
      recipeId: 'recipe-saved',
      servings: 4,
      peopleCount: 2,
      originalDate: new Date('2026-01-25'),
      originalMealType: 'lunch',
      reason: 'Too busy',
    };
    const mockPlanId = 'plan-456';
    const mockDate = new Date('2026-01-30');
    const mockMealType = 'dinner';

    it('should execute by creating meal and removing from backlog', async () => {
      vi.mocked(mealPlanningAPI.createPlannedMeal).mockResolvedValue({ id: 'new-meal-id' });

      const command = new UseBacklogItemCommand(mockBacklogItem, mockPlanId, mockDate, mockMealType);
      await command.execute();

      expect(mealPlanningAPI.createPlannedMeal).toHaveBeenCalledWith(
        expect.objectContaining({
          meal_plan_id: mockPlanId,
          date: '2026-01-30',
          meal_type: 'dinner',
          recipe_id: 'recipe-saved',
          servings: 4,
          people_count: 2,
          status: 'planned',
        })
      );
      expect(mealPlanningAPI.removeFromBacklog).toHaveBeenCalledWith('backlog-789');
    });

    it('should undo by deleting meal and recreating backlog item', async () => {
      vi.mocked(mealPlanningAPI.createPlannedMeal).mockResolvedValue({ id: 'new-meal-id' });

      const command = new UseBacklogItemCommand(mockBacklogItem, mockPlanId, mockDate, mockMealType);
      await command.execute();
      vi.clearAllMocks();

      await command.undo();

      expect(mealPlanningAPI.deletePlannedMeal).toHaveBeenCalledWith('new-meal-id');
      expect(mealPlanningAPI.addToBacklog).toHaveBeenCalledWith(
        expect.objectContaining({
          mealName: 'Saved Recipe',
          recipeId: 'recipe-saved',
          originalDate: '2026-01-25',
          originalMealType: 'lunch',
          reason: 'Too busy',
          servings: 4,
          peopleCount: 2,
        })
      );
    });

    it('should handle custom meal (no recipeId)', async () => {
      const customMealBacklog = {
        id: 'backlog-custom',
        mealName: 'Homemade Soup',
        servings: 2,
      };

      vi.mocked(mealPlanningAPI.createPlannedMeal).mockResolvedValue({ id: 'meal-custom' });

      const command = new UseBacklogItemCommand(customMealBacklog, mockPlanId, mockDate, mockMealType);
      await command.execute();

      expect(mealPlanningAPI.createPlannedMeal).toHaveBeenCalledWith(
        expect.objectContaining({
          custom_meal: 'Homemade Soup',
          recipe_id: undefined,
        })
      );
    });

    it('should have correct description', () => {
      const command = new UseBacklogItemCommand(mockBacklogItem, mockPlanId, mockDate, mockMealType);
      expect(command.description).toBe('Schedule from backlog: Saved Recipe');
    });
  });
});

