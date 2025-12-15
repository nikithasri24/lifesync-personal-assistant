/**
 * React Query hooks for Skincare tracking
 *
 * Provides automatic caching, loading states, and cache invalidation
 * for skincare products, routines, logs, and analytics.
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
  getSkincareRoutines,
  getRoutinesForDay,
  createSkincareRoutine,
  updateSkincareRoutine,
  deleteSkincareRoutine,
  getSkincareLogs,
  logRoutineCompletion,
  resetCompletion,
  getCompletionStats,
  getSkincareStreak,
} from '@/api/skincareAPI';
import { logger } from '@/services/logger';
import type { SkincareProduct, SkincareRoutine, SkincareLog, SkinCondition } from '@/skincare/types';

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
// ROUTINES QUERY HOOKS
// =====================================================

export interface SkincareRoutineFilters extends Record<string, unknown> {
  routineType?: 'AM' | 'PM' | 'WEEKLY' | 'SPECIAL';
  isActive?: boolean;
}

/**
 * Get all skincare routines with optional filters
 */
export function useSkincareRoutines(
  filters?: SkincareRoutineFilters
): UseQueryResult<SkincareRoutine[], Error> {
  return useQuery({
    queryKey: queryKeys.skincare.routines.list(filters),
    queryFn: () => getSkincareRoutines(filters),
    ...queryOptions.user,
  });
}

/**
 * Get routines for a specific day of week and time slot
 */
export function useRoutinesForDay(
  dayOfWeek: number,
  timeSlot: 'AM' | 'PM'
): UseQueryResult<SkincareRoutine[], Error> {
  return useQuery({
    queryKey: queryKeys.skincare.routines.forDay(dayOfWeek, timeSlot),
    queryFn: () => getRoutinesForDay(dayOfWeek, timeSlot),
    ...queryOptions.user,
  });
}

/**
 * Create a new skincare routine
 */
export function useCreateRoutine(): UseMutationResult<
  SkincareRoutine,
  Error,
  Omit<SkincareRoutine, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      input: Omit<SkincareRoutine, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
    ) => {
      logger.debug('Skincare', 'Creating skincare routine', { name: input.name, type: input.routineType });
      const result = await createSkincareRoutine(input);
      return result;
    },
    onSuccess: (newRoutine) => {
      logger.info('Skincare', 'Skincare routine created successfully', {
        id: newRoutine.id,
        name: newRoutine.name,
      });

      // Invalidate all routines lists
      void queryClient.invalidateQueries({ queryKey: queryKeys.skincare.routines.all() });

      // Optimistically add to cache
      queryClient.setQueryData<SkincareRoutine[]>(
        queryKeys.skincare.routines.list(undefined),
        (old) => {
          return old ? [newRoutine, ...old] : [newRoutine];
        }
      );
    },
    onError: (error: Error) => {
      logger.error('Skincare', 'Failed to create skincare routine', { error: error.message });
    },
  });
}

/**
 * Update an existing skincare routine
 */
export function useUpdateRoutine(): UseMutationResult<
  SkincareRoutine,
  Error,
  { id: string; updates: Partial<SkincareRoutine> }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<SkincareRoutine> }) => {
      logger.debug('Skincare', 'Updating skincare routine', { id, updates });
      const result = await updateSkincareRoutine(id, updates);
      return result;
    },
    onSuccess: (updatedRoutine) => {
      logger.info('Skincare', 'Skincare routine updated successfully', {
        id: updatedRoutine.id,
        name: updatedRoutine.name,
      });

      // Invalidate all routines lists
      void queryClient.invalidateQueries({ queryKey: queryKeys.skincare.routines.all() });

      // Update the specific routine detail cache
      queryClient.setQueryData(
        queryKeys.skincare.routines.detail(updatedRoutine.id),
        updatedRoutine
      );

      // Optimistically update in list caches
      queryClient.setQueriesData<SkincareRoutine[]>(
        { queryKey: queryKeys.skincare.routines.lists() },
        (old) => {
          return old?.map((routine) =>
            routine.id === updatedRoutine.id ? updatedRoutine : routine
          );
        }
      );
    },
    onError: (error: Error, { id }) => {
      logger.error('Skincare', 'Failed to update skincare routine', { error: error.message, id });
    },
  });
}

