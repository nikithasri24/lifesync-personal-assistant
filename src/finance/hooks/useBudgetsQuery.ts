import { useQuery, useMutation, useQueryClient, type UseQueryResult, type UseMutationResult } from '@tanstack/react-query';
import { getFinanceAPI } from '@/finance/data';
import type { Budget, BudgetTemplate, BudgetTemplateInput } from '@/finance/types';
import { logger } from '@/services/logger';
import { financeKeys } from './useFinanceMergedMode';

// ==================== Budgets ====================

export function useBudgetsQuery(month: string): UseQueryResult<Budget[], Error> {
  return useQuery<Budget[], Error>({
    queryKey: financeKeys.budgets(month),
    queryFn: async () => {
      const api = await getFinanceAPI();
      return api.listBudgets(month);
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useUpsertBudgetMutation(): UseMutationResult<void, Error, { categoryId: string; month: string; limit: number }, unknown> {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { categoryId: string; month: string; limit: number }>({
    mutationFn: async (budget: { categoryId: string; month: string; limit: number }) => {
      logger.debug('Finance', 'Upserting budget', { categoryId: budget.categoryId, month: budget.month, limit: budget.limit });
      const api = await getFinanceAPI();
      await api.upsertBudget(budget);
    },
    onSuccess: (_, variables) => {
      logger.info('Finance', 'Budget upserted successfully', { categoryId: variables.categoryId, month: variables.month });
      void queryClient.invalidateQueries({ queryKey: financeKeys.budgets(variables.month) });
    },
    onError: (error: Error, budget) => {
      logger.error('Finance', 'Failed to upsert budget', { error: error.message, categoryId: budget.categoryId });
    },
  });
}

export function useDeleteBudgetMutation(): UseMutationResult<void, Error, { categoryId: string; month: string }, unknown> {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { categoryId: string; month: string }>({
    mutationFn: async ({ categoryId, month }: { categoryId: string; month: string }) => {
      logger.debug('Finance', 'Deleting budget', { categoryId, month });
      const api = await getFinanceAPI();
      await api.deleteBudget(categoryId, month);
    },
    onSuccess: (_, variables) => {
      logger.info('Finance', 'Budget deleted successfully', { categoryId: variables.categoryId, month: variables.month });
      void queryClient.invalidateQueries({ queryKey: financeKeys.budgets(variables.month) });
    },
    onError: (error: Error, { categoryId, month }) => {
      logger.error('Finance', 'Failed to delete budget', { error: error.message, categoryId, month });
    },
  });
}

// ==================== Budget Templates ====================

export function useBudgetTemplatesQuery(): UseQueryResult<BudgetTemplate[], Error> {
  return useQuery<BudgetTemplate[], Error>({
    queryKey: financeKeys.budgetTemplates(),
    queryFn: async () => {
      const api = await getFinanceAPI();
      return api.listBudgetTemplates();
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

export function useUpsertBudgetTemplateMutation(): UseMutationResult<void, Error, BudgetTemplateInput, unknown> {
  const queryClient = useQueryClient();

  return useMutation<void, Error, BudgetTemplateInput>({
    mutationFn: async (template: BudgetTemplateInput) => {
      logger.debug('Finance', 'Upserting budget template', { categoryId: template.categoryId });
      const api = await getFinanceAPI();
      await api.upsertBudgetTemplate(template);
    },
    onSuccess: (_, template) => {
      logger.info('Finance', 'Budget template upserted successfully', { categoryId: template.categoryId });
      void queryClient.invalidateQueries({ queryKey: financeKeys.budgetTemplates() });
    },
    onError: (error: Error, template) => {
      logger.error('Finance', 'Failed to upsert budget template', { error: error.message, categoryId: template.categoryId });
    },
  });
}

export function useDeleteBudgetTemplateMutation(): UseMutationResult<void, Error, string, unknown> {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (categoryId: string) => {
      logger.debug('Finance', 'Deleting budget template', { categoryId });
      const api = await getFinanceAPI();
      await api.deleteBudgetTemplate(categoryId);
    },
    onSuccess: (_, categoryId) => {
      logger.info('Finance', 'Budget template deleted successfully', { categoryId });
      void queryClient.invalidateQueries({ queryKey: financeKeys.budgetTemplates() });
    },
    onError: (error: Error, categoryId) => {
      logger.error('Finance', 'Failed to delete budget template', { error: error.message, categoryId });
    },
  });
}

export function useInitializeBudgetsMutation(): UseMutationResult<number, Error, string, unknown> {
  const queryClient = useQueryClient();

  return useMutation<number, Error, string>({
    mutationFn: async (month: string) => {
      logger.debug('Finance', 'Initializing budgets from templates', { month });
      const api = await getFinanceAPI();
      return api.initializeBudgetsFromTemplates(month);
    },
    onSuccess: (_, month) => {
      logger.info('Finance', 'Budgets initialized successfully', { month });
      void queryClient.invalidateQueries({ queryKey: financeKeys.budgets(month) });
    },
    onError: (error: Error, month) => {
      logger.error('Finance', 'Failed to initialize budgets', { error: error.message, month });
    },
  });
}
