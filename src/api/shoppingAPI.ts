/**
 * Shopping API
 * CRUD operations for shopping lists and items with Supabase
 */

import { supabase } from '../lib/supabase';
import type { ShoppingItemData, ShoppingListData } from '../services/types';
import { apiCall, requireAuth, handleSupabaseResponse } from './apiWrapper';

// =====================================================
// SHOPPING LISTS CRUD OPERATIONS
// =====================================================

/**
 * Get all shopping lists for the current user
 */
export async function getShoppingLists(): Promise<ShoppingListData[]> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const { data, error } = await supabase
        .from('shopping_lists')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data ?? []) as ShoppingListData[];
    },
    { domain: 'ShoppingAPI', operation: 'getShoppingLists' }
  );
}

/**
 * Create a new shopping list
 */
export async function createShoppingList(
  list: Omit<ShoppingListData, 'id' | 'created_at' | 'updated_at'>
): Promise<ShoppingListData> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const result = await supabase
        .from('shopping_lists')
        .insert({
          user_id: user.id,
          ...list,
          status: list.status ?? 'active',
        })
        .select()
        .single();

      const data = handleSupabaseResponse(result, 'Shopping List');
      return data as ShoppingListData;
    },
    { domain: 'ShoppingAPI', operation: 'createShoppingList', data: { name: list.name } }
  );
}

/**
 * Update a shopping list
 */
export async function updateShoppingList(
  id: string,
  updates: Partial<ShoppingListData>
): Promise<ShoppingListData> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const result = await supabase
        .from('shopping_lists')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      const data = handleSupabaseResponse(result, 'Shopping List', id);
      return data as ShoppingListData;
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
 * Get all items for a shopping list
 */
export async function getShoppingListItems(listId: string): Promise<ShoppingItemData[]> {
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

      if (listError || !list) throw new Error('Shopping list not found or access denied');

      const { data, error } = await supabase
        .from('shopping_items')
        .select('*')
        .eq('shopping_list_id', listId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data ?? []) as ShoppingItemData[];
    },
    { domain: 'ShoppingAPI', operation: 'getShoppingListItems', data: { listId } }
  );
}

/**
 * Create a new shopping item
 */
export async function createShoppingItem(
  listId: string,
  item: Omit<ShoppingItemData, 'id' | 'shopping_list_id' | 'created_at' | 'updated_at'>
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

      if (listError || !list) throw new Error('Shopping list not found or access denied');

      const result = await supabase
        .from('shopping_items')
        .insert({
          shopping_list_id: listId,
          ...item,
          is_purchased: item.is_purchased ?? false,
        })
        .select()
        .single();

      const data = handleSupabaseResponse(result, 'Shopping Item');
      return data as ShoppingItemData;
    },
    { domain: 'ShoppingAPI', operation: 'createShoppingItem', data: { listId, name: item.name } }
  );
}

/**
 * Update a shopping item
 */
export async function updateShoppingItem(
  itemId: string,
  updates: Partial<ShoppingItemData>
): Promise<ShoppingItemData> {
  return apiCall(
    async () => {
      const result = await supabase
        .from('shopping_items')
        .update(updates)
        .eq('id', itemId)
        .select()
        .single();

      const data = handleSupabaseResponse(result, 'Shopping Item', itemId);
      return data as ShoppingItemData;
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
      const { error } = await supabase
        .from('shopping_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
    },
    { domain: 'ShoppingAPI', operation: 'deleteShoppingItem', data: { itemId } }
  );
}
