/**
 * Shopping API
 * CRUD operations for shopping lists and items with Supabase
 */

import { supabase } from '../lib/supabase';
import type { ShoppingItemData, ShoppingListData } from '../services/types';
import { apiCall, requireAuth, handleSupabaseResponse } from './apiWrapper';
import { NotFoundError } from '../lib/errors';
import { validateApiResponse } from '../lib/validation';
import {
  ShoppingListDataSchema,
  ShoppingListDataArraySchema,
  ShoppingItemDataSchema,
  ShoppingItemDataArraySchema,
} from '../shopping/schemas';
import {
  mapRowToShoppingList,
  mapShoppingListToInsert,
  mapShoppingListToUpdate,
  mapRowToShoppingItem,
  mapShoppingItemToInsert,
  mapShoppingItemToUpdate,
} from './mappers/shoppingMappers';

// =====================================================
// SHOPPING LISTS CRUD OPERATIONS
// =====================================================

/**
 * Get all shopping lists for the current user (includes merged lists from partner)
 */
export async function getShoppingLists(): Promise<ShoppingListData[]> {
  return apiCall(
    async () => {
      await requireAuth();

      // RLS policy handles filtering - returns own lists + partner's lists if merged
      const { data, error } = await supabase
        .from('shopping_lists')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      const lists = (data ?? []).map(mapRowToShoppingList);
      return validateApiResponse(
        ShoppingListDataArraySchema,
        lists,
        'getShoppingLists'
      );
    },
    { domain: 'ShoppingAPI', operation: 'getShoppingLists' }
  );
}

/**
 * Create a new shopping list (with connection_id if in merged mode)
 */
export async function createShoppingList(
  list: Omit<ShoppingListData, 'id' | 'created_at' | 'updated_at' | 'user_id'>
): Promise<ShoppingListData> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const dbList = mapShoppingListToInsert(list);

      const result = await supabase
        .from('shopping_lists')
        .insert({
          ...dbList,
          user_id: user.id,
        })
        .select()
        .single();

      const data = handleSupabaseResponse(result, 'Shopping List');
      const mappedData = mapRowToShoppingList(data);
      return validateApiResponse(
        ShoppingListDataSchema,
        mappedData,
        'createShoppingList'
      );
    },
    { domain: 'ShoppingAPI', operation: 'createShoppingList', data: { name: list.name } }
  );
}

/**
 * Update a shopping list
 */
export async function updateShoppingList(
  id: string,
  updates: Partial<Omit<ShoppingListData, 'id' | 'user_id' | 'created_at'>>
): Promise<ShoppingListData> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const dbUpdates = mapShoppingListToUpdate(updates);

      const result = await supabase
        .from('shopping_lists')
        .update(dbUpdates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      const data = handleSupabaseResponse(result, 'Shopping List', id);
      const mappedData = mapRowToShoppingList(data);
      return validateApiResponse(
        ShoppingListDataSchema,
        mappedData,
        'updateShoppingList'
      );
    },
    { domain: 'ShoppingAPI', operation: 'updateShoppingList', data: { id } }
  );
}

/**
 * Delete a shopping list
 */
export async function deleteShoppingList(id: string): Promise<void> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const { error } = await supabase
        .from('shopping_lists')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    { domain: 'ShoppingAPI', operation: 'deleteShoppingList', data: { id } }
  );
}

// =====================================================
// SHOPPING ITEMS CRUD OPERATIONS
// =====================================================

/**
 * Get all items for a shopping list (RLS policy ensures access control)
 */
export async function getShoppingListItems(listId: string): Promise<ShoppingItemData[]> {
  return apiCall(
    async () => {
      await requireAuth();

      // RLS policy on shopping_lists ensures we can only access lists we have permission to view
      const { data, error } = await supabase
        .from('shopping_items')
        .select('*')
        .eq('shopping_list_id', listId)
        .order('created_at', { ascending: true});

      if (error) throw error;
      const items = (data ?? []).map(mapRowToShoppingItem);
      return validateApiResponse(
        ShoppingItemDataArraySchema,
        items,
        'getShoppingListItems'
      );
    },
    { domain: 'ShoppingAPI', operation: 'getShoppingListItems', data: { listId } }
  );
}

