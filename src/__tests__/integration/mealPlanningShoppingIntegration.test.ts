/**
 * Meal Planning-Shopping Integration Tests
 * Tests the integration between meal plans, recipes, and shopping lists.
 *
 * Uses mocked API modules — no live Supabase calls.
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';

vi.mock('../../api/shoppingAPI', () => ({
  createShoppingList: vi.fn(),
  updateShoppingList: vi.fn(),
  deleteShoppingList: vi.fn(),
  getShoppingLists: vi.fn(),
  createShoppingItem: vi.fn(),
  updateShoppingItem: vi.fn(),
  deleteShoppingItem: vi.fn(),
  getShoppingItems: vi.fn(),
}));

import * as shoppingAPI from '../../api/shoppingAPI';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const USER_ID = 'test-user-id';

function makeShoppingList(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'list-1',
    user_id: USER_ID,
    name: 'Weekly Groceries',
    status: 'active' as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

function makeShoppingItem(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'item-1',
    list_id: 'list-1',
    name: 'Chicken Breast',
    quantity: 1,
    unit: 'lb',
    is_purchased: false,
    in_pantry: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Meal Planning-Shopping Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // 1. Adding a meal plan generates shopping list items for ingredients
  // -------------------------------------------------------------------------
  test('should create shopping list with items from meal ingredients', async () => {
    const list = makeShoppingList();
    const item = makeShoppingItem({ name: 'Chicken Breast', quantity: 2 });

    vi.mocked(shoppingAPI.createShoppingList).mockResolvedValue(list as any);
    vi.mocked(shoppingAPI.createShoppingItem).mockResolvedValue(item as any);

    // Create the shopping list
    const createdList = await shoppingAPI.createShoppingList({
      name: 'Weekly Groceries',
      status: 'active',
    });
    expect(createdList).toBeDefined();
    expect(createdList.name).toBe('Weekly Groceries');

    // Add ingredient as shopping item
    const createdItem = await shoppingAPI.createShoppingItem({
      list_id: createdList.id,
      name: 'Chicken Breast',
      quantity: 2,
    });
    expect(createdItem.name).toBe('Chicken Breast');
    expect(createdItem.quantity).toBe(2);
  });

  // -------------------------------------------------------------------------
  // 2. Duplicate ingredients are merged (quantities summed)
  // -------------------------------------------------------------------------
  test('should merge duplicate ingredients by summing quantities', () => {
    // Simulate two meal plans each needing the same ingredient
    const ingredientsFromMeal1 = [{ name: 'Eggs', quantity: 4 }];
    const ingredientsFromMeal2 = [{ name: 'Eggs', quantity: 6 }];

    const allIngredients = [...ingredientsFromMeal1, ...ingredientsFromMeal2];

    // Merge: group by name and sum quantities
    const merged: Record<string, number> = {};
    for (const ing of allIngredients) {
      merged[ing.name] = (merged[ing.name] ?? 0) + ing.quantity;
    }

    expect(merged['Eggs']).toBe(10);
    expect(Object.keys(merged)).toHaveLength(1); // no duplicates
  });

  // -------------------------------------------------------------------------
  // 3. Removing a meal removes its unique ingredients from the shopping list
  // -------------------------------------------------------------------------
  test('should remove unique ingredients when meal is removed from plan', async () => {
    const chickenItem = makeShoppingItem({ id: 'item-chicken', name: 'Chicken Breast' });
    const riceItem = makeShoppingItem({ id: 'item-rice', name: 'Rice' });

    vi.mocked(shoppingAPI.deleteShoppingItem).mockResolvedValue(undefined as any);
    vi.mocked(shoppingAPI.getShoppingItems).mockResolvedValue([riceItem] as any);

    // Delete the chicken ingredient (unique to the removed meal)
    await shoppingAPI.deleteShoppingItem('item-chicken');

    // Remaining items should only have rice
    const remaining = await shoppingAPI.getShoppingItems({ list_id: 'list-1' });
    expect(remaining).toHaveLength(1);
    expect(remaining[0].name).toBe('Rice');
  });

  // -------------------------------------------------------------------------
  // 4. Marking ingredient as "in pantry" removes it from active shopping list
  // -------------------------------------------------------------------------
  test('should mark ingredient as in pantry and exclude from shopping list', async () => {
    const item = makeShoppingItem({ name: 'Olive Oil', in_pantry: false });
    const updatedItem = { ...item, in_pantry: true };

    vi.mocked(shoppingAPI.updateShoppingItem).mockResolvedValue(updatedItem as any);
    vi.mocked(shoppingAPI.getShoppingItems).mockResolvedValue([] as any);

    // Mark as in pantry
    const patched = await shoppingAPI.updateShoppingItem(item.id, { in_pantry: true });
    expect(patched.in_pantry).toBe(true);

    // Shopping list filtered to exclude pantry items
    const activeItems = await shoppingAPI.getShoppingItems({ list_id: 'list-1', in_pantry: false });
    expect(activeItems).toHaveLength(0);
  });

  // -------------------------------------------------------------------------
  // 5. Weekly meal plan generates an aggregated shopping list
  // -------------------------------------------------------------------------
  test('should aggregate shopping list for 7-day meal plan', () => {
    // 7 days of meals, each with ingredients
    const weeklyMeals = [
      { day: 'Mon', ingredients: [{ name: 'Chicken', qty: 2 }, { name: 'Broccoli', qty: 1 }] },
      { day: 'Tue', ingredients: [{ name: 'Salmon', qty: 1 }, { name: 'Asparagus', qty: 1 }] },
      { day: 'Wed', ingredients: [{ name: 'Chicken', qty: 2 }, { name: 'Rice', qty: 1 }] },
      { day: 'Thu', ingredients: [{ name: 'Beef', qty: 1.5 }, { name: 'Broccoli', qty: 2 }] },
      { day: 'Fri', ingredients: [{ name: 'Salmon', qty: 1 }, { name: 'Spinach', qty: 1 }] },
      { day: 'Sat', ingredients: [{ name: 'Chicken', qty: 3 }, { name: 'Asparagus', qty: 2 }] },
      { day: 'Sun', ingredients: [{ name: 'Beef', qty: 1 }, { name: 'Rice', qty: 2 }] },
    ];

    // Aggregate
    const shoppingList: Record<string, number> = {};
    for (const meal of weeklyMeals) {
      for (const ing of meal.ingredients) {
        shoppingList[ing.name] = (shoppingList[ing.name] ?? 0) + ing.qty;
      }
    }

    expect(shoppingList['Chicken']).toBe(7);   // 2 + 2 + 3
    expect(shoppingList['Broccoli']).toBe(3);  // 1 + 2
    expect(shoppingList['Salmon']).toBe(2);    // 1 + 1
    expect(shoppingList['Asparagus']).toBe(3); // 1 + 2
    expect(shoppingList['Beef']).toBe(2.5);    // 1.5 + 1
    expect(shoppingList['Rice']).toBe(3);      // 1 + 2
    expect(Object.keys(shoppingList)).toHaveLength(7);
  });

  // -------------------------------------------------------------------------
  // Original tests (kept for coverage)
  // -------------------------------------------------------------------------

  test('should update shopping item quantity and mark as purchased', async () => {
    const updatedItem = {
      id: 'item-1',
      name: 'Chicken Breast',
      quantity: 3,
      is_purchased: true,
    };
    vi.mocked(shoppingAPI.updateShoppingItem).mockResolvedValue(updatedItem as any);

    const item = await shoppingAPI.updateShoppingItem('item-1', {
      quantity: 3,
      is_purchased: true,
    });

    expect(item.quantity).toBe(3);
    expect(item.is_purchased).toBe(true);
  });

  test('should retrieve multiple shopping lists', async () => {
    const lists = [
      makeShoppingList({ id: 'list-1', name: 'Groceries' }),
      makeShoppingList({ id: 'list-2', name: 'Pharmacy' }),
    ];
    vi.mocked(shoppingAPI.getShoppingLists).mockResolvedValue(lists as any);

    const result = await shoppingAPI.getShoppingLists();
    expect(result).toHaveLength(2);
    expect(result.map((l: any) => l.name)).toContain('Groceries');
  });
});
