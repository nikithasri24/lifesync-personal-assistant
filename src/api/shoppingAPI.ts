/**
 * Shopping API with Merged Mode Support
 * CRUD operations for shopping lists and items with Supabase
 *
 * Merged Mode: When both users in a connection set the shopping module to "merged",
 * the API fetches data for both users. RLS policies ensure proper access control.
 *
 * Implementation:
 * - Uses getShoppingMergedConnection() from storesAPI (shared cache)
 * - Fetch functions include partner's data when merged
 * - RLS policies on shopping_lists and shopping_items tables handle security
 */

import { supabase } from '../lib/supabase';
import type { ShoppingItemData, ShoppingListData } from '../services/types';
import { apiCall, requireAuth, handleSupabaseResponse } from './apiWrapper';
import { NotFoundError } from '../lib/errors';
import { validateApiResponse } from '../lib/validation';
import { getShoppingMergedConnection } from './storesAPI';
import { logger } from '../services/logger';
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
      const user = await requireAuth();

      // Check for merged connection
      const mergedConnection = await getShoppingMergedConnection();

      let query = supabase
        .from('shopping_lists')
        .select('*')
        .order('created_at', { ascending: false });

      // If merged mode, RLS handles access
      // RLS policy will filter based on merged permissions
      if (mergedConnection) {
        logger.debug('ShoppingAPI', 'Merged mode enabled, fetching for both users');
        // RLS handles the filtering
      } else {
        // Personal mode: only get current user's lists
        query = query.eq('user_id', user.id);
      }

      const { data, error } = await query;
      if (error) throw error;

      const lists = (data ?? []).map(mapRowToShoppingList);
      logger.debug('ShoppingAPI', 'Fetched shopping lists', {
        count: lists.length,
        mode: mergedConnection ? 'merged' : 'personal'
      });

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

      // Get connection_id if user has merged permission
      const mergedConnection = await getShoppingMergedConnection();

      const dbList = mapShoppingListToInsert(list);

      const result = await supabase
        .from('shopping_lists')
        .insert({
          ...dbList,
          user_id: user.id,
          connection_id: mergedConnection?.connectionId ?? null,
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

/**
 * Add a batch of recipe/session ingredients to the shopping list.
 * Idempotent: if items from the same recipe_id already exist, skips them.
 * Returns { added, skipped } counts.
 */
export async function addIngredientsToShoppingList(
  listId: string,
  ingredients: Array<{ name: string; amount?: string; unit?: string }>,
  sourceType: 'batch_cook' | 'recipe',
  sourceName: string,
  recipeId?: string
): Promise<{ added: number; skipped: number }> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      // If recipeId provided: check if items already added from this recipe → idempotent guard
      if (recipeId) {
        const { data: existing } = await supabase
          .from('shopping_items')
          .select('id')
          .eq('shopping_list_id', listId)
          .eq('recipe_id', recipeId)
          .limit(1);

        if (existing && existing.length > 0) {
          return { added: 0, skipped: ingredients.length };
        }
      }

      const rows = ingredients
        .filter(ing => ing.name.trim().length > 0)
        .map(ing => ({
          shopping_list_id: listId,
          user_id: user.id,
          name: ing.name.trim().charAt(0).toUpperCase() + ing.name.trim().slice(1),
          quantity: ing.amount ? parseFloat(ing.amount) || null : null,
          unit: ing.unit?.trim() || null,
          auto_added: true,
          notes: `${sourceType}:${sourceName}`,
          recipe_id: recipeId ?? null,
          is_purchased: false,
        }));

      if (rows.length === 0) return { added: 0, skipped: 0 };

      const { error } = await supabase.from('shopping_items').insert(rows);
      if (error) throw error;

      return { added: rows.length, skipped: 0 };
    },
    { domain: 'ShoppingAPI', operation: 'addIngredientsToShoppingList', data: { listId, sourceName, count: ingredients.length } }
  );
}
