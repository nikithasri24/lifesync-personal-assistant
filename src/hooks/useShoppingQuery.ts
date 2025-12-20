import { useQuery, useMutation, useQueryClient, type UseMutationResult, type UseQueryResult } from '@tanstack/react-query';
import {
  getShoppingLists,
  getShoppingListItems,
  createShoppingList,
  createShoppingItem,
  updateShoppingItem,
  deleteShoppingItem,
} from '../api/shoppingAPI';
import type { ShoppingItemData, ShoppingListData } from '../services/types';
import { logger } from '@/services/logger';

// ==================== Query Keys ====================

export const shoppingKeys = {
  all: ['shopping'] as const,
  lists: () => [...shoppingKeys.all, 'lists'] as const,
  list: (id: string) => [...shoppingKeys.all, 'list', id] as const,
  items: (listId: string) => [...shoppingKeys.all, 'items', listId] as const,
};

// ==================== Shopping Lists ====================

export function useShoppingLists(): UseQueryResult<ShoppingListData[], Error> {
  return useQuery({
    queryKey: shoppingKeys.lists(),
    queryFn: getShoppingLists,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useCreateShoppingList(): UseMutationResult<ShoppingListData, Error, Omit<ShoppingListData, 'id' | 'created_at' | 'updated_at'>> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (list: Omit<ShoppingListData, 'id' | 'created_at' | 'updated_at'>) => {
      logger.debug('Shopping', 'Creating shopping list', { name: list.name });
      const result = await createShoppingList(list);
      return result;
    },
    onSuccess: (newList) => {
      logger.info('Shopping', 'Shopping list created successfully', { id: newList.id, name: newList.name });
      queryClient.setQueryData<ShoppingListData[]>(shoppingKeys.lists(), (old) => {
        if (!old) return [newList];
        return [...old, newList];
      });
    },
    onError: (error: Error, list) => {
      logger.error('Shopping', 'Failed to create shopping list', { error: error.message, name: list.name });
    },
  });
}

// ==================== Shopping Items ====================

export function useShoppingItems(listId: string | null): UseQueryResult<ShoppingItemData[], Error> {
  return useQuery({
    queryKey: listId ? shoppingKeys.items(listId) : ['shopping-items-null'],
    queryFn: () => {
      if (!listId) throw new Error('List ID is required');
      return getShoppingListItems(listId);
    },
    enabled: !!listId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function useCreateShoppingItem(): UseMutationResult<
  ShoppingItemData,
  Error,
  { listId: string; item: Omit<ShoppingItemData, 'id' | 'shopping_list_id' | 'created_at' | 'updated_at'> },
  { previousItems?: ShoppingItemData[] }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      listId,
      item,
    }: {
      listId: string;
      item: Omit<ShoppingItemData, 'id' | 'shopping_list_id' | 'created_at' | 'updated_at'>;
    }) => {
      logger.debug('Shopping', 'Creating shopping item', { listId, name: item.name });
      const result = await createShoppingItem(listId, item);
      return result;
    },
    onMutate: async ({ listId, item }) => {
      logger.debug('Shopping', 'Optimistic update: create shopping item', { listId, name: item.name });
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: shoppingKeys.items(listId) });

      // Snapshot the previous value
      const previousItems = queryClient.getQueryData<ShoppingItemData[]>(
        shoppingKeys.items(listId)
      );

      // Optimistically update
      const optimisticItem: ShoppingItemData = {
        ...item,
        id: `temp-${Date.now()}`,
        shopping_list_id: listId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      queryClient.setQueryData<ShoppingItemData[]>(shoppingKeys.items(listId), (old) => {
        if (!old) return [optimisticItem];
        return [...old, optimisticItem];
      });

      return { previousItems };
    },
    onError: (err: Error, { listId, item }, context) => {
      logger.error('Shopping', 'Failed to create shopping item', { error: err.message, listId, name: item.name });
      // Rollback on error
      if (context?.previousItems) {
        queryClient.setQueryData(shoppingKeys.items(listId), context.previousItems);
      }
    },
    onSuccess: (newItem, { listId }) => {
      logger.info('Shopping', 'Shopping item created successfully', { id: newItem.id, listId, name: newItem.name });
      // Replace optimistic item with real one
      queryClient.setQueryData<ShoppingItemData[]>(shoppingKeys.items(listId), (old) => {
        if (!old) return [newItem];
        return old.map((item) => (item.id?.startsWith('temp-') ? newItem : item));
      });
    },
  });
}

