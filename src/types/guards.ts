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
 *   logger.debug('TypeGuards', `Found item: ${data.name}`);
 * }
 */

import type { ShoppingItem } from '../shopping/types';
import type { Task } from '../lib/supabase';
import type { Transaction, Account, Category } from '../finance/types';
import type { Goal } from './index';
import type { Recipe, PantryItem } from './index';
import type {
  CalendarEvent,
  HabitData,
  HabitEntryData,
  TaskData,
  ProjectData,
  ShoppingListData,
  StoreData,
  ShoppingItemData,
  PantryItemData,
  MealPlanData,
  PlannedMealData,
  RecipeData as RecipeDataType,
  FocusSessionData,
} from '../services/types';
import type { SavedLocation, Coordinates } from '../lib/location/types';
import type {
  ProfileConnection,
  ModulePermission,
  ConnectionInvitation,
  ConnectionWithUser,
} from '../shared/types/connections';

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
 * Check if value is a Task (legacy type)
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
 * Check if value is TaskData (modern type)
 */
export function isTaskData(value: unknown): value is TaskData {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'title' in value &&
    'status' in value &&
    'user_id' in value &&
    typeof (value as TaskData).title === 'string' &&
    typeof (value as TaskData).status === 'string' &&
    typeof (value as TaskData).user_id === 'string'
  );
}

/**
 * Check if value is ProjectData
 */
export function isProjectData(value: unknown): value is ProjectData {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'name' in value &&
    'user_id' in value &&
    typeof (value as ProjectData).name === 'string' &&
    typeof (value as ProjectData).user_id === 'string'
  );
}

/**
 * Check if value is ShoppingListData
 */
export function isShoppingListData(value: unknown): value is ShoppingListData {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'name' in value &&
    'user_id' in value &&
    typeof (value as ShoppingListData).name === 'string' &&
    typeof (value as ShoppingListData).user_id === 'string'
  );
}

/**
 * Check if value is ShoppingItemData
 */
export function isShoppingItemData(value: unknown): value is ShoppingItemData {
  return (
    typeof value === 'object' &&
    value !== null &&
    'name' in value &&
    'shopping_list_id' in value &&
    typeof (value as ShoppingItemData).name === 'string' &&
    typeof (value as ShoppingItemData).shopping_list_id === 'string'
  );
}

/**
 * Check if value is StoreData
 */
export function isStoreData(value: unknown): value is StoreData {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'name' in value &&
    typeof (value as StoreData).name === 'string'
  );
}

/**
 * Check if value is PantryItemData
 */
export function isPantryItemData(value: unknown): value is PantryItemData {
  return (
    typeof value === 'object' &&
    value !== null &&
    'name' in value &&
    typeof (value as PantryItemData).name === 'string'
  );
}

/**
 * Check if value is MealPlanData
 */
export function isMealPlanData(value: unknown): value is MealPlanData {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'name' in value &&
    'user_id' in value &&
    typeof (value as MealPlanData).name === 'string' &&
    typeof (value as MealPlanData).user_id === 'string'
  );
}

/**
 * Check if value is PlannedMealData
 */
export function isPlannedMealData(value: unknown): value is PlannedMealData {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'meal_plan_id' in value &&
    'date' in value &&
    'meal_type' in value &&
    typeof (value as PlannedMealData).meal_plan_id === 'string' &&
    typeof (value as PlannedMealData).date === 'string' &&
    ['breakfast', 'lunch', 'dinner', 'snack'].includes((value as PlannedMealData).meal_type)
  );
}

/**
 * Check if value is RecipeData
 */
export function isRecipeData(value: unknown): value is RecipeDataType {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'name' in value &&
    'user_id' in value &&
    typeof (value as RecipeDataType).name === 'string' &&
    typeof (value as RecipeDataType).user_id === 'string'
  );
}

/**
 * Check if value is FocusSessionData
 */
export function isFocusSessionData(value: unknown): value is FocusSessionData {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'user_id' in value &&
    'started_at' in value &&
    typeof (value as FocusSessionData).user_id === 'string' &&
    typeof (value as FocusSessionData).started_at === 'string'
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
 * Check if value is a HabitData
 */
export function isHabitData(value: unknown): value is HabitData {
  return (
    typeof value === 'object' &&
    value !== null &&
    'name' in value &&
    typeof (value as HabitData).name === 'string' &&
    (
      !('id' in value) ||
      typeof (value as HabitData).id === 'string'
    ) &&
    (
      !('frequency' in value) ||
      ['daily', 'weekly', 'monthly'].includes((value as HabitData).frequency!)
    )
  );
}

/**
 * Check if value is a HabitEntryData
 */
export function isHabitEntryData(value: unknown): value is HabitEntryData {
  return (
    typeof value === 'object' &&
    value !== null &&
    'habit_id' in value &&
    'date' in value &&
    typeof (value as HabitEntryData).habit_id === 'string' &&
    typeof (value as HabitEntryData).date === 'string'
  );
}

/**
 * Check if value is valid Coordinates
 */
export function isCoordinates(value: unknown): value is Coordinates {
  return (
    typeof value === 'object' &&
    value !== null &&
    'lat' in value &&
    'lng' in value &&
    typeof (value as Coordinates).lat === 'number' &&
    typeof (value as Coordinates).lng === 'number' &&
    !isNaN((value as Coordinates).lat) &&
    !isNaN((value as Coordinates).lng)
  );
}

/**
 * Check if value is a SavedLocation
 */
export function isSavedLocation(value: unknown): value is SavedLocation {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'name' in value &&
    'coordinates' in value &&
    'type' in value &&
    typeof (value as SavedLocation).id === 'string' &&
    typeof (value as SavedLocation).name === 'string' &&
    isCoordinates((value as SavedLocation).coordinates) &&
    ['home', 'work', 'store', 'custom'].includes((value as SavedLocation).type)
  );
}

