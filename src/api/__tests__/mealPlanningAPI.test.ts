import { describe, it, expect, beforeEach, vi } from 'vitest';
import { supabase } from '../../lib/supabase';
import {
  getMealPlans,
  createMealPlan,
  updateMealPlan,
  deleteMealPlan,
  createPlannedMeal,
  updatePlannedMeal,
  deletePlannedMeal,
  getRecipes,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  getPantryItems,
  createPantryItem,
  updatePantryItem,
  deletePantryItem,
} from '../mealPlanningAPI';

// Mock Supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
  },
}));

describe('mealPlanningAPI', () => {
  const mockUser = { id: 'test-user-123' };

  const mockRecipe = {
    id: 'recipe-123',
    user_id: 'test-user-123',
    name: 'Pasta Carbonara',
    description: 'Classic Italian pasta dish',
    cuisine: 'Italian',
    difficulty: 'medium',
    prep_time: 15,
    cook_time: 20,
    servings: 4,
    calories: 650,
    ingredients: [{ name: 'Pasta', amount: '400g' }],
    instructions: 'Cook pasta, mix with sauce',
    tags: ['italian', 'pasta'],
    is_favorite: true,
    created_at: '2025-12-01T08:00:00Z',
    updated_at: '2025-12-01T08:00:00Z',
  };

  const mockMealPlan = {
    id: 'mealplan-123',
    user_id: 'test-user-123',
    name: 'Week 1 Plan',
    week_start_date: '2026-01-06',
    meal_columns: [{ id: 'breakfast', name: 'Breakfast' }],
    shopping_list_generated: false,
    notes: 'Test plan',
    planned_meals: [],
    created_at: '2025-12-01T08:00:00Z',
    updated_at: '2025-12-01T08:00:00Z',
  };

  const mockPlannedMeal = {
    id: 'plannedmeal-123',
    meal_plan_id: 'mealplan-123',
    recipe_id: 'recipe-123',
    custom_meal: null,
    date: '2026-01-06',
    meal_type: 'dinner',
    servings: 4,
    people_count: 4,
    status: 'planned',
    notes: null,
    created_at: '2025-12-01T08:00:00Z',
    updated_at: '2025-12-01T08:00:00Z',
  };

  const mockPantryItem = {
    id: 'pantry-123',
    user_id: 'test-user-123',
    name: 'Olive Oil',
    quantity: 1,
    unit: 'bottle',
    category: 'pantry',
    location: 'Kitchen cabinet',
    expiration_date: '2026-06-01',
    notes: null,
    is_low_stock: false,
    low_stock_threshold: 1,
    created_at: '2025-12-01T08:00:00Z',
    updated_at: '2025-12-01T08:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (supabase!.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { user: mockUser },
    });
  });

  // ==================== RECIPES TESTS ====================

  describe('Recipes API', () => {
    describe('getRecipes', () => {
      it('should fetch all recipes for authenticated user', async () => {
        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({
            data: [mockRecipe],
            error: null,
          }),
        };

        (supabase!.from as ReturnType<typeof vi.fn>).mockReturnValue(mockQuery);

        const result = await getRecipes();

        expect(supabase!.from).toHaveBeenCalledWith('recipes');
        expect(mockQuery.select).toHaveBeenCalledWith('*');
        expect(mockQuery.eq).toHaveBeenCalledWith('user_id', mockUser.id);
        expect(result).toEqual([mockRecipe]);
      });

      it('should throw error when not authenticated', async () => {
        (supabase!.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
          data: { user: null },
        });

        await expect(getRecipes()).rejects.toThrow('Not authenticated');
      });
    });

    describe('createRecipe', () => {
      it('should create a new recipe', async () => {
        const newRecipe = {
          name: 'New Recipe',
          description: 'A new test recipe',
          cuisine: 'Mexican',
          difficulty: 'easy' as const,
          prep_time: 10,
          cook_time: 15,
          servings: 2,
          ingredients: [],
          instructions: 'Test instructions',
        };

        const mockQuery = {
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { ...mockRecipe, ...newRecipe },
            error: null,
          }),
        };

        (supabase!.from as ReturnType<typeof vi.fn>).mockReturnValue(mockQuery);

        const result = await createRecipe(newRecipe);

        expect(supabase!.from).toHaveBeenCalledWith('recipes');
        expect(mockQuery.insert).toHaveBeenCalledWith(expect.objectContaining({
          user_id: mockUser.id,
          name: 'New Recipe',
        }));
        expect(result.name).toBe('New Recipe');
      });
    });

    describe('updateRecipe', () => {
      it('should update an existing recipe', async () => {
        const updates = { name: 'Updated Recipe Name', is_favorite: false };

        const mockQuery = {
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { ...mockRecipe, ...updates },
            error: null,
          }),
        };

        (supabase!.from as ReturnType<typeof vi.fn>).mockReturnValue(mockQuery);

        const result = await updateRecipe('recipe-123', updates);

        expect(supabase!.from).toHaveBeenCalledWith('recipes');
        expect(mockQuery.update).toHaveBeenCalledWith(updates);
        expect(result.name).toBe('Updated Recipe Name');
      });
    });

    describe('deleteRecipe', () => {
      it('should delete a recipe', async () => {
        const mockQuery = {
          delete: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
        };
        mockQuery.eq = vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        });

        (supabase!.from as ReturnType<typeof vi.fn>).mockReturnValue(mockQuery);

        await expect(deleteRecipe('recipe-123')).resolves.not.toThrow();
        expect(supabase!.from).toHaveBeenCalledWith('recipes');
      });
    });
  });

  // ==================== MEAL PLANS TESTS ====================

  describe('Meal Plans API', () => {
    describe('getMealPlans', () => {
      it('should fetch all meal plans with planned meals', async () => {
        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
        };
        // Chain the order calls
        mockQuery.order = vi.fn()
          .mockReturnValueOnce(mockQuery) // first order call
          .mockReturnValueOnce(mockQuery) // second order call
          .mockResolvedValueOnce({ data: [mockMealPlan], error: null }); // third order call resolves

        (supabase!.from as ReturnType<typeof vi.fn>).mockReturnValue(mockQuery);

        const result = await getMealPlans();

        expect(supabase!.from).toHaveBeenCalledWith('meal_plans');
        expect(mockQuery.select).toHaveBeenCalledWith('*, planned_meals(*)');
        expect(result).toEqual([mockMealPlan]);
      });
    });

    describe('createMealPlan', () => {
      it('should create a new meal plan or return existing', async () => {
        const newPlan = {
          name: 'New Week Plan',
          week_start_date: '2026-01-13',
        };

        // Mock for checking existing
        const mockSelectQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        };

        // Mock for insert
        const mockInsertQuery = {
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { ...mockMealPlan, ...newPlan, id: 'new-plan-id' },
            error: null,
          }),
        };

        let callCount = 0;
        (supabase!.from as ReturnType<typeof vi.fn>).mockImplementation(() => {
          callCount++;
          if (callCount === 1) return mockSelectQuery;
          return mockInsertQuery;
        });

        const result = await createMealPlan(newPlan);

        expect(result.name).toBe('New Week Plan');
      });
    });
  });

  // ==================== PLANNED MEALS TESTS ====================

  describe('Planned Meals API', () => {
    describe('createPlannedMeal', () => {
      it('should create a planned meal after verifying plan ownership', async () => {
        const newMeal = {
          meal_plan_id: 'mealplan-123',
          recipe_id: 'recipe-123',
          date: '2026-01-07',
          meal_type: 'lunch',
          servings: 2,
          people_count: 2,
        };

        // Mock for plan ownership check
        const mockPlanQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { id: 'mealplan-123' },
            error: null,
          }),
        };

        // Mock for insert
        const mockInsertQuery = {
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { ...mockPlannedMeal, ...newMeal },
            error: null,
          }),
        };

        let callCount = 0;
        (supabase!.from as ReturnType<typeof vi.fn>).mockImplementation(() => {
          callCount++;
          if (callCount === 1) return mockPlanQuery;
          return mockInsertQuery;
        });

        const result = await createPlannedMeal(newMeal);

        expect(result.meal_type).toBe('lunch');
      });

      it('should throw error if meal plan not owned by user', async () => {
        const newMeal = {
          meal_plan_id: 'other-user-plan',
          date: '2026-01-07',
          meal_type: 'dinner',
          servings: 4,
          people_count: 4,
        };

        const mockPlanQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Not found' },
          }),
        };

        (supabase!.from as ReturnType<typeof vi.fn>).mockReturnValue(mockPlanQuery);

        await expect(createPlannedMeal(newMeal)).rejects.toThrow();
      });
    });
  });

  // ==================== PANTRY ITEMS TESTS ====================

  describe('Pantry Items API', () => {
    describe('getPantryItems', () => {
      it('should fetch all pantry items for authenticated user', async () => {
        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({
            data: [mockPantryItem],
            error: null,
          }),
        };

        (supabase!.from as ReturnType<typeof vi.fn>).mockReturnValue(mockQuery);

        const result = await getPantryItems();

        expect(supabase!.from).toHaveBeenCalledWith('pantry_items');
        expect(result).toEqual([mockPantryItem]);
      });
    });

    describe('createPantryItem', () => {
      it('should create a new pantry item', async () => {
        const newItem = {
          name: 'Flour',
          quantity: 2,
          unit: 'kg',
          category: 'pantry' as const,
        };

        const mockQuery = {
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { ...mockPantryItem, ...newItem },
            error: null,
          }),
        };

        (supabase!.from as ReturnType<typeof vi.fn>).mockReturnValue(mockQuery);

        const result = await createPantryItem(newItem);

        expect(result.name).toBe('Flour');
      });
    });

    describe('updatePantryItem', () => {
      it('should update a pantry item', async () => {
        const updates = { quantity: 0.5, is_low_stock: true };

        const mockQuery = {
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { ...mockPantryItem, ...updates },
            error: null,
          }),
        };

        (supabase!.from as ReturnType<typeof vi.fn>).mockReturnValue(mockQuery);

        const result = await updatePantryItem('pantry-123', updates);

        expect(result.is_low_stock).toBe(true);
      });
    });

    describe('deletePantryItem', () => {
      it('should delete a pantry item', async () => {
        const mockQuery = {
          delete: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        };

        (supabase!.from as ReturnType<typeof vi.fn>).mockReturnValue(mockQuery);

        await expect(deletePantryItem('pantry-123')).resolves.not.toThrow();
      });
    });
  });
});

