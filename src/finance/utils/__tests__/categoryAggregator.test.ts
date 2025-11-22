import { describe, it, expect } from 'vitest';
import {
  aggregateByCategory,
  buildCategoryTree,
  getTopCategories,
  groupByParentCategory,
  calculateCategoryStats,
  compareCategorySpending,
} from '../categoryAggregator';
import type { Transaction, Category } from '../../types';

describe('categoryAggregator', () => {
  const createTransaction = (overrides?: Partial<Transaction>): Transaction => ({
    id: 'txn-1',
    accountId: 'acc-1',
    dateISO: '2025-11-21',
    description: 'Test',
    categoryId: 'cat-1',
    amount: 100,
    type: 'debit',
    ...overrides,
  });

  const createCategory = (overrides?: Partial<Category>): Category => ({
    id: 'cat-1',
    name: 'Test Category',
    icon: '📦',
    color: '#000000',
    ...overrides,
  });

  describe('aggregateByCategory', () => {
    const categories = [
      createCategory({ id: 'cat-groceries', name: 'Groceries', parentId: 'cat-food' }),
      createCategory({ id: 'cat-food', name: 'Food' }),
      createCategory({ id: 'cat-transport', name: 'Transportation' }),
    ];

    it('should aggregate transactions by category', () => {
      const transactions = [
        createTransaction({ categoryId: 'cat-groceries', amount: 100 }),
        createTransaction({ categoryId: 'cat-groceries', amount: 150 }),
        createTransaction({ categoryId: 'cat-transport', amount: 50 }),
      ];

      const result = aggregateByCategory(transactions, categories);

      expect(result).toHaveLength(2);
      expect(result[0].categoryName).toBe('Groceries');
      expect(result[0].totalAmount).toBe(250);
      expect(result[0].transactionCount).toBe(2);
      expect(result[0].averageAmount).toBe(125);
    });

    it('should calculate percentages correctly', () => {
      const transactions = [
        createTransaction({ categoryId: 'cat-groceries', amount: 100 }),
        createTransaction({ categoryId: 'cat-transport', amount: 400 }),
      ];

      const result = aggregateByCategory(transactions, categories);

      expect(result[0].percentage).toBe(80); // Transport: 400/500
      expect(result[1].percentage).toBe(20); // Groceries: 100/500
    });

    it('should include parent category information', () => {
      const transactions = [
        createTransaction({ categoryId: 'cat-groceries', amount: 100 }),
      ];

      const result = aggregateByCategory(transactions, categories);

      expect(result[0].parentId).toBe('cat-food');
      expect(result[0].parentName).toBe('Food');
    });

    it('should filter by transaction type - debit only', () => {
      const transactions = [
        createTransaction({ categoryId: 'cat-groceries', amount: 100, type: 'debit' }),
        createTransaction({ categoryId: 'cat-transport', amount: 50, type: 'credit' }),
      ];

      const result = aggregateByCategory(transactions, categories, { type: 'debit' });

      expect(result).toHaveLength(1);
      expect(result[0].categoryName).toBe('Groceries');
    });

    it('should filter by transaction type - credit only', () => {
      const transactions = [
        createTransaction({ categoryId: 'cat-groceries', amount: 100, type: 'debit' }),
        createTransaction({ categoryId: 'cat-transport', amount: 5000, type: 'credit' }),
      ];

      const result = aggregateByCategory(transactions, categories, { type: 'credit' });

      expect(result).toHaveLength(1);
      expect(result[0].categoryName).toBe('Transportation');
    });

    it('should include uncategorized by default', () => {
      const transactions = [
        createTransaction({ categoryId: undefined, amount: 100 }),
      ];

      const result = aggregateByCategory(transactions, categories);

      expect(result).toHaveLength(1);
      expect(result[0].categoryId).toBe('uncategorized');
      expect(result[0].categoryName).toBe('Uncategorized');
    });

    it('should exclude uncategorized when specified', () => {
      const transactions = [
        createTransaction({ categoryId: undefined, amount: 100 }),
        createTransaction({ categoryId: 'cat-groceries', amount: 200 }),
      ];

      const result = aggregateByCategory(transactions, categories, {
        includeUncategorized: false,
      });

      expect(result).toHaveLength(1);
      expect(result[0].categoryName).toBe('Groceries');
    });

    it('should include icon and color from category', () => {
      const transactions = [
        createTransaction({ categoryId: 'cat-groceries', amount: 100 }),
      ];

      const result = aggregateByCategory(transactions, categories);

      expect(result[0].icon).toBeDefined();
      expect(result[0].color).toBeDefined();
    });

    it('should sort by total amount descending', () => {
      const transactions = [
        createTransaction({ categoryId: 'cat-groceries', amount: 100 }),
        createTransaction({ categoryId: 'cat-transport', amount: 500 }),
        createTransaction({ categoryId: 'cat-food', amount: 300 }),
      ];

      const result = aggregateByCategory(transactions, categories);

      expect(result[0].totalAmount).toBe(500);
      expect(result[1].totalAmount).toBe(300);
      expect(result[2].totalAmount).toBe(100);
    });

    it('should handle empty transactions', () => {
      const result = aggregateByCategory([], categories);

      expect(result).toHaveLength(0);
    });

    it('should handle missing category data', () => {
      const transactions = [
        createTransaction({ categoryId: 'cat-unknown', amount: 100 }),
      ];

      const result = aggregateByCategory(transactions, categories);

      expect(result[0].categoryName).toBe('Uncategorized');
    });
  });

  describe('buildCategoryTree', () => {
    const categories = [
      createCategory({ id: 'cat-food', name: 'Food' }),
      createCategory({ id: 'cat-groceries', name: 'Groceries', parentId: 'cat-food' }),
      createCategory({ id: 'cat-dining', name: 'Dining Out', parentId: 'cat-food' }),
      createCategory({ id: 'cat-transport', name: 'Transportation' }),
    ];

    it('should build hierarchical tree structure', () => {
      const aggregates = [
        { categoryId: 'cat-food', categoryName: 'Food', totalAmount: 500, transactionCount: 5, percentage: 50, averageAmount: 100 },
        { categoryId: 'cat-groceries', categoryName: 'Groceries', parentId: 'cat-food', parentName: 'Food', totalAmount: 300, transactionCount: 3, percentage: 30, averageAmount: 100 },
        { categoryId: 'cat-transport', categoryName: 'Transportation', totalAmount: 200, transactionCount: 2, percentage: 20, averageAmount: 100 },
      ];

      const tree = buildCategoryTree(aggregates, categories);

      expect(tree).toHaveLength(2); // Food and Transportation at root level
      expect(tree[0].children).toHaveLength(1); // Food has Groceries as child
    });

    it('should set correct levels', () => {
      const aggregates = [
        { categoryId: 'cat-food', categoryName: 'Food', totalAmount: 500, transactionCount: 5, percentage: 50, averageAmount: 100 },
        { categoryId: 'cat-groceries', categoryName: 'Groceries', parentId: 'cat-food', totalAmount: 300, transactionCount: 3, percentage: 30, averageAmount: 100 },
      ];

      const tree = buildCategoryTree(aggregates, categories);

      expect(tree[0].level).toBe(0);
      expect(tree[0].children[0].level).toBe(1);
    });

    it('should sort children by amount', () => {
      const aggregates = [
        { categoryId: 'cat-food', categoryName: 'Food', totalAmount: 1000, transactionCount: 10, percentage: 100, averageAmount: 100 },
        { categoryId: 'cat-groceries', categoryName: 'Groceries', parentId: 'cat-food', totalAmount: 600, transactionCount: 6, percentage: 60, averageAmount: 100 },
        { categoryId: 'cat-dining', categoryName: 'Dining Out', parentId: 'cat-food', totalAmount: 400, transactionCount: 4, percentage: 40, averageAmount: 100 },
      ];

      const tree = buildCategoryTree(aggregates, categories);

      expect(tree[0].children[0].categoryName).toBe('Groceries'); // Higher amount first
      expect(tree[0].children[1].categoryName).toBe('Dining Out');
    });

    it('should handle flat structure (no parents)', () => {
      const aggregates = [
        { categoryId: 'cat-transport', categoryName: 'Transportation', totalAmount: 200, transactionCount: 2, percentage: 100, averageAmount: 100 },
      ];

      const tree = buildCategoryTree(aggregates, categories);

      expect(tree).toHaveLength(1);
      expect(tree[0].children).toHaveLength(0);
    });

    it('should handle orphaned children (parent not in aggregates)', () => {
      const aggregates = [
        { categoryId: 'cat-groceries', categoryName: 'Groceries', parentId: 'cat-food', totalAmount: 300, transactionCount: 3, percentage: 100, averageAmount: 100 },
      ];

      const tree = buildCategoryTree(aggregates, categories);

      // Orphaned child becomes root
      expect(tree).toHaveLength(1);
      expect(tree[0].categoryId).toBe('cat-groceries');
    });

    it('should handle empty aggregates', () => {
      const tree = buildCategoryTree([], categories);

      expect(tree).toHaveLength(0);
    });
  });

  describe('getTopCategories', () => {
    it('should return top N categories by amount', () => {
      const aggregates = [
        { categoryId: 'cat-1', categoryName: 'Cat 1', totalAmount: 100, transactionCount: 1, percentage: 10, averageAmount: 100 },
        { categoryId: 'cat-2', categoryName: 'Cat 2', totalAmount: 500, transactionCount: 1, percentage: 50, averageAmount: 500 },
        { categoryId: 'cat-3', categoryName: 'Cat 3', totalAmount: 300, transactionCount: 1, percentage: 30, averageAmount: 300 },
        { categoryId: 'cat-4', categoryName: 'Cat 4', totalAmount: 200, transactionCount: 1, percentage: 20, averageAmount: 200 },
      ];

      const top3 = getTopCategories(aggregates, 3);

      expect(top3).toHaveLength(3);
      expect(top3[0].totalAmount).toBe(500);
      expect(top3[1].totalAmount).toBe(300);
      expect(top3[2].totalAmount).toBe(200);
    });

    it('should default to top 5', () => {
      const aggregates = Array.from({ length: 10 }, (_, i) => ({
        categoryId: `cat-${i}`,
        categoryName: `Category ${i}`,
        totalAmount: i * 100,
        transactionCount: 1,
        percentage: 10,
        averageAmount: i * 100,
      }));

      const top = getTopCategories(aggregates);

      expect(top).toHaveLength(5);
    });

    it('should handle fewer categories than limit', () => {
      const aggregates = [
        { categoryId: 'cat-1', categoryName: 'Cat 1', totalAmount: 100, transactionCount: 1, percentage: 100, averageAmount: 100 },
      ];

      const top5 = getTopCategories(aggregates, 5);

      expect(top5).toHaveLength(1);
    });

    it('should handle empty aggregates', () => {
      const top = getTopCategories([]);

      expect(top).toHaveLength(0);
    });
  });

  describe('groupByParentCategory', () => {
    const categories = [
      createCategory({ id: 'cat-food', name: 'Food' }),
      createCategory({ id: 'cat-groceries', name: 'Groceries', parentId: 'cat-food' }),
    ];

    it('should group categories by parent', () => {
      const aggregates = [
        { categoryId: 'cat-groceries', categoryName: 'Groceries', parentId: 'cat-food', totalAmount: 300, transactionCount: 3, percentage: 100, averageAmount: 100 },
        { categoryId: 'cat-dining', categoryName: 'Dining', parentId: 'cat-food', totalAmount: 200, transactionCount: 2, percentage: 100, averageAmount: 100 },
        { categoryId: 'cat-transport', categoryName: 'Transport', totalAmount: 500, transactionCount: 5, percentage: 100, averageAmount: 100 },
      ];

      const grouped = groupByParentCategory(aggregates, categories);

      expect(grouped.get('cat-food')).toHaveLength(2);
      expect(grouped.get('root')).toHaveLength(1);
    });

    it('should handle categories without parents', () => {
      const aggregates = [
        { categoryId: 'cat-transport', categoryName: 'Transport', totalAmount: 500, transactionCount: 5, percentage: 100, averageAmount: 100 },
      ];

      const grouped = groupByParentCategory(aggregates, categories);

      expect(grouped.get('root')).toHaveLength(1);
    });

    it('should handle empty aggregates', () => {
      const grouped = groupByParentCategory([], categories);

      expect(grouped.size).toBe(0);
    });
  });

  describe('calculateCategoryStats', () => {
    it('should calculate statistics', () => {
      const aggregates = [
        { categoryId: 'cat-1', categoryName: 'Cat 1', totalAmount: 100, transactionCount: 1, percentage: 10, averageAmount: 100 },
        { categoryId: 'cat-2', categoryName: 'Cat 2', totalAmount: 200, transactionCount: 1, percentage: 20, averageAmount: 200 },
        { categoryId: 'cat-3', categoryName: 'Cat 3', totalAmount: 300, transactionCount: 1, percentage: 30, averageAmount: 300 },
      ];

      const stats = calculateCategoryStats(aggregates);

      expect(stats.totalCategories).toBe(3);
      expect(stats.totalAmount).toBe(600);
      expect(stats.averagePerCategory).toBe(200);
      expect(stats.medianAmount).toBe(200);
      expect(stats.topCategory?.totalAmount).toBe(300);
      expect(stats.bottomCategory?.totalAmount).toBe(100);
    });

    it('should handle empty aggregates', () => {
      const stats = calculateCategoryStats([]);

      expect(stats.totalCategories).toBe(0);
      expect(stats.totalAmount).toBe(0);
      expect(stats.averagePerCategory).toBe(0);
      expect(stats.medianAmount).toBe(0);
      expect(stats.topCategory).toBeNull();
      expect(stats.bottomCategory).toBeNull();
    });

    it('should handle single category', () => {
      const aggregates = [
        { categoryId: 'cat-1', categoryName: 'Cat 1', totalAmount: 500, transactionCount: 5, percentage: 100, averageAmount: 100 },
      ];

      const stats = calculateCategoryStats(aggregates);

      expect(stats.totalCategories).toBe(1);
      expect(stats.medianAmount).toBe(500);
      expect(stats.topCategory).toEqual(stats.bottomCategory);
    });

    it('should handle even number of categories for median', () => {
      const aggregates = [
        { categoryId: 'cat-1', categoryName: 'Cat 1', totalAmount: 100, transactionCount: 1, percentage: 25, averageAmount: 100 },
        { categoryId: 'cat-2', categoryName: 'Cat 2', totalAmount: 200, transactionCount: 1, percentage: 25, averageAmount: 200 },
        { categoryId: 'cat-3', categoryName: 'Cat 3', totalAmount: 300, transactionCount: 1, percentage: 25, averageAmount: 300 },
        { categoryId: 'cat-4', categoryName: 'Cat 4', totalAmount: 400, transactionCount: 1, percentage: 25, averageAmount: 400 },
      ];

      const stats = calculateCategoryStats(aggregates);

      expect(stats.medianAmount).toBe(300); // Middle value after sorting
    });
  });

  describe('compareCategorySpending', () => {
    it('should compare category spending across periods', () => {
      const current = [
        { categoryId: 'cat-1', categoryName: 'Groceries', totalAmount: 600, transactionCount: 6, percentage: 60, averageAmount: 100 },
        { categoryId: 'cat-2', categoryName: 'Transport', totalAmount: 200, transactionCount: 2, percentage: 20, averageAmount: 100 },
      ];

      const previous = [
        { categoryId: 'cat-1', categoryName: 'Groceries', totalAmount: 500, transactionCount: 5, percentage: 50, averageAmount: 100 },
        { categoryId: 'cat-2', categoryName: 'Transport', totalAmount: 200, transactionCount: 2, percentage: 20, averageAmount: 100 },
      ];

      const comparison = compareCategorySpending(current, previous);

      expect(comparison).toHaveLength(2);
      expect(comparison[0].categoryId).toBe('cat-1'); // Largest absolute change
      expect(comparison[0].change).toBe(100);
      expect(comparison[0].changePercent).toBe(20);
    });

    it('should handle new categories in current period', () => {
      const current = [
        { categoryId: 'cat-new', categoryName: 'New Category', totalAmount: 300, transactionCount: 3, percentage: 100, averageAmount: 100 },
      ];

      const previous: typeof current = [];

      const comparison = compareCategorySpending(current, previous);

      expect(comparison[0].previousAmount).toBe(0);
      expect(comparison[0].change).toBe(300);
    });

    it('should sort by absolute change', () => {
      const current = [
        { categoryId: 'cat-1', categoryName: 'Cat 1', totalAmount: 600, transactionCount: 6, percentage: 60, averageAmount: 100 },
        { categoryId: 'cat-2', categoryName: 'Cat 2', totalAmount: 100, transactionCount: 1, percentage: 10, averageAmount: 100 },
      ];

      const previous = [
        { categoryId: 'cat-1', categoryName: 'Cat 1', totalAmount: 500, transactionCount: 5, percentage: 50, averageAmount: 100 },
        { categoryId: 'cat-2', categoryName: 'Cat 2', totalAmount: 400, transactionCount: 4, percentage: 40, averageAmount: 100 },
      ];

      const comparison = compareCategorySpending(current, previous);

      // cat-2 has larger absolute change (300) than cat-1 (100)
      expect(Math.abs(comparison[0].change)).toBeGreaterThanOrEqual(Math.abs(comparison[1].change));
    });

    it('should handle zero previous amount', () => {
      const current = [
        { categoryId: 'cat-1', categoryName: 'Cat 1', totalAmount: 500, transactionCount: 5, percentage: 100, averageAmount: 100 },
      ];

      const previous: typeof current = [];

      const comparison = compareCategorySpending(current, previous);

      expect(comparison[0].changePercent).toBe(0);
    });

    it('should calculate negative changes', () => {
      const current = [
        { categoryId: 'cat-1', categoryName: 'Cat 1', totalAmount: 300, transactionCount: 3, percentage: 100, averageAmount: 100 },
      ];

      const previous = [
        { categoryId: 'cat-1', categoryName: 'Cat 1', totalAmount: 500, transactionCount: 5, percentage: 100, averageAmount: 100 },
      ];

      const comparison = compareCategorySpending(current, previous);

      expect(comparison[0].change).toBe(-200);
      expect(comparison[0].changePercent).toBe(-40);
    });
  });
});
