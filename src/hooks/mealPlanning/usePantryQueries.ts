/**
 * Pantry Queries and Mutations
 * 
 * React Query hooks for pantry item CRUD operations.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as mealPlanningAPI from '@/api/mealPlanningAPI';
import type { PantryItemData } from '@/services/types';
import { logger } from '@/services/logger';
import { mealPlanningKeys } from './keys';
import type { PantryItem, PantryItemInput, PantryItemUpdate } from './types';
import { mapPantryItemDataToPantryItem, buildPantryItemInsertPayload, buildPantryItemUpdatePayload } from './mappers';

/**
 * Fetch all pantry items
 */
export function usePantryItemsQuery(options?: { enabled?: boolean }): ReturnType<typeof useQuery<PantryItem[]>> {
  return useQuery({
    queryKey: mealPlanningKeys.pantryList(),
    queryFn: async () => {
      const data = await mealPlanningAPI.getPantryItems();
      return data.map(mapPantryItemDataToPantryItem);
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: options?.enabled ?? true,
  });
}

/**
 * Create a new pantry item
 */
export function useCreatePantryItemMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: PantryItemInput) => {
      const payload = buildPantryItemInsertPayload(input) as Omit<PantryItemData, 'id' | 'created_at' | 'updated_at' | 'user_id'>;
      const created = await mealPlanningAPI.createPantryItem(payload);
      return mapPantryItemDataToPantryItem(created);
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: mealPlanningKeys.pantryList() });
      const previousItems = queryClient.getQueryData<PantryItem[]>(mealPlanningKeys.pantryList());

      const optimisticItem: PantryItem = {
        id: `temp-${Date.now()}`,
        ...input,
        updatedAt: new Date(),
      };

      queryClient.setQueryData<PantryItem[]>(mealPlanningKeys.pantryList(), (old) => {
        if (!old) return [optimisticItem];
        return [optimisticItem, ...old];
      });

      return { previousItems };
    },
    onError: (err, _variables, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData(mealPlanningKeys.pantryList(), context.previousItems);
      }
      logger.error('MealPlanning', 'Error creating pantry item', { error: err });
    },
    onSuccess: (newItem) => {
      queryClient.setQueryData<PantryItem[]>(mealPlanningKeys.pantryList(), (old) => {
        if (!old) return [newItem];
        return old.map((item) => (item.id.startsWith('temp-') ? newItem : item));
      });
    },
  });
}

/**
 * Update a pantry item
 */
export function useUpdatePantryItemMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemId, updates }: { itemId: string; updates: PantryItemUpdate }) => {
      const payload = buildPantryItemUpdatePayload(updates);
      const updated = await mealPlanningAPI.updatePantryItem(itemId, payload);
      return mapPantryItemDataToPantryItem(updated);
    },
    onMutate: async ({ itemId, updates }) => {
      await queryClient.cancelQueries({ queryKey: mealPlanningKeys.pantryList() });
      const previousItems = queryClient.getQueryData<PantryItem[]>(mealPlanningKeys.pantryList());

      queryClient.setQueryData<PantryItem[]>(mealPlanningKeys.pantryList(), (old) => {
        if (!old) return [];
        return old.map((item) =>
          item.id === itemId ? { ...item, ...updates, updatedAt: new Date() } : item
        );
      });

      return { previousItems };
    },
    onError: (err, _variables, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData(mealPlanningKeys.pantryList(), context.previousItems);
      }
      logger.error('MealPlanning', 'Error updating pantry item', { error: err });
    },
    onSuccess: (updatedItem) => {
      queryClient.setQueryData<PantryItem[]>(mealPlanningKeys.pantryList(), (old) => {
        if (!old) return [updatedItem];
        return old.map((item) => (item.id === updatedItem.id ? updatedItem : item));
      });
    },
  });
}

/**
 * Delete a pantry item
 */
export function useDeletePantryItemMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (itemId: string) => {
      await mealPlanningAPI.deletePantryItem(itemId);
      return itemId;
    },
    onMutate: async (itemId) => {
      await queryClient.cancelQueries({ queryKey: mealPlanningKeys.pantryList() });
      const previousItems = queryClient.getQueryData<PantryItem[]>(mealPlanningKeys.pantryList());

      queryClient.setQueryData<PantryItem[]>(mealPlanningKeys.pantryList(), (old) => {
        if (!old) return [];
        return old.filter((item) => item.id !== itemId);
      });

      return { previousItems };
    },
    onError: (err, _itemId, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData(mealPlanningKeys.pantryList(), context.previousItems);
      }
      logger.error('MealPlanning', 'Error deleting pantry item', { error: err });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: mealPlanningKeys.pantryList() });
    },
  });
}