/**
 * Create a new shopping item
 */
export async function createShoppingItem(
  listId: string,
  item: Omit<ShoppingItemData, 'id' | 'shopping_list_id' | 'created_at' | 'updated_at' | 'user_id'>
): Promise<ShoppingItemData> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      // Verify list ownership
      const { data: list, error: listError } = await supabase
        .from('shopping_lists')
        .select('id')
        .eq('id', listId)
        .eq('user_id', user.id)
        .single();

      if (listError || !list) throw new NotFoundError('Shopping List', listId);

      const dbItem = mapShoppingItemToInsert(item);

      const result = await supabase
        .from('shopping_items')
        .insert({
          ...dbItem,
          user_id: user.id,
          shopping_list_id: listId,
        })
        .select()
        .single();

      const data = handleSupabaseResponse(result, 'Shopping Item');
      const mappedData = mapRowToShoppingItem(data);
      return validateApiResponse(
        ShoppingItemDataSchema,
        mappedData,
        'createShoppingItem'
      );
    },
    { domain: 'ShoppingAPI', operation: 'createShoppingItem', data: { listId, name: item.name } }
  );
}

/**
 * Update a shopping item
 */
export async function updateShoppingItem(
  itemId: string,
  updates: Partial<Omit<ShoppingItemData, 'id' | 'user_id' | 'shopping_list_id' | 'created_at'>>
): Promise<ShoppingItemData> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const { data: item, error: itemError } = await supabase
        .from('shopping_items')
        .select('shopping_list_id')
        .eq('id', itemId)
        .single();

      if (itemError || !item?.shopping_list_id) {
        throw new NotFoundError('Shopping Item', itemId);
      }

      const { data: list, error: listError } = await supabase
        .from('shopping_lists')
        .select('id')
        .eq('id', item.shopping_list_id)
        .eq('user_id', user.id)
        .single();

      if (listError || !list) {
        throw new NotFoundError('Shopping Item', itemId);
      }

      const dbUpdates = mapShoppingItemToUpdate(updates);

      const result = await supabase
        .from('shopping_items')
        .update(dbUpdates)
        .eq('id', itemId)
        .eq('shopping_list_id', item.shopping_list_id)
        .select()
        .single();

      const data = handleSupabaseResponse(result, 'Shopping Item', itemId);
      const mappedData = mapRowToShoppingItem(data);
      return validateApiResponse(
        ShoppingItemDataSchema,
        mappedData,
        'updateShoppingItem'
      );
    },
    { domain: 'ShoppingAPI', operation: 'updateShoppingItem', data: { itemId } }
  );
}

/**
 * Delete a shopping item
 */
export async function deleteShoppingItem(itemId: string): Promise<void> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const { data: item, error: itemError } = await supabase
        .from('shopping_items')
        .select('shopping_list_id')
        .eq('id', itemId)
        .single();

      if (itemError || !item?.shopping_list_id) {
        throw new NotFoundError('Shopping Item', itemId);
      }

      const { data: list, error: listError } = await supabase
        .from('shopping_lists')
        .select('id')
        .eq('id', item.shopping_list_id)
        .eq('user_id', user.id)
        .single();

      if (listError || !list) {
        throw new NotFoundError('Shopping Item', itemId);
      }

      const { error } = await supabase
        .from('shopping_items')
        .delete()
        .eq('id', itemId)
        .eq('shopping_list_id', item.shopping_list_id);

      if (error) throw error;
    },
    { domain: 'ShoppingAPI', operation: 'deleteShoppingItem', data: { itemId } }
  );
}
