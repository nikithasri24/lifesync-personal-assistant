/**
 * Category Aggregator
 *
 * Aggregates transactions by category for reporting and visualization.
 * Handles hierarchical categories and provides various grouping options.
 */

import type { Transaction, Category } from '../types';

export interface CategoryAggregate {
  categoryId: string;
  categoryName: string;
  parentId?: string;
  parentName?: string;
  totalAmount: number;
  transactionCount: number;
  percentage: number;
  averageAmount: number;
  icon?: string;
  color?: string;
}

export interface CategoryTreeNode extends CategoryAggregate {
  children: CategoryTreeNode[];
  level: number;
}

/**
 * Aggregate transactions by category
 */
export function aggregateByCategory(
  transactions: Transaction[],
  categories: Category[],
  options: {
    type?: 'debit' | 'credit' | 'all';
    includeUncategorized?: boolean;
  } = {}
): CategoryAggregate[] {
  const { type = 'all', includeUncategorized = true } = options;

  // Filter by transaction type
  const filteredTxns = type === 'all'
    ? transactions
    : transactions.filter(t => t.type === type);

  // Group by category
  const categoryMap = new Map<string, {
    amount: number;
    count: number;
    transactions: Transaction[];
  }>();

  for (const txn of filteredTxns) {
    const catId = txn.categoryId ?? 'uncategorized';

    // Skip uncategorized if not included
    if (catId === 'uncategorized' && !includeUncategorized) {
      continue;
    }

    const existing = categoryMap.get(catId) ?? { amount: 0, count: 0, transactions: [] };
    categoryMap.set(catId, {
      amount: existing.amount + txn.amount,
      count: existing.count + 1,
      transactions: [...existing.transactions, txn],
    });
  }

  // Calculate total for percentages
  const total = Array.from(categoryMap.values()).reduce((sum, cat) => sum + cat.amount, 0);

  // Build result array
  const results: CategoryAggregate[] = [];

  for (const [catId, data] of categoryMap.entries()) {
    const category = categories.find(c => c.id === catId);
    const parent = category?.parentId
      ? categories.find(c => c.id === category.parentId)
      : undefined;

    results.push({
      categoryId: catId,
      categoryName: category?.name ?? 'Uncategorized',
      parentId: category?.parentId,
      parentName: parent?.name,
      totalAmount: data.amount,
      transactionCount: data.count,
      percentage: total > 0 ? (data.amount / total) * 100 : 0,
      averageAmount: data.count > 0 ? data.amount / data.count : 0,
      icon: category?.icon,
      color: category?.color,
    });
  }

  return results.sort((a, b) => b.totalAmount - a.totalAmount);
}

/**
 * Build hierarchical category tree
 */
export function buildCategoryTree(
  aggregates: CategoryAggregate[],
  _categories: Category[]
): CategoryTreeNode[] {
  const nodeMap = new Map<string, CategoryTreeNode>();
  const rootNodes: CategoryTreeNode[] = [];

  // Create nodes for all aggregates
  for (const agg of aggregates) {
    nodeMap.set(agg.categoryId, {
      ...agg,
      children: [],
      level: 0,
    });
  }

  // Build tree structure
  for (const node of nodeMap.values()) {
    if (node.parentId && nodeMap.has(node.parentId)) {
      // Has parent - add to parent's children
      const parent = nodeMap.get(node.parentId);
      if (parent) {
        parent.children.push(node);
        node.level = parent.level + 1;
      }
    } else {
      // Root node
      rootNodes.push(node);
    }
  }

  // Sort children by amount
  const sortChildren = (nodes: CategoryTreeNode[]): void => {
    nodes.sort((a, b) => b.totalAmount - a.totalAmount);
    for (const node of nodes) {
      sortChildren(node.children);
    }
  };

  sortChildren(rootNodes);

  return rootNodes;
}

/**
 * Get top N categories by spending
 */
export function getTopCategories(
  aggregates: CategoryAggregate[],
  limit: number = 5
): CategoryAggregate[] {
  return aggregates
    .sort((a, b) => b.totalAmount - a.totalAmount)
    .slice(0, limit);
}

/**
 * Group categories by parent
 */
export function groupByParentCategory(
  aggregates: CategoryAggregate[],
  _categories: Category[]
): Map<string, CategoryAggregate[]> {
  const grouped = new Map<string, CategoryAggregate[]>();

  for (const agg of aggregates) {
    const parentKey = agg.parentId ?? 'root';
    const existing = grouped.get(parentKey) ?? [];
    grouped.set(parentKey, [...existing, agg]);
  }

  return grouped;
}

/**
 * Calculate category statistics
 */
export function calculateCategoryStats(aggregates: CategoryAggregate[]): {
  totalCategories: number;
  totalAmount: number;
  averagePerCategory: number;
  medianAmount: number;
  topCategory: CategoryAggregate | null;
  bottomCategory: CategoryAggregate | null;
} {
  if (aggregates.length === 0) {
    return {
      totalCategories: 0,
      totalAmount: 0,
      averagePerCategory: 0,
      medianAmount: 0,
      topCategory: null,
      bottomCategory: null,
    };
  }

  const sorted = [...aggregates].sort((a, b) => a.totalAmount - b.totalAmount);
  const totalAmount = aggregates.reduce((sum, cat) => sum + cat.totalAmount, 0);

  return {
    totalCategories: aggregates.length,
    totalAmount,
    averagePerCategory: totalAmount / aggregates.length,
    medianAmount: sorted[Math.floor(sorted.length / 2)].totalAmount,
    topCategory: sorted[sorted.length - 1],
    bottomCategory: sorted[0],
  };
}

/**
 * Compare category spending across periods
 */
export function compareCategorySpending(
  currentPeriod: CategoryAggregate[],
  previousPeriod: CategoryAggregate[]
): Array<{
  categoryId: string;
  categoryName: string;
  currentAmount: number;
  previousAmount: number;
  change: number;
  changePercent: number;
}> {
  const comparison: Array<{
    categoryId: string;
    categoryName: string;
    currentAmount: number;
    previousAmount: number;
    change: number;
    changePercent: number;
  }> = [];

  // Create map of previous period for quick lookup
  const previousMap = new Map(
    previousPeriod.map(cat => [cat.categoryId, cat.totalAmount])
  );

  // Compare each category
  for (const current of currentPeriod) {
    const previousAmount = previousMap.get(current.categoryId) ?? 0;
    const change = current.totalAmount - previousAmount;
    const changePercent = previousAmount > 0
      ? (change / previousAmount) * 100
      : 0;

    comparison.push({
      categoryId: current.categoryId,
      categoryName: current.categoryName,
      currentAmount: current.totalAmount,
      previousAmount,
      change,
      changePercent,
    });
  }

  return comparison.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
}