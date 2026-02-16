/**
 * Tests for shopping type validators
 */

import { describe, it, expect } from 'vitest';
import {
  validateCategory,
  validatePantryCategory,
  validatePriority,
  validatePantryFilter,
  validatePantrySort,
  SHOPPING_CATEGORIES,
  PANTRY_CATEGORIES,
  SHOPPING_PRIORITIES,
  PANTRY_FILTERS,
  PANTRY_SORTS,
} from '../typeValidators';

describe('typeValidators', () => {
  describe('validateCategory', () => {
    it('should return valid shopping categories', () => {
      SHOPPING_CATEGORIES.forEach(category => {
        expect(validateCategory(category)).toBe(category);
      });
    });

    it('should return default "other" for invalid categories', () => {
      expect(validateCategory('invalid')).toBe('other');
      expect(validateCategory('')).toBe('other');
      expect(validateCategory('PRODUCE')).toBe('other'); // Case sensitive
      expect(validateCategory('grocery')).toBe('other');
    });

    it('should handle null and undefined', () => {
      expect(validateCategory(null as unknown as string)).toBe('other');
      expect(validateCategory(undefined as unknown as string)).toBe('other');
    });

    it('should handle numbers and objects', () => {
      expect(validateCategory(123 as unknown as string)).toBe('other');
      expect(validateCategory({} as unknown as string)).toBe('other');
      expect(validateCategory([] as unknown as string)).toBe('other');
    });

    it('should accept all valid shopping categories', () => {
      const validCategories = [
        'produce',
        'dairy',
        'meat',
        'pantry',
        'frozen',
        'bakery',
        'deli',
        'household',
        'personal',
        'electronics',
        'other',
      ];

      validCategories.forEach(category => {
        expect(validateCategory(category)).toBe(category);
      });
    });
  });

  describe('validatePantryCategory', () => {
    it('should return valid pantry categories', () => {
      PANTRY_CATEGORIES.forEach(category => {
        expect(validatePantryCategory(category)).toBe(category);
      });
    });

    it('should return default "other" for invalid pantry categories', () => {
      expect(validatePantryCategory('invalid')).toBe('other');
      expect(validatePantryCategory('frozen')).toBe('other'); // Valid shopping but not pantry
      expect(validatePantryCategory('electronics')).toBe('other');
    });

    it('should accept all valid pantry categories', () => {
      const validCategories = ['produce', 'dairy', 'meat', 'pantry', 'other'];

      validCategories.forEach(category => {
        expect(validatePantryCategory(category)).toBe(category);
      });
    });
  });

  describe('validatePriority', () => {
    it('should return valid priorities', () => {
      SHOPPING_PRIORITIES.forEach(priority => {
        expect(validatePriority(priority)).toBe(priority);
      });
    });

    it('should return default "medium" for invalid priorities', () => {
      expect(validatePriority('invalid')).toBe('medium');
      expect(validatePriority('urgent')).toBe('medium');
      expect(validatePriority('critical')).toBe('medium');
      expect(validatePriority('')).toBe('medium');
    });

    it('should handle null and undefined', () => {
      expect(validatePriority(null as unknown as string)).toBe('medium');
      expect(validatePriority(undefined as unknown as string)).toBe('medium');
    });

    it('should accept all valid priorities', () => {
      expect(validatePriority('low')).toBe('low');
      expect(validatePriority('medium')).toBe('medium');
      expect(validatePriority('high')).toBe('high');
    });
  });

  describe('validatePantryFilter', () => {
    it('should return valid pantry filters', () => {
      PANTRY_FILTERS.forEach(filter => {
        expect(validatePantryFilter(filter)).toBe(filter);
      });
    });

    it('should return default "all" for invalid filters', () => {
      expect(validatePantryFilter('invalid')).toBe('all');
      expect(validatePantryFilter('active')).toBe('all');
      expect(validatePantryFilter('')).toBe('all');
    });

    it('should handle null and undefined', () => {
      expect(validatePantryFilter(null as unknown as string)).toBe('all');
      expect(validatePantryFilter(undefined as unknown as string)).toBe('all');
    });

    it('should accept all valid filters', () => {
      expect(validatePantryFilter('all')).toBe('all');
      expect(validatePantryFilter('low-stock')).toBe('low-stock');
      expect(validatePantryFilter('expired')).toBe('expired');
      expect(validatePantryFilter('expiring-soon')).toBe('expiring-soon');
    });
  });

  describe('validatePantrySort', () => {
    it('should return valid pantry sorts', () => {
      PANTRY_SORTS.forEach(sort => {
        expect(validatePantrySort(sort)).toBe(sort);
      });
    });

    it('should return default "name" for invalid sorts', () => {
      expect(validatePantrySort('invalid')).toBe('name');
      expect(validatePantrySort('price')).toBe('name');
      expect(validatePantrySort('date')).toBe('name');
      expect(validatePantrySort('')).toBe('name');
    });

    it('should handle null and undefined', () => {
      expect(validatePantrySort(null as unknown as string)).toBe('name');
      expect(validatePantrySort(undefined as unknown as string)).toBe('name');
    });

    it('should accept all valid sort options', () => {
      expect(validatePantrySort('name')).toBe('name');
      expect(validatePantrySort('quantity')).toBe('quantity');
      expect(validatePantrySort('expiration')).toBe('expiration');
      expect(validatePantrySort('category')).toBe('category');
    });
  });

  describe('constants', () => {
    it('should have correct shopping categories', () => {
      expect(SHOPPING_CATEGORIES).toHaveLength(11);
      expect(SHOPPING_CATEGORIES).toContain('produce');
      expect(SHOPPING_CATEGORIES).toContain('electronics');
      expect(SHOPPING_CATEGORIES).toContain('other');
    });

    it('should have correct pantry categories as subset of shopping categories', () => {
      expect(PANTRY_CATEGORIES).toHaveLength(5);
      PANTRY_CATEGORIES.forEach(category => {
        expect(SHOPPING_CATEGORIES).toContain(category);
      });
    });

    it('should have correct priorities', () => {
      expect(SHOPPING_PRIORITIES).toHaveLength(3);
      expect(SHOPPING_PRIORITIES).toEqual(['low', 'medium', 'high']);
    });

    it('should have correct pantry filters', () => {
      expect(PANTRY_FILTERS).toHaveLength(4);
      expect(PANTRY_FILTERS).toEqual(['all', 'low-stock', 'expired', 'expiring-soon']);
    });

    it('should have correct pantry sort options', () => {
      expect(PANTRY_SORTS).toHaveLength(4);
      expect(PANTRY_SORTS).toEqual(['name', 'quantity', 'expiration', 'category']);
    });
  });
});
