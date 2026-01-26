/**
 * React Query hooks for Personal Care tracking
 *
 * Provides automatic caching, loading states, and cache invalidation
 * for personal care categories, items, products, and logs.
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
  getPersonalCareCategories,
  createPersonalCareCategory,
  updatePersonalCareCategory,
  deletePersonalCareCategory,
  getPersonalCareItems,
  getScheduledItemsDue,
  createPersonalCareItem,
  updatePersonalCareItem,
  deletePersonalCareItem,
  getPersonalCareProducts,
  createPersonalCareProduct,
  updatePersonalCareProduct,
  deletePersonalCareProduct,
  getPersonalCareLogs,
  logPersonalCareCompletion,
  deletePersonalCareLog,
  linkProductToItem,
  unlinkProductFromItem,
  getItemProducts,
  initializePersonalCare,
  getMonthSchedule,
  scheduleItem,
  updateScheduleStatus,
  removeScheduledItem,
} from '@/api/personalCareAPI';
import { logger } from '@/services/logger';
import type {
  PersonalCareCategory,
  PersonalCareCategoryInput,
  PersonalCareItem,
  PersonalCareItemInput,
  PersonalCareProduct,
  PersonalCareProductInput,
  PersonalCareLog,
  PersonalCareLogInput,
  PersonalCareSchedule,
  PersonalCareScheduleWithItem,
  ScheduleStatus,
} from '@/personal-care/types';

// =====================================================
// CATEGORIES QUERY HOOKS
// =====================================================

export interface PersonalCareCategoryFilters extends Record<string, unknown> {
  activeOnly?: boolean;
}

/**
 * Get all personal care categories with optional filters
 */
export function usePersonalCareCategories(
  filters?: PersonalCareCategoryFilters
): UseQueryResult<PersonalCareCategory[], Error> {
  return useQuery({
    queryKey: queryKeys.personalCare.categories.list(filters),
    queryFn: () => getPersonalCareCategories(filters),
    ...queryOptions.user,
  });
}

/**
 * Create a new personal care category
 */
export function useCreateCategory(): UseMutationResult<
  PersonalCareCategory,
  Error,
  PersonalCareCategoryInput
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: PersonalCareCategoryInput) => {
      logger.debug('PersonalCare', 'Creating category', { name: input.name });
      return createPersonalCareCategory(input);
    },
    onSuccess: (newCategory) => {
      logger.info('PersonalCare', 'Category created', { id: newCategory.id, name: newCategory.name });
      queryClient.invalidateQueries({ queryKey: queryKeys.personalCare.categories.all() });
    },
    onError: (error: Error) => {
      logger.error('PersonalCare', 'Failed to create category', { error: error.message });
    },
  });
}

/**
 * Update a personal care category
 */
export function useUpdateCategory(): UseMutationResult<
  PersonalCareCategory,
  Error,
  { id: string; updates: Partial<PersonalCareCategoryInput> }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }) => {
      logger.debug('PersonalCare', 'Updating category', { id });
      return updatePersonalCareCategory(id, updates);
    },
    onSuccess: (updated) => {
      logger.info('PersonalCare', 'Category updated', { id: updated.id });
      queryClient.invalidateQueries({ queryKey: queryKeys.personalCare.categories.all() });
    },
    onError: (error: Error, { id }) => {
      logger.error('PersonalCare', 'Failed to update category', { error: error.message, id });
    },
  });
}

/**
 * Delete a personal care category
 */
export function useDeleteCategory(): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      logger.debug('PersonalCare', 'Deleting category', { id });
      return deletePersonalCareCategory(id);
    },
    onSuccess: (_, id) => {
      logger.info('PersonalCare', 'Category deleted', { id });
      queryClient.invalidateQueries({ queryKey: queryKeys.personalCare.categories.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.personalCare.items.all() });
    },
    onError: (error: Error, id) => {
      logger.error('PersonalCare', 'Failed to delete category', { error: error.message, id });
    },
  });
}

/**
 * Initialize personal care with default frequency-based categories and suggested items
 * Only creates if user has no categories yet
 */
