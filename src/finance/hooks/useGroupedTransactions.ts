/**
 * useGroupedTransactions
 * Hook to group transactions by category with budget information
 */

import { useMemo } from 'react';
import type { Transaction, Category, Budget } from '../types';

export interface GroupedTransactions {
  categoryId: string | null;
  categoryName: string;
  transactions: Transaction[];
  total: number;
  budget?: Budget;
  budgetLimit?: number;
}

interface UseGroupedTransactionsParams {
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
}

export function useGroupedTransactions({
  transactions,
  categories,
  budgets,
}: UseGroupedTransactionsParams): GroupedTransactions[] {
  return useMemo(() => {
    const groups = new Map<string | null, Transaction[]>();

    // Ensure transactions is an array before iterating
    if (!Array.isArray(transactions)) {
      return [];
    }

    transactions.forEach((txn) => {
      const key = txn.categoryId ?? null;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      const groupArray = groups.get(key);
      if (groupArray) {
        groupArray.push(txn);
      }
    });

    // Convert to array and sort each group by date (newest first)
    const result: GroupedTransactions[] = [];

    groups.forEach((txns, categoryId) => {
      const categoryName = categoryId
        ? categories.find((c) => c.id === categoryId)?.name ?? 'Unknown Category'
        : 'Uncategorized';

      // Sort transactions by date (newest first)
      const sortedTxns = txns.sort(
        (a, b) => new Date(b.dateISO).getTime() - new Date(a.dateISO).getTime()
      );

      // Calculate group total (spent amount - only debits for budget comparison)
      const spent = Math.abs(txns.reduce(
        (sum, txn) => sum + (txn.type === 'debit' ? txn.amount : 0),
        0
      ));

      // Get budget for this category
      const budget = categoryId ? budgets.find((b) => b.categoryId === categoryId) : undefined;

      result.push({
        categoryId,
        categoryName,
        transactions: sortedTxns,
        total: spent,
        budget,
        budgetLimit: budget?.limit,
      });
    });

    // Sort groups: Uncategorized first, then by absolute total (largest first)
    return result.sort((a, b) => {
      if (a.categoryId === null) return -1;
      if (b.categoryId === null) return 1;
      return Math.abs(b.total) - Math.abs(a.total);
    });
  }, [transactions, categories, budgets]);
}

