/**
 * useFinanceMetrics Hook
 *
 * Centralized hook for calculating and accessing financial metrics.
 * Provides caching and memoization for performance.
 */

import { useMemo } from 'react';
import type { Transaction, Category, Account } from '../types';
import type { Paystub } from '../data';
import {
  calculateCashFlow,
  calculateCashFlowByCategory,
  calculateCashFlowTrend,
  prepareSankeyData,
  filterTransfers,
  type CashFlowResult,
  type CashFlowByCategory,
  type SankeyNode,
} from '../utils/cashFlowCalculator';
import {
  calculateSavingsRateDetailed,
  getSavingsRateStatus,
  type SavingsRateResult,
} from '../utils/savingsRate';
import {
  aggregateByCategory,
  getTopCategories,
  buildCategoryTree,
  calculateCategoryStats,
  type CategoryAggregate,
  type CategoryTreeNode,
} from '../utils/categoryAggregator';
import {
  filterByDateRange,
  type DateRange,
} from '../utils/timePeriodUtils';

export interface FinanceMetrics {
  // Cash Flow
  cashFlow: CashFlowResult;
  cashFlowByCategory: CashFlowByCategory[];
  sankeyData: SankeyNode[];

  // Savings
  savingsRate: SavingsRateResult;
  savingsRateStatus: ReturnType<typeof getSavingsRateStatus>;

  // Categories
  categoryAggregates: CategoryAggregate[];
  topCategories: CategoryAggregate[];
  categoryTree: CategoryTreeNode[];
  categoryStats: ReturnType<typeof calculateCategoryStats>;

  // Trends (if previous period provided)
  trend?: ReturnType<typeof calculateCashFlowTrend>;

  // Summary
  summary: {
    totalIncome: number;
    totalExpenses: number;
    netCashFlow: number;
    savingsRate: number;
    transactionCount: number;
    categoryCount: number;
  };
}

export interface UseFinanceMetricsOptions {
  transactions: Transaction[];
  categories: Category[];
  accounts?: Account[];
  currentPeriod?: DateRange;
  previousPeriod?: DateRange;
  topCategoriesLimit?: number;
  paystub?: Paystub | null;
}

/**
 * Calculate comprehensive finance metrics
 */
export function useFinanceMetrics(options: UseFinanceMetricsOptions): FinanceMetrics {
  const {
    transactions,
    categories,
    currentPeriod,
    previousPeriod,
    topCategoriesLimit = 5,
    paystub,
  } = options;

  // Filter transactions by current period if provided
  const periodTxns = useMemo(() => {
    if (!currentPeriod) return transactions;
    return filterByDateRange(transactions, currentPeriod);
  }, [transactions, currentPeriod]);

  // Strip inter-account transfers (e.g. Credit Card Payments) so they don't
  // double-count expenses — the individual purchases are already tracked.
  const currentTxns = useMemo(
    () => filterTransfers(periodTxns, categories),
    [periodTxns, categories]
  );

  const previousPeriodTxns = useMemo(() => {
    if (!previousPeriod) return [];
    return filterByDateRange(transactions, previousPeriod);
  }, [transactions, previousPeriod]);

  const previousTxns = useMemo(
    () => filterTransfers(previousPeriodTxns, categories),
    [previousPeriodTxns, categories]
  );

  // Calculate cash flow
  const cashFlow = useMemo(
    () => calculateCashFlow(currentTxns),
    [currentTxns]
  );

  // Calculate cash flow by category
  const cashFlowByCategory = useMemo(
    () => calculateCashFlowByCategory(currentTxns, categories, 'all'),
    [currentTxns, categories]
  );

  // Prepare Sankey data
  const sankeyData = useMemo(
    () => prepareSankeyData(currentTxns, categories, paystub),
    [currentTxns, categories]
  );

  // Calculate savings rate
  const savingsRate = useMemo(
    () => calculateSavingsRateDetailed(cashFlow.totalIncome, cashFlow.totalExpenses),
    [cashFlow]
  );

  const savingsRateStatus = useMemo(
    () => getSavingsRateStatus(savingsRate.savingsRate),
    [savingsRate]
  );

  // Aggregate by category
  const categoryAggregates = useMemo(
    () => aggregateByCategory(currentTxns, categories, { type: 'debit', includeUncategorized: true }),
    [currentTxns, categories]
  );

  // Get top categories
  const topCategories = useMemo(
    () => getTopCategories(categoryAggregates, topCategoriesLimit),
    [categoryAggregates, topCategoriesLimit]
  );

  // Build category tree
  const categoryTree = useMemo(
    () => buildCategoryTree(categoryAggregates, categories),
    [categoryAggregates, categories]
  );

  // Calculate category stats
  const categoryStats = useMemo(
    () => calculateCategoryStats(categoryAggregates),
    [categoryAggregates]
  );

  // Calculate trend if previous period provided
  const trend = useMemo(() => {
    if (previousTxns.length === 0) return undefined;
    return calculateCashFlowTrend(currentTxns, previousTxns);
  }, [currentTxns, previousTxns]);

  // Build summary
  const summary = useMemo(
    () => ({
      totalIncome: cashFlow.totalIncome,
      totalExpenses: cashFlow.totalExpenses,
      netCashFlow: cashFlow.netCashFlow,
      savingsRate: savingsRate.savingsRate,
      transactionCount: currentTxns.length,
      categoryCount: categoryAggregates.length,
    }),
    [cashFlow, savingsRate, currentTxns, categoryAggregates]
  );

  return {
    cashFlow,
    cashFlowByCategory,
    sankeyData,
    savingsRate,
    savingsRateStatus,
    categoryAggregates,
    topCategories,
    categoryTree,
    categoryStats,
    trend,
    summary,
  };
}

/**
 * Lightweight hook for just cash flow metrics
 */
export function useCashFlowMetrics(
  transactions: Transaction[],
  categories: Category[]
): {
  cashFlow: CashFlowResult;
  cashFlowByCategory: CashFlowByCategory[];
} {
  const cashFlow = useMemo(
    () => calculateCashFlow(transactions),
    [transactions]
  );

  const cashFlowByCategory = useMemo(
    () => calculateCashFlowByCategory(transactions, categories, 'all'),
    [transactions, categories]
  );

  return { cashFlow, cashFlowByCategory };
}

/**
 * Lightweight hook for just savings rate
 */
export function useSavingsRate(
  transactions: Transaction[]
): SavingsRateResult & { status: ReturnType<typeof getSavingsRateStatus> } {
  const cashFlow = useMemo(
    () => calculateCashFlow(transactions),
    [transactions]
  );

  const savingsRate = useMemo(
    () => calculateSavingsRateDetailed(cashFlow.totalIncome, cashFlow.totalExpenses),
    [cashFlow]
  );

  const status = useMemo(
    () => getSavingsRateStatus(savingsRate.savingsRate),
    [savingsRate]
  );

  return { ...savingsRate, status };
}
