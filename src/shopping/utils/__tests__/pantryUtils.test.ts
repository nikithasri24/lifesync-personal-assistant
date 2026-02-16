/**
 * Tests for pantry utility functions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createShoppingItemFromPantry, exportPantryToCsv, downloadCsv } from '../pantryUtils';
import type { PantryItem } from '@/types';

describe('pantryUtils', () => {
  describe('createShoppingItemFromPantry', () => {
    it('should convert a pantry item to a shopping item with correct properties', () => {
      const pantryItem: PantryItem = {
        id: 'pantry-1',
        name: 'Milk',
        quantity: 0,
        unit: 'gallon',
        category: 'dairy',
        location: 'Fridge',
        isLowStock: true,
        lowStockThreshold: 1,
        notes: 'Organic preferred',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      const result = createShoppingItemFromPantry(pantryItem, 2);

      expect(result).toEqual({
        name: 'Milk',
        quantity: 2,
        unit: 'gallon',
        category: 'dairy',
        priority: 'medium',
        purchased: false,
        notes: 'Organic preferred',
        tags: ['from:pantry', 'reason:replenish'],
        bestStores: [],
      });
    });

    it('should map all pantry categories correctly', () => {
      const categories: PantryItem['category'][] = ['produce', 'dairy', 'meat', 'pantry', 'bakery', 'other'];

      categories.forEach(category => {
        const pantryItem: PantryItem = {
          id: 'test',
          name: 'Test Item',
          quantity: 1,
          category,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const result = createShoppingItemFromPantry(pantryItem, 1);
        expect(result.category).toBe(category);
      });
    });

    it('should handle pantry item without optional fields', () => {
      const pantryItem: PantryItem = {
        id: 'pantry-2',
        name: 'Eggs',
        quantity: 0,
        category: 'dairy',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = createShoppingItemFromPantry(pantryItem, 12);

      expect(result.unit).toBeUndefined();
      expect(result.notes).toBeUndefined();
      expect(result.tags).toEqual(['from:pantry', 'reason:replenish']);
    });

    it('should default to "other" category for unmapped categories', () => {
      const pantryItem = {
        id: 'pantry-3',
        name: 'Test',
        quantity: 1,
        category: 'unknown-category' as PantryItem['category'],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = createShoppingItemFromPantry(pantryItem, 1);
      expect(result.category).toBe('other');
    });
  });

  describe('exportPantryToCsv', () => {
    it('should export pantry items to CSV format with headers', () => {
      const items: PantryItem[] = [
        {
          id: '1',
          name: 'Milk',
          quantity: 2,
          unit: 'gallon',
          category: 'dairy',
          expirationDate: new Date('2024-12-31'),
          location: 'Fridge',
          isLowStock: false,
          lowStockThreshold: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          name: 'Apples',
          quantity: 5,
          unit: 'lbs',
          category: 'produce',
          location: 'Counter',
          isLowStock: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const csv = exportPantryToCsv(items);
      const lines = csv.split('\n');

      // Check headers
      expect(lines[0]).toBe('Name,Quantity,Unit,Category,Expiration,Location,Low Stock,Threshold');

      // Check data rows
      expect(lines[1]).toContain('"Milk"');
      expect(lines[1]).toContain('"2"');
      expect(lines[1]).toContain('"gallon"');
      expect(lines[1]).toContain('"dairy"');
      expect(lines[1]).toContain('"2024-12-31"');
      expect(lines[1]).toContain('"Fridge"');
      expect(lines[1]).toContain('"No"');
      expect(lines[1]).toContain('"1"');

      expect(lines[2]).toContain('"Apples"');
      expect(lines[2]).toContain('"5"');
      expect(lines[2]).toContain('"produce"');
      expect(lines[2]).toContain('"Yes"');
    });

    it('should handle items with missing optional fields', () => {
      const items: PantryItem[] = [
        {
          id: '1',
          name: 'Rice',
          quantity: 10,
          category: 'pantry',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const csv = exportPantryToCsv(items);
      const lines = csv.split('\n');

      expect(lines[1]).toContain('"Rice"');
      expect(lines[1]).toContain('"10"');
      expect(lines[1]).toContain('""'); // Empty unit
      expect(lines[1]).toContain('"No"'); // isLowStock defaults to false
    });

    it('should handle empty array', () => {
      const csv = exportPantryToCsv([]);
      const lines = csv.split('\n');

      expect(lines.length).toBe(1); // Only headers
      expect(lines[0]).toBe('Name,Quantity,Unit,Category,Expiration,Location,Low Stock,Threshold');
    });

    it('should properly quote fields containing commas', () => {
      const items: PantryItem[] = [
        {
          id: '1',
          name: 'Cheese, Cheddar',
          quantity: 1,
          category: 'dairy',
          notes: 'Sharp, aged',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const csv = exportPantryToCsv(items);
      expect(csv).toContain('"Cheese, Cheddar"');
    });
  });

  describe('downloadCsv', () => {
    beforeEach(() => {
      // Setup DOM mocks
      document.body.innerHTML = '';
      global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
      global.URL.revokeObjectURL = vi.fn();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should create a download link and trigger download', () => {
      const csvContent = 'Name,Quantity\n"Milk",2';
      const clickSpy = vi.fn();

      // Mock createElement to spy on the link element
      const originalCreateElement = document.createElement.bind(document);
      vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
        const element = originalCreateElement(tagName);
        if (tagName === 'a') {
          element.click = clickSpy;
        }
        return element;
      });

      downloadCsv(csvContent, 'test-export.csv');

      // Verify blob was created
      expect(global.URL.createObjectURL).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'text/csv;charset=utf-8;',
        })
      );

      // Verify link was clicked
      expect(clickSpy).toHaveBeenCalled();
    });

    it('should use default filename when not provided', () => {
      const csvContent = 'Name\n"Test"';
      const clickSpy = vi.fn();

      const originalCreateElement = document.createElement.bind(document);
      vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
        const element = originalCreateElement(tagName);
        if (tagName === 'a') {
          element.click = clickSpy;
          // Capture the download attribute
          const originalSetAttribute = element.setAttribute.bind(element);
          vi.spyOn(element, 'setAttribute').mockImplementation((name, value) => {
            originalSetAttribute(name, value);
            if (name === 'download') {
              expect(value).toBe('pantry-export.csv');
            }
          });
        }
        return element;
      });

      downloadCsv(csvContent);

      expect(clickSpy).toHaveBeenCalled();
    });

    it('should clean up after download', () => {
      const csvContent = 'test';
      let linkElement: HTMLAnchorElement | null = null;

      const originalCreateElement = document.createElement.bind(document);
      vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
        const element = originalCreateElement(tagName);
        if (tagName === 'a') {
          linkElement = element as HTMLAnchorElement;
          element.click = vi.fn();
        }
        return element;
      });

      downloadCsv(csvContent);

      // Verify link was added then removed from DOM
      expect(linkElement).toBeTruthy();
      expect(document.body.contains(linkElement!)).toBe(false);
    });
  });
});
