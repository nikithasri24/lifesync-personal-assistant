/**
 * Type mappers for shopping data
 * Converts between database types and application types
 */

import type { Database } from '@/types/database.types';
import type { ShoppingListData, ShoppingItemData } from '@/services/types';

type ShoppingListRow = Database['public']['Tables']['shopping_lists']['Row'];
type ShoppingListInsert = Database['public']['Tables']['shopping_lists']['Insert'];
type ShoppingListUpdate = Database['public']['Tables']['shopping_lists']['Update'];

type ShoppingItemRow = Database['public']['Tables']['shopping_items']['Row'];
type ShoppingItemInsert = Database['public']['Tables']['shopping_items']['Insert'];
type ShoppingItemUpdate = Database['public']['Tables']['shopping_items']['Update'];

/**
 * Converts database row to application ShoppingListData type
 */
export function mapRowToShoppingList(row: ShoppingListRow): ShoppingListData {
  return {
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    description: row.description,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/**
 * Converts application ShoppingListData to database insert format
 */
export function mapShoppingListToInsert(
  list: Omit<ShoppingListData, 'id' | 'created_at' | 'updated_at' | 'user_id'>
): Omit<ShoppingListInsert, 'user_id'> {
  return {
    name: list.name,
    description: list.description,
    status: list.status,
  };
}

/**
 * Converts partial ShoppingListData update to database update format
 */
export function mapShoppingListToUpdate(
  updates: Partial<Omit<ShoppingListData, 'id' | 'user_id' | 'created_at'>>
): ShoppingListUpdate {
  const dbUpdate: ShoppingListUpdate = {};

  if (updates.name !== undefined) dbUpdate.name = updates.name;
  if (updates.description !== undefined) dbUpdate.description = updates.description;
  if (updates.status !== undefined) dbUpdate.status = updates.status;
  if (updates.updated_at !== undefined) dbUpdate.updated_at = updates.updated_at;

  return dbUpdate;
}

/**
 * Converts database row to application ShoppingItemData type
 */
export function mapRowToShoppingItem(row: ShoppingItemRow): ShoppingItemData {
  return {
    id: row.id,
    shopping_list_id: row.shopping_list_id,
    user_id: row.user_id,
    name: row.name,
    quantity: row.quantity,
    unit: row.unit,
    estimated_price: row.estimated_price,
    actual_price: row.actual_price,
    category: row.category,
    subcategory: row.subcategory,
    brand: row.brand,
    notes: row.notes,
    is_purchased: row.is_purchased,
    purchased_at: row.purchased_at,
    purchased_by: row.purchased_by,
    position: row.position,
    priority: row.priority,
    tags: row.tags,
    assigned_store: row.assigned_store,
    best_stores: row.best_stores,
    aisle: row.aisle,
    barcode: row.barcode,
    image_url: row.image_url,
    nutrition_info: row.nutrition_info,
    recurring: row.recurring,
    added_by: row.added_by,
    auto_added: row.auto_added,
    recipe_id: row.recipe_id,
    store: row.store,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/**
 * Converts application ShoppingItemData to database insert format
 */
export function mapShoppingItemToInsert(
  item: Omit<ShoppingItemData, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'shopping_list_id'>
): Omit<ShoppingItemInsert, 'user_id' | 'shopping_list_id'> {
  return {
    name: item.name,
    quantity: item.quantity,
    unit: item.unit,
    estimated_price: item.estimated_price,
    actual_price: item.actual_price,
    category: item.category,
    subcategory: item.subcategory,
    brand: item.brand,
    notes: item.notes,
    is_purchased: item.is_purchased,
    purchased_at: item.purchased_at,
    purchased_by: item.purchased_by,
    position: item.position,
    priority: item.priority,
    tags: item.tags,
    assigned_store: item.assigned_store,
    best_stores: item.best_stores,
    aisle: item.aisle,
    barcode: item.barcode,
    image_url: item.image_url,
    nutrition_info: item.nutrition_info as ShoppingItemInsert['nutrition_info'],
    recurring: item.recurring as ShoppingItemInsert['recurring'],
    added_by: item.added_by,
    auto_added: item.auto_added,
    recipe_id: item.recipe_id,
    store: item.store,
  };
}

/**
 * Converts partial ShoppingItemData update to database update format
 */
export function mapShoppingItemToUpdate(
  updates: Partial<Omit<ShoppingItemData, 'id' | 'user_id' | 'shopping_list_id' | 'created_at'>>
): ShoppingItemUpdate {
  const dbUpdate: ShoppingItemUpdate = {};

  if (updates.name !== undefined) dbUpdate.name = updates.name;
  if (updates.quantity !== undefined) dbUpdate.quantity = updates.quantity;
  if (updates.unit !== undefined) dbUpdate.unit = updates.unit;
  if (updates.estimated_price !== undefined) dbUpdate.estimated_price = updates.estimated_price;
  if (updates.actual_price !== undefined) dbUpdate.actual_price = updates.actual_price;
  if (updates.category !== undefined) dbUpdate.category = updates.category;
  if (updates.subcategory !== undefined) dbUpdate.subcategory = updates.subcategory;
  if (updates.brand !== undefined) dbUpdate.brand = updates.brand;
  if (updates.notes !== undefined) dbUpdate.notes = updates.notes;
  if (updates.is_purchased !== undefined) dbUpdate.is_purchased = updates.is_purchased;
  if (updates.purchased_at !== undefined) dbUpdate.purchased_at = updates.purchased_at;
  if (updates.purchased_by !== undefined) dbUpdate.purchased_by = updates.purchased_by;
  if (updates.position !== undefined) dbUpdate.position = updates.position;
  if (updates.priority !== undefined) dbUpdate.priority = updates.priority;
  if (updates.tags !== undefined) dbUpdate.tags = updates.tags;
  if (updates.assigned_store !== undefined) dbUpdate.assigned_store = updates.assigned_store;
  if (updates.best_stores !== undefined) dbUpdate.best_stores = updates.best_stores;
  if (updates.aisle !== undefined) dbUpdate.aisle = updates.aisle;
  if (updates.barcode !== undefined) dbUpdate.barcode = updates.barcode;
  if (updates.image_url !== undefined) dbUpdate.image_url = updates.image_url;
  if (updates.nutrition_info !== undefined) dbUpdate.nutrition_info = updates.nutrition_info as ShoppingItemUpdate['nutrition_info'];
  if (updates.recurring !== undefined) dbUpdate.recurring = updates.recurring as ShoppingItemUpdate['recurring'];
  if (updates.added_by !== undefined) dbUpdate.added_by = updates.added_by;
  if (updates.auto_added !== undefined) dbUpdate.auto_added = updates.auto_added;
  if (updates.recipe_id !== undefined) dbUpdate.recipe_id = updates.recipe_id;
  if (updates.store !== undefined) dbUpdate.store = updates.store;
  if (updates.updated_at !== undefined) dbUpdate.updated_at = updates.updated_at;

  return dbUpdate;
}
