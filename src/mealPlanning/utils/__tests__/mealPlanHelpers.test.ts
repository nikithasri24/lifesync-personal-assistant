/**
 * Tests for meal planning helper utilities
 */

import { describe, it, expect } from 'vitest';
import {
  toKey,
  ensureDate,
  parseLocalDateKey,
  getMealDraftKey,
  MEAL_TYPES,
} from '../mealPlanHelpers';

describe('mealPlanHelpers', () => {
  describe('toKey', () => {
    it('should convert Date to YYYY-MM-DD string', () => {
      const date = new Date(2024, 0, 15); // Jan 15, 2024
      expect(toKey(date)).toBe('2024-01-15');
    });

    it('should pad single-digit months and days with zeros', () => {
      const date = new Date(2024, 0, 1); // Jan 1, 2024
      expect(toKey(date)).toBe('2024-01-01');
    });

    it('should handle different months correctly', () => {
      expect(toKey(new Date(2024, 11, 31))).toBe('2024-12-31'); // Dec 31
      expect(toKey(new Date(2024, 5, 15))).toBe('2024-06-15'); // Jun 15
    });

    it('should handle leap year dates', () => {
      expect(toKey(new Date(2024, 1, 29))).toBe('2024-02-29'); // Feb 29, 2024 (leap year)
    });

    it('should handle year boundaries', () => {
      expect(toKey(new Date(2023, 11, 31))).toBe('2023-12-31');
      expect(toKey(new Date(2024, 0, 1))).toBe('2024-01-01');
    });
  });

  describe('ensureDate', () => {
    it('should return Date object when given Date', () => {
      const date = new Date(2024, 0, 15);
      const result = ensureDate(date);

      expect(result).toBe(date);
      expect(result).toBeInstanceOf(Date);
    });

    it('should convert ISO string to Date', () => {
      const isoString = '2024-01-15T12:00:00.000Z';
      const result = ensureDate(isoString);

      expect(result).toBeInstanceOf(Date);
      expect(result.toISOString()).toBe(isoString);
    });

    it('should convert date-only string to Date', () => {
      const dateString = '2024-01-15';
      const result = ensureDate(dateString);

      expect(result).toBeInstanceOf(Date);
      // Use UTC methods since new Date('YYYY-MM-DD') creates UTC midnight
      expect(result.getUTCFullYear()).toBe(2024);
      expect(result.getUTCMonth()).toBe(0); // January
      expect(result.getUTCDate()).toBe(15);
    });

    it('should handle various string date formats', () => {
      const formats = [
        '2024-01-15',
        '2024/01/15',
        'Jan 15, 2024',
        '01/15/2024',
      ];

      formats.forEach(format => {
        const result = ensureDate(format);
        expect(result).toBeInstanceOf(Date);
        expect(Number.isNaN(result.getTime())).toBe(false);
      });
    });
  });

  describe('parseLocalDateKey', () => {
    it('should parse YYYY-MM-DD to local Date', () => {
      const result = parseLocalDateKey('2024-01-15');

      expect(result).toBeInstanceOf(Date);
      expect(result.getFullYear()).toBe(2024);
      expect(result.getMonth()).toBe(0); // January (0-indexed)
      expect(result.getDate()).toBe(15);
    });

    it('should create date at midnight local time', () => {
      const result = parseLocalDateKey('2024-06-15');

      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
      expect(result.getSeconds()).toBe(0);
      expect(result.getMilliseconds()).toBe(0);
    });

    it('should handle different months correctly', () => {
      expect(parseLocalDateKey('2024-01-01').getMonth()).toBe(0); // Jan
      expect(parseLocalDateKey('2024-06-15').getMonth()).toBe(5); // Jun
      expect(parseLocalDateKey('2024-12-31').getMonth()).toBe(11); // Dec
    });

    it('should handle single-digit months and days', () => {
      const result = parseLocalDateKey('2024-1-5');

      expect(result.getFullYear()).toBe(2024);
      expect(result.getMonth()).toBe(0); // January
      expect(result.getDate()).toBe(5);
    });

    it('should be inverse of toKey', () => {
      const original = new Date(2024, 0, 15);
      const key = toKey(original);
      const parsed = parseLocalDateKey(key);

      expect(parsed.getFullYear()).toBe(original.getFullYear());
      expect(parsed.getMonth()).toBe(original.getMonth());
      expect(parsed.getDate()).toBe(original.getDate());
    });

    it('should handle leap year dates', () => {
      const result = parseLocalDateKey('2024-02-29');

      expect(result.getMonth()).toBe(1); // February
      expect(result.getDate()).toBe(29);
    });

    it('should handle year boundaries', () => {
      expect(parseLocalDateKey('2023-12-31').getDate()).toBe(31);
      expect(parseLocalDateKey('2024-01-01').getDate()).toBe(1);
    });
  });

  describe('getMealDraftKey', () => {
    it('should generate draft key for meal', () => {
      const result = getMealDraftKey('2024-01-15', 'breakfast');

      expect(result).toBe('meal-draft-2024-01-15-breakfast');
    });

    it('should handle different meal types', () => {
      expect(getMealDraftKey('2024-01-15', 'breakfast')).toBe('meal-draft-2024-01-15-breakfast');
      expect(getMealDraftKey('2024-01-15', 'lunch')).toBe('meal-draft-2024-01-15-lunch');
      expect(getMealDraftKey('2024-01-15', 'dinner')).toBe('meal-draft-2024-01-15-dinner');
      expect(getMealDraftKey('2024-01-15', 'snack')).toBe('meal-draft-2024-01-15-snack');
    });

    it('should handle different dates', () => {
      expect(getMealDraftKey('2024-01-01', 'breakfast')).toBe('meal-draft-2024-01-01-breakfast');
      expect(getMealDraftKey('2024-12-31', 'breakfast')).toBe('meal-draft-2024-12-31-breakfast');
    });

    it('should generate unique keys for different combinations', () => {
      const keys = new Set([
        getMealDraftKey('2024-01-15', 'breakfast'),
        getMealDraftKey('2024-01-15', 'lunch'),
        getMealDraftKey('2024-01-16', 'breakfast'),
        getMealDraftKey('2024-01-16', 'lunch'),
      ]);

      expect(keys.size).toBe(4); // All unique
    });

    it('should create consistent keys for same input', () => {
      const key1 = getMealDraftKey('2024-01-15', 'breakfast');
      const key2 = getMealDraftKey('2024-01-15', 'breakfast');

      expect(key1).toBe(key2);
    });
  });

  describe('MEAL_TYPES constant', () => {
    it('should contain all expected meal types', () => {
      expect(MEAL_TYPES).toHaveLength(4);
      expect(MEAL_TYPES).toContain('breakfast');
      expect(MEAL_TYPES).toContain('lunch');
      expect(MEAL_TYPES).toContain('dinner');
      expect(MEAL_TYPES).toContain('snack');
    });

    it('should be in expected order', () => {
      expect(MEAL_TYPES[0]).toBe('breakfast');
      expect(MEAL_TYPES[1]).toBe('lunch');
      expect(MEAL_TYPES[2]).toBe('dinner');
      expect(MEAL_TYPES[3]).toBe('snack');
    });

    it('should be a readonly tuple', () => {
      // TypeScript compile-time check, but we can verify it exists
      expect(Array.isArray(MEAL_TYPES)).toBe(true);
    });
  });

  describe('date key round-trip', () => {
    it('should maintain date integrity through toKey and parseLocalDateKey', () => {
      const dates = [
        new Date(2024, 0, 1),
        new Date(2024, 5, 15),
        new Date(2024, 11, 31),
        new Date(2024, 1, 29), // Leap year
      ];

      dates.forEach(original => {
        const key = toKey(original);
        const parsed = parseLocalDateKey(key);

        expect(parsed.getFullYear()).toBe(original.getFullYear());
        expect(parsed.getMonth()).toBe(original.getMonth());
        expect(parsed.getDate()).toBe(original.getDate());
      });
    });
  });
});