/**
 * Delete a skincare routine
 */
export function useDeleteRoutine(): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      logger.debug('Skincare', 'Deleting skincare routine', { id });
      const result = await deleteSkincareRoutine(id);
      return result;
    },
    onSuccess: (_data, deletedId) => {
      logger.info('Skincare', 'Skincare routine deleted successfully', { id: deletedId });

      // Invalidate all routines queries
      void queryClient.invalidateQueries({ queryKey: queryKeys.skincare.routines.all() });

      // Remove from cache
      queryClient.removeQueries({ queryKey: queryKeys.skincare.routines.detail(deletedId) });

      // Optimistically remove from list caches
      queryClient.setQueriesData<SkincareRoutine[]>(
        { queryKey: queryKeys.skincare.routines.lists() },
        (old) => {
          return old?.filter((routine) => routine.id !== deletedId);
        }
      );
    },
    onError: (error: Error, id) => {
      logger.error('Skincare', 'Failed to delete skincare routine', { error: error.message, id });
    },
  });
}

// =====================================================
// LOGS QUERY HOOKS (Completion Tracking)
// =====================================================

export interface SkincareLogFilters extends Record<string, unknown> {
  startDate?: string;
  endDate?: string;
  routineType?: 'AM' | 'PM';
}

/**
 * Get skincare logs with optional filters
 */
export function useSkincareLogs(
  filters?: SkincareLogFilters
): UseQueryResult<SkincareLog[], Error> {
  return useQuery({
    queryKey: queryKeys.skincare.logs.list(filters),
    queryFn: () => getSkincareLogs(filters),
    ...queryOptions.user,
  });
}

/**
 * Log a routine completion (with optimistic updates)
 */
export function useLogCompletion(): UseMutationResult<
  SkincareLog,
  Error,
  {
    date: string;
    routineId: string | null;
    routineType: 'AM' | 'PM';
    productsUsed: string[];
    skippedProducts?: string[];
    skinCondition?: string;
    skinNotes?: string;
  },
  { previousLogs?: SkincareLog[] }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input) => {
      logger.debug('Skincare', 'Logging routine completion', {
        date: input.date,
        routineType: input.routineType,
      });
      const result = await logRoutineCompletion(input);
      return result;
    },
    // Optimistic update - instant visual feedback!
    onMutate: async (input) => {
      logger.debug('Skincare', 'Optimistic update: logging routine completion', {
        date: input.date,
        routineType: input.routineType,
      });

      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: queryKeys.skincare.logs.all() });

      // Snapshot previous state for rollback
      const previousLogs = queryClient.getQueryData<SkincareLog[]>(
        queryKeys.skincare.logs.list(undefined)
      );

      // Create optimistic log with temporary ID
      const optimisticLog: SkincareLog = {
        id: 'temp-' + Date.now(),
        userId: '', // Will be filled by server
        date: input.date,
        routineId: input.routineId ?? undefined,
        routineType: input.routineType,
        completed: true,
        completedAt: new Date().toISOString(),
        productsUsed: input.productsUsed,
        skippedProducts: input.skippedProducts || [],
        skinCondition: input.skinCondition as SkinCondition | undefined,
        skinNotes: input.skinNotes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Optimistically add to logs list
      queryClient.setQueryData<SkincareLog[]>(queryKeys.skincare.logs.list(undefined), (old) => {
        return old ? [optimisticLog, ...old] : [optimisticLog];
      });

      return { previousLogs };
    },
    onSuccess: (newLog) => {
      logger.info('Skincare', 'Routine completion logged successfully', {
        id: newLog.id,
        date: newLog.date,
        routineType: newLog.routineType,
      });

      // Replace optimistic log with real server data
      queryClient.setQueryData<SkincareLog[]>(queryKeys.skincare.logs.list(undefined), (old) => {
        if (!old) return [newLog];

        // Try to replace the optimistic entry
        let replaced = false;
        const updated = old.map((log) => {
          if (
            log.id?.startsWith('temp-') &&
            log.date === newLog.date &&
            log.routineType === newLog.routineType
          ) {
            replaced = true;
            return newLog;
          }
          return log;
        });

        // If no optimistic entry was found, check if entry already exists before adding
        if (!replaced) {
          const logExists = updated.some(
            (log) =>
              log.date === newLog.date &&
              log.routineType === newLog.routineType &&
              log.id === newLog.id
          );
          if (!logExists) {
            return [newLog, ...updated];
          }
        }

        return updated;
      });

      // Invalidate stats to update streaks and completion rates
      void queryClient.invalidateQueries({ queryKey: queryKeys.skincare.stats('', '') });
      void queryClient.invalidateQueries({ queryKey: queryKeys.skincare.streaks() });
    },
    onError: (error: Error, _input, context) => {
      logger.error('Skincare', 'Failed to log routine completion - rolling back', { error: error.message });

      // Rollback optimistic updates on error
      if (context?.previousLogs) {
        queryClient.setQueryData(queryKeys.skincare.logs.list(undefined), context.previousLogs);
      }
    },
    // Always refetch to ensure sync with server
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.skincare.logs.all() });
    },
  });
}

