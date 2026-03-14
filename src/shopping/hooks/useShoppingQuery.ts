/**
 * Shopping React Query Hooks
 * Moved from src/hooks/useShoppingQuery.ts to its domain directory.
 * src/hooks/useShoppingQuery.ts is now a barrel re-export pointing here.
 */

import { useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient, type UseMutationResult, type UseQueryResult } from '@tanstack/react-query';
import {
  getShoppingLists,
  getShoppingListItems,
  createShoppingList,
  createShoppingItem,
  updateShoppingItem,
  deleteShoppingItem,
  addIngredientsToShoppingList,
} from '@/api/shoppingAPI';
import type { ShoppingItemData, ShoppingListData } from '@/services/types';
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
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateShoppingList(): UseMutationResult<ShoppingListData, Error, Omit<ShoppingListData, 'id' | 'created_at' | 'updated_at'>> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (list: Omit<ShoppingListData, 'id' | 'created_at' | 'updated_at'>) => {
      logger.debug('Shopping', 'Creating shopping list', { name: list.name });
      return createShoppingList(list);
    },
    onSuccess: (newList) => {
      logger.info('Shopping', 'Shopping list created', { id: newList.id });
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
    staleTime: 1000 * 60 * 2,
  });
}

export function useCreateShoppingItem(): UseMutationResult<
  ShoppingItemData,
  Error,
  { listId: string; item: Omit<ShoppingItemData, 'id' | 'shopping_list_id' | 'created_at' | 'updated_at'> },
  { previousItems?: ShoppingItemData[]; optimisticId?: string }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ listId, item }) => {
      logger.debug('Shopping', 'Creating shopping item', { listId, name: item.name });
      return createShoppingItem(listId, item);
    },
    onMutate: async ({ listId, item }) => {
      await queryClient.cancelQueries({ queryKey: shoppingKeys.items(listId) });
      const previousItems = queryClient.getQueryData<ShoppingItemData[]>(shoppingKeys.items(listId));
      const optimisticId = `temp-${Date.now()}`;
      const optimisticItem: ShoppingItemData = {
        ...item,
        id: optimisticId,
        shopping_list_id: listId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      queryClient.setQueryData<ShoppingItemData[]>(shoppingKeys.items(listId), (old) => {
        if (!old) return [optimisticItem];
        return [...old, optimisticItem];
      });
      return { previousItems, optimisticId };
    },
    onError: (err: Error, { listId, item }, context) => {
      logger.error('Shopping', 'Failed to create shopping item', { error: err.message, name: item.name });
      if (context?.previousItems) {
        queryClient.setQueryData(shoppingKeys.items(listId), context.previousItems);
      }
    },
    onSuccess: (newItem, { listId }, context) => {
      logger.info('Shopping', 'Shopping item created', { id: newItem.id });
      queryClient.setQueryData<ShoppingItemData[]>(shoppingKeys.items(listId), (old) => {
        if (!old) return [newItem];
        if (!context?.optimisticId) return old;
        return old.map((item) => (item.id === context.optimisticId ? newItem : item));
      });
    },
  });
}

export function useUpdateShoppingItem(): UseMutationResult<
  ShoppingItemData,
  Error,
  { itemId: string; updates: Partial<ShoppingItemData>; listId?: string | null },
  { listId?: string | null; previousItems?: ShoppingItemData[]; invalidateAll?: boolean }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemId, updates }) => {
      logger.debug('Shopping', 'Updating shopping item', { itemId });
      return updateShoppingItem(itemId, updates);
    },
    onMutate: async ({ itemId, updates, listId }) => {
      let resolvedListId = listId ?? null;
      let previousItems: ShoppingItemData[] | undefined;

      if (resolvedListId) {
        previousItems = queryClient.getQueryData<ShoppingItemData[]>(shoppingKeys.items(resolvedListId));
      } else {
        const itemQueries = queryClient.getQueryCache().findAll({ queryKey: [...shoppingKeys.all, 'items'] });
        for (const query of itemQueries) {
          const data = query.state.data as ShoppingItemData[] | undefined;
          if (data?.some((item) => item.id === itemId)) {
            resolvedListId = data.find((item) => item.id === itemId)?.shopping_list_id ?? null;
            previousItems = data;
            break;
          }
        }
      }

      if (!resolvedListId) return { listId: null, invalidateAll: true };

      await queryClient.cancelQueries({ queryKey: shoppingKeys.items(resolvedListId) });
      queryClient.setQueryData<ShoppingItemData[]>(shoppingKeys.items(resolvedListId), (old) => {
        if (!old) return old;
        return old.map((item) =>
          item.id === itemId ? { ...item, ...updates, updated_at: new Date().toISOString() } : item
        );
      });
      return { listId: resolvedListId, previousItems };
    },
    onError: (err: Error, { itemId }, context) => {
      logger.error('Shopping', 'Failed to update shopping item', { error: err.message, itemId });
      if (context?.listId && context?.previousItems) {
        queryClient.setQueryData(shoppingKeys.items(context.listId), context.previousItems);
      } else if (context?.invalidateAll) {
        void queryClient.invalidateQueries({ queryKey: [...shoppingKeys.all, 'items'] });
      }
    },
    onSuccess: (updatedItem, { itemId }, context) => {
      logger.info('Shopping', 'Shopping item updated', { id: itemId });
      if (context?.listId) {
        queryClient.setQueryData<ShoppingItemData[]>(shoppingKeys.items(context.listId), (old) => {
          if (!old) return old;
          return old.map((item) => (item.id === itemId ? updatedItem : item));
        });
      } else if (context?.invalidateAll) {
        void queryClient.invalidateQueries({ queryKey: [...shoppingKeys.all, 'items'] });
      }
    },
  });
}