export function useInitializePersonalCare(): UseMutationResult<
  { categories: PersonalCareCategory[]; items: PersonalCareItem[] },
  Error,
  void
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      logger.debug('PersonalCare', 'Initializing personal care');
      return initializePersonalCare();
    },
    onSuccess: (result) => {
      logger.info('PersonalCare', 'Initialized with categories and items', {
        categoriesCount: result.categories.length,
        itemsCount: result.items.length,
      });
      // Update the cache with the returned data
      queryClient.setQueryData(queryKeys.personalCare.categories.list({}), result.categories);
      queryClient.setQueryData(queryKeys.personalCare.items.list({}), result.items);
      queryClient.invalidateQueries({ queryKey: queryKeys.personalCare.all });
    },
    onError: (error: Error) => {
      logger.error('PersonalCare', 'Failed to initialize', { error: error.message });
    },
  });
}

// =====================================================
// ITEMS QUERY HOOKS
// =====================================================

export interface PersonalCareItemFilters extends Record<string, unknown> {
  categoryId?: string;
  activeOnly?: boolean;
  trackingMode?: PersonalCareItem['trackingMode'];
}

/**
 * Get all personal care items with optional filters
 */
export function usePersonalCareItems(
  filters?: PersonalCareItemFilters
): UseQueryResult<PersonalCareItem[], Error> {
  return useQuery({
    queryKey: queryKeys.personalCare.items.list(filters),
    queryFn: () => getPersonalCareItems(filters),
    ...queryOptions.user,
  });
}

/**
 * Get scheduled items that are due today or overdue
 */
export function useScheduledItemsDue(): UseQueryResult<PersonalCareItem[], Error> {
  return useQuery({
    queryKey: queryKeys.personalCare.items.scheduled(),
    queryFn: () => getScheduledItemsDue(),
    ...queryOptions.user,
  });
}

/**
 * Create a new personal care item
 */
export function useCreateItem(): UseMutationResult<
  PersonalCareItem,
  Error,
  PersonalCareItemInput
> {
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

/**
 * Update a personal care item
 */
export function useUpdateItem(): UseMutationResult<
  PersonalCareItem,
  Error,
  { id: string; updates: Partial<PersonalCareItemInput> }
> {
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

/**
 * Delete a personal care item
 */
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

// =====================================================
// PRODUCTS QUERY HOOKS
// =====================================================

export interface PersonalCareProductFilters extends Record<string, unknown> {
  currentlyUsing?: boolean;
}

/**
 * Get all personal care products with optional filters
 */
export function usePersonalCareProducts(
  filters?: PersonalCareProductFilters
): UseQueryResult<PersonalCareProduct[], Error> {
  return useQuery({
    queryKey: queryKeys.personalCare.products.list(filters),
    queryFn: () => getPersonalCareProducts(filters),
    ...queryOptions.user,
  });
}

/**
 * Get products linked to a specific item
 */
export function useItemProducts(
  itemId: string
): UseQueryResult<(PersonalCareProduct & { usageOrder: number })[], Error> {
  return useQuery({
    queryKey: queryKeys.personalCare.products.forItem(itemId),
    queryFn: () => getItemProducts(itemId),
    enabled: !!itemId,
    ...queryOptions.user,
  });
}

/**
 * Create a new personal care product
 */
export function useCreateProduct(): UseMutationResult<
  PersonalCareProduct,
  Error,
  PersonalCareProductInput
> {
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

/**
 * Update a personal care product
 */
export function useUpdateProduct(): UseMutationResult<
  PersonalCareProduct,
  Error,
  { id: string; updates: Partial<PersonalCareProductInput> }
> {
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

/**
 * Delete a personal care product
 */
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

/**
 * Link a product to an item
 */
export function useLinkProductToItem(): UseMutationResult<
  unknown,
  Error,
  { itemId: string; productId: string; usageOrder?: number }
> {
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

/**
 * Unlink a product from an item
 */
export function useUnlinkProductFromItem(): UseMutationResult<
  void,
  Error,
  { itemId: string; productId: string }
> {
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

// =====================================================
// LOGS QUERY HOOKS
// =====================================================

export interface PersonalCareLogFilters extends Record<string, unknown> {
  itemId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}

/**
 * Get personal care logs with optional filters
 */
export function usePersonalCareLogs(
  filters?: PersonalCareLogFilters
): UseQueryResult<PersonalCareLog[], Error> {
  return useQuery({
    queryKey: queryKeys.personalCare.logs.list(filters),
    queryFn: () => getPersonalCareLogs(filters),
    ...queryOptions.user,
  });
}

/**
 * Get logs for a specific item
 */
export function useItemLogs(
  itemId: string,
  limit?: number
): UseQueryResult<PersonalCareLog[], Error> {
  return useQuery({
    queryKey: queryKeys.personalCare.logs.forItem(itemId),
    queryFn: () => getPersonalCareLogs({ itemId, limit }),
    enabled: !!itemId,
    ...queryOptions.user,
  });
}

/**
 * Log completion of a personal care item
 */
export function useLogCompletion(): UseMutationResult<
  PersonalCareLog,
  Error,
  PersonalCareLogInput
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: PersonalCareLogInput) => {
      logger.debug('PersonalCare', 'Logging completion', { itemId: input.itemId });
      return logPersonalCareCompletion(input);
    },
    onSuccess: (log) => {
      logger.info('PersonalCare', 'Completion logged', { id: log.id, itemId: log.itemId });
      // Invalidate logs and items (items have lastCompletedAt/nextDueDate updated)
      queryClient.invalidateQueries({ queryKey: queryKeys.personalCare.logs.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.personalCare.items.all() });
    },
    onError: (error: Error) => {
      logger.error('PersonalCare', 'Failed to log completion', { error: error.message });
    },
  });
}

/**
 * Delete a personal care log
 */
export function useDeleteLog(): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      logger.debug('PersonalCare', 'Deleting log', { id });
      return deletePersonalCareLog(id);
    },
    onSuccess: (_, id) => {
      logger.info('PersonalCare', 'Log deleted', { id });
      queryClient.invalidateQueries({ queryKey: queryKeys.personalCare.logs.all() });
    },
    onError: (error: Error, id) => {
      logger.error('PersonalCare', 'Failed to delete log', { error: error.message, id });
    },
  });
}

