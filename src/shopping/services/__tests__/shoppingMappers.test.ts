/**
 * Tests for shopping data mappers
 */

import { describe, it, expect } from 'vitest';
import {
  mapShoppingItemDataToModel,
  mapShoppingItemToCreateInput,
  mapShoppingItemToUpdateInput,
} from '../shoppingMappers';
import type { ShoppingItemData } from '@/services/types';
import type { ShoppingItem } from '../../types';

describe('shoppingMappers', () => {
  describe('mapShoppingItemDataToModel', () => {
    it('should map API data to UI model correctly', () => {
      const apiData: ShoppingItemData[] = [
        {
          id: 'item-1',
          shopping_list_id: 'list-1',
          user_id: 'user-1',
          name: 'Milk',
          quantity: 2,
          unit: 'gallon',
          category: 'dairy',
          subcategory: 'whole milk',
          priority: 'high',
          is_purchased: false,
          estimated_price: 3.99,
          actual_price: 4.29,
          brand: 'Organic Valley',
          aisle: '12',
          barcode: '123456789',
          image_url: 'https://example.com/milk.jpg',
          nutrition_info: { calories: 150, protein: 8 },
          tags: ['organic', 'refrigerated'],
          assigned_store: 'store-1',
          best_stores: ['store-1', 'store-2'],
          notes: 'Get the large size',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
        },
      ];

      const result = mapShoppingItemDataToModel(apiData);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'item-1',
        name: 'Milk',
        quantity: 2,
        unit: 'gallon',
        category: 'dairy',
        subcategory: 'whole milk',
        priority: 'high',
        purchased: false,
        estimatedPrice: 3.99,
        price: 4.29,
        brand: 'Organic Valley',
        aisle: '12',
        barcode: '123456789',
        imageUrl: 'https://example.com/milk.jpg',
        nutritionInfo: { calories: 150, protein: 8 },
        tags: ['organic', 'refrigerated'],
        assignedStore: 'store-1',
        bestStores: ['store-1', 'store-2'],
        notes: 'Get the large size',
        ownerId: 'user-1',
      });
      expect(result[0].createdAt).toBeInstanceOf(Date);
      expect(result[0].updatedAt).toBeInstanceOf(Date);
    });

    it('should handle items with minimal data', () => {
      const apiData: ShoppingItemData[] = [
        {
          id: 'item-2',
          shopping_list_id: 'list-1',
          user_id: 'user-1',
          name: 'Bread',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      const result = mapShoppingItemDataToModel(apiData);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'item-2',
        name: 'Bread',
        quantity: 1,
        category: 'other',
        priority: 'medium',
        purchased: false,
        tags: [],
        bestStores: [],
        ownerId: 'user-1',
      });
    });

    it('should handle missing id by using empty string', () => {
      const apiData: ShoppingItemData[] = [
        {
          shopping_list_id: 'list-1',
          user_id: 'user-1',
          name: 'Test Item',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      const result = mapShoppingItemDataToModel(apiData);

      expect(result[0].id).toBe('');
    });

    it('should convert price fields to numbers', () => {
      const apiData: ShoppingItemData[] = [
        {
          id: 'item-3',
          shopping_list_id: 'list-1',
          user_id: 'user-1',
          name: 'Cheese',
          estimated_price: '5.99' as unknown as number,
          actual_price: '6.49' as unknown as number,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      const result = mapShoppingItemDataToModel(apiData);

      expect(result[0].estimatedPrice).toBe(5.99);
      expect(result[0].price).toBe(6.49);
      expect(typeof result[0].estimatedPrice).toBe('number');
      expect(typeof result[0].price).toBe('number');
    });

    it('should handle empty array', () => {
      const result = mapShoppingItemDataToModel([]);
      expect(result).toEqual([]);
    });

    it('should handle invalid dates by using current date', () => {
      const apiData: ShoppingItemData[] = [
        {
          id: 'item-4',
          shopping_list_id: 'list-1',
          user_id: 'user-1',
          name: 'Test',
          created_at: undefined,
          updated_at: undefined,
        },
      ];

      const result = mapShoppingItemDataToModel(apiData);

      expect(result[0].createdAt).toBeInstanceOf(Date);
      expect(result[0].updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('mapShoppingItemToCreateInput', () => {
    it('should map UI model to API create input', () => {
      const uiItem: Omit<ShoppingItem, 'id' | 'createdAt' | 'updatedAt'> = {
        name: 'Eggs',
        quantity: 12,
        unit: 'count',
        category: 'dairy',
        subcategory: 'large',
        priority: 'medium',
        purchased: false,
        estimatedPrice: 3.49,
        price: 3.99,
        brand: 'Farm Fresh',
        aisle: '8',
        barcode: '987654321',
        imageUrl: 'https://example.com/eggs.jpg',
        nutritionInfo: { protein: 6, fat: 5 },
        tags: ['cage-free'],
        assignedStore: 'store-1',
        bestStores: ['store-1'],
        notes: 'Check expiration date',
      };

      const result = mapShoppingItemToCreateInput(uiItem);

      expect(result).toEqual({
        name: 'Eggs',
        quantity: 12,
        unit: 'count',
        category: 'dairy',
        subcategory: 'large',
        priority: 'medium',
        is_purchased: false,
        estimated_price: 3.49,
        actual_price: 3.99,
        brand: 'Farm Fresh',
        aisle: '8',
        barcode: '987654321',
        image_url: 'https://example.com/eggs.jpg',
        nutrition_info: { protein: 6, fat: 5 },
        tags: ['cage-free'],
        assigned_store: 'store-1',
        best_stores: ['store-1'],
        notes: 'Check expiration date',
      });
    });

    it('should handle minimal item data', () => {
      const uiItem: Omit<ShoppingItem, 'id' | 'createdAt' | 'updatedAt'> = {
        name: 'Bread',
        quantity: 1,
        category: 'bakery',
        priority: 'low',
        purchased: false,
        tags: [],
        bestStores: [],
      };

      const result = mapShoppingItemToCreateInput(uiItem);

      expect(result).toEqual({
        name: 'Bread',
        quantity: 1,
        unit: undefined,
        category: 'bakery',
        subcategory: undefined,
        priority: 'low',
        is_purchased: false,
        estimated_price: undefined,
        actual_price: undefined,
        brand: undefined,
        aisle: undefined,
        barcode: undefined,
        image_url: undefined,
        nutrition_info: undefined,
        tags: [],
        assigned_store: undefined,
        best_stores: [],
        notes: undefined,
      });
    });

    it('should default priority to medium when not provided', () => {
      const uiItem: Omit<ShoppingItem, 'id' | 'createdAt' | 'updatedAt'> = {
        name: 'Test',
        quantity: 1,
        category: 'other',
        purchased: false,
        tags: [],
        bestStores: [],
      };

      const result = mapShoppingItemToCreateInput(uiItem);

      expect(result.priority).toBe('medium');
    });

    it('should default purchased to false when not provided', () => {
      const uiItem: Omit<ShoppingItem, 'id' | 'createdAt' | 'updatedAt'> = {
        name: 'Test',
        quantity: 1,
        category: 'other',
        priority: 'low',
        tags: [],
        bestStores: [],
      };

      const result = mapShoppingItemToCreateInput(uiItem);

      expect(result.is_purchased).toBe(false);
    });
  });

  describe('mapShoppingItemToUpdateInput', () => {
    it('should map all possible update fields', () => {
      const updates: Partial<ShoppingItem> = {
        name: 'Updated Name',
        quantity: 5,
        unit: 'lbs',
        category: 'produce',
        subcategory: 'fruits',
        priority: 'high',
        purchased: true,
        estimatedPrice: 10.99,
        price: 11.49,
        brand: 'Premium',
        aisle: '1',
        barcode: '111222333',
        imageUrl: 'https://example.com/updated.jpg',
        nutritionInfo: { calories: 200 },
        tags: ['organic', 'local'],
        assignedStore: 'store-2',
        bestStores: ['store-2', 'store-3'],
        notes: 'Updated notes',
      };

      const result = mapShoppingItemToUpdateInput(updates);

      expect(result).toEqual({
        name: 'Updated Name',
        quantity: 5,
        unit: 'lbs',
        category: 'produce',
        subcategory: 'fruits',
        priority: 'high',
        is_purchased: true,
        estimated_price: 10.99,
        actual_price: 11.49,
        brand: 'Premium',
        aisle: '1',
        barcode: '111222333',
        image_url: 'https://example.com/updated.jpg',
        nutrition_info: { calories: 200 },
        tags: ['organic', 'local'],
        assigned_store: 'store-2',
        best_stores: ['store-2', 'store-3'],
        notes: 'Updated notes',
      });
    });

    it('should only include provided fields', () => {
      const updates: Partial<ShoppingItem> = {
        quantity: 3,
        purchased: true,
      };

      const result = mapShoppingItemToUpdateInput(updates);

      expect(result).toEqual({
        quantity: 3,
        is_purchased: true,
      });
      expect(Object.keys(result)).toHaveLength(2);
    });

    it('should handle empty updates object', () => {
      const updates: Partial<ShoppingItem> = {};

      const result = mapShoppingItemToUpdateInput(updates);

      expect(result).toEqual({});
      expect(Object.keys(result)).toHaveLength(0);
    });

    it('should handle undefined values explicitly', () => {
      const updates: Partial<ShoppingItem> = {
        name: 'Test',
        unit: undefined,
        notes: undefined,
      };

      const result = mapShoppingItemToUpdateInput(updates);

      expect(result).toHaveProperty('name', 'Test');
      expect(result).toHaveProperty('unit', undefined);
      expect(result).toHaveProperty('notes', undefined);
    });

    it('should convert nutrition info to Record format', () => {
      const updates: Partial<ShoppingItem> = {
        nutritionInfo: {
          calories: 100,
          protein: 5,
          carbs: 20,
        },
      };

      const result = mapShoppingItemToUpdateInput(updates);

      expect(result.nutrition_info).toEqual({
        calories: 100,
        protein: 5,
        carbs: 20,
      });
    });

    it('should handle partial updates without affecting unmapped fields', () => {
      const updates: Partial<ShoppingItem> = {
        priority: 'low',
      };

      const result = mapShoppingItemToUpdateInput(updates);

      expect(result).not.toHaveProperty('name');
      expect(result).not.toHaveProperty('quantity');
      expect(result).toHaveProperty('priority', 'low');
    });
  });
});
