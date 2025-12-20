/**
 * Shopping API
 * CRUD operations for shopping lists and items with Supabase
 */

import { supabase } from '../lib/supabase';
import type { ShoppingItemData, ShoppingListData } from '../services/types';

// =====================================================
// SHOPPING LISTS CRUD OPERATIONS
// =====================================================

/**
 * Get all shopping lists for the current user
 */
export async function getShoppingLists(): Promise<ShoppingListData[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('shopping_lists')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as ShoppingListData[];
}

/**
 * Create a new shopping list
 */
export async function createShoppingList(
  list: Omit<ShoppingListData, 'id' | 'created_at' | 'updated_at'>
): Promise<ShoppingListData> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('shopping_lists')
    .insert({
      user_id: user.id,
      ...list,
      status: list.status ?? 'active',
    })
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error('Failed to create shopping list');
  return data as ShoppingListData;
}

/**
 * Update a shopping list
 */
export async function updateShoppingList(
  id: string,
  updates: Partial<ShoppingListData>
): Promise<ShoppingListData> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('shopping_lists')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error('Shopping list not found or update failed');
  return data as ShoppingListData;
}

/**
 * Delete a shopping list
 */
export async function deleteShoppingList(id: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('shopping_lists')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) throw error;
}

// =====================================================
// SHOPPING ITEMS CRUD OPERATIONS
// =====================================================

/**
 * Get all items for a shopping list
 */
export async function getShoppingListItems(listId: string): Promise<ShoppingItemData[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

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
}

/**
 * Create a new shopping item
 */
export async function createShoppingItem(
  listId: string,
  item: Omit<ShoppingItemData, 'id' | 'shopping_list_id' | 'created_at' | 'updated_at'>
): Promise<ShoppingItemData> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

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
    .insert({
      shopping_list_id: listId,
      ...item,
      is_purchased: item.is_purchased ?? false,
    })
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error('Failed to create shopping item');
  return data as ShoppingItemData;
}

/**
 * Update a shopping item
 */
export async function updateShoppingItem(
  itemId: string,
  updates: Partial<ShoppingItemData>
): Promise<ShoppingItemData> {
  const { data, error } = await supabase
    .from('shopping_items')
    .update(updates)
    .eq('id', itemId)
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error('Shopping item not found or update failed');
  return data as ShoppingItemData;
}

/**
 * Delete a shopping item
 */
export async function deleteShoppingItem(itemId: string): Promise<void> {
  const { error } = await supabase
    .from('shopping_items')
    .delete()
    .eq('id', itemId);

  if (error) throw error;
}
