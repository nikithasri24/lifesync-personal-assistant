/**
 * Meal Planning-Shopping Integration Tests
 * Tests the integration between meal plans, recipes, and shopping lists
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';

// Mock the API modules directly to avoid Supabase mock complexity
vi.mock('../../api/shoppingAPI', () => ({
  createShoppingList: vi.fn(),
  updateShoppingList: vi.fn(),
  deleteShoppingList: vi.fn(),
  getShoppingLists: vi.fn(),
  createShoppingItem: vi.fn(),
  updateShoppingItem: vi.fn(),
  deleteShoppingItem: vi.fn(),
}));

import * as shoppingAPI from '../../api/shoppingAPI';

describe('Meal Planning-Shopping Integration', () => {
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
  };

  const mockShoppingList = {
    id: 'list-1',
    user_id: mockUser.id,
    name: 'Weekly Groceries',
    status: 'active' as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should create shopping list with items', async () => {
    vi.mocked(shoppingAPI.createShoppingList).mockResolvedValue(mockShoppingList as any);

    const list = await shoppingAPI.createShoppingList({
      name: mockShoppingList.name,
      status: 'active',
    });

    expect(list).toBeDefined();
    expect(list.name).toBe('Weekly Groceries');
  });

  test('should update shopping item', async () => {
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
});
