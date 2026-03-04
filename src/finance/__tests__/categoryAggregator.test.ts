/**
 * Unit tests for categoryAggregator.ts
 *
 * Tests grouping, sorting, and comparison logic used on Budget/Dashboard pages.
 * A bug here would silently produce wrong category spending totals.
 */

import { describe, it, expect } from 'vitest';
import {
  aggregateByCategory,
  getTopCategories,
  calculateCategoryStats,
  compareCategorySpending,
} from '../utils/categoryAggregator';
import type { Transaction, Category } from '../types';

// ─── Fixtures ────────────────────────────────────────────────────────────────

const CAT_FOOD: Category     = { id: 'cat-food',  userId: 'u1', name: 'Food & Dining' };
const CAT_GROCERIES: Category = { id: 'cat-groc', userId: 'u1', name: 'Groceries' };
const CAT_TRAVEL: Category   = { id: 'cat-travel', userId: 'u1', name: 'Travel' };

const categories = [CAT_FOOD, CAT_GROCERIES, CAT_TRAVEL];

function makeTxn(overrides: Partial<Transaction>): Transaction {
  return {
    id: `txn-${Math.random()}`,
    userId: 'u1',
    accountId: 'acc-1',
    amount: 100,
    type: 'debit',
    description: 'Test',
    dateISO: '2026-03-01',
    categoryId: CAT_FOOD.id,
    transferId: null,
    ...overrides,
  };
}

// ─── aggregateByCategory ─────────────────────────────────────────────────────

describe('aggregateByCategory', () => {
  it('groups transactions by category and sums amounts', () => {
    const txns = [
      makeTxn({ categoryId: CAT_FOOD.id, amount: 50 }),
      makeTxn({ categoryId: CAT_FOOD.id, amount: 30 }),
      makeTxn({ categoryId: CAT_GROCERIES.id, amount: 120 }),
    ];
    const result = aggregateByCategory(txns, categories);
    const food = result.find(r => r.categoryId === CAT_FOOD.id);
    const groc = result.find(r => r.categoryId === CAT_GROCERIES.id);
    expect(food?.totalAmount).toBe(80);
    expect(groc?.totalAmount).toBe(120);
  });

  it('sorts results by totalAmount descending', () => {
    const txns = [
      makeTxn({ categoryId: CAT_FOOD.id, amount: 10 }),
      makeTxn({ categoryId: CAT_GROCERIES.id, amount: 200 }),
      makeTxn({ categoryId: CAT_TRAVEL.id, amount: 50 }),
    ];
    const result = aggregateByCategory(txns, categories);
    expect(result[0].categoryId).toBe(CAT_GROCERIES.id);
    expect(result[result.length - 1].categoryId).toBe(CAT_FOOD.id);
  });

  it('filters to debit-only when type="debit"', () => {
    const txns = [
      makeTxn({ type: 'debit',  categoryId: CAT_FOOD.id,     amount: 100 }),
      makeTxn({ type: 'credit', categoryId: CAT_GROCERIES.id, amount: 500 }),
    ];
    const result = aggregateByCategory(txns, categories, { type: 'debit' });
    expect(result.length).toBe(1);
    expect(result[0].categoryId).toBe(CAT_FOOD.id);
  });

  it('filters to credit-only when type="credit"', () => {
    const txns = [
      makeTxn({ type: 'debit',  categoryId: CAT_FOOD.id,     amount: 100 }),
      makeTxn({ type: 'credit', categoryId: CAT_GROCERIES.id, amount: 500 }),
    ];
    const result = aggregateByCategory(txns, categories, { type: 'credit' });
    expect(result.length).toBe(1);
    expect(result[0].categoryId).toBe(CAT_GROCERIES.id);
  });

  it('groups null categoryId as "Uncategorized"', () => {
    const txns = [makeTxn({ categoryId: null })];
    const result = aggregateByCategory(txns, categories);
    const uncategorized = result.find(r => r.categoryName === 'Uncategorized');
    expect(uncategorized).toBeDefined();
  });

  it('excludes uncategorized when includeUncategorized=false', () => {
    const txns = [
      makeTxn({ categoryId: null }),
      makeTxn({ categoryId: CAT_FOOD.id }),
    ];
    const result = aggregateByCategory(txns, categories, { includeUncategorized: false });
    expect(result.every(r => r.categoryName !== 'Uncategorized')).toBe(true);
  });

  it('computes correct percentage', () => {
    const txns = [
      makeTxn({ categoryId: CAT_FOOD.id,     amount: 25 }),
      makeTxn({ categoryId: CAT_GROCERIES.id, amount: 75 }),
    ];
    const result = aggregateByCategory(txns, categories);
    const food = result.find(r => r.categoryId === CAT_FOOD.id)!;
    const groc = result.find(r => r.categoryId === CAT_GROCERIES.id)!;
    expect(food.percentage).toBeCloseTo(25);
    expect(groc.percentage).toBeCloseTo(75);
  });

  it('computes correct averageAmount', () => {
    const txns = [
      makeTxn({ categoryId: CAT_FOOD.id, amount: 60 }),
      makeTxn({ categoryId: CAT_FOOD.id, amount: 40 }),
    ];
    const result = aggregateByCategory(txns, categories);
    const food = result.find(r => r.categoryId === CAT_FOOD.id)!;
    expect(food.averageAmount).toBeCloseTo(50);
    expect(food.transactionCount).toBe(2);
  });
});

