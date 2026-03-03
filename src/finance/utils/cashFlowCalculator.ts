/**
 * Cash Flow Calculator
 *
 * Calculates income, expenses, and net cash flow from transactions.
 * Used across Dashboard, Reports, and Analytics.
 */

import type { Transaction } from '../types';

/**
 * Category names that represent inter-account transfers, not real income/expenses.
 * Transactions in these categories are excluded from all cash flow calculations
 * to avoid double-counting (e.g. CC purchases are already tracked individually;
 * the payment from checking → CC is just moving money between accounts).
 */
export const TRANSFER_CATEGORY_NAMES = new Set([
  'Credit Card Payments',
]);

/**
 * Remove inter-account transfer transactions from a list before cash flow math.
 * Excludes transactions that have a transfer_id (created via the transfer command)
 * OR belong to a known transfer category (manually categorised transfers).
 */
export function filterTransfers(
  transactions: Transaction[],
  categories: Array<{ id: string; name: string }>
): Transaction[] {
  const transferCatIds = new Set(
    categories
      .filter(c => TRANSFER_CATEGORY_NAMES.has(c.name))
      .map(c => c.id)
  );
  return transactions.filter(t =>
    !t.transferId &&
    !(t.categoryId && transferCatIds.has(t.categoryId))
  );
}

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
    const catId = txn.categoryId ?? 'uncategorized';
    const existing = categoryMap.get(catId) ?? { amount: 0, count: 0 };
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
      categoryName: category?.name ?? 'Uncategorized',
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

// Max categories shown on right side of Sankey before grouping into "Other"
const MAX_EXPENSE_NODES = 7;

import type { Paystub } from '../data';

export function prepareSankeyData(
  transactions: Transaction[],
  categories: Array<{ id: string; name: string }>,
  paystub?: Paystub | null
): SankeyNode[] {
  const nodes: SankeyNode[] = [];

  // Strip inter-account transfers before building the flow diagram
  const realTxns = filterTransfers(transactions, categories);

  // Income sources: categories where ALL transactions are credits (no debits).
  // This matches the Transactions tab logic — a category with any debits is
  // treated as an expense category; credits in it are ignored (returns/refunds).
  const debitCategoryIds = new Set(
    realTxns.filter(t => t.type === 'debit').map(t => t.categoryId).filter(Boolean)
  );
  const incomeTxns = realTxns.filter(
    t => t.type === 'credit' && !(t.categoryId && debitCategoryIds.has(t.categoryId))
  );

  // Income flows: sources → Total Income
  const incomeBySource = calculateCashFlowByCategory(incomeTxns, categories, 'credit');
  const totalIncome = incomeBySource.reduce((sum, cat) => sum + cat.amount, 0);

  for (const source of incomeBySource) {
    if (source.amount > 0) {
      nodes.push({ source: source.categoryName, target: 'Total Income', value: source.amount });
    }
  }

  // When paystub data exists, the existing Salary transactions already represent
  // Nikki's net take-home pay. We expand that into Gross Pay → deductions + net,
  // keeping any remaining salary (e.g. partner's) unchanged.
  if (paystub && paystub.grossPay > 0) {
    const GROSS_LABEL = 'Nikki Gross Pay';

    // Find the "Salary" income node (usually the biggest one)
    const salaryNodeIdx = nodes.findIndex(n =>
      n.target === 'Total Income' && n.source.toLowerCase().includes('salary')
    );

    if (salaryNodeIdx !== -1) {
      const salaryNode = nodes[salaryNodeIdx];
      const partnerSalary = salaryNode.value - paystub.netPay;

      // Remove the combined Salary node
      nodes.splice(salaryNodeIdx, 1);

      // If there's remaining salary (partner's), keep it as-is
      if (partnerSalary > 0) {
        nodes.push({ source: 'Salary', target: 'Total Income', value: partnerSalary });
      }
    }

    // Nikki Gross Pay → each deduction (visible on right side)
    for (const d of paystub.deductions) {
      if (d.amount > 0) {
        nodes.push({ source: GROSS_LABEL, target: d.name, value: d.amount });
      }
    }

    // Nikki Gross Pay → Total Income (net take-home only)
    nodes.push({ source: GROSS_LABEL, target: 'Total Income', value: paystub.netPay });
  }

  // Expense flows: Total Income → categories.
  // Use debit-only sums, exactly matching the Transactions tab category totals.
  // Credits in expense categories (returns/refunds) are intentionally ignored here,
  // consistent with how the Transactions tab computes expense category amounts.
  const allExpenses = calculateCashFlowByCategory(
    realTxns.filter(t => t.type === 'debit'),
    categories,
    'debit'
  ).filter(e => e.amount > 0);

  const topExpenses  = allExpenses.slice(0, MAX_EXPENSE_NODES);
  const restExpenses = allExpenses.slice(MAX_EXPENSE_NODES);

  for (const expense of topExpenses) {
    nodes.push({ source: 'Total Income', target: expense.categoryName, value: expense.amount });
  }

  // Lump tail categories into "Other" so the chart stays readable
  const otherTotal = restExpenses.reduce((sum, e) => sum + e.amount, 0);
  if (otherTotal > 0) {
    nodes.push({ source: 'Total Income', target: 'Other', value: otherTotal });
  }

  // Savings node (if net positive)
  const totalExpenses = allExpenses.reduce((sum, e) => sum + e.amount, 0);
  const savings = totalIncome - totalExpenses;
  if (savings > 0) {
    nodes.push({ source: 'Total Income', target: 'Savings', value: savings });
  }

  return nodes;
}
