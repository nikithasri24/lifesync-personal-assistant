import { useQuery, useMutation, useQueryClient, type UseQueryResult, type UseMutationResult } from '@tanstack/react-query';
import { getFinanceAPI } from '@/finance/data';
import type { RetirementAccountWithStats, RetirementAccountMetadataInput } from '@/finance/types';
import { logger } from '@/services/logger';
import { financeKeys } from './useFinanceMergedMode';

// ==================== Retirement Accounts ====================

export function useRetirementAccountsQuery(): UseQueryResult<RetirementAccountWithStats[], Error> {
  return useQuery<RetirementAccountWithStats[], Error>({
    queryKey: financeKeys.retirementAccounts(),
    queryFn: async () => {
      const api = await getFinanceAPI();
      return api.listRetirementAccounts();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useRetirementAccountQuery(accountId: string | null): UseQueryResult<RetirementAccountWithStats | null, Error> {
  return useQuery<RetirementAccountWithStats | null, Error>({
    queryKey: accountId ? financeKeys.retirementAccount(accountId) : ['retirementAccount-null'],
    queryFn: async () => {
      if (!accountId) return null;
      const api = await getFinanceAPI();
      return api.getRetirementAccount(accountId);
    },
    enabled: !!accountId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useUpsertRetirementAccountMetadataMutation(): UseMutationResult<void, Error, RetirementAccountMetadataInput, unknown> {
  const queryClient = useQueryClient();

  return useMutation<void, Error, RetirementAccountMetadataInput>({
    mutationFn: async (metadata: RetirementAccountMetadataInput) => {
      logger.debug('Finance', 'Upserting retirement account metadata', { accountId: metadata.accountId });
      const api = await getFinanceAPI();
      await api.upsertRetirementAccountMetadata(metadata);
    },
    onSuccess: (_, metadata) => {
      logger.info('Finance', 'Retirement account metadata upserted successfully', { accountId: metadata.accountId });
      void queryClient.invalidateQueries({ queryKey: financeKeys.retirementAccounts() });
      void queryClient.invalidateQueries({ queryKey: financeKeys.retirementAccount(metadata.accountId) });
      void queryClient.invalidateQueries({ queryKey: financeKeys.accounts() });
    },
    onError: (error: Error, metadata) => {
      logger.error('Finance', 'Failed to upsert retirement account metadata', { error: error.message, accountId: metadata.accountId });
    },
  });
}

export function useDeleteRetirementAccountMetadataMutation(): UseMutationResult<void, Error, string, unknown> {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (accountId: string) => {
      logger.debug('Finance', 'Deleting retirement account metadata', { accountId });
      const api = await getFinanceAPI();
      await api.deleteRetirementAccountMetadata(accountId);
    },
    onSuccess: (_, accountId) => {
      logger.info('Finance', 'Retirement account metadata deleted successfully', { accountId });
      void queryClient.invalidateQueries({ queryKey: financeKeys.retirementAccounts() });
      void queryClient.invalidateQueries({ queryKey: financeKeys.retirementAccount(accountId) });
    },
    onError: (error: Error, accountId) => {
      logger.error('Finance', 'Failed to delete retirement account metadata', { error: error.message, accountId });
    },
  });
}