// ─── getTopCategories ────────────────────────────────────────────────────────

describe('getTopCategories', () => {
  it('returns exactly limit items', () => {
    const aggregates = [
      { categoryId: 'a', categoryName: 'A', totalAmount: 300, transactionCount: 1, percentage: 60, averageAmount: 300 },
      { categoryId: 'b', categoryName: 'B', totalAmount: 200, transactionCount: 1, percentage: 40, averageAmount: 200 },
      { categoryId: 'c', categoryName: 'C', totalAmount: 100, transactionCount: 1, percentage: 20, averageAmount: 100 },
    ];
    expect(getTopCategories(aggregates, 2)).toHaveLength(2);
  });

  it('returns all items when limit > length', () => {
    const aggregates = [
      { categoryId: 'a', categoryName: 'A', totalAmount: 100, transactionCount: 1, percentage: 100, averageAmount: 100 },
    ];
    expect(getTopCategories(aggregates, 5)).toHaveLength(1);
  });

  it('returns highest-amount items first', () => {
    const aggregates = [
      { categoryId: 'low', categoryName: 'Low', totalAmount: 50, transactionCount: 1, percentage: 10, averageAmount: 50 },
      { categoryId: 'high', categoryName: 'High', totalAmount: 500, transactionCount: 1, percentage: 90, averageAmount: 500 },
    ];
    const top = getTopCategories(aggregates, 1);
    expect(top[0].categoryId).toBe('high');
  });
});

// ─── calculateCategoryStats ──────────────────────────────────────────────────

describe('calculateCategoryStats', () => {
  it('returns zeros for empty array', () => {
    const stats = calculateCategoryStats([]);
    expect(stats).toMatchObject({
      totalCategories: 0,
      totalAmount: 0,
      averagePerCategory: 0,
      medianAmount: 0,
      topCategory: null,
      bottomCategory: null,
    });
  });

  it('computes correct totalAmount and averagePerCategory', () => {
    const aggregates = [
      { categoryId: 'a', categoryName: 'A', totalAmount: 300, transactionCount: 3, percentage: 60, averageAmount: 100 },
      { categoryId: 'b', categoryName: 'B', totalAmount: 200, transactionCount: 2, percentage: 40, averageAmount: 100 },
    ];
    const stats = calculateCategoryStats(aggregates);
    expect(stats.totalAmount).toBe(500);
    expect(stats.averagePerCategory).toBeCloseTo(250);
    expect(stats.totalCategories).toBe(2);
  });

  it('identifies topCategory and bottomCategory correctly', () => {
    const aggregates = [
      { categoryId: 'low', categoryName: 'Low',  totalAmount: 50,  transactionCount: 1, percentage: 10, averageAmount: 50 },
      { categoryId: 'mid', categoryName: 'Mid',  totalAmount: 200, transactionCount: 1, percentage: 40, averageAmount: 200 },
      { categoryId: 'high', categoryName: 'High', totalAmount: 500, transactionCount: 1, percentage: 50, averageAmount: 500 },
    ];
    const stats = calculateCategoryStats(aggregates);
    expect(stats.topCategory?.categoryId).toBe('high');
    expect(stats.bottomCategory?.categoryId).toBe('low');
  });
});

// ─── compareCategorySpending ─────────────────────────────────────────────────

describe('compareCategorySpending', () => {
  const makeAgg = (id: string, name: string, amount: number) => ({
    categoryId: id,
    categoryName: name,
    totalAmount: amount,
    transactionCount: 1,
    percentage: 0,
    averageAmount: amount,
  });

  it('matches categories by ID and computes change', () => {
    const current  = [makeAgg('food', 'Food', 150)];
    const previous = [makeAgg('food', 'Food', 100)];
    const result = compareCategorySpending(current, previous);
    expect(result[0].change).toBeCloseTo(50);
    expect(result[0].changePercent).toBeCloseTo(50);
  });

  it('shows previous=0 and changePercent=0 for new categories', () => {
    const current  = [makeAgg('new-cat', 'New', 200)];
    const previous: typeof current = [];
    const result = compareCategorySpending(current, previous);
    expect(result[0].previousAmount).toBe(0);
    expect(result[0].changePercent).toBe(0);
  });

  it('returns negative change when spending decreases', () => {
    const current  = [makeAgg('food', 'Food', 80)];
    const previous = [makeAgg('food', 'Food', 100)];
    const result = compareCategorySpending(current, previous);
    expect(result[0].change).toBeCloseTo(-20);
    expect(result[0].changePercent).toBeCloseTo(-20);
  });

  it('sorts results by absolute change descending', () => {
    const current = [
      makeAgg('small', 'Small', 110),  // change = +10
      makeAgg('big',   'Big',   300),  // change = +200
    ];
    const previous = [
      makeAgg('small', 'Small', 100),
      makeAgg('big',   'Big',   100),
    ];
    const result = compareCategorySpending(current, previous);
    expect(result[0].categoryId).toBe('big');
  });
});