/**
 * Reset completion for a specific date and routine type
 */
export function useResetCompletion(): UseMutationResult<
  void,
  Error,
  { date: string; routineType: 'AM' | 'PM' }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ date, routineType }: { date: string; routineType: 'AM' | 'PM' }) => {
      logger.debug('Skincare', 'Resetting completion', { date, routineType });
      const result = await resetCompletion(date, routineType);
      return result;
    },
    onSuccess: (_data, { date, routineType }) => {
      logger.info('Skincare', 'Completion reset successfully', { date, routineType });

      // Invalidate logs queries
      void queryClient.invalidateQueries({ queryKey: queryKeys.skincare.logs.all() });

      // Optimistically remove from cache
      queryClient.setQueryData<SkincareLog[]>(queryKeys.skincare.logs.list(undefined), (old) => {
        return old?.filter(
          (log) => !(log.date === date && log.routineType === routineType)
        );
      });

      // Invalidate stats to update streaks and completion rates
      void queryClient.invalidateQueries({ queryKey: queryKeys.skincare.stats('', '') });
      void queryClient.invalidateQueries({ queryKey: queryKeys.skincare.streaks() });
    },
    onError: (error: Error, { date, routineType }) => {
      logger.error('Skincare', 'Failed to reset completion', { error: error.message, date, routineType });
    },
  });
}

// =====================================================
// ANALYTICS QUERY HOOKS
// =====================================================

/**
 * Get completion statistics for a date range
 */
export function useCompletionStats(
  startDate: string,
  endDate: string
): UseQueryResult<
  {
    totalDays: number;
    completedDays: number;
    completionRate: number;
    amCompletions: number;
    pmCompletions: number;
  },
  Error
> {
  return useQuery({
    queryKey: queryKeys.skincare.stats(startDate, endDate),
    queryFn: () => getCompletionStats(startDate, endDate),
    ...queryOptions.user,
    enabled: !!startDate && !!endDate,
  });
}

/**
 * Get current and best skincare streaks
 */
export function useSkincareStreak(): UseQueryResult<
  {
    currentStreak: number;
    bestStreak: number;
    lastCompletionDate: string | null;
  },
  Error
> {
  return useQuery({
    queryKey: queryKeys.skincare.streaks(),
    queryFn: () => getSkincareStreak(),
    ...queryOptions.user,
  });
}
