import type { StateCreator } from 'zustand';
import type { FinancialAccountData, FinancialTransactionData } from '@/services/types';
import { apiClient } from '@/services/apiClient';

type TransactionInput = Omit<FinancialTransactionData, 'id' | 'created_at' | 'updated_at'>;

export interface FinanceSlice {
  accounts: FinancialAccountData[];
  accountsLoaded: boolean;
  accountsLoading: boolean;
  accountsError: string | null;

  transactions: FinancialTransactionData[];
  transactionsLoaded: boolean;
  transactionsLoading: boolean;
  transactionsError: string | null;

  loadAccounts: () => Promise<void>;
  loadTransactions: () => Promise<void>;
  addTransaction: (tx: TransactionInput) => Promise<FinancialTransactionData>;
  updateTransaction: (id: string, updates: Partial<FinancialTransactionData>) => Promise<FinancialTransactionData>;
}

export const createFinanceSlice: StateCreator<FinanceSlice, [], [], FinanceSlice> = (set, get) => ({
  accounts: [],
  accountsLoaded: false,
  accountsLoading: false,
  accountsError: null,

  transactions: [],
  transactionsLoaded: false,
  transactionsLoading: false,
  transactionsError: null,

  loadAccounts: async () => {
    if (get().accountsLoading) return;
    set({ accountsLoading: true, accountsError: null });
    try {
      const accounts = await apiClient.getFinancialAccounts();
      set({ accounts, accountsLoaded: true, accountsLoading: false });
    } catch (error) {
      set({
        accountsError: error instanceof Error ? error.message : 'Failed to load accounts',
        accountsLoading: false,
      });
      throw error;
    }
  },

  loadTransactions: async () => {
    if (get().transactionsLoading) return;
    set({ transactionsLoading: true, transactionsError: null });
    try {
      const transactions = await apiClient.getFinancialTransactions();
      set({ transactions, transactionsLoaded: true, transactionsLoading: false });
    } catch (error) {
      set({
        transactionsError: error instanceof Error ? error.message : 'Failed to load transactions',
        transactionsLoading: false,
      });
      throw error;
    }
  },

  addTransaction: async (tx) => {
    const created = await apiClient.createFinancialTransaction(tx);
    set((state) => ({ transactions: [created, ...state.transactions] }));
    return created;
  },

  updateTransaction: async (id, updates) => {
    const updated = await apiClient.updateFinancialTransaction(id, updates);
    set((state) => ({
      transactions: state.transactions.map((t) => (t.id === id ? { ...t, ...updated } : t)),
    }));
    return updated;
  },
});
