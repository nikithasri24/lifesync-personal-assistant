import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { getMergedConnectionId, type MergedConnectionResult } from '@/shared/api/SharedDataProvider';
import { useCurrentUserId as useCurrentUserIdBase, useMergedConnection as useMergedConnectionBase, usePartnerName as usePartnerNameBase, useHasMergedPermission as useHasMergedPermissionBase } from '@/hooks/useOwnerInfo';
import type { TxnQuery } from '@/finance/types';
import { logger } from '@/services/logger';

// ==================== Merged Connection Cache ====================

// Cache for merged connection to avoid repeated checks within same session
let cachedFinanceMergedConnection: MergedConnectionResult | null | undefined = undefined;

/**
 * Get the merged connection ID for finances if both users have enabled merged mode.
 * Results are cached for the session to avoid repeated database calls.
 */
export async function getFinancesMergedConnection(): Promise<MergedConnectionResult | null> {
  if (cachedFinanceMergedConnection !== undefined) {
    logger.debug('Hooks', 'Using cached finance merged connection', { connection: cachedFinanceMergedConnection });
    return cachedFinanceMergedConnection;
  }
  cachedFinanceMergedConnection = await getMergedConnectionId('finances');
  logger.debug('Hooks', 'Fetched finance merged connection', { connection: cachedFinanceMergedConnection });
  return cachedFinanceMergedConnection;
}

/**
 * Clear the cached merged connection (call when permissions change)
 */
export function clearFinanceMergedConnectionCache(): void {
  cachedFinanceMergedConnection = undefined;
}

// ==================== Query Keys ====================

export const financeKeys = {
  all: ['finance'] as const,
  mergedConnection: () => [...financeKeys.all, 'mergedConnection'] as const,
  institutions: () => [...financeKeys.all, 'institutions'] as const,
  accounts: () => [...financeKeys.all, 'accounts'] as const,
  account: (id: string) => [...financeKeys.all, 'account', id] as const,
  transactions: (params?: TxnQuery) => [...financeKeys.all, 'transactions', params] as const,
  budgets: (month: string) => [...financeKeys.all, 'budgets', month] as const,
  budgetTemplates: () => [...financeKeys.all, 'budgetTemplates'] as const,
  categories: () => [...financeKeys.all, 'categories'] as const,
  netWorth: () => [...financeKeys.all, 'netWorth'] as const,
  goals: () => [...financeKeys.all, 'goals'] as const,
  goal: (id: string) => [...financeKeys.all, 'goal', id] as const,
  goalProgress: (goalId: string) => [...financeKeys.all, 'goalProgress', goalId] as const,
  cardBenefits: (accountId: string) => [...financeKeys.all, 'cardBenefits', accountId] as const,
  categoryBonuses: (accountId: string) => [...financeKeys.all, 'categoryBonuses', accountId] as const,
  welcomeBonuses: (accountId: string) => [...financeKeys.all, 'welcomeBonuses', accountId] as const,
  cardOffers: (accountId: string) => [...financeKeys.all, 'cardOffers', accountId] as const,
  loans: () => [...financeKeys.all, 'loans'] as const,
  loan: (id: string) => [...financeKeys.all, 'loan', id] as const,
  loanPayments: (loanId: string) => [...financeKeys.all, 'loanPayments', loanId] as const,
  insurancePolicies: () => [...financeKeys.all, 'insurancePolicies'] as const,
  insurancePolicy: (id: string) => [...financeKeys.all, 'insurancePolicy', id] as const,
  recurringTransactions: () => [...financeKeys.all, 'recurringTransactions'] as const,
  pendingTransactions: () => [...financeKeys.all, 'pendingTransactions'] as const,
  retirementAccounts: () => [...financeKeys.all, 'retirementAccounts'] as const,
  retirementAccount: (id: string) => [...financeKeys.all, 'retirementAccount', id] as const,
};

// ==================== Merged Connection Hooks ====================

/**
 * Hook to get merged connection for finances module.
 * Returns partnerId and connectionId if both users have merged mode enabled.
 * @deprecated Use useMergedConnection('finances') from @/hooks/useOwnerInfo for standardization
 */
export function useFinanceMergedConnectionQuery(options?: { enabled?: boolean }): UseQueryResult<MergedConnectionResult | null, Error> {
  return useQuery<MergedConnectionResult | null, Error>({
    queryKey: financeKeys.mergedConnection(),
    queryFn: async () => {
      const result = await getFinancesMergedConnection();
      return result;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes - merged connection doesn't change often
    enabled: options?.enabled ?? true,
  });
}

// ==================== Standardized Owner Info Hooks ====================
// These are re-exports from useOwnerInfo configured for the finances module
// Use these for new code to maintain consistency across the codebase

/**
 * Get current user ID.
 * Re-export of standardized hook from useOwnerInfo.
 */
export const useFinanceCurrentUserId = useCurrentUserIdBase;

/**
 * Get merged connection for finances module.
 * Re-export of standardized hook from useOwnerInfo.
 */
export function useFinanceMergedConnection() {
  return useMergedConnectionBase('finances');
}

/**
 * Get partner's name from merged connection.
 * Re-export of standardized hook from useOwnerInfo.
 */
export function useFinancePartnerName() {
  return usePartnerNameBase('finances');
}

/**
 * Check if finances merged mode is enabled.
 * Re-export of standardized hook from useOwnerInfo.
 */
export function useFinanceHasMergedPermission() {
  return useHasMergedPermissionBase('finances');
}
