import { describe, it, expect } from 'vitest';
import {
  calculateCashFlow,
  calculateCashFlowByCategory,
  calculateCashFlowTrend,
  prepareSankeyData,
} from '../cashFlowCalculator';
import type { Transaction } from '../../types';

describe('cashFlowCalculator', () => {
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

  describe('calculateCashFlow', () => {
    it('should calculate cash flow with income and expenses', () => {
      const transactions = [
        createTransaction({ id: '1', type: 'credit', amount: 5000 }),
        createTransaction({ id: '2', type: 'debit', amount: 1000 }),
        createTransaction({ id: '3', type: 'debit', amount: 500 }),
      ];

      const result = calculateCashFlow(transactions);

      expect(result.totalIncome).toBe(5000);
      expect(result.totalExpenses).toBe(1500);
      expect(result.netCashFlow).toBe(3500);
      expect(result.incomeTransactions).toHaveLength(1);
      expect(result.expenseTransactions).toHaveLength(2);
    });

    it('should handle empty transactions', () => {
      const result = calculateCashFlow([]);

      expect(result.totalIncome).toBe(0);
      expect(result.totalExpenses).toBe(0);
      expect(result.netCashFlow).toBe(0);
      expect(result.incomeTransactions).toHaveLength(0);
      expect(result.expenseTransactions).toHaveLength(0);
    });

    it('should handle only income transactions', () => {
      const transactions = [
        createTransaction({ type: 'credit', amount: 5000 }),
        createTransaction({ type: 'credit', amount: 2000 }),
      ];

      const result = calculateCashFlow(transactions);

      expect(result.totalIncome).toBe(7000);
      expect(result.totalExpenses).toBe(0);
      expect(result.netCashFlow).toBe(7000);
    });

    it('should handle only expense transactions', () => {
      const transactions = [
        createTransaction({ type: 'debit', amount: 1000 }),
        createTransaction({ type: 'debit', amount: 500 }),
      ];

      const result = calculateCashFlow(transactions);

      expect(result.totalIncome).toBe(0);
      expect(result.totalExpenses).toBe(1500);
      expect(result.netCashFlow).toBe(-1500);
    });

    it('should handle negative cash flow', () => {
      const transactions = [
        createTransaction({ type: 'credit', amount: 1000 }),
        createTransaction({ type: 'debit', amount: 2000 }),
      ];

      const result = calculateCashFlow(transactions);

      expect(result.netCashFlow).toBe(-1000);
    });

    it('should handle zero amounts', () => {
      const transactions = [
        createTransaction({ type: 'credit', amount: 0 }),
        createTransaction({ type: 'debit', amount: 0 }),
      ];

      const result = calculateCashFlow(transactions);

      expect(result.totalIncome).toBe(0);
      expect(result.totalExpenses).toBe(0);
      expect(result.netCashFlow).toBe(0);
    });
  });

  describe('calculateCashFlowByCategory', () => {
    const categories = [
      { id: 'cat-1', name: 'Groceries' },
      { id: 'cat-2', name: 'Salary' },
      { id: 'cat-3', name: 'Transportation' },
    ];

    it('should aggregate transactions by category', () => {
      const transactions = [
        createTransaction({ categoryId: 'cat-1', amount: 100, type: 'debit' }),
        createTransaction({ categoryId: 'cat-1', amount: 50, type: 'debit' }),
        createTransaction({ categoryId: 'cat-3', amount: 75, type: 'debit' }),
      ];

      const result = calculateCashFlowByCategory(transactions, categories);

      expect(result).toHaveLength(2);
      expect(result[0].categoryName).toBe('Groceries');
      expect(result[0].amount).toBe(150);
      expect(result[0].transactionCount).toBe(2);
      expect(result[1].categoryName).toBe('Transportation');
      expect(result[1].amount).toBe(75);
    });

    it('should calculate percentages correctly', () => {
      const transactions = [
        createTransaction({ categoryId: 'cat-1', amount: 100, type: 'debit' }),
        createTransaction({ categoryId: 'cat-3', amount: 400, type: 'debit' }),
      ];

      const result = calculateCashFlowByCategory(transactions, categories);

      expect(result[0].percentage).toBe(80); // 400/500
      expect(result[1].percentage).toBe(20); // 100/500
    });

    it('should filter by transaction type', () => {
      const transactions = [
        createTransaction({ categoryId: 'cat-1', amount: 100, type: 'debit' }),
        createTransaction({ categoryId: 'cat-2', amount: 5000, type: 'credit' }),
      ];

      const debitResult = calculateCashFlowByCategory(transactions, categories, 'debit');
      const creditResult = calculateCashFlowByCategory(transactions, categories, 'credit');

      expect(debitResult).toHaveLength(1);
      expect(debitResult[0].categoryName).toBe('Groceries');
      expect(creditResult).toHaveLength(1);
      expect(creditResult[0].categoryName).toBe('Salary');
    });

    it('should handle uncategorized transactions', () => {
      const transactions = [
        createTransaction({ categoryId: undefined, amount: 100, type: 'debit' }),
      ];

      const result = calculateCashFlowByCategory(transactions, categories);

      expect(result[0].categoryId).toBe('uncategorized');
      expect(result[0].categoryName).toBe('Uncategorized');
    });

    it('should sort by amount descending', () => {
      const transactions = [
        createTransaction({ categoryId: 'cat-1', amount: 100, type: 'debit' }),
        createTransaction({ categoryId: 'cat-3', amount: 500, type: 'debit' }),
        createTransaction({ categoryId: 'cat-2', amount: 300, type: 'debit' }),
      ];

      const result = calculateCashFlowByCategory(transactions, categories);

      expect(result[0].amount).toBe(500);
      expect(result[1].amount).toBe(300);
      expect(result[2].amount).toBe(100);
    });

    it('should handle empty transactions', () => {
      const result = calculateCashFlowByCategory([], categories);

      expect(result).toHaveLength(0);
    });

    it('should handle zero percentage when total is zero', () => {
      const transactions = [
        createTransaction({ amount: 0, type: 'debit' }),
      ];

      const result = calculateCashFlowByCategory(transactions, categories);

      expect(result[0].percentage).toBe(0);
    });
  });

  describe('calculateCashFlowTrend', () => {
    it('should calculate month-over-month trend', () => {
      const currentTxns = [
        createTransaction({ type: 'credit', amount: 6000 }),
        createTransaction({ type: 'debit', amount: 4000 }),
      ];

      const previousTxns = [
        createTransaction({ type: 'credit', amount: 5000 }),
        createTransaction({ type: 'debit', amount: 3000 }),
      ];

      const result = calculateCashFlowTrend(currentTxns, previousTxns);

      expect(result.currentIncome).toBe(6000);
      expect(result.previousIncome).toBe(5000);
      expect(result.incomeChange).toBe(1000);
      expect(result.incomeChangePercent).toBe(20);

      expect(result.currentExpenses).toBe(4000);
      expect(result.previousExpenses).toBe(3000);
      expect(result.expensesChange).toBe(1000);
      expect(result.expensesChangePercent).toBeCloseTo(33.33, 1);

      expect(result.currentNet).toBe(2000);
      expect(result.previousNet).toBe(2000);
      expect(result.netChange).toBe(0);
    });

    it('should handle zero previous income', () => {
      const currentTxns = [
        createTransaction({ type: 'credit', amount: 5000 }),
      ];

      const previousTxns: Transaction[] = [];

      const result = calculateCashFlowTrend(currentTxns, previousTxns);

      expect(result.incomeChangePercent).toBe(0);
    });

    it('should handle negative trend', () => {
      const currentTxns = [
        createTransaction({ type: 'credit', amount: 4000 }),
      ];

      const previousTxns = [
        createTransaction({ type: 'credit', amount: 5000 }),
      ];

      const result = calculateCashFlowTrend(currentTxns, previousTxns);

      expect(result.incomeChange).toBe(-1000);
      expect(result.incomeChangePercent).toBe(-20);
    });

    it('should handle zero net change with negative values', () => {
      const currentTxns = [
        createTransaction({ type: 'credit', amount: 3000 }),
        createTransaction({ type: 'debit', amount: 4000 }),
      ];

      const previousTxns = [
        createTransaction({ type: 'credit', amount: 2000 }),
        createTransaction({ type: 'debit', amount: 3000 }),
      ];

      const result = calculateCashFlowTrend(currentTxns, previousTxns);

      expect(result.currentNet).toBe(-1000);
      expect(result.previousNet).toBe(-1000);
      expect(result.netChange).toBe(0);
      expect(result.netChangePercent).toBe(0);
    });

    it('should handle empty current period', () => {
      const previousTxns = [
        createTransaction({ type: 'credit', amount: 5000 }),
      ];

      const result = calculateCashFlowTrend([], previousTxns);

      expect(result.currentIncome).toBe(0);
      expect(result.incomeChange).toBe(-5000);
      expect(result.incomeChangePercent).toBe(-100);
    });
  });

  describe('prepareSankeyData', () => {
    const categories = [
      { id: 'cat-salary', name: 'Salary' },
      { id: 'cat-groceries', name: 'Groceries' },
      { id: 'cat-rent', name: 'Rent' },
    ];

    it('should prepare Sankey diagram data', () => {
      const transactions = [
        createTransaction({ categoryId: 'cat-salary', amount: 5000, type: 'credit' }),
        createTransaction({ categoryId: 'cat-groceries', amount: 500, type: 'debit' }),
        createTransaction({ categoryId: 'cat-rent', amount: 1500, type: 'debit' }),
      ];

      const result = prepareSankeyData(transactions, categories);

      // Should have: Salary -> Total Income, Total Income -> Groceries, Total Income -> Rent, Total Income -> Savings
      expect(result.length).toBeGreaterThan(0);

      const salaryNode = result.find(n => n.source === 'Salary');
      expect(salaryNode?.target).toBe('Total Income');
      expect(salaryNode?.value).toBe(5000);

      const savingsNode = result.find(n => n.target === 'Savings');
      expect(savingsNode?.source).toBe('Total Income');
      expect(savingsNode?.value).toBe(3000); // 5000 - 500 - 1500
    });

    it('should handle multiple income sources', () => {
      const transactions = [
        createTransaction({ id: '1', categoryId: 'cat-salary', amount: 5000, type: 'credit' }),
        createTransaction({ id: '2', categoryId: 'cat-bonus', amount: 2000, type: 'credit' }),
      ];

      const cats = [
        { id: 'cat-salary', name: 'Salary' },
        { id: 'cat-bonus', name: 'Bonus' },
      ];

      const result = prepareSankeyData(transactions, cats);

      const incomeNodes = result.filter(n => n.target === 'Total Income');
      expect(incomeNodes).toHaveLength(2);
    });

    it('should handle zero savings (expenses equal income)', () => {
      const transactions = [
        createTransaction({ id: '1', categoryId: 'cat-salary', amount: 5000, type: 'credit' }),
        createTransaction({ id: '2', categoryId: 'cat-rent', amount: 5000, type: 'debit' }),
      ];

      const result = prepareSankeyData(transactions, categories);

      const savingsNode = result.find(n => n.target === 'Savings');
      expect(savingsNode).toBeUndefined(); // No savings when zero
    });

    it('should handle negative savings (expenses exceed income)', () => {
      const transactions = [
        createTransaction({ id: '1', categoryId: 'cat-salary', amount: 3000, type: 'credit' }),
        createTransaction({ id: '2', categoryId: 'cat-rent', amount: 4000, type: 'debit' }),
      ];

      const result = prepareSankeyData(transactions, categories);

      const savingsNode = result.find(n => n.target === 'Savings');
      expect(savingsNode).toBeUndefined(); // No savings node when negative
    });

    it('should exclude zero-value flows', () => {
      const transactions = [
        createTransaction({ categoryId: 'cat-salary', amount: 5000, type: 'credit' }),
        createTransaction({ categoryId: 'cat-groceries', amount: 0, type: 'debit' }),
      ];

      const result = prepareSankeyData(transactions, categories);

      const groceriesNode = result.find(n => n.target === 'Groceries');
      expect(groceriesNode).toBeUndefined();
    });

    it('should handle empty transactions', () => {
      const result = prepareSankeyData([], categories);

      expect(result).toHaveLength(0);
    });
  });
});
