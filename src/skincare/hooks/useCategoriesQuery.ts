import { useQuery, useMutation, useQueryClient, type UseMutationResult, type UseQueryResult } from '@tanstack/react-query';
import { queryKeys, queryOptions } from '@/lib/react-query';
import {
  getPersonalCareCategories,
  createPersonalCareCategory,
  updatePersonalCareCategory,
  deletePersonalCareCategory,
  initializePersonalCare,
} from '@/api/personalCareAPI';
import { logger } from '@/services/logger';
import type { PersonalCareCategory, PersonalCareCategoryInput, PersonalCareItem } from '@/skincare/personalCareTypes';

// =====================================================
// CATEGORIES QUERY HOOKS
// =====================================================

export interface PersonalCareCategoryFilters extends Record<string, unknown> {
  activeOnly?: boolean;
}

export function usePersonalCareCategories(filters?: PersonalCareCategoryFilters): UseQueryResult<PersonalCareCategory[], Error> {
  return useQuery({
    queryKey: queryKeys.personalCare.categories.list(filters),
    queryFn: () => getPersonalCareCategories(filters),
    ...queryOptions.user,
  });
}

export function useCreateCategory(): UseMutationResult<PersonalCareCategory, Error, PersonalCareCategoryInput> {
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

export function useUpdateCategory(): UseMutationResult<PersonalCareCategory, Error, { id: string; updates: Partial<PersonalCareCategoryInput> }> {
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
 * Initialize personal care with default frequency-based categories and suggested items.
 * Only creates if user has no categories yet.
 */
export function useInitializePersonalCare(): UseMutationResult<{ categories: PersonalCareCategory[]; items: PersonalCareItem[] }, Error, void> {
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
      queryClient.setQueryData(queryKeys.personalCare.categories.list({}), result.categories);
      queryClient.setQueryData(queryKeys.personalCare.items.list({}), result.items);
      queryClient.invalidateQueries({ queryKey: queryKeys.personalCare.all });
    },
    onError: (error: Error) => {
      logger.error('PersonalCare', 'Failed to initialize', { error: error.message });
    },
  });
}
