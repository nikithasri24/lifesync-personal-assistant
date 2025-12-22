/**
 * Finance Zustand Slice - UI STATE ONLY
 *
 * ⚠️ DEPRECATED: Server state removed - use React Query hooks instead
 * 
 * This slice now contains ONLY UI state (view modes, filters, etc.)
 * All server data (accounts, transactions, budgets, loading states, CRUD operations) should use React Query.
 *
 * ✅ Use React Query hooks from @/hooks/useFinanceQuery.ts:
 * - useFinancialAccountsQuery() - Get all accounts
 * - useFinancialAccountQuery(id) - Get single account
 * - useFinancialTransactionsQuery() - Get all transactions
 * - useFinancialTransactionQuery(id) - Get single transaction
 * - useCreateAccountMutation() - Create account
 * - useUpdateAccountMutation() - Update account
 * - useDeleteAccountMutation() - Delete account
 * - useCreateTransactionMutation() - Create transaction
 * - useUpdateTransactionMutation() - Update transaction
 * - useDeleteTransactionMutation() - Delete transaction
 *
 * Additional React Query Features:
 * - Budget tracking hooks
 * - Spending analytics hooks
 * - Bill payment tracking hooks
 * - Investment portfolio hooks
 * - Financial goal tracking
 *
 * Benefits of React Query:
 * - Better financial data caching and synchronization
 * - Optimistic updates for transactions
 * - Automatic invalidation when finances change
 * - Proper separation: Server state (React Query) vs UI state (Zustand)
 */

import { type StateCreator } from 'zustand';

export interface FinanceSlice {
  // UI State only - no server data!
  financeViewMode: 'overview' | 'transactions' | 'accounts' | 'budgets' | 'analytics';
  financeFilterDateRange: { start: string; end: string } | null;
  financeFilterCategory: string | null;
  financeFilterAccount: string | null;
  financeFilterType: 'all' | 'income' | 'expense' | 'transfer';
  financeSortBy: 'date' | 'amount' | 'category' | 'account';
  financeSortOrder: 'asc' | 'desc';
  financeShowRecurring: boolean;
  financeSelectedTransaction: string | null;
  financeSelectedAccount: string | null;

  // UI Actions
  setFinanceViewMode: (mode: 'overview' | 'transactions' | 'accounts' | 'budgets' | 'analytics') => void;
  setFinanceFilterDateRange: (range: { start: string; end: string } | null) => void;
  setFinanceFilterCategory: (category: string | null) => void;
  setFinanceFilterAccount: (account: string | null) => void;
  setFinanceFilterType: (type: 'all' | 'income' | 'expense' | 'transfer') => void;
  setFinanceSortBy: (sortBy: 'date' | 'amount' | 'category' | 'account') => void;
  setFinanceSortOrder: (order: 'asc' | 'desc') => void;
  setFinanceShowRecurring: (show: boolean) => void;
  setFinanceSelectedTransaction: (transactionId: string | null) => void;
  setFinanceSelectedAccount: (accountId: string | null) => void;
  resetFinanceFilters: () => void;
}

export const createFinanceSlice: StateCreator<FinanceSlice, [], [], FinanceSlice> = (set) => ({
  // Initial UI state
  financeViewMode: 'overview',
  financeFilterDateRange: null,
  financeFilterCategory: null,
  financeFilterAccount: null,
  financeFilterType: 'all',
  financeSortBy: 'date',
  financeSortOrder: 'desc',
  financeShowRecurring: true,
  financeSelectedTransaction: null,
  financeSelectedAccount: null,

  // UI Actions
  setFinanceViewMode: (mode) => set({ financeViewMode: mode }),
  setFinanceFilterDateRange: (range) => set({ financeFilterDateRange: range }),
  setFinanceFilterCategory: (category) => set({ financeFilterCategory: category }),
  setFinanceFilterAccount: (account) => set({ financeFilterAccount: account }),
  setFinanceFilterType: (type) => set({ financeFilterType: type }),
  setFinanceSortBy: (sortBy) => set({ financeSortBy: sortBy }),
  setFinanceSortOrder: (order) => set({ financeSortOrder: order }),
  setFinanceShowRecurring: (show) => set({ financeShowRecurring: show }),
  setFinanceSelectedTransaction: (transactionId) => set({ financeSelectedTransaction: transactionId }),
  setFinanceSelectedAccount: (accountId) => set({ financeSelectedAccount: accountId }),
  resetFinanceFilters: () =>
    set({
      financeFilterDateRange: null,
      financeFilterCategory: null,
      financeFilterAccount: null,
      financeFilterType: 'all',
      financeShowRecurring: true,
      financeSelectedTransaction: null,
      financeSelectedAccount: null,
    }),
});
