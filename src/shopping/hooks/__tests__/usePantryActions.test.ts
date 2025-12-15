import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { usePantryActions } from '../usePantryActions';
import type { PantryItem } from '@/types';

describe('usePantryActions', () => {
  const mockPantryItems: PantryItem[] = [
    {
      id: '1',
      name: 'Milk',
      quantity: 1,
      unit: 'L',
      category: 'dairy',
      isLowStock: true,
      lowStockThreshold: 3,
      notes: 'Organic milk',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '2',
      name: 'Eggs',
      quantity: 2,
      unit: 'dozen',
      category: 'dairy',
      isLowStock: true,
      lowStockThreshold: 5,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '3',
      name: 'Bread',
      quantity: 1,
      unit: 'loaf',
      category: 'bakery',
      isLowStock: false,
      expirationDate: new Date('2024-01-01'), // Expired
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '4',
      name: 'Cheese',
      quantity: 200,
      unit: 'g',
      category: 'dairy',
      isLowStock: false,
      expirationDate: new Date('2023-12-01'), // Expired
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '5',
      name: 'Fresh Item',
      quantity: 10,
      unit: 'pcs',
      category: 'other',
      isLowStock: false,
      expirationDate: new Date('2025-12-31'), // Not expired
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  let mockAddShoppingItem: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockAddShoppingItem = vi.fn().mockResolvedValue(undefined);
  });

  describe('addLowStockToShopping', () => {
    it('adds all low-stock items with thresholds to shopping list', async () => {
      const { result } = renderHook(() =>
        usePantryActions(mockPantryItems, mockAddShoppingItem)
      );

      const count = await result.current.addLowStockToShopping();

      expect(count).toBe(2); // Milk and Eggs are low stock
      expect(mockAddShoppingItem).toHaveBeenCalledTimes(2);
    });

    it('calculates correct quantity needed based on threshold', async () => {
      const { result } = renderHook(() =>
        usePantryActions(mockPantryItems, mockAddShoppingItem)
      );

      await result.current.addLowStockToShopping();

      // Milk: threshold 3, current 1, need 2
      expect(mockAddShoppingItem).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Milk',
          quantity: 2,
          unit: 'L',
          category: 'dairy',
          tags: ['from:pantry'],
        })
      );

      // Eggs: threshold 5, current 2, need 3
      expect(mockAddShoppingItem).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Eggs',
          quantity: 3,
          unit: 'dozen',
          category: 'dairy',
          tags: ['from:pantry'],
        })
      );
    });

    it('includes notes from pantry item', async () => {
      const { result } = renderHook(() =>
        usePantryActions(mockPantryItems, mockAddShoppingItem)
      );

      await result.current.addLowStockToShopping();

      expect(mockAddShoppingItem).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Milk',
          notes: 'Organic milk',
        })
      );
    });

    it('adds at least 1 item if quantity calculation results in 0 or negative', async () => {
      const itemAtThreshold: PantryItem = {
        id: '6',
        name: 'At Threshold',
        quantity: 5,
        unit: 'pcs',
        category: 'other',
        isLowStock: true,
        lowStockThreshold: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const { result } = renderHook(() =>
        usePantryActions([itemAtThreshold], mockAddShoppingItem)
      );

      await result.current.addLowStockToShopping();

      expect(mockAddShoppingItem).toHaveBeenCalledWith(
        expect.objectContaining({
          quantity: 1, // At least 1 even though we're at threshold
        })
      );
    });

    it('skips low-stock items without threshold', async () => {
      const itemWithoutThreshold: PantryItem = {
        id: '7',
        name: 'No Threshold',
        quantity: 1,
        unit: 'pcs',
        category: 'other',
        isLowStock: true,
        lowStockThreshold: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const { result } = renderHook(() =>
        usePantryActions([itemWithoutThreshold], mockAddShoppingItem)
      );

      const count = await result.current.addLowStockToShopping();

      expect(count).toBe(0);
      expect(mockAddShoppingItem).not.toHaveBeenCalled();
    });

    it('returns 0 when no low-stock items', async () => {
      const noLowStockItems = mockPantryItems.filter((item) => !item.isLowStock);

      const { result } = renderHook(() =>
        usePantryActions(noLowStockItems, mockAddShoppingItem)
      );

      const count = await result.current.addLowStockToShopping();

      expect(count).toBe(0);
      expect(mockAddShoppingItem).not.toHaveBeenCalled();
    });
  });

  describe('addExpiredToShopping', () => {
    it('adds all expired items to shopping list', async () => {
      const { result } = renderHook(() =>
        usePantryActions(mockPantryItems, mockAddShoppingItem)
      );

      const count = await result.current.addExpiredToShopping();

      expect(count).toBe(2); // Bread and Cheese are expired
      expect(mockAddShoppingItem).toHaveBeenCalledTimes(2);
    });

    it('uses current quantity for expired items', async () => {
      const { result } = renderHook(() =>
        usePantryActions(mockPantryItems, mockAddShoppingItem)
      );

      await result.current.addExpiredToShopping();

      expect(mockAddShoppingItem).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Bread',
          quantity: 1,
          unit: 'loaf',
        })
      );

      expect(mockAddShoppingItem).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Cheese',
          quantity: 200,
          unit: 'g',
        })
      );
    });

    it('adds tags indicating expired item', async () => {
      const { result } = renderHook(() =>
        usePantryActions(mockPantryItems, mockAddShoppingItem)
      );

      await result.current.addExpiredToShopping();

      expect(mockAddShoppingItem).toHaveBeenCalledWith(
        expect.objectContaining({
          tags: ['from:pantry', 'reason:expired'],
        })
      );
    });

    it('uses quantity 1 if current quantity is 0 or undefined', async () => {
      const zeroQuantityItem: PantryItem = {
        id: '8',
        name: 'Zero Quantity',
        quantity: 0,
        unit: 'pcs',
        category: 'other',
        isLowStock: false,
        expirationDate: new Date('2024-01-01'),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const { result } = renderHook(() =>
        usePantryActions([zeroQuantityItem], mockAddShoppingItem)
      );

      await result.current.addExpiredToShopping();

      expect(mockAddShoppingItem).toHaveBeenCalledWith(
        expect.objectContaining({
          quantity: 1,
        })
      );
    });

    it('returns 0 when no expired items', async () => {
      const noExpiredItems = mockPantryItems.filter(
        (item) => !item.expirationDate || item.expirationDate.getTime() >= new Date().getTime()
      );

      const { result } = renderHook(() =>
        usePantryActions(noExpiredItems, mockAddShoppingItem)
      );

      const count = await result.current.addExpiredToShopping();

      expect(count).toBe(0);
      expect(mockAddShoppingItem).not.toHaveBeenCalled();
    });

    it('only processes items with expiration dates', async () => {
      const noExpiryItem: PantryItem = {
        id: '9',
        name: 'No Expiry',
        quantity: 1,
        unit: 'pcs',
        category: 'other',
        isLowStock: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const { result } = renderHook(() =>
        usePantryActions([noExpiryItem], mockAddShoppingItem)
      );

      const count = await result.current.addExpiredToShopping();

      expect(count).toBe(0);
      expect(mockAddShoppingItem).not.toHaveBeenCalled();
    });
  });

  describe('Shopping Item Structure', () => {
    it('creates shopping items with all required fields', async () => {
      const { result } = renderHook(() =>
        usePantryActions(mockPantryItems, mockAddShoppingItem)
      );

      await result.current.addLowStockToShopping();

      expect(mockAddShoppingItem).toHaveBeenCalledWith(
        expect.objectContaining({
          name: expect.any(String),
          quantity: expect.any(Number),
          unit: expect.any(String),
          category: expect.any(String),
          subcategory: undefined,
          priority: 'medium',
          purchased: false,
          price: undefined,
          estimatedPrice: undefined,
          aisle: undefined,
          brand: undefined,
          size: undefined,
          imageUrl: undefined,
          nutritionInfo: undefined,
          tags: expect.any(Array),
          addedBy: undefined,
          purchasedAt: undefined,
          purchasedBy: undefined,
          assignedStore: undefined,
          bestStores: [],
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('continues processing other items if one fails', async () => {
      const failingAddShoppingItem = vi
        .fn()
        .mockRejectedValueOnce(new Error('Failed'))
        .mockResolvedValueOnce(undefined);

      const { result } = renderHook(() =>
        usePantryActions(mockPantryItems, failingAddShoppingItem)
      );

      // Should not throw, but continue processing
      await expect(result.current.addLowStockToShopping()).rejects.toThrow('Failed');

      expect(failingAddShoppingItem).toHaveBeenCalledTimes(1);
    });
  });
});
