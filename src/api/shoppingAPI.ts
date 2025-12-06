import { apiClient } from '../services/apiClient';
import type { ShoppingItemData, ShoppingListData } from '../services/types';

// ==================== Shopping Lists ====================

export async function getShoppingLists(): Promise<ShoppingListData[]> {
  return await apiClient.getShoppingLists();
}

export async function createShoppingList(
  list: Omit<ShoppingListData, 'id' | 'created_at' | 'updated_at'>
): Promise<ShoppingListData> {
  return await apiClient.createShoppingList(list);
}

// ==================== Shopping Items ====================

export async function getShoppingListItems(listId: string): Promise<ShoppingItemData[]> {
  return await apiClient.getShoppingListItems(listId);
}

export async function createShoppingItem(
  listId: string,
  item: Omit<ShoppingItemData, 'id' | 'shopping_list_id' | 'created_at' | 'updated_at'>
): Promise<ShoppingItemData> {
  return await apiClient.addShoppingItem(listId, item);
}

export async function updateShoppingItem(
  itemId: string,
  updates: Partial<ShoppingItemData>
): Promise<ShoppingItemData> {
  return await apiClient.updateShoppingItem(itemId, updates);
}

export async function deleteShoppingItem(itemId: string): Promise<ShoppingItemData> {
  return await apiClient.deleteShoppingItem(itemId);
}
