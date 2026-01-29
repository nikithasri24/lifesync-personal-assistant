/* eslint-disable max-lines */
import { describe, it, expect } from 'vitest';
import {
  toDate,
  sanitize,
  normalisePantryCategory,
  normaliseMealColumns,
  serializeMealColumns,
  filterValidMealIds,
  mapRecipeDataToRecipe,
  mapPlannedMealDataToPlannedMeal,
  mapMealPlanDataToMealPlanWeek,
  mapPantryItemDataToPantryItem,
  mapMealTrackingFromAPI,
  mapBacklogItemFromAPI,
  buildRecipeInsertPayload,
  buildRecipeUpdatePayload,
  buildPlannedMealInsertPayload,
  buildPlannedMealUpdatePayload,
  DEFAULT_MEAL_COLUMNS,
} from '../mappers';
import type { RecipeData, PlannedMealData, MealPlanData, PantryItemData, MealTrackingData, MealBacklogData } from '@/services/types';

describe('Meal Planning Mappers', () => {
  describe('toDate', () => {
    it('should return undefined for null/undefined', () => {
      expect(toDate(null)).toBeUndefined();
      expect(toDate(undefined)).toBeUndefined();
    });

    it('should return same Date if input is Date', () => {
      const date = new Date('2026-01-29');
      expect(toDate(date)).toBe(date);
    });

    it('should parse valid ISO string', () => {
      const result = toDate('2026-01-29T10:30:00Z');
      expect(result).toBeInstanceOf(Date);
      expect(result?.getFullYear()).toBe(2026);
    });

    it('should return undefined for invalid date string', () => {
      expect(toDate('invalid-date')).toBeUndefined();
    });
  });

  describe('sanitize', () => {
    it('should remove undefined values from object', () => {
      const input = { a: 1, b: undefined, c: 'hello', d: null };
      const result = sanitize(input);
      expect(result).toEqual({ a: 1, c: 'hello', d: null });
    });

    it('should keep null values', () => {
      const input = { a: null, b: 0, c: '' };
      const result = sanitize(input);
      expect(result).toEqual({ a: null, b: 0, c: '' });
    });
  });

  describe('normalisePantryCategory', () => {
    it('should normalize produce categories', () => {
      expect(normalisePantryCategory('produce')).toBe('produce');
      expect(normalisePantryCategory('fruits')).toBe('produce');
      expect(normalisePantryCategory('vegetables')).toBe('produce');
      expect(normalisePantryCategory('PRODUCE')).toBe('produce');
    });

    it('should normalize dairy category', () => {
      expect(normalisePantryCategory('dairy')).toBe('dairy');
      expect(normalisePantryCategory('Dairy')).toBe('dairy');
    });

    it('should normalize meat/protein categories', () => {
      expect(normalisePantryCategory('meat')).toBe('meat');
      expect(normalisePantryCategory('protein')).toBe('meat');
    });

    it('should normalize pantry/dry-goods categories', () => {
      expect(normalisePantryCategory('pantry')).toBe('pantry');
      expect(normalisePantryCategory('dry-goods')).toBe('pantry');
    });

    it('should return other for unknown categories', () => {
      expect(normalisePantryCategory('unknown')).toBe('other');
      expect(normalisePantryCategory('')).toBe('other');
      expect(normalisePantryCategory(null)).toBe('other');
      expect(normalisePantryCategory(undefined)).toBe('other');
    });
  });

  describe('normaliseMealColumns', () => {
    it('should return defaults for null/undefined', () => {
      expect(normaliseMealColumns(null as any)).toEqual(DEFAULT_MEAL_COLUMNS);
      expect(normaliseMealColumns(undefined)).toEqual(DEFAULT_MEAL_COLUMNS);
    });

    it('should handle array format with order', () => {
      const columns = [
        { id: 'breakfast', name: 'Breakfast', order: 1 },
        { id: 'lunch', name: 'Lunch' },
      ];
      const result = normaliseMealColumns(columns as any);
      expect(result[0].order).toBe(1);
      expect(result[1].order).toBe(2); // auto-assigned
    });

    it('should handle object format', () => {
      const columns = {
        breakfast: { name: 'Morning Meal', defaultServings: 3 },
        lunch: { name: 'Midday Meal' },
      };
      const result = normaliseMealColumns(columns as any);
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('breakfast');
      expect(result[0].name).toBe('Morning Meal');
      expect(result[0].defaultServings).toBe(3);
    });
  });

  describe('serializeMealColumns', () => {
    it('should convert array to object format', () => {
      const columns = [{ id: 'breakfast', name: 'Breakfast', order: 1, defaultServings: 2, defaultPeopleCount: 2, color: '#fff' }];
      const result = serializeMealColumns(columns);
      expect(result).toEqual({
        breakfast: { id: 'breakfast', name: 'Breakfast', order: 1, defaultServings: 2, defaultPeopleCount: 2, color: '#fff' },
      });
    });
  });

  describe('filterValidMealIds', () => {
    it('should filter out temp IDs', () => {
      const ids = ['meal-123', 'temp-456', 'meal-789', 'temp-abc'];
      const result = filterValidMealIds(ids);
      expect(result).toEqual(['meal-123', 'meal-789']);
    });

    it('should keep all valid IDs', () => {
      const ids = ['meal-1', 'meal-2'];
      const result = filterValidMealIds(ids);
      expect(result).toEqual(['meal-1', 'meal-2']);
    });
  });

  describe('mapRecipeDataToRecipe', () => {
    const mockRecipeData: RecipeData = {
      id: 'recipe-123',
      name: 'Spaghetti Carbonara',
      description: 'Classic Italian pasta',
      cuisine: 'Italian',
      difficulty: 'medium',
      prep_time: 15,
      cook_time: 20,
      servings: 4,
      calories_per_serving: 450,
      instructions: 'Boil pasta\nMake sauce\nCombine',
      ingredients: [{ name: 'pasta', amount: 400, unit: 'g' }, { name: 'eggs', amount: 4 }],
      tags: ['italian', 'pasta'],
      is_favorite: true,
      dietary_restrictions: ['gluten'],
      created_at: '2026-01-01T10:00:00Z',
    };

    it('should map all recipe fields correctly', () => {
      const result = mapRecipeDataToRecipe(mockRecipeData);

      expect(result.id).toBe('recipe-123');
      expect(result.name).toBe('Spaghetti Carbonara');
      expect(result.description).toBe('Classic Italian pasta');
      expect(result.cuisine).toBe('Italian');
      expect(result.difficulty).toBe('medium');
      expect(result.prepTime).toBe(15);
      expect(result.cookTime).toBe(20);
      expect(result.servings).toBe(4);
      expect(result.calories).toBe(450);
      expect(result.isFavorite).toBe(true);
      expect(result.tags).toEqual(['italian', 'pasta']);
    });

    it('should parse instructions into array', () => {
      const result = mapRecipeDataToRecipe(mockRecipeData);
      expect(result.instructions).toEqual(['Boil pasta', 'Make sauce', 'Combine']);
    });

    it('should map ingredients correctly', () => {
      const result = mapRecipeDataToRecipe(mockRecipeData);
      expect(result.ingredients).toHaveLength(2);
      expect(result.ingredients[0]).toEqual({ name: 'pasta', amount: 400, unit: 'g' });
      expect(result.ingredients[1]).toEqual({ name: 'eggs', amount: 4, unit: undefined });
    });

    it('should handle missing optional fields', () => {
      const minimalData: RecipeData = { name: 'Simple Recipe' };
      const result = mapRecipeDataToRecipe(minimalData);

      expect(result.name).toBe('Simple Recipe');
      expect(result.description).toBeUndefined();
      expect(result.instructions).toEqual([]);
      expect(result.ingredients).toEqual([]);
      expect(result.servings).toBe(1);
      expect(result.isFavorite).toBe(false);
    });
  });

  describe('mapPlannedMealDataToPlannedMeal', () => {
    const mockPlannedMealData: PlannedMealData = {
      id: 'meal-456',
      meal_plan_id: 'plan-123',
      date: '2026-01-29',
      meal_type: 'dinner',
      recipe_id: 'recipe-789',
      custom_meal: null,
      servings: 4,
      people_count: 2,
      status: 'planned',
      notes: 'Family dinner',
      is_postponed: false,
      created_at: '2026-01-28T10:00:00Z',
    };

    it('should map all planned meal fields correctly', () => {
      const result = mapPlannedMealDataToPlannedMeal(mockPlannedMealData);

      expect(result.id).toBe('meal-456');
      expect(result.mealPlanId).toBe('plan-123');
      expect(result.mealType).toBe('dinner');
      expect(result.recipeId).toBe('recipe-789');
      expect(result.servings).toBe(4);
      expect(result.peopleCount).toBe(2);
      expect(result.status).toBe('planned');
      expect(result.notes).toBe('Family dinner');
      expect(result.isPostponed).toBe(false);
    });

    it('should parse date-only string as local date', () => {
      const result = mapPlannedMealDataToPlannedMeal(mockPlannedMealData);
      expect(result.date.getFullYear()).toBe(2026);
      expect(result.date.getMonth()).toBe(0); // January
      expect(result.date.getDate()).toBe(29);
    });

    it('should handle postponed meal with original date', () => {
      const postponedData: PlannedMealData = {
        ...mockPlannedMealData,
        is_postponed: true,
        postponed_reason: 'Too busy',
        original_date: '2026-01-28',
      };

      const result = mapPlannedMealDataToPlannedMeal(postponedData);
      expect(result.isPostponed).toBe(true);
      expect(result.postponedReason).toBe('Too busy');
      expect(result.originalDate?.getDate()).toBe(28);
    });
  });

  describe('mapMealPlanDataToMealPlanWeek', () => {
    const mockMealPlanData: MealPlanData = {
      id: 'plan-123',
      name: 'Week 5 Plan',
      week_start_date: '2026-01-27',
      planned_meals: [
        { id: 'meal-1', meal_plan_id: 'plan-123', date: '2026-01-28', meal_type: 'lunch', servings: 2, people_count: 2, status: 'planned', created_at: '2026-01-01T10:00:00Z' },
        { id: 'meal-2', meal_plan_id: 'plan-123', date: '2026-01-27', meal_type: 'breakfast', servings: 1, people_count: 1, status: 'planned', created_at: '2026-01-01T10:00:00Z' },
      ],
      notes: 'Healthy week',
      shopping_list_generated: true,
      created_at: '2026-01-25T10:00:00Z',
      updated_at: '2026-01-26T10:00:00Z',
    };

    it('should map meal plan fields correctly', () => {
      const result = mapMealPlanDataToMealPlanWeek(mockMealPlanData);

      expect(result.id).toBe('plan-123');
      expect(result.name).toBe('Week 5 Plan');
      expect(result.notes).toBe('Healthy week');
      expect(result.shoppingListGenerated).toBe(true);
    });

    it('should parse week start date as local date', () => {
      const result = mapMealPlanDataToMealPlanWeek(mockMealPlanData);
      expect(result.weekStartDate.getFullYear()).toBe(2026);
      expect(result.weekStartDate.getMonth()).toBe(0);
      expect(result.weekStartDate.getDate()).toBe(27);
    });

    it('should sort meals by date then meal type', () => {
      const result = mapMealPlanDataToMealPlanWeek(mockMealPlanData);
      // First meal should be breakfast on 27th (earlier date)
      expect(result.meals[0].id).toBe('meal-2');
      expect(result.meals[0].date.getDate()).toBe(27);
      // Second meal should be lunch on 28th
      expect(result.meals[1].id).toBe('meal-1');
      expect(result.meals[1].date.getDate()).toBe(28);
    });

    it('should use default meal columns when not provided', () => {
      const result = mapMealPlanDataToMealPlanWeek(mockMealPlanData);
      expect(result.mealColumns).toEqual(DEFAULT_MEAL_COLUMNS);
    });
  });

  describe('mapPantryItemDataToPantryItem', () => {
    const mockPantryData: PantryItemData = {
      id: 'pantry-123',
      name: 'Olive Oil',
      quantity: 500,
      unit: 'ml',
      category: 'pantry',
      location: 'Kitchen',
      expiration_date: '2027-01-01',
      notes: 'Extra virgin',
      is_low_stock: false,
      created_at: '2026-01-01T10:00:00Z',
      updated_at: '2026-01-15T10:00:00Z',
    };

    it('should map pantry item fields correctly', () => {
      const result = mapPantryItemDataToPantryItem(mockPantryData);

      expect(result.id).toBe('pantry-123');
      expect(result.name).toBe('Olive Oil');
      expect(result.quantity).toBe(500);
      expect(result.unit).toBe('ml');
      expect(result.category).toBe('pantry');
      expect(result.location).toBe('Kitchen');
      expect(result.notes).toBe('Extra virgin');
    });

    it('should normalize category', () => {
      const produceData = { ...mockPantryData, category: 'vegetables' };
      const result = mapPantryItemDataToPantryItem(produceData);
      expect(result.category).toBe('produce');
    });
  });

  describe('mapMealTrackingFromAPI', () => {
    const mockTrackingData: MealTrackingData = {
      id: 'tracking-123',
      user_id: 'user-456',
      planned_meal_id: 'meal-789',
      status: 'eaten',
      servings_consumed: 2,
      calories_consumed: 500,
      notes: 'Delicious!',
      tracked_at: '2026-01-29T12:00:00Z',
    };

    it('should map tracking fields correctly', () => {
      const result = mapMealTrackingFromAPI(mockTrackingData);

      expect(result.id).toBe('tracking-123');
      expect(result.userId).toBe('user-456');
      expect(result.plannedMealId).toBe('meal-789');
      expect(result.status).toBe('eaten');
      expect(result.servingsConsumed).toBe(2);
      expect(result.caloriesConsumed).toBe(500);
      expect(result.notes).toBe('Delicious!');
      expect(result.trackedAt).toBeInstanceOf(Date);
    });

    it('should handle swapped meal data', () => {
      const swappedData: MealTrackingData = {
        ...mockTrackingData,
        status: 'swapped',
        swapped_meal: 'Pizza',
        swapped_recipe_id: 'recipe-pizza',
      };

      const result = mapMealTrackingFromAPI(swappedData);
      expect(result.status).toBe('swapped');
      expect(result.swappedMeal).toBe('Pizza');
      expect(result.swappedRecipeId).toBe('recipe-pizza');
    });
  });

  describe('mapBacklogItemFromAPI', () => {
    const mockBacklogData: MealBacklogData = {
      id: 'backlog-123',
      connection_id: 'conn-456',
      meal_name: 'Leftover Pasta',
      recipe_id: 'recipe-789',
      saved_by_user_id: 'user-abc',
      original_date: '2026-01-28',
      original_meal_type: 'dinner',
      reason: 'Too tired to cook',
      servings: 4,
      people_count: 2,
      created_at: '2026-01-28T20:00:00Z',
    };

    it('should map backlog item fields correctly', () => {
      const result = mapBacklogItemFromAPI(mockBacklogData);

      expect(result.id).toBe('backlog-123');
      expect(result.connectionId).toBe('conn-456');
      expect(result.mealName).toBe('Leftover Pasta');
      expect(result.recipeId).toBe('recipe-789');
      expect(result.savedByUserId).toBe('user-abc');
      expect(result.originalMealType).toBe('dinner');
      expect(result.reason).toBe('Too tired to cook');
      expect(result.servings).toBe(4);
      expect(result.peopleCount).toBe(2);
    });

    it('should parse original date', () => {
      const result = mapBacklogItemFromAPI(mockBacklogData);
      expect(result.originalDate).toBeInstanceOf(Date);
      // The date is parsed as UTC, so we check that it represents 2026-01-28
      expect(result.originalDate?.toISOString().startsWith('2026-01-28')).toBe(true);
    });
  });

  describe('buildRecipeInsertPayload', () => {
    it('should build correct payload with all fields', () => {
      const input = {
        name: 'Test Recipe',
        description: 'Test description',
        cuisine: 'Italian',
        prepTime: 10,
        cookTime: 20,
        servings: 4,
        instructions: ['Step 1', 'Step 2'],
        ingredients: [{ name: 'flour', amount: 200, unit: 'g' }],
        tags: ['test'],
        isFavorite: true,
      };

      const result = buildRecipeInsertPayload(input);

      expect(result.name).toBe('Test Recipe');
      expect(result.description).toBe('Test description');
      expect(result.prep_time).toBe(10);
      expect(result.cook_time).toBe(20);
      expect(result.instructions).toBe('Step 1\nStep 2');
      expect(result.is_favorite).toBe(true);
    });

    it('should join instructions with newlines', () => {
      const input = {
        name: 'Recipe',
        instructions: ['First', 'Second', 'Third'],
        ingredients: [],
      };

      const result = buildRecipeInsertPayload(input);
      expect(result.instructions).toBe('First\nSecond\nThird');
    });
  });

  describe('buildRecipeUpdatePayload', () => {
    it('should only include defined fields', () => {
      const updates = { name: 'Updated Name', servings: 6 };
      const result = buildRecipeUpdatePayload(updates);

      expect(result.name).toBe('Updated Name');
      expect(result.servings).toBe(6);
      expect(result.description).toBeUndefined();
      expect(result.cuisine).toBeUndefined();
    });
  });

  describe('buildPlannedMealInsertPayload', () => {
    it('should build correct payload', () => {
      const meal = {
        date: new Date(2026, 0, 29), // Jan 29, 2026
        mealType: 'dinner' as const,
        recipeId: 'recipe-123',
        servings: 4,
        peopleCount: 2,
      };

      const result = buildPlannedMealInsertPayload('plan-456', meal);

      expect(result.meal_plan_id).toBe('plan-456');
      expect(result.date).toBe('2026-01-29');
      expect(result.meal_type).toBe('dinner');
      expect(result.recipe_id).toBe('recipe-123');
      expect(result.servings).toBe(4);
      expect(result.people_count).toBe(2);
    });

    it('should handle custom meal without recipe', () => {
      const meal = {
        date: new Date(2026, 0, 29),
        mealType: 'lunch' as const,
        customMeal: 'Homemade Soup',
        servings: 2,
        peopleCount: 1,
      };

      const result = buildPlannedMealInsertPayload('plan-456', meal);

      expect(result.custom_meal).toBe('Homemade Soup');
      expect(result.recipe_id).toBeNull();
    });

    it('should convert empty recipeId to null', () => {
      const meal = {
        date: new Date(2026, 0, 29),
        mealType: 'breakfast' as const,
        recipeId: '',
        customMeal: 'Toast',
        servings: 1,
        peopleCount: 1,
      };

      const result = buildPlannedMealInsertPayload('plan-456', meal);
      expect(result.recipe_id).toBeNull();
    });
  });

  describe('buildPlannedMealUpdatePayload', () => {
    it('should only include defined fields', () => {
      const updates = { servings: 6, notes: 'Updated notes' };
      const result = buildPlannedMealUpdatePayload(updates);

      expect(result.servings).toBe(6);
      expect(result.notes).toBe('Updated notes');
      expect(result.date).toBeUndefined();
      expect(result.meal_type).toBeUndefined();
    });

    it('should format date correctly', () => {
      const updates = { date: new Date(2026, 0, 30) };
      const result = buildPlannedMealUpdatePayload(updates);
      expect(result.date).toBe('2026-01-30');
    });

    it('should handle postponed meal updates', () => {
      const updates = {
        isPostponed: true,
        postponedReason: 'Busy day',
        originalDate: new Date(2026, 0, 29),
      };

      const result = buildPlannedMealUpdatePayload(updates);
      expect(result.is_postponed).toBe(true);
      expect(result.postponed_reason).toBe('Busy day');
      expect(result.original_date).toBe('2026-01-29');
    });
  });
});

