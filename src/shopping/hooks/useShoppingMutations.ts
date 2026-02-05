/**
 * Custom hook for managing shopping mutations
 * Provides wrapper functions around React Query mutations to maintain
 * consistent API with the previous Zustand store implementation
 */

import {
  useCreateShoppingItem,
  useUpdateShoppingItem,
  useDeleteShoppingItem,
  useToggleShoppingItem,
} from '@/hooks/useShoppingQuery';
import {
  useCreatePantryItemMutation,
  useUpdatePantryItemMutation,
  useDeletePantryItemMutation,
} from '@/hooks/useMealPlanningQuery';
import { mapShoppingItemDataToModel, mapShoppingItemToCreateInput, mapShoppingItemToUpdateInput } from '../services/shoppingMappers';
import type { ShoppingItem } from '../types';
import type { ShoppingListData } from '@/services/types';

export interface UseShoppingMutationsReturn {
  // Shopping item mutations
  addShoppingItem: (item: Omit<ShoppingItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateShoppingItem: (itemId: string, updates: Partial<ShoppingItem>) => Promise<ShoppingItem>;
  deleteShoppingItem: (itemId: string) => Promise<void>;
  toggleShoppingItem: (itemId: string) => Promise<ShoppingItem | void>;

  // Pantry item mutations
  createPantryItem: ReturnType<typeof useCreatePantryItemMutation>;
  updatePantryItem: ReturnType<typeof useUpdatePantryItemMutation>;
  deletePantryItem: ReturnType<typeof useDeletePantryItemMutation>;
}

/**
 * Hook that provides mutation wrapper functions for shopping and pantry items
 */
export function useShoppingMutations(params: {
  activeListId: string | null;
  ensureActiveList: () => Promise<ShoppingListData>;
  shoppingItems: ShoppingItem[];
}): UseShoppingMutationsReturn {
  const { activeListId, ensureActiveList, shoppingItems } = params;

  // Shopping mutations
  const createItemMutation = useCreateShoppingItem();
  const updateItemMutation = useUpdateShoppingItem();
  const deleteItemMutation = useDeleteShoppingItem();
  const toggleItemMutation = useToggleShoppingItem();

  // Pantry mutations
  const createPantryItemMutation = useCreatePantryItemMutation();
  const updatePantryItemMutation = useUpdatePantryItemMutation();
  const deletePantryItemMutation = useDeletePantryItemMutation();

  // Wrapper functions to maintain same API as Zustand store
  const addShoppingItem = async (item: Omit<ShoppingItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> => {
    const listId = activeListId ?? (await ensureActiveList()).id ?? '';
    await createItemMutation.mutateAsync({
      listId,
      item: mapShoppingItemToCreateInput(item),
    });
  };

  const updateShoppingItem = async (itemId: string, updates: Partial<ShoppingItem>): Promise<ShoppingItem> => {
    const result = await updateItemMutation.mutateAsync({
      itemId,
      updates: mapShoppingItemToUpdateInput(updates),
      listId: activeListId,
    });
    return mapShoppingItemDataToModel([result])[0];
  };

  const deleteShoppingItem = async (itemId: string): Promise<void> => {
    await deleteItemMutation.mutateAsync({ itemId, listId: activeListId });
  };

  const toggleShoppingItem = async (itemId: string): Promise<ShoppingItem | void> => {
    const item = shoppingItems.find((i) => i.id === itemId);
    if (!item) return Promise.resolve();
    const result = await toggleItemMutation.mutateAsync({
      itemId,
      currentStatus: item.purchased,
      listId: activeListId,
    });
    return mapShoppingItemDataToModel([result])[0];
  };

  return {
    addShoppingItem,
    updateShoppingItem,
    deleteShoppingItem,
    toggleShoppingItem,
    createPantryItem: createPantryItemMutation,
    updatePantryItem: updatePantryItemMutation,
    deletePantryItem: deletePantryItemMutation,
  };
}
