/**
 * React Query hooks for Skincare/Self Care tracking
 *
 * Provides automatic caching, loading states, and cache invalidation
 * for skincare products and weekly routines.
 *
 * Pattern reference: /src/hooks/useHabitsQuery.ts
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import { queryKeys, queryOptions } from '@/lib/react-query';
import {
  getSkincareProducts,
  createSkincareProduct,
  updateSkincareProduct,
  deleteSkincareProduct,
  getWeeklyRoutines,
  upsertWeeklyRoutine,
} from '@/api/skincareAPI';
import { logger } from '@/services/logger';
import type { SkincareProduct, SkincareWeeklyRoutine, SkincareWeeklyRoutineInput } from '@/skincare/types';

// =====================================================
// PRODUCTS QUERY HOOKS
// =====================================================

export interface SkincareProductFilters extends Record<string, unknown> {
  category?: SkincareProduct['category'];
  in_use?: boolean;
}

/**
 * Get all skincare products with optional filters
 */
export function useSkincareProducts(
  filters?: SkincareProductFilters
): UseQueryResult<SkincareProduct[], Error> {
  return useQuery({
    queryKey: queryKeys.skincare.products.list(filters),
    queryFn: () => getSkincareProducts(filters),
    ...queryOptions.user,
  });
}

/**
 * Create a new skincare product
 */
export function useCreateProduct(): UseMutationResult<
  SkincareProduct,
  Error,
  Omit<SkincareProduct, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      input: Omit<SkincareProduct, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
    ) => {
      logger.debug('Skincare', 'Creating skincare product', { name: input.name, category: input.category });
      const result = await createSkincareProduct(input);
      return result;
    },
    onSuccess: (newProduct) => {
      logger.info('Skincare', 'Skincare product created successfully', {
        id: newProduct.id,
        name: newProduct.name,
      });

      // Invalidate all products lists
      void queryClient.invalidateQueries({ queryKey: queryKeys.skincare.products.all() });

      // Optimistically add to cache
      queryClient.setQueryData<SkincareProduct[]>(
        queryKeys.skincare.products.list(undefined),
        (old) => {
          return old ? [newProduct, ...old] : [newProduct];
        }
      );
    },
    onError: (error: Error) => {
      logger.error('Skincare', 'Failed to create skincare product', { error: error.message });
    },
  });
}

/**
 * Update an existing skincare product
 */
export function useUpdateProduct(): UseMutationResult<
  SkincareProduct,
  Error,
  { id: string; updates: Partial<SkincareProduct> }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<SkincareProduct> }) => {
      logger.debug('Skincare', 'Updating skincare product', { id, updates });
      const result = await updateSkincareProduct(id, updates);
      return result;
    },
    onSuccess: (updatedProduct) => {
      logger.info('Skincare', 'Skincare product updated successfully', {
        id: updatedProduct.id,
        name: updatedProduct.name,
      });

      // Invalidate all products lists
      void queryClient.invalidateQueries({ queryKey: queryKeys.skincare.products.all() });

      // Update the specific product detail cache
      queryClient.setQueryData(
        queryKeys.skincare.products.detail(updatedProduct.id),
        updatedProduct
      );

      // Optimistically update in list caches
      queryClient.setQueriesData<SkincareProduct[]>(
        { queryKey: queryKeys.skincare.products.lists() },
        (old) => {
          return old?.map((product) =>
            product.id === updatedProduct.id ? updatedProduct : product
          );
        }
      );
    },
    onError: (error: Error, { id }) => {
      logger.error('Skincare', 'Failed to update skincare product', { error: error.message, id });
    },
  });
}

/**
 * Delete a skincare product
 */
export function useDeleteProduct(): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      logger.debug('Skincare', 'Deleting skincare product', { id });
      const result = await deleteSkincareProduct(id);
      return result;
    },
    onSuccess: (_data, deletedId) => {
      logger.info('Skincare', 'Skincare product deleted successfully', { id: deletedId });

      // Invalidate all products queries
      void queryClient.invalidateQueries({ queryKey: queryKeys.skincare.products.all() });

      // Remove from cache
      queryClient.removeQueries({ queryKey: queryKeys.skincare.products.detail(deletedId) });

      // Optimistically remove from list caches
      queryClient.setQueriesData<SkincareProduct[]>(
        { queryKey: queryKeys.skincare.products.lists() },
        (old) => {
          return old?.filter((product) => product.id !== deletedId);
        }
      );
    },
    onError: (error: Error, id) => {
      logger.error('Skincare', 'Failed to delete skincare product', { error: error.message, id });
    },
  });
}

// =====================================================
// WEEKLY ROUTINES QUERY HOOKS
// =====================================================

/**
 * Get all weekly routines (7 days)
 */
export function useWeeklyRoutines(): UseQueryResult<SkincareWeeklyRoutine[], Error> {
  return useQuery({
    queryKey: queryKeys.skincare.weekly.list(),
    queryFn: () => getWeeklyRoutines(),
    ...queryOptions.user,
  });
}

/**
 * Upsert a weekly routine for a specific day
 */
export function useUpsertWeeklyRoutine(): UseMutationResult<
  SkincareWeeklyRoutine,
  Error,
  SkincareWeeklyRoutineInput
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (routine: SkincareWeeklyRoutineInput) => {
      logger.debug('Skincare', 'Upserting weekly routine', { dayOfWeek: routine.dayOfWeek });
      return upsertWeeklyRoutine(routine);
    },
    onSuccess: (newRoutine) => {
      logger.info('Skincare', 'Weekly routine upserted successfully', { dayOfWeek: newRoutine.dayOfWeek });

      // Optimistically update the cache
      queryClient.setQueryData<SkincareWeeklyRoutine[]>(queryKeys.skincare.weekly.list(), (old) => {
        if (!old) return [newRoutine];
        const index = old.findIndex((r) => r.dayOfWeek === newRoutine.dayOfWeek);
        if (index >= 0) {
          const updated = [...old];
          updated[index] = newRoutine;
          return updated;
        }
        return [...old, newRoutine].sort((a, b) => a.dayOfWeek - b.dayOfWeek);
      });
    },
    onError: (error: Error, routine) => {
      logger.error('Skincare', 'Failed to upsert weekly routine', {
        error: error.message,
        dayOfWeek: routine.dayOfWeek,
      });
    },
  });
}