// =====================================================
// SCHEDULE (CALENDAR) QUERY HOOKS
// =====================================================

/**
 * Get schedule for a specific month
 */
export function useMonthSchedule(
  year: number,
  month: number
): UseQueryResult<PersonalCareScheduleWithItem[], Error> {
  return useQuery({
    queryKey: queryKeys.personalCare.schedule.month(year, month),
    queryFn: async () => {
      logger.debug('PersonalCare', 'Fetching month schedule', { year, month });
      return getMonthSchedule(year, month);
    },
    staleTime: queryOptions.user.staleTime,
  });
}

/**
 * Schedule an item for a specific date
 */
export function useScheduleItem(): UseMutationResult<
  PersonalCareSchedule,
  Error,
  { itemId: string; scheduledDate: string }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemId, scheduledDate }) => {
      logger.debug('PersonalCare', 'Scheduling item', { itemId, scheduledDate });
      return scheduleItem(itemId, scheduledDate);
    },
    onSuccess: (result) => {
      logger.info('PersonalCare', 'Item scheduled', { id: result.id });
      queryClient.invalidateQueries({ queryKey: queryKeys.personalCare.schedule.all() });
    },
    onError: (error: Error) => {
      logger.error('PersonalCare', 'Failed to schedule item', { error: error.message });
    },
  });
}

/**
 * Update schedule status (complete or skip)
 */
export function useUpdateScheduleStatus(): UseMutationResult<
  PersonalCareSchedule,
  Error,
  { scheduleId: string; status: ScheduleStatus; notes?: string }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ scheduleId, status, notes }) => {
      logger.debug('PersonalCare', 'Updating schedule status', { scheduleId, status });
      return updateScheduleStatus(scheduleId, status, notes);
    },
    onSuccess: (result) => {
      logger.info('PersonalCare', 'Schedule status updated', { id: result.id, status: result.status });
      queryClient.invalidateQueries({ queryKey: queryKeys.personalCare.schedule.all() });
      // Also invalidate logs since completing creates a log entry
      queryClient.invalidateQueries({ queryKey: queryKeys.personalCare.logs.all() });
    },
    onError: (error: Error) => {
      logger.error('PersonalCare', 'Failed to update schedule status', { error: error.message });
    },
  });
}

/**
 * Remove a scheduled item by ID
 */
export function useRemoveScheduledItem(): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (scheduleId: string) => {
      logger.debug('PersonalCare', 'Removing scheduled item', { scheduleId });
      return removeScheduledItem(scheduleId);
    },
    onSuccess: (_, scheduleId) => {
      logger.info('PersonalCare', 'Scheduled item removed', { scheduleId });
      queryClient.invalidateQueries({ queryKey: queryKeys.personalCare.schedule.all() });
    },
    onError: (error: Error) => {
      logger.error('PersonalCare', 'Failed to remove scheduled item', { error: error.message });
    },
  });
}

