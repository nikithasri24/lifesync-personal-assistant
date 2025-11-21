/**
 * Meal Planning Helper Utilities
 * Date manipulation and key generation for meal planning
 */

import { format } from 'date-fns';

export const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const;
export type MealType = typeof MEAL_TYPES[number];

/**
 * Convert a Date to YYYY-MM-DD string key
 */
export const toKey = (date: Date): string => format(date, 'yyyy-MM-dd');

/**
 * Ensure value is a Date object
 */
export const ensureDate = (value: Date | string): Date =>
  value instanceof Date ? value : new Date(value);

/**
 * Parse a local date key (YYYY-MM-DD) to Date object
 */
export const parseLocalDateKey = (key: string): Date => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
};

/**
 * Generate a storage key for a meal draft
 */
export const getMealDraftKey = (dateKey: string, mealType: string): string =>
  `meal-draft-${dateKey}-${mealType}`;
