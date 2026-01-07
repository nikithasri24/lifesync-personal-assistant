import { useState, useEffect, useMemo } from 'react';
import { logger } from '../../services/logger';
import type { PlannedMeal } from '../../types';
import type { Recipe } from '@/hooks/useMealPlanningQuery';

export type GroceryItemStatus = 'needed' | 'at_home' | 'in_cart' | 'purchased';

export interface GroceryItem {
  id: string;
  name: string;
  amount?: string;
  unit?: string;
  recipes: string[];
  status: GroceryItemStatus;
}

export function useGroceryList(
  plannedMeals: PlannedMeal[],
  recipes: Recipe[],
  weekKey: string
): {
  groceryList: GroceryItem[];
  neededItems: GroceryItem[];
  atHomeItems: GroceryItem[];
  inCartItems: GroceryItem[];
  purchasedItems: GroceryItem[];
  updateItemStatus: (itemId: string, status: GroceryItemStatus) => void;
  getStatusColor: (status: GroceryItemStatus) => string;
} {
  const groceryStorageKey = `grocery-statuses-${weekKey}`;

  // Load grocery item statuses from localStorage
  const [groceryItemStatuses, setGroceryItemStatuses] = useState<Map<string, GroceryItemStatus>>(() => {
    try {
      const stored = localStorage.getItem(groceryStorageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as Record<string, GroceryItemStatus>;
        return new Map(Object.entries(parsed));
      }
    } catch (error) {
      logger.error('GroceryList', error as Error, { context: 'load grocery statuses failed' });
    }
    return new Map();
  });

  // Persist grocery statuses to localStorage
  useEffect(() => {
    try {
      const obj = Object.fromEntries(groceryItemStatuses);
      localStorage.setItem(groceryStorageKey, JSON.stringify(obj));
    } catch (error) {
      logger.error('GroceryList', error as Error, { context: 'save grocery statuses failed' });
    }
  }, [groceryItemStatuses, groceryStorageKey]);

  // Generate grocery list from planned meals
  const groceryList = useMemo(() => {
    const ingredientMap = new Map<string, { name: string; amount?: string; unit?: string; recipes: string[] }>();

    plannedMeals.forEach((meal) => {
      if (meal.recipeId) {
        const recipe = recipes.find((r) => r.id === meal.recipeId);
        if (recipe?.ingredients) {
          recipe.ingredients.forEach((ing) => {
            const key = ing.name.toLowerCase().trim();
            const existing = ingredientMap.get(key);

            if (existing) {
              if (!existing.recipes.includes(recipe.name)) {
                existing.recipes.push(recipe.name);
              }
            } else {
              ingredientMap.set(key, {
                name: ing.name,
                amount: ing.amount,
                unit: ing.unit,
                recipes: [recipe.name],
              });
            }
          });
        }
      }
    });

    const items: GroceryItem[] = Array.from(ingredientMap.values()).map((item) => {
      const itemKey = item.name.toLowerCase().trim();
      return {
        id: itemKey,
        ...item,
        status: groceryItemStatuses.get(itemKey) ?? 'needed',
      };
    });

    return items.sort((a, b) => a.name.localeCompare(b.name));
  }, [plannedMeals, recipes, groceryItemStatuses]);

  const updateItemStatus = (itemId: string, status: GroceryItemStatus): void => {
    setGroceryItemStatuses((prev) => {
      const next = new Map(prev);
      next.set(itemId, status);
      return next;
    });
  };

  const getStatusColor = (status: GroceryItemStatus): string => {
    switch (status) {
      case 'at_home':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'in_cart':
        return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      case 'purchased':
        return 'bg-gray-100 text-gray-600 border-gray-300 line-through';
      default:
        return 'bg-white text-slate-900 border-slate-200';
    }
  };

  const neededItems = groceryList.filter((item) => item.status === 'needed');
  const atHomeItems = groceryList.filter((item) => item.status === 'at_home');
  const inCartItems = groceryList.filter((item) => item.status === 'in_cart');
  const purchasedItems = groceryList.filter((item) => item.status === 'purchased');

  return {
    groceryList,
    neededItems,
    atHomeItems,
    inCartItems,
    purchasedItems,
    updateItemStatus,
    getStatusColor,
  };
}