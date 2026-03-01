import { useQuery, useMutation, useQueryClient, type UseMutationResult, type UseQueryResult } from '@tanstack/react-query';
import { queryKeys, queryOptions } from '@/lib/react-query';
import {
  getPersonalCareItems,
  getScheduledItemsDue,
  createPersonalCareItem,
  updatePersonalCareItem,
  deletePersonalCareItem,
} from '@/api/personalCareAPI';
import { logger } from '@/services/logger';
import type { PersonalCareItem, PersonalCareItemInput } from '@/skincare/personalCareTypes';

// =====================================================
// ITEMS QUERY HOOKS
// =====================================================

export interface PersonalCareItemFilters extends Record<string, unknown> {
  categoryId?: string;
  activeOnly?: boolean;
  trackingMode?: PersonalCareItem['trackingMode'];
}

export function usePersonalCareItems(filters?: PersonalCareItemFilters): UseQueryResult<PersonalCareItem[], Error> {
  return useQuery({
    queryKey: queryKeys.personalCare.items.list(filters),
    queryFn: () => getPersonalCareItems(filters),
    ...queryOptions.user,
  });
}

export function useScheduledItemsDue(): UseQueryResult<PersonalCareItem[], Error> {
  return useQuery({
    queryKey: queryKeys.personalCare.items.scheduled(),
    queryFn: () => getScheduledItemsDue(),
    ...queryOptions.user,
  });
}

export function useCreateItem(): UseMutationResult<PersonalCareItem, Error, PersonalCareItemInput> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: PersonalCareItemInput) => {
      logger.debug('PersonalCare', 'Creating item', { name: input.name });
      return createPersonalCareItem(input);
    },
    onSuccess: (newItem) => {
      logger.info('PersonalCare', 'Item created', { id: newItem.id, name: newItem.name });
      queryClient.invalidateQueries({ queryKey: queryKeys.personalCare.items.all() });
    },
    onError: (error: Error) => {
      logger.error('PersonalCare', 'Failed to create item', { error: error.message });
    },
  });
}

export function useUpdateItem(): UseMutationResult<PersonalCareItem, Error, { id: string; updates: Partial<PersonalCareItemInput> }> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }) => {
      logger.debug('PersonalCare', 'Updating item', { id });
      return updatePersonalCareItem(id, updates);
    },
    onSuccess: (updated) => {
      logger.info('PersonalCare', 'Item updated', { id: updated.id });
      queryClient.invalidateQueries({ queryKey: queryKeys.personalCare.items.all() });
    },
    onError: (error: Error, { id }) => {
      logger.error('PersonalCare', 'Failed to update item', { error: error.message, id });
    },
  });
}

export function useDeleteItem(): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      logger.debug('PersonalCare', 'Deleting item', { id });
      return deletePersonalCareItem(id);
    },
    onSuccess: (_, id) => {
      logger.info('PersonalCare', 'Item deleted', { id });
      queryClient.invalidateQueries({ queryKey: queryKeys.personalCare.items.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.personalCare.logs.all() });
    },
    onError: (error: Error, id) => {
      logger.error('PersonalCare', 'Failed to delete item', { error: error.message, id });
    },
  });
}
