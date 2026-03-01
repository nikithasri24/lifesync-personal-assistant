import { useQuery, useMutation, useQueryClient, type UseQueryResult, type UseMutationResult } from '@tanstack/react-query';
import { getFinanceAPI } from '@/finance/data';
import type { RecurringTransaction, RecurringTransactionInput, PendingTransaction, TransactionInput } from '@/finance/types';
import { logger } from '@/services/logger';
import { financeKeys } from './useFinanceMergedMode';

// ==================== Recurring Transactions ====================

export function useRecurringTransactionsQuery(): UseQueryResult<RecurringTransaction[], Error> {
  return useQuery<RecurringTransaction[], Error>({
    queryKey: financeKeys.recurringTransactions(),
    queryFn: async () => {
      const api = await getFinanceAPI();
      return api.listRecurringTransactions();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function usePendingTransactionsQuery(): UseQueryResult<PendingTransaction[], Error> {
  return useQuery<PendingTransaction[], Error>({
    queryKey: financeKeys.pendingTransactions(),
    queryFn: async () => {
      const api = await getFinanceAPI();
      return api.listPendingTransactions();
    },
    refetchInterval: 1000 * 60, // Refetch every minute for pending items
    staleTime: 1000 * 30, // 30 seconds
  });
}

export function useUpsertRecurringTransactionMutation(): UseMutationResult<void, Error, RecurringTransactionInput, unknown> {
  const queryClient = useQueryClient();

  return useMutation<void, Error, RecurringTransactionInput>({
    mutationFn: async (recurring: RecurringTransactionInput) => {
      logger.debug('Finance', 'Upserting recurring transaction', { recurring });
      const api = await getFinanceAPI();
      await api.upsertRecurringTransaction(recurring);
    },
    onSuccess: (_, recurring) => {
      logger.info('Finance', 'Recurring transaction saved successfully', { id: recurring.id });
      void queryClient.invalidateQueries({ queryKey: financeKeys.recurringTransactions() });
    },
    onError: (error: Error) => {
      logger.error('Finance', error, { context: 'Failed to save recurring transaction' });
    },
  });
}

export function useDeleteRecurringTransactionMutation(): UseMutationResult<void, Error, string, unknown> {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (recurringId: string) => {
      logger.debug('Finance', 'Deleting recurring transaction', { recurringId });
      const api = await getFinanceAPI();
      await api.deleteRecurringTransaction(recurringId);
    },
    onSuccess: (_, recurringId) => {
      logger.info('Finance', 'Recurring transaction deleted successfully', { recurringId });
      void queryClient.invalidateQueries({ queryKey: financeKeys.recurringTransactions() });
      void queryClient.invalidateQueries({ queryKey: financeKeys.pendingTransactions() });
    },
    onError: (error: Error) => {
      logger.error('Finance', error, { context: 'Failed to delete recurring transaction' });
    },
  });
}

export function useApprovePendingTransactionMutation(): UseMutationResult<void, Error, { pendingId: string; edits?: Partial<TransactionInput> }, unknown> {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { pendingId: string; edits?: Partial<TransactionInput> }>({
    mutationFn: async ({ pendingId, edits }) => {
      logger.debug('Finance', 'Approving pending transaction', { pendingId, hasEdits: !!edits });
      const api = await getFinanceAPI();
      await api.approvePendingTransaction(pendingId, edits);
    },
    onSuccess: (_, { pendingId }) => {
      logger.info('Finance', 'Pending transaction approved successfully', { pendingId });
      void queryClient.invalidateQueries({ queryKey: financeKeys.pendingTransactions() });
      void queryClient.invalidateQueries({ queryKey: financeKeys.transactions() });
      void queryClient.invalidateQueries({ queryKey: financeKeys.accounts() });
    },
    onError: (error: Error) => {
      logger.error('Finance', error, { context: 'Failed to approve pending transaction' });
    },
  });
}

export function useSkipPendingTransactionMutation(): UseMutationResult<void, Error, string, unknown> {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (pendingId: string) => {
      logger.debug('Finance', 'Skipping pending transaction', { pendingId });
      const api = await getFinanceAPI();
      await api.skipPendingTransaction(pendingId);
    },
    onSuccess: (_, pendingId) => {
      logger.info('Finance', 'Pending transaction skipped successfully', { pendingId });
      void queryClient.invalidateQueries({ queryKey: financeKeys.pendingTransactions() });
    },
    onError: (error: Error) => {
      logger.error('Finance', error, { context: 'Failed to skip pending transaction' });
    },
  });
}

export function useDeletePendingTransactionMutation(): UseMutationResult<void, Error, string, unknown> {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (pendingId: string) => {
      logger.debug('Finance', 'Deleting pending transaction', { pendingId });
      const api = await getFinanceAPI();
      await api.deletePendingTransaction(pendingId);
    },
    onSuccess: (_, pendingId) => {
      logger.info('Finance', 'Pending transaction deleted successfully', { pendingId });
      void queryClient.invalidateQueries({ queryKey: financeKeys.pendingTransactions() });
    },
    onError: (error: Error) => {
      logger.error('Finance', error, { context: 'Failed to delete pending transaction' });
    },
  });
}

export function useGeneratePendingTransactionsMutation(): UseMutationResult<number, Error, void, unknown> {
  const queryClient = useQueryClient();

  return useMutation<number, Error, void>({
    mutationFn: async () => {
      logger.debug('Finance', 'Generating pending transactions');
      const api = await getFinanceAPI();
      return api.generatePendingTransactions();
    },
    onSuccess: (count) => {
      logger.info('Finance', 'Pending transactions generated successfully', { count });
      void queryClient.invalidateQueries({ queryKey: financeKeys.pendingTransactions() });
      void queryClient.invalidateQueries({ queryKey: financeKeys.recurringTransactions() });
    },
    onError: (error: Error) => {
      logger.error('Finance', error, { context: 'Failed to generate pending transactions' });
    },
  });
}
