/**
 * Type-safe validators for shopping-related enums
 * Replaces 'as any' assertions with proper validation
 */

import { createEnumValidator } from '../../utils/validators';

// Category types
export const SHOPPING_CATEGORIES = [
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
] as const;

export type ShoppingCategory = typeof SHOPPING_CATEGORIES[number];

// Priority types
export const SHOPPING_PRIORITIES = ['low', 'medium', 'high'] as const;

export type ShoppingPriority = typeof SHOPPING_PRIORITIES[number];

// Pantry filter types
export const PANTRY_FILTERS = ['all', 'low-stock', 'expired', 'expiring-soon'] as const;

export type PantryFilter = typeof PANTRY_FILTERS[number];

// Pantry sort types
export const PANTRY_SORTS = ['name', 'quantity', 'expiration', 'category'] as const;

export type PantrySort = typeof PANTRY_SORTS[number];

/**
 * Validates and returns a shopping category
 * @param value - The value to validate
 * @returns A valid shopping category
 */
export const validateCategory = createEnumValidator(SHOPPING_CATEGORIES, 'other');

/**
 * Validates and returns a shopping priority
 * @param value - The value to validate
 * @returns A valid shopping priority
 */
export const validatePriority = createEnumValidator(SHOPPING_PRIORITIES, 'medium');

/**
 * Validates and returns a pantry filter
 * @param value - The value to validate
 * @returns A valid pantry filter
 */
export const validatePantryFilter = createEnumValidator(PANTRY_FILTERS, 'all');

/**
 * Validates and returns a pantry sort
 * @param value - The value to validate
 * @returns A valid pantry sort
 */
export const validatePantrySort = createEnumValidator(PANTRY_SORTS, 'name');
