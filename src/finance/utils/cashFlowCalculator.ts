/**
 * Cash Flow Calculator
 *
 * Calculates income, expenses, and net cash flow from transactions.
 * Used across Dashboard, Reports, and Analytics.
 */

import type { Transaction } from '../types';

export interface CashFlowResult {
  totalIncome: number;
  totalExpenses: number;
  netCashFlow: number;
  incomeTransactions: Transaction[];
  expenseTransactions: Transaction[];
}

export interface CashFlowByCategory {
  categoryId: string;
  categoryName: string;
  amount: number;
  percentage: number;
  transactionCount: number;
}

/**
 * Calculate cash flow metrics from a list of transactions
 */
export function calculateCashFlow(transactions: Transaction[]): CashFlowResult {
  const incomeTransactions = transactions.filter(t => t.type === 'credit');
  const expenseTransactions = transactions.filter(t => t.type === 'debit');

  const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);
  const netCashFlow = totalIncome - totalExpenses;

  return {
    totalIncome,
    totalExpenses,
    netCashFlow,
    incomeTransactions,
    expenseTransactions,
  };
}

/**
 * Calculate cash flow breakdown by category
 */
export function calculateCashFlowByCategory(
  transactions: Transaction[],
  categories: Array<{ id: string; name: string }>,
  type: 'debit' | 'credit' | 'all' = 'all'
): CashFlowByCategory[] {
  // Filter by type if specified
  const filteredTxns = type === 'all'
    ? transactions
    : transactions.filter(t => t.type === type);

  // Group by category
  const categoryMap = new Map<string, { amount: number; count: number }>();

  for (const txn of filteredTxns) {
    const catId = txn.categoryId || 'uncategorized';
    const existing = categoryMap.get(catId) || { amount: 0, count: 0 };
    categoryMap.set(catId, {
      amount: existing.amount + txn.amount,
      count: existing.count + 1,
    });
  }

  // Calculate total for percentage
  const total = Array.from(categoryMap.values()).reduce((sum, cat) => sum + cat.amount, 0);

  // Convert to array and add metadata
  const results: CashFlowByCategory[] = [];

  for (const [catId, data] of categoryMap.entries()) {
    const category = categories.find(c => c.id === catId);
    results.push({
      categoryId: catId,
      categoryName: category?.name || 'Uncategorized',
      amount: data.amount,
      percentage: total > 0 ? (data.amount / total) * 100 : 0,
      transactionCount: data.count,
    });
  }

  // Sort by amount descending
  return results.sort((a, b) => b.amount - a.amount);
}

/**
 * Calculate month-over-month cash flow comparison
 */
export function calculateCashFlowTrend(
  currentPeriodTxns: Transaction[],
  previousPeriodTxns: Transaction[]
): {
  currentIncome: number;
  previousIncome: number;
  incomeChange: number;
  incomeChangePercent: number;
  currentExpenses: number;
  previousExpenses: number;
  expensesChange: number;
  expensesChangePercent: number;
  currentNet: number;
  previousNet: number;
  netChange: number;
  netChangePercent: number;
} {
  const current = calculateCashFlow(currentPeriodTxns);
  const previous = calculateCashFlow(previousPeriodTxns);

  return {
    currentIncome: current.totalIncome,
    previousIncome: previous.totalIncome,
    incomeChange: current.totalIncome - previous.totalIncome,
    incomeChangePercent: previous.totalIncome > 0
      ? ((current.totalIncome - previous.totalIncome) / previous.totalIncome) * 100
      : 0,
    currentExpenses: current.totalExpenses,
    previousExpenses: previous.totalExpenses,
    expensesChange: current.totalExpenses - previous.totalExpenses,
    expensesChangePercent: previous.totalExpenses > 0
      ? ((current.totalExpenses - previous.totalExpenses) / previous.totalExpenses) * 100
      : 0,
    currentNet: current.netCashFlow,
    previousNet: previous.netCashFlow,
    netChange: current.netCashFlow - previous.netCashFlow,
    netChangePercent: previous.netCashFlow !== 0
      ? ((current.netCashFlow - previous.netCashFlow) / Math.abs(previous.netCashFlow)) * 100
      : 0,
  };
}

/**
 * Prepare data for Sankey diagram
 * Format: { source: string, target: string, value: number }
 */
export interface SankeyNode {
  source: string;
  target: string;
  value: number;
}

export function prepareSankeyData(
  transactions: Transaction[],
  categories: Array<{ id: string; name: string }>
): SankeyNode[] {
  const nodes: SankeyNode[] = [];

  // Income flows: Income -> Total Income
  const incomeBySource = calculateCashFlowByCategory(
    transactions.filter(t => t.type === 'credit'),
    categories,
    'credit'
  );

  const totalIncome = incomeBySource.reduce((sum, cat) => sum + cat.amount, 0);

  // Add income sources to total income
  for (const source of incomeBySource) {
    if (source.amount > 0) {
      nodes.push({
        source: source.categoryName,
        target: 'Total Income',
        value: source.amount,
      });
    }
  }

  // Expense flows: Total Income -> Category
  const expenseByCategory = calculateCashFlowByCategory(
    transactions.filter(t => t.type === 'debit'),
    categories,
    'debit'
  );

  for (const expense of expenseByCategory) {
    if (expense.amount > 0) {
      nodes.push({
        source: 'Total Income',
        target: expense.categoryName,
        value: expense.amount,
      });
    }
  }

  // Savings: Total Income -> Savings (if positive net flow)
  const totalExpenses = expenseByCategory.reduce((sum, cat) => sum + cat.amount, 0);
  const savings = totalIncome - totalExpenses;

  if (savings > 0) {
    nodes.push({
      source: 'Total Income',
      target: 'Savings',
      value: savings,
    });
  }

  return nodes;
}
