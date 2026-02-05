/**
 * Runtime Type Guards
 *
 * Type guard functions for runtime type validation.
 * Use these instead of unsafe type casts (as Type) to improve type safety.
 *
 * @example
 * // Instead of:
 * const item = data as ShoppingItem; // Unsafe!
 *
 * // Use:
 * if (isShoppingItem(data)) {
 *   // TypeScript knows data is ShoppingItem here
 *   console.log(data.name);
 * }
 */

import type { ShoppingItem } from '../shopping/types';
import type { Task } from '../lib/supabase';
import type { Transaction, Account, Category } from '../finance/types';
import type { Goal } from './index';
import type { Recipe, PantryItem } from './index';
import type { CalendarEvent } from '../services/types';

/**
 * Check if value is a ShoppingItem
 */
export function isShoppingItem(value: unknown): value is ShoppingItem {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'name' in value &&
    'category' in value &&
    'purchased' in value &&
    typeof (value as ShoppingItem).name === 'string' &&
    typeof (value as ShoppingItem).purchased === 'boolean'
  );
}

/**
 * Check if value is a Task
 */
export function isTask(value: unknown): value is Task {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'title' in value &&
    'status' in value &&
    typeof (value as Task).title === 'string' &&
    typeof (value as Task).status === 'string'
  );
}

/**
 * Check if value is a Transaction
 */
export function isTransaction(value: unknown): value is Transaction {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'amount' in value &&
    'description' in value &&
    'type' in value &&
    typeof (value as Transaction).amount === 'number' &&
    typeof (value as Transaction).description === 'string'
  );
}

/**
 * Check if value is an Account
 */
export function isAccount(value: unknown): value is Account {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'name' in value &&
    'type' in value &&
    'balance' in value &&
    typeof (value as Account).name === 'string' &&
    typeof (value as Account).balance === 'number'
  );
}

/**
 * Check if value is a Category
 */
export function isCategory(value: unknown): value is Category {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'name' in value &&
    typeof (value as Category).name === 'string'
  );
}

/**
 * Check if value is a Goal
 */
export function isGoal(value: unknown): value is Goal {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'title' in value &&
    'description' in value &&
    typeof (value as Goal).title === 'string'
  );
}

/**
 * Check if value is a Recipe
 */
export function isRecipe(value: unknown): value is Recipe {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'name' in value &&
    'instructions' in value &&
    'ingredients' in value &&
    typeof (value as Recipe).name === 'string' &&
    Array.isArray((value as Recipe).instructions) &&
    Array.isArray((value as Recipe).ingredients)
  );
}

/**
 * Check if value is a PantryItem
 */
export function isPantryItem(value: unknown): value is PantryItem {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'name' in value &&
    'quantity' in value &&
    'category' in value &&
    typeof (value as PantryItem).name === 'string' &&
    typeof (value as PantryItem).quantity === 'number'
  );
}

/**
 * Check if value is a CalendarEvent
 */
export function isCalendarEvent(value: unknown): value is CalendarEvent {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'title' in value &&
    'start_time' in value &&
    typeof (value as CalendarEvent).title === 'string' &&
    typeof (value as CalendarEvent).start_time === 'string'
  );
}

/**
 * Check if value is an array of a specific type using a guard function
 *
 * @example
 * if (isArrayOf(data, isTask)) {
 *   // data is Task[]
 * }
 */
export function isArrayOf<T>(
  value: unknown,
  guard: (item: unknown) => item is T
): value is T[] {
  return Array.isArray(value) && value.every(guard);
}

/**
 * Check if value is a non-null object
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Check if value is a string
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 * Check if value is a number
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

/**
 * Check if value is a boolean
 */
export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

/**
 * Check if value is a Date object
 */
export function isDate(value: unknown): value is Date {
  return value instanceof Date && !isNaN(value.getTime());
}

/**
 * Assert that a condition is true, throwing an error if not
 * Useful for narrowing types when you know something must be true
 *
 * @example
 * function processUser(data: unknown) {
 *   assertType(isObject(data) && 'id' in data, 'Expected user object with id');
 *   // data is now Record<string, unknown> & { id: unknown }
 * }
 */
export function assertType(
  condition: boolean,
  message: string = 'Type assertion failed'
): asserts condition {
  if (!condition) {
    throw new TypeError(message);
  }
}
