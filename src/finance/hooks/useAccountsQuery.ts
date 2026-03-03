import { useQuery, useMutation, useQueryClient, type UseQueryResult, type UseMutationResult } from '@tanstack/react-query';
import { getFinanceAPI } from '@/finance/data';
import type { Account } from '@/finance/types';
import { logger } from '@/services/logger';
import { financeKeys } from './useFinanceMergedMode';

// ==================== Accounts ====================

export function useAccountsQuery(): UseQueryResult<Account[], Error> {
  return useQuery<Account[], Error>({
    queryKey: financeKeys.accounts(),
    queryFn: async () => {
      const api = await getFinanceAPI();
      return api.listAccounts();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useUpdateAccountMutation(): UseMutationResult<void, Error, { accountId: string; updates: Partial<Account> }, { previousAccounts: Account[] | undefined }> {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { accountId: string; updates: Partial<Account> }, { previousAccounts: Account[] | undefined }>({
    mutationFn: async ({ accountId, updates }: { accountId: string; updates: Partial<Account> }) => {
      logger.debug('Finance', 'Updating account', { accountId, updates });
      const api = await getFinanceAPI();
      await api.updateAccount(accountId, updates);
    },
    onMutate: async ({ accountId, updates }) => {
      logger.debug('Finance', 'Optimistic update: account', { accountId, updates });
      await queryClient.cancelQueries({ queryKey: financeKeys.accounts() });
      const previousAccounts = queryClient.getQueryData<Account[]>(financeKeys.accounts());

      // Optimistic update
      queryClient.setQueryData<Account[]>(financeKeys.accounts(), (old) => {
        if (!old) return old;
        return old.map((account) =>
          account.id === accountId ? { ...account, ...updates } : account
        );
      });

      return { previousAccounts };
    },
    onError: (err: Error, { accountId }, context) => {
      logger.error('Finance', 'Failed to update account', { error: err.message, accountId });
      if (context?.previousAccounts) {
        queryClient.setQueryData(financeKeys.accounts(), context.previousAccounts);
      }
    },
    onSuccess: (_, { accountId }) => {
      logger.info('Finance', 'Account updated successfully', { id: accountId });
      void queryClient.invalidateQueries({ queryKey: financeKeys.accounts() });
    },
  });
}

type UpsertAccountInput = { id?: string; name: string; type: string; balance: number; institutionId?: string; userId?: string; isArchived?: boolean; creditLimit?: number; apr?: number; promoAprEndDate?: string; notes?: string };

export function useUpsertAccountMutation(): UseMutationResult<void, Error, UpsertAccountInput, unknown> {
  const queryClient = useQueryClient();

  return useMutation<void, Error, UpsertAccountInput>({
    mutationFn: async (account) => {
      logger.debug('Finance', 'Upserting account', { account });
      const api = await getFinanceAPI();
      await api.upsertAccount(account);
    },
    onSuccess: (_, account) => {
      logger.info('Finance', 'Account upserted successfully', { name: account.name });
      void queryClient.invalidateQueries({ queryKey: financeKeys.accounts() });
      void queryClient.invalidateQueries({ queryKey: financeKeys.netWorth() });
    },
    onError: (error: Error, account) => {
      logger.error('Finance', 'Failed to upsert account', { error: error.message, name: account.name });
    },
  });
}

export function useDeleteAccountMutation(): UseMutationResult<void, Error, string, unknown> {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (accountId: string) => {
      logger.debug('Finance', 'Deleting account', { accountId });
      const api = await getFinanceAPI();
      await api.deleteAccount(accountId);
    },
    onSuccess: (_, accountId) => {
      logger.info('Finance', 'Account deleted successfully', { accountId });
      void queryClient.invalidateQueries({ queryKey: financeKeys.accounts() });
      void queryClient.invalidateQueries({ queryKey: financeKeys.netWorth() });
      void queryClient.invalidateQueries({ queryKey: financeKeys.transactions() });
    },
    onError: (error: Error, accountId) => {
      logger.error('Finance', 'Failed to delete account', { error: error.message, accountId });
    },
  });
}
