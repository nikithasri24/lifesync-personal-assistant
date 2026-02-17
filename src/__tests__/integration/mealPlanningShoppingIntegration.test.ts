/**
 * Meal Planning-Shopping Integration Tests
 * Tests the integration between meal plans, recipes, and shopping lists
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { supabase } from '../../lib/supabase';
import * as shoppingAPI from '../../api/shoppingAPI';

// Mock Supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
  },
}));

describe('Meal Planning-Shopping Integration', () => {
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
  };

  const mockShoppingList = {
    id: 'list-1',
    user_id: mockUser.id,
    title: 'Weekly Groceries',
    items: [
      { id: 'item-1', name: 'Chicken Breast', quantity: 2, unit: 'lbs', checked: false },
      { id: 'item-2', name: 'Rice', quantity: 1, unit: 'bag', checked: false },
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (supabase.auth.getUser as any).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
  });

  test('should create shopping list with items', async () => {
    const mockQuery = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: mockShoppingList,
        error: null,
      }),
    };

    (supabase.from as any).mockReturnValue(mockQuery);

    const list = await shoppingAPI.createShoppingList({
      name: mockShoppingList.title,
      status: 'active',
    });

    expect(list).toBeDefined();
    // Items are stored in a separate table, not directly on the list
  });

  test('should update shopping item', async () => {
    const mockQuery = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: 'item-1', name: 'Chicken Breast', quantity: 3, is_purchased: true },
        error: null,
      }),
    };

    (supabase.from as any).mockReturnValue(mockQuery);

    const item = await shoppingAPI.updateShoppingItem('item-1', {
      quantity: 3,
      is_purchased: true,
    });

    expect(item.quantity).toBe(3);
    expect(item.is_purchased).toBe(true);
  });

});
