import { useQuery, useMutation, useQueryClient, useInfiniteQuery, type UseQueryOptions, type UseQueryResult, type UseMutationResult, type UseInfiniteQueryResult } from '@tanstack/react-query';
import { getFinanceAPI } from '@/finance/data';
import type { Transaction, TxnQuery, TransactionInput } from '@/finance/types';
import { logger } from '@/services/logger';
import { financeKeys } from './useFinanceMergedMode';

// ==================== Transactions ====================

export function useTransactionsQuery(params?: TxnQuery, options?: Omit<UseQueryOptions<Transaction[], Error>, 'queryKey' | 'queryFn'>): UseQueryResult<Transaction[], Error> {
  return useQuery<Transaction[], Error>({
    queryKey: financeKeys.transactions(params),
    queryFn: async () => {
      const api = await getFinanceAPI();
      const result = await api.listTransactions(params ?? { limit: 500 });
      // Extract items from paginated response
      return result.items;
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    ...options,
  });
}

/**
 * Infinite query for transactions with cursor-based pagination
 * Use this for large transaction lists (1000+ items) with infinite scroll
 */
export function useInfiniteTransactionsQuery(
  params?: Omit<TxnQuery, 'cursor'>,
  pageSize: number = 50
): UseInfiniteQueryResult<{ pages: { items: Transaction[]; nextCursor?: string }[]; pageParams: (string | undefined)[] }, Error> {
  return useInfiniteQuery({
    queryKey: [...financeKeys.transactions(params), 'infinite'],
    queryFn: async ({ pageParam }) => {
      const api = await getFinanceAPI();
      return api.listTransactions({
        ...params,
        cursor: pageParam as string | undefined,
        limit: pageSize,
      });
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function useUpsertTransactionMutation(): UseMutationResult<void, Error, TransactionInput, unknown> {
  const queryClient = useQueryClient();

  return useMutation<void, Error, TransactionInput>({
    mutationFn: async (transaction: TransactionInput) => {
      logger.debug('Finance', 'Upserting transaction', { id: transaction.id, amount: transaction.amount });
      const api = await getFinanceAPI();
      await api.upsertTransaction(transaction);
    },
    onSuccess: (_, transaction) => {
      logger.info('Finance', 'Transaction upserted successfully', { id: transaction.id });
      // Invalidate all transaction queries since we don't know which params were used
      void queryClient.invalidateQueries({ queryKey: financeKeys.all });
    },
    onError: (error: Error, transaction) => {
      logger.error('Finance', 'Failed to upsert transaction', { error: error.message, id: transaction.id });
    },
  });
}

export function useDeleteTransactionMutation(): UseMutationResult<void, Error, string, unknown> {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (id: string) => {
      logger.debug('Finance', 'Deleting transaction', { id });
      const api = await getFinanceAPI();
      await api.deleteTransaction(id);
    },
    onSuccess: (_, id) => {
      logger.info('Finance', 'Transaction deleted successfully', { id });
      void queryClient.invalidateQueries({ queryKey: financeKeys.all });
    },
    onError: (error: Error, id) => {
      logger.error('Finance', 'Failed to delete transaction', { error: error.message, id });
    },
  });
}