export function useUpdateShoppingItem(): UseMutationResult<
  ShoppingItemData,
  Error,
  { itemId: string; updates: Partial<ShoppingItemData> },
  { listId?: string; previousItems?: ShoppingItemData[] }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemId, updates }: { itemId: string; updates: Partial<ShoppingItemData> }) => {
      logger.debug('Shopping', 'Updating shopping item', { itemId, updates });
      const result = await updateShoppingItem(itemId, updates);
      return result;
    },
    onMutate: async ({ itemId, updates }) => {
      logger.debug('Shopping', 'Optimistic update: shopping item', { itemId, updates });
      // Find which list this item belongs to by searching all item queries
      const queryCache = queryClient.getQueryCache();
      const itemQueries = queryCache.findAll({
        queryKey: [...shoppingKeys.all, 'items'],
      });

      let listId: string | null = null;
      let previousItems: ShoppingItemData[] | undefined;

      for (const query of itemQueries) {
        const data = query.state.data as ShoppingItemData[] | undefined;
        if (data?.some((item) => item.id === itemId)) {
          listId = data.find((item) => item.id === itemId)?.shopping_list_id ?? null;
          previousItems = data;
          break;
        }
      }

      if (!listId) return {};

      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: shoppingKeys.items(listId) });

      // Optimistically update
      queryClient.setQueryData<ShoppingItemData[]>(shoppingKeys.items(listId), (old) => {
        if (!old) return old;
        return old.map((item) =>
          item.id === itemId ? { ...item, ...updates, updated_at: new Date().toISOString() } : item
        );
      });

      return { listId, previousItems };
    },
    onError: (err: Error, { itemId }, context) => {
      logger.error('Shopping', 'Failed to update shopping item', { error: err.message, itemId });
      // Rollback on error
      if (context?.listId && context?.previousItems) {
        queryClient.setQueryData(shoppingKeys.items(context.listId), context.previousItems);
      }
    },
    onSuccess: (updatedItem, { itemId }, context) => {
      logger.info('Shopping', 'Shopping item updated successfully', { id: itemId, name: updatedItem.name });
      // Update with server response
      if (context?.listId) {
        queryClient.setQueryData<ShoppingItemData[]>(
          shoppingKeys.items(context.listId),
          (old) => {
            if (!old) return old;
            return old.map((item) => (item.id === itemId ? updatedItem : item));
          }
        );
      }
    },
  });
}

export function useDeleteShoppingItem(): UseMutationResult<
  void,
  Error,
  string,
  { listId?: string; previousItems?: ShoppingItemData[] }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (itemId: string) => {
      logger.debug('Shopping', 'Deleting shopping item', { itemId });
      await deleteShoppingItem(itemId);
    },
    onMutate: async (itemId) => {
      logger.debug('Shopping', 'Optimistic update: delete shopping item', { itemId });
      // Find which list this item belongs to
      const queryCache = queryClient.getQueryCache();
      const itemQueries = queryCache.findAll({
        queryKey: [...shoppingKeys.all, 'items'],
      });

      let listId: string | null = null;
      let previousItems: ShoppingItemData[] | undefined;

      for (const query of itemQueries) {
        const data = query.state.data as ShoppingItemData[] | undefined;
        if (data?.some((item) => item.id === itemId)) {
          listId = data.find((item) => item.id === itemId)?.shopping_list_id ?? null;
          previousItems = data;
          break;
        }
      }

      if (!listId) return {};

      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: shoppingKeys.items(listId) });

      // Optimistically remove
      queryClient.setQueryData<ShoppingItemData[]>(shoppingKeys.items(listId), (old) => {
        if (!old) return old;
        return old.filter((item) => item.id !== itemId);
      });

      return { listId, previousItems };
    },
    onError: (err: Error, itemId, context) => {
      logger.error('Shopping', 'Failed to delete shopping item', { error: err.message, itemId });
      // Rollback on error
      if (context?.listId && context?.previousItems) {
        queryClient.setQueryData(shoppingKeys.items(context.listId), context.previousItems);
      }
    },
    onSuccess: (_, itemId) => {
      logger.info('Shopping', 'Shopping item deleted successfully', { id: itemId });
    },
  });
}

// ==================== Toggle Purchase Status ====================

export function useToggleShoppingItem(): UseMutationResult<
  ShoppingItemData,
  Error,
  { itemId: string; currentStatus: boolean }
> {
  const updateMutation = useUpdateShoppingItem();

  return useMutation({
    mutationFn: async ({ itemId, currentStatus }: { itemId: string; currentStatus: boolean }) => {
      return updateMutation.mutateAsync({
        itemId,
        updates: { is_purchased: !currentStatus },
      });
    },
  });
}

// ==================== Active Shopping List Helper ====================

/**
 * Hook to get or create the active shopping list
 * Returns the first active list, or creates one if none exists
 */
export function useActiveShoppingList(): {
  activeList: ShoppingListData | undefined;
  activeListId: string | null;
  isLoading: boolean;
  ensureActiveList: () => Promise<ShoppingListData>;
} {
  const { data: lists, isLoading } = useShoppingLists();
  const createList = useCreateShoppingList();

  const typedLists = lists as ShoppingListData[] | undefined;

  const activeList: ShoppingListData | undefined =
    typedLists?.find((list: ShoppingListData) => list.status === 'active') ?? typedLists?.[0];

  const ensureActiveList = async (): Promise<ShoppingListData> => {
    if (activeList) {
      return activeList;
    }

    return createList.mutateAsync({
      name: 'Shopping List',
      status: 'active',
    });
  };

  return {
    activeList,
    activeListId: activeList?.id ?? null,
    isLoading,
    ensureActiveList,
  };
}