export function useDeleteShoppingItem(): UseMutationResult<
  void,
  Error,
  { itemId: string; listId?: string | null },
  { listId?: string | null; previousItems?: ShoppingItemData[]; invalidateAll?: boolean }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemId }) => {
      logger.debug('Shopping', 'Deleting shopping item', { itemId });
      await deleteShoppingItem(itemId);
    },
    onMutate: async ({ itemId, listId }) => {
      let resolvedListId = listId ?? null;
      let previousItems: ShoppingItemData[] | undefined;

      if (resolvedListId) {
        previousItems = queryClient.getQueryData<ShoppingItemData[]>(shoppingKeys.items(resolvedListId));
      } else {
        const itemQueries = queryClient.getQueryCache().findAll({ queryKey: [...shoppingKeys.all, 'items'] });
        for (const query of itemQueries) {
          const data = query.state.data as ShoppingItemData[] | undefined;
          if (data?.some((item) => item.id === itemId)) {
            resolvedListId = data.find((item) => item.id === itemId)?.shopping_list_id ?? null;
            previousItems = data;
            break;
          }
        }
      }

      if (!resolvedListId) return { listId: null, invalidateAll: true };

      await queryClient.cancelQueries({ queryKey: shoppingKeys.items(resolvedListId) });
      queryClient.setQueryData<ShoppingItemData[]>(shoppingKeys.items(resolvedListId), (old) => {
        if (!old) return old;
        return old.filter((item) => item.id !== itemId);
      });
      return { listId: resolvedListId, previousItems };
    },
    onError: (err: Error, { itemId }, context) => {
      logger.error('Shopping', 'Failed to delete shopping item', { error: err.message, itemId });
      if (context?.listId && context?.previousItems) {
        queryClient.setQueryData(shoppingKeys.items(context.listId), context.previousItems);
      } else if (context?.invalidateAll) {
        void queryClient.invalidateQueries({ queryKey: [...shoppingKeys.all, 'items'] });
      }
    },
    onSuccess: (_, _vars, context) => {
      logger.info('Shopping', 'Shopping item deleted');
      if (context?.invalidateAll) {
        void queryClient.invalidateQueries({ queryKey: [...shoppingKeys.all, 'items'] });
      }
    },
  });
}

// ==================== Toggle Purchase Status ====================

export function useToggleShoppingItem(): UseMutationResult<
  ShoppingItemData,
  Error,
  { itemId: string; currentStatus: boolean; listId?: string | null }
> {
  const updateMutation = useUpdateShoppingItem();
  return useMutation({
    mutationFn: async ({ itemId, currentStatus, listId }) =>
      updateMutation.mutateAsync({ itemId, updates: { is_purchased: !currentStatus }, listId }),
  });
}

// ==================== Add Ingredients (Batch Cook / Recipe) ====================

export function useAddIngredientsToShoppingList() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      listId,
      ingredients,
      sourceType,
      sourceName,
      recipeId,
    }: {
      listId: string;
      ingredients: Array<{ name: string; amount?: string; unit?: string }>;
      sourceType: 'batch_cook' | 'recipe';
      sourceName: string;
      recipeId?: string;
    }) => addIngredientsToShoppingList(listId, ingredients, sourceType, sourceName, recipeId),
    onSuccess: (_, { listId }) => {
      void queryClient.invalidateQueries({ queryKey: shoppingKeys.items(listId) });
    },
    onError: (err: Error) => {
      logger.error('Shopping', 'Failed to add ingredients to shopping list', { error: err.message });
    },
  });
}

// ==================== Active Shopping List Helper ====================

export function useActiveShoppingList(): {
  activeList: ShoppingListData | undefined;
  activeListId: string | null;
  isLoading: boolean;
  ensureActiveList: () => Promise<ShoppingListData>;
} {
  const { data: lists, isLoading } = useShoppingLists();
  const createList = useCreateShoppingList();
  const isCreatingRef = useRef(false);
  const pendingPromiseRef = useRef<Promise<ShoppingListData> | null>(null);

  const typedLists = lists as ShoppingListData[] | undefined;
  const activeList: ShoppingListData | undefined =
    typedLists?.find((list: ShoppingListData) => list.status === 'active') ?? typedLists?.[0];

  const activeListRef = useRef(activeList);
  activeListRef.current = activeList;

  const ensureActiveList = useCallback(async (): Promise<ShoppingListData> => {
    if (activeListRef.current) return activeListRef.current;
    if (isCreatingRef.current && pendingPromiseRef.current) return pendingPromiseRef.current;
    isCreatingRef.current = true;
    pendingPromiseRef.current = createList
      .mutateAsync({ name: 'Shopping List', status: 'active' })
      .finally(() => {
        isCreatingRef.current = false;
        pendingPromiseRef.current = null;
      });
    return pendingPromiseRef.current;
  }, [createList]);

  return { activeList, activeListId: activeList?.id ?? null, isLoading, ensureActiveList };
}
