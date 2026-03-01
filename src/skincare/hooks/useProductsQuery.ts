import { useQuery, useMutation, useQueryClient, type UseMutationResult, type UseQueryResult } from '@tanstack/react-query';
import { queryKeys, queryOptions } from '@/lib/react-query';
import {
  getPersonalCareProducts,
  createPersonalCareProduct,
  updatePersonalCareProduct,
  deletePersonalCareProduct,
  linkProductToItem,
  unlinkProductFromItem,
  getItemProducts,
} from '@/api/personalCareAPI';
import { logger } from '@/services/logger';
import type { PersonalCareProduct, PersonalCareProductInput } from '@/skincare/personalCareTypes';

// =====================================================
// PRODUCTS QUERY HOOKS
// =====================================================

export interface PersonalCareProductFilters extends Record<string, unknown> {
  currentlyUsing?: boolean;
}

export function usePersonalCareProducts(filters?: PersonalCareProductFilters): UseQueryResult<PersonalCareProduct[], Error> {
  return useQuery({
    queryKey: queryKeys.personalCare.products.list(filters),
    queryFn: () => getPersonalCareProducts(filters),
    ...queryOptions.user,
  });
}

export function useItemProducts(itemId: string): UseQueryResult<(PersonalCareProduct & { usageOrder: number })[], Error> {
  return useQuery({
    queryKey: queryKeys.personalCare.products.forItem(itemId),
    queryFn: () => getItemProducts(itemId),
    enabled: !!itemId,
    ...queryOptions.user,
  });
}

export function useCreateProduct(): UseMutationResult<PersonalCareProduct, Error, PersonalCareProductInput> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: PersonalCareProductInput) => {
      logger.debug('PersonalCare', 'Creating product', { name: input.name });
      return createPersonalCareProduct(input);
    },
    onSuccess: (newProduct) => {
      logger.info('PersonalCare', 'Product created', { id: newProduct.id, name: newProduct.name });
      queryClient.invalidateQueries({ queryKey: queryKeys.personalCare.products.all() });
    },
    onError: (error: Error) => {
      logger.error('PersonalCare', 'Failed to create product', { error: error.message });
    },
  });
}

export function useUpdateProduct(): UseMutationResult<PersonalCareProduct, Error, { id: string; updates: Partial<PersonalCareProductInput> }> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }) => {
      logger.debug('PersonalCare', 'Updating product', { id });
      return updatePersonalCareProduct(id, updates);
    },
    onSuccess: (updated) => {
      logger.info('PersonalCare', 'Product updated', { id: updated.id });
      queryClient.invalidateQueries({ queryKey: queryKeys.personalCare.products.all() });
    },
    onError: (error: Error, { id }) => {
      logger.error('PersonalCare', 'Failed to update product', { error: error.message, id });
    },
  });
}

export function useDeleteProduct(): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      logger.debug('PersonalCare', 'Deleting product', { id });
      return deletePersonalCareProduct(id);
    },
    onSuccess: (_, id) => {
      logger.info('PersonalCare', 'Product deleted', { id });
      queryClient.invalidateQueries({ queryKey: queryKeys.personalCare.products.all() });
    },
    onError: (error: Error, id) => {
      logger.error('PersonalCare', 'Failed to delete product', { error: error.message, id });
    },
  });
}

export function useLinkProductToItem(): UseMutationResult<unknown, Error, { itemId: string; productId: string; usageOrder?: number }> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemId, productId, usageOrder }) => {
      logger.debug('PersonalCare', 'Linking product to item', { itemId, productId });
      return linkProductToItem(itemId, productId, usageOrder);
    },
    onSuccess: (_, { itemId }) => {
      logger.info('PersonalCare', 'Product linked to item');
      queryClient.invalidateQueries({ queryKey: queryKeys.personalCare.products.forItem(itemId) });
    },
    onError: (error: Error) => {
      logger.error('PersonalCare', 'Failed to link product', { error: error.message });
    },
  });
}

export function useUnlinkProductFromItem(): UseMutationResult<void, Error, { itemId: string; productId: string }> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemId, productId }) => {
      logger.debug('PersonalCare', 'Unlinking product from item', { itemId, productId });
      return unlinkProductFromItem(itemId, productId);
    },
    onSuccess: (_, { itemId }) => {
      logger.info('PersonalCare', 'Product unlinked from item');
      queryClient.invalidateQueries({ queryKey: queryKeys.personalCare.products.forItem(itemId) });
    },
    onError: (error: Error) => {
      logger.error('PersonalCare', 'Failed to unlink product', { error: error.message });
    },
  });
}