// =====================================================
// Inbox Types
// =====================================================

/**
 * Check if value is an InboxItem (runtime validation only)
 * Note: This checks structural shape. Use type assertion after validation.
 */
export function isInboxItem(value: unknown): boolean {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'user_id' in value &&
    'content' in value &&
    'suggested_type' in value &&
    'status' in value &&
    'created_at' in value &&
    'updated_at' in value &&
    typeof (value as any).id === 'string' &&
    typeof (value as any).user_id === 'string' &&
    typeof (value as any).content === 'string' &&
    typeof (value as any).suggested_type === 'string' &&
    typeof (value as any).status === 'string' &&
    typeof (value as any).created_at === 'string' &&
    typeof (value as any).updated_at === 'string'
  );
}

// =====================================================
// Notification Types
// =====================================================

/**
 * Check if value is a NotificationQueueItem
 */
export function isNotificationQueueItem(value: unknown): value is {
  id?: string;
  user_id: string;
  type: string;
  priority: 'low' | 'normal' | 'high';
  payload: Record<string, unknown>;
  scheduled_for: string;
  status?: string;
} {
  return (
    typeof value === 'object' &&
    value !== null &&
    'user_id' in value &&
    'type' in value &&
    'priority' in value &&
    'payload' in value &&
    'scheduled_for' in value &&
    typeof (value as any).user_id === 'string' &&
    typeof (value as any).type === 'string' &&
    ['low', 'normal', 'high'].includes((value as any).priority)
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

// =====================================================
// Connection Types
// =====================================================

/**
 * Check if value is a ProfileConnection
 */
export function isProfileConnection(value: unknown): value is ProfileConnection {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'requesterId' in value &&
    'receiverId' in value &&
    'relationship' in value &&
    'status' in value &&
    'createdAt' in value &&
    'updatedAt' in value &&
    typeof (value as ProfileConnection).id === 'string' &&
    typeof (value as ProfileConnection).requesterId === 'string' &&
    typeof (value as ProfileConnection).receiverId === 'string' &&
    typeof (value as ProfileConnection).relationship === 'string' &&
    typeof (value as ProfileConnection).status === 'string' &&
    typeof (value as ProfileConnection).createdAt === 'string' &&
    typeof (value as ProfileConnection).updatedAt === 'string'
  );
}

/**
 * Check if value is a ModulePermission
 */
export function isModulePermission(value: unknown): value is ModulePermission {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'connectionId' in value &&
    'module' in value &&
    'permissionLevel' in value &&
    'userId' in value &&
    'createdAt' in value &&
    'updatedAt' in value &&
    typeof (value as ModulePermission).id === 'string' &&
    typeof (value as ModulePermission).connectionId === 'string' &&
    typeof (value as ModulePermission).module === 'string' &&
    typeof (value as ModulePermission).permissionLevel === 'string' &&
    typeof (value as ModulePermission).userId === 'string' &&
    typeof (value as ModulePermission).createdAt === 'string' &&
    typeof (value as ModulePermission).updatedAt === 'string'
  );
}

/**
 * Check if value is a ConnectionInvitation
 */
export function isConnectionInvitation(value: unknown): value is ConnectionInvitation {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'connectionId' in value &&
    'proposedPermissions' in value &&
    'createdAt' in value &&
    'expiresAt' in value &&
    typeof (value as ConnectionInvitation).id === 'string' &&
    typeof (value as ConnectionInvitation).connectionId === 'string' &&
    typeof (value as ConnectionInvitation).createdAt === 'string' &&
    typeof (value as ConnectionInvitation).expiresAt === 'string'
  );
}

/**
 * Check if value is a ConnectionWithUser
 */
export function isConnectionWithUser(value: unknown): value is ConnectionWithUser {
  return (
    isProfileConnection(value) &&
    'otherUser' in value &&
    typeof (value as ConnectionWithUser).otherUser === 'object' &&
    (value as ConnectionWithUser).otherUser !== null &&
    'id' in (value as ConnectionWithUser).otherUser &&
    'email' in (value as ConnectionWithUser).otherUser &&
    typeof (value as ConnectionWithUser).otherUser.id === 'string' &&
    typeof (value as ConnectionWithUser).otherUser.email === 'string'
  );
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
