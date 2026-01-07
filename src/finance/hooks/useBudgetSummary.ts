/**
 * useBudgetSummary
 * Hook to calculate budget summary metrics from grouped transactions
 */

import { useMemo } from 'react';
import type { GroupedTransactions } from './useGroupedTransactions';

export interface BudgetSummaryMetrics {
  categoriesWithBudgets: number;
  totalCategories: number;
  totalBudgeted: number;
  totalSpent: number;
  totalRemaining: number;
  overBudgetCount: number;
  utilizationPercent: number;
}

export function useBudgetSummary(groupedTransactions: GroupedTransactions[]): BudgetSummaryMetrics {
  return useMemo(() => {
    const categoriesWithBudgets = groupedTransactions.filter(g => g.budgetLimit);
    const totalBudgeted = categoriesWithBudgets.reduce((sum, g) => sum + (g.budgetLimit ?? 0), 0);
    const totalSpent = categoriesWithBudgets.reduce((sum, g) => sum + g.total, 0);
    const totalRemaining = totalBudgeted - totalSpent;
    const overBudgetCount = categoriesWithBudgets.filter(g => g.total > (g.budgetLimit ?? 0)).length;

    return {
      categoriesWithBudgets: categoriesWithBudgets.length,
      totalCategories: groupedTransactions.length,
      totalBudgeted,
      totalSpent,
      totalRemaining,
      overBudgetCount,
      utilizationPercent: totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0,
    };
  }, [groupedTransactions]);
}

