/**
 * Tests for useGroceryList hook
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useGroceryList } from '../useGroceryList';
import type { PlannedMeal, Recipe } from '@/types';
import * as secureStorage from '@/utils/secureStorage';

// Mock secure storage
vi.mock('@/utils/secureStorage', () => ({
  getSecureItem: vi.fn(),
  setSecureItem: vi.fn(() => true),
  migrateToSecureStorage: vi.fn(() => true),
}));

describe('useGroceryList', () => {
  const mockRecipes: Recipe[] = [
    {
      id: 'recipe-1',
      name: 'Pasta Carbonara',
      ingredients: [
        { name: 'spaghetti', amount: '1', unit: 'lb' },
        { name: 'bacon', amount: '8', unit: 'oz' },
        { name: 'eggs', amount: '4', unit: 'count' },
        { name: 'parmesan cheese', amount: '1', unit: 'cup' },
      ],
      instructions: ['Cook pasta', 'Fry bacon', 'Mix all'],
      servings: 4,
      difficulty: 'medium',
      tags: [],
      rating: undefined,
      notes: undefined,
      image: undefined,
      isFavorite: false,
      calories: undefined,
      cuisine: 'italian',
      dietaryRestrictions: [],
      nutritionInfo: undefined,
      flowChart: undefined,
      sourceType: 'manual',
      sourceUrl: undefined,
      videoThumbnail: undefined,
      description: undefined,
      prepTime: undefined,
      cookTime: undefined,
      createdAt: new Date(),
    },
    {
      id: 'recipe-2',
      name: 'Caesar Salad',
      ingredients: [
        { name: 'romaine lettuce', amount: '1', unit: 'head' },
        { name: 'parmesan cheese', amount: '0.5', unit: 'cup' },
        { name: 'croutons', amount: '1', unit: 'cup' },
      ],
      instructions: ['Chop lettuce', 'Add dressing'],
      servings: 2,
      difficulty: 'easy',
      tags: [],
      rating: undefined,
      notes: undefined,
      image: undefined,
      isFavorite: false,
      calories: undefined,
      cuisine: 'italian',
      dietaryRestrictions: [],
      nutritionInfo: undefined,
      flowChart: undefined,
      sourceType: 'manual',
      sourceUrl: undefined,
      videoThumbnail: undefined,
      description: undefined,
      prepTime: undefined,
      cookTime: undefined,
      createdAt: new Date(),
    },
  ];

  const mockPlannedMeals: PlannedMeal[] = [
    {
      id: 'meal-1',
      mealPlanId: 'plan-1',
      date: new Date('2024-01-15'),
      mealType: 'dinner',
      recipeId: 'recipe-1',
      servings: 4,
      peopleCount: 4,
      status: 'planned',
      createdAt: new Date(),
    },
    {
      id: 'meal-2',
      mealPlanId: 'plan-1',
      date: new Date('2024-01-16'),
      mealType: 'lunch',
      recipeId: 'recipe-2',
      servings: 2,
      peopleCount: 2,
      status: 'planned',
      createdAt: new Date(),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(secureStorage.getSecureItem).mockReturnValue(null);
  });

  describe('grocery list generation', () => {
    it('should generate grocery list from planned meals', () => {
      const { result } = renderHook(() =>
        useGroceryList(mockPlannedMeals, mockRecipes, 'week-2024-01-15')
      );

      expect(result.current.groceryList.length).toBeGreaterThan(0);

      // Check that ingredients are included
      const itemNames = result.current.groceryList.map(item => item.name);
      expect(itemNames).toContain('spaghetti');
      expect(itemNames).toContain('bacon');
      expect(itemNames).toContain('eggs');
      expect(itemNames).toContain('parmesan cheese');
      expect(itemNames).toContain('romaine lettuce');
      expect(itemNames).toContain('croutons');
    });

    it('should combine duplicate ingredients from multiple recipes', () => {
      const { result } = renderHook(() =>
        useGroceryList(mockPlannedMeals, mockRecipes, 'week-2024-01-15')
      );

      // Parmesan cheese appears in both recipes
      const parmesan = result.current.groceryList.find(item =>
        item.name.toLowerCase().includes('parmesan')
      );

      expect(parmesan).toBeDefined();
      expect(parmesan?.recipes).toHaveLength(2);
      expect(parmesan?.recipes).toContain('Pasta Carbonara');
      expect(parmesan?.recipes).toContain('Caesar Salad');
    });

    it('should handle meals without recipes', () => {
      const mealsWithCustom: PlannedMeal[] = [
        ...mockPlannedMeals,
        {
          id: 'meal-3',
          mealPlanId: 'plan-1',
          date: new Date('2024-01-17'),
          mealType: 'breakfast',
          customMeal: 'Cereal',
          servings: 1,
          peopleCount: 1,
          status: 'planned',
          createdAt: new Date(),
        },
      ];

      const { result } = renderHook(() =>
        useGroceryList(mealsWithCustom, mockRecipes, 'week-2024-01-15')
      );

      // Should still generate list without errors
      expect(result.current.groceryList).toBeDefined();
    });

    it('should skip recipes without ingredients', () => {
      const recipesWithoutIngredients: Recipe[] = [
        {
          ...mockRecipes[0],
          ingredients: undefined,
        },
      ];

      const { result } = renderHook(() =>
        useGroceryList([mockPlannedMeals[0]], recipesWithoutIngredients, 'week-2024-01-15')
      );

      expect(result.current.groceryList).toHaveLength(0);
    });

    it('should handle empty meal list', () => {
      const { result } = renderHook(() =>
        useGroceryList([], mockRecipes, 'week-2024-01-15')
      );

      expect(result.current.groceryList).toHaveLength(0);
    });
  });

  describe('status management', () => {
    it('should initialize all items with "needed" status by default', () => {
      const { result } = renderHook(() =>
        useGroceryList(mockPlannedMeals, mockRecipes, 'week-2024-01-15')
      );

      result.current.groceryList.forEach(item => {
        expect(item.status).toBe('needed');
      });
    });

    it('should update item status', () => {
      const { result } = renderHook(() =>
        useGroceryList(mockPlannedMeals, mockRecipes, 'week-2024-01-15')
      );

      const firstItem = result.current.groceryList[0];

      act(() => {
        result.current.updateItemStatus(firstItem.id, 'in_cart');
      });

      const updatedItem = result.current.groceryList.find(item => item.id === firstItem.id);
      expect(updatedItem?.status).toBe('in_cart');
    });

    it('should categorize items by status', () => {
      const { result } = renderHook(() =>
        useGroceryList(mockPlannedMeals, mockRecipes, 'week-2024-01-15')
      );

      // Initially all should be needed
      expect(result.current.neededItems.length).toBe(result.current.groceryList.length);
      expect(result.current.atHomeItems).toHaveLength(0);
      expect(result.current.inCartItems).toHaveLength(0);
      expect(result.current.purchasedItems).toHaveLength(0);

      const firstItem = result.current.groceryList[0];
      const secondItem = result.current.groceryList[1];

      act(() => {
        result.current.updateItemStatus(firstItem.id, 'at_home');
        result.current.updateItemStatus(secondItem.id, 'in_cart');
      });

      expect(result.current.neededItems.length).toBe(result.current.groceryList.length - 2);
      expect(result.current.atHomeItems).toHaveLength(1);
      expect(result.current.inCartItems).toHaveLength(1);
    });
  });

  describe('secure storage persistence', () => {
    it('should load statuses from secure storage on mount', () => {
      const savedStatuses = {
        'spaghetti': 'in_cart',
        'bacon': 'purchased',
      };

      vi.mocked(secureStorage.getSecureItem).mockReturnValue(savedStatuses);

      const { result } = renderHook(() =>
        useGroceryList(mockPlannedMeals, mockRecipes, 'week-2024-01-15')
      );

      const spaghetti = result.current.groceryList.find(item => item.id === 'spaghetti');
      const bacon = result.current.groceryList.find(item => item.id === 'bacon');

      expect(spaghetti?.status).toBe('in_cart');
      expect(bacon?.status).toBe('purchased');
    });

    it('should migrate existing data to secure storage', () => {
      renderHook(() =>
        useGroceryList(mockPlannedMeals, mockRecipes, 'week-2024-01-15')
      );

      expect(secureStorage.migrateToSecureStorage).toHaveBeenCalledWith('grocery-statuses-week-2024-01-15');
    });

    it('should persist status changes to secure storage', async () => {
      const { result } = renderHook(() =>
        useGroceryList(mockPlannedMeals, mockRecipes, 'week-2024-01-15')
      );

      const firstItem = result.current.groceryList[0];

      act(() => {
        result.current.updateItemStatus(firstItem.id, 'purchased');
      });

      await waitFor(() => {
        expect(secureStorage.setSecureItem).toHaveBeenCalled();
      });

      const lastCall = vi.mocked(secureStorage.setSecureItem).mock.calls[
        vi.mocked(secureStorage.setSecureItem).mock.calls.length - 1
      ];
      expect(lastCall[0]).toBe('grocery-statuses-week-2024-01-15');
      expect(lastCall[1]).toHaveProperty(firstItem.id, 'purchased');
    });

    it('should handle storage failures gracefully', async () => {
      vi.mocked(secureStorage.setSecureItem).mockReturnValue(false);

      const { result } = renderHook(() =>
        useGroceryList(mockPlannedMeals, mockRecipes, 'week-2024-01-15')
      );

      const firstItem = result.current.groceryList[0];

      // Should not throw error even if storage fails
      act(() => {
        result.current.updateItemStatus(firstItem.id, 'purchased');
      });

      await waitFor(() => {
        expect(secureStorage.setSecureItem).toHaveBeenCalled();
      });

      // Item should still be updated in memory
      const updatedItem = result.current.groceryList.find(item => item.id === firstItem.id);
      expect(updatedItem?.status).toBe('purchased');
    });
  });

  describe('status colors', () => {
    it('should provide correct color classes for each status', () => {
      const { result } = renderHook(() =>
        useGroceryList(mockPlannedMeals, mockRecipes, 'week-2024-01-15')
      );

      expect(result.current.getStatusColor('needed')).toBe('bg-white text-slate-900 border-slate-200');
      expect(result.current.getStatusColor('at_home')).toBe('bg-green-100 text-green-800 border-green-300');
      expect(result.current.getStatusColor('in_cart')).toBe('bg-indigo-100 text-indigo-800 border-indigo-300');
      expect(result.current.getStatusColor('purchased')).toBe('bg-gray-100 text-gray-600 border-gray-300 line-through');
    });
  });

  describe('grocery list items structure', () => {
    it('should include amount and unit when available', () => {
      const { result } = renderHook(() =>
        useGroceryList(mockPlannedMeals, mockRecipes, 'week-2024-01-15')
      );

      const spaghetti = result.current.groceryList.find(item => item.name === 'spaghetti');

      expect(spaghetti).toMatchObject({
        name: 'spaghetti',
        amount: '1',
        unit: 'lb',
      });
    });

    it('should track which recipes use each ingredient', () => {
      const { result } = renderHook(() =>
        useGroceryList(mockPlannedMeals, mockRecipes, 'week-2024-01-15')
      );

      const items = result.current.groceryList;

      items.forEach(item => {
        expect(item.recipes).toBeDefined();
        expect(Array.isArray(item.recipes)).toBe(true);
        expect(item.recipes.length).toBeGreaterThan(0);
      });
    });

    it('should generate unique IDs for each item', () => {
      const { result } = renderHook(() =>
        useGroceryList(mockPlannedMeals, mockRecipes, 'week-2024-01-15')
      );

      const ids = result.current.groceryList.map(item => item.id);
      const uniqueIds = new Set(ids);

      expect(ids.length).toBe(uniqueIds.size);
    });

    it('should sort items alphabetically by name', () => {
      const { result } = renderHook(() =>
        useGroceryList(mockPlannedMeals, mockRecipes, 'week-2024-01-15')
      );

      const names = result.current.groceryList.map(item => item.name);
      const sortedNames = [...names].sort((a, b) => a.localeCompare(b));

      expect(names).toEqual(sortedNames);
    });
  });
});
