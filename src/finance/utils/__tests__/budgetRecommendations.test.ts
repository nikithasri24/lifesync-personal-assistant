import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  calculateBudgetRecommendation,
  formatRecommendationMessage,
  getConfidenceColor,
} from '../budgetRecommendations';
import type { Transaction } from '../../types';

// Mock the logger
vi.mock('../../../services/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('budgetRecommendations', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-11-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const createTransaction = (overrides?: Partial<Transaction>): Transaction => ({
    id: 'txn-1',
    accountId: 'acc-1',
    dateISO: '2025-11-01T12:00:00Z',
    description: 'Test',
    categoryId: 'cat-groceries',
    amount: 100,
    type: 'debit',
    ...overrides,
  });

  describe('calculateBudgetRecommendation', () => {
    it('should calculate recommendation with consistent spending', () => {
      const transactions = [
        createTransaction({ dateISO: '2025-09-15', amount: 500 }),
        createTransaction({ id: '2', dateISO: '2025-10-15', amount: 480 }),
        createTransaction({ id: '3', dateISO: '2025-11-10', amount: 520 }),
      ];

      const result = calculateBudgetRecommendation(transactions, 'cat-groceries', 3);

      expect(result).toBeTruthy();
      expect(result!.average).toBe(500);
      expect(result!.suggested).toBe(550); // 500 * 1.1
      expect(result!.min).toBe(480);
      expect(result!.max).toBe(520);
      expect(result!.monthsAnalyzed).toBe(3);
      expect(result!.confidence).toBe('high');
    });

    it('should return null when no transactions for category', () => {
      const transactions = [
        createTransaction({ categoryId: 'cat-other', amount: 100 }),
      ];

      const result = calculateBudgetRecommendation(transactions, 'cat-groceries', 3);

      expect(result).toBeNull();
    });

    it('should filter out credit transactions', () => {
      const transactions = [
        createTransaction({ dateISO: '2025-10-15', amount: 500, type: 'debit' }),
        createTransaction({ id: '2', dateISO: '2025-10-20', amount: 1000, type: 'credit' }),
      ];

      const result = calculateBudgetRecommendation(transactions, 'cat-groceries', 3);

      expect(result!.average).toBe(500);
      expect(result!.monthsAnalyzed).toBe(1);
    });

    it('should only analyze specified number of months', () => {
      const transactions = [
        createTransaction({ dateISO: '2025-06-15', amount: 100 }), // 5 months ago - excluded
        createTransaction({ id: '2', dateISO: '2025-10-15', amount: 500 }),
        createTransaction({ id: '3', dateISO: '2025-11-10', amount: 500 }),
      ];

      const result = calculateBudgetRecommendation(transactions, 'cat-groceries', 2);

      expect(result!.monthsAnalyzed).toBe(2);
    });

    it('should return null when no spending in analyzed period', () => {
      const transactions = [
        createTransaction({ dateISO: '2024-01-15', amount: 500 }), // Too old
      ];

      const result = calculateBudgetRecommendation(transactions, 'cat-groceries', 3);

      expect(result).toBeNull();
    });

    it('should calculate medium confidence for moderate variation', () => {
      const transactions = [
        createTransaction({ dateISO: '2025-09-15', amount: 300 }),
        createTransaction({ id: '2', dateISO: '2025-10-15', amount: 500 }),
        createTransaction({ id: '3', dateISO: '2025-11-10', amount: 400 }),
      ];

      const result = calculateBudgetRecommendation(transactions, 'cat-groceries', 3);

      expect(result!.confidence).toBe('medium');
    });

    it('should calculate low confidence for high variation', () => {
      const transactions = [
        createTransaction({ dateISO: '2025-09-15', amount: 100 }),
        createTransaction({ id: '2', dateISO: '2025-10-15', amount: 1000 }),
        createTransaction({ id: '3', dateISO: '2025-11-10', amount: 200 }),
      ];

      const result = calculateBudgetRecommendation(transactions, 'cat-groceries', 3);

      expect(result!.confidence).toBe('low');
    });

    it('should calculate low confidence with limited data', () => {
      const transactions = [
        createTransaction({ dateISO: '2025-11-10', amount: 500 }),
      ];

      const result = calculateBudgetRecommendation(transactions, 'cat-groceries', 3);

      expect(result!.confidence).toBe('low');
      expect(result!.monthsAnalyzed).toBe(1);
    });

    it('should handle multiple transactions in same month', () => {
      const transactions = [
        createTransaction({ dateISO: '2025-11-05', amount: 200 }),
        createTransaction({ id: '2', dateISO: '2025-11-10', amount: 300 }),
        createTransaction({ id: '3', dateISO: '2025-11-20', amount: 100 }),
      ];

      const result = calculateBudgetRecommendation(transactions, 'cat-groceries', 3);

      expect(result!.average).toBe(600); // All summed for November
      expect(result!.monthsAnalyzed).toBe(1);
    });

    it('should skip months with zero spending', () => {
      const transactions = [
        createTransaction({ dateISO: '2025-09-15', amount: 500 }),
        // No transactions in October
        createTransaction({ id: '3', dateISO: '2025-11-10', amount: 500 }),
      ];

      const result = calculateBudgetRecommendation(transactions, 'cat-groceries', 3);

      expect(result!.monthsAnalyzed).toBe(2); // Only counts months with spending
    });

    it('should round suggested amount up', () => {
      const transactions = [
        createTransaction({ dateISO: '2025-10-15', amount: 333 }),
      ];

      const result = calculateBudgetRecommendation(transactions, 'cat-groceries', 3);

      expect(result!.suggested).toBe(367); // Math.ceil(333 * 1.1)
    });

    it('should use default of 3 months when not specified', () => {
      const transactions = [
        createTransaction({ dateISO: '2025-09-15', amount: 100 }),
        createTransaction({ id: '2', dateISO: '2025-10-15', amount: 100 }),
        createTransaction({ id: '3', dateISO: '2025-11-10', amount: 100 }),
        createTransaction({ id: '4', dateISO: '2025-08-15', amount: 100 }), // 4th month - excluded
      ];

      const result = calculateBudgetRecommendation(transactions, 'cat-groceries');

      expect(result!.monthsAnalyzed).toBe(3);
    });
  });

  describe('formatRecommendationMessage', () => {
    it('should format high confidence message', () => {
      const rec = {
        suggested: 550,
        average: 500,
        min: 480,
        max: 520,
        monthsAnalyzed: 3,
        confidence: 'high' as const,
      };

      const message = formatRecommendationMessage(rec);

      expect(message).toContain('3 months');
      expect(message).toContain('consistent');
      expect(message).toContain('$550');
      expect(message).toContain('$500');
    });

    it('should format medium confidence message', () => {
      const rec = {
        suggested: 550,
        average: 500,
        min: 300,
        max: 700,
        monthsAnalyzed: 3,
        confidence: 'medium' as const,
      };

      const message = formatRecommendationMessage(rec);

      expect(message).toContain('3 months');
      expect(message).toContain('suggest');
      expect(message).toContain('$550');
    });

    it('should format low confidence message with single month', () => {
      const rec = {
        suggested: 550,
        average: 500,
        min: 500,
        max: 500,
        monthsAnalyzed: 1,
        confidence: 'low' as const,
      };

      const message = formatRecommendationMessage(rec);

      expect(message).toContain('Limited data');
      expect(message).toContain('1 month');
      expect(message).not.toContain('months'); // Should be singular
    });

    it('should format low confidence message with multiple months', () => {
      const rec = {
        suggested: 650,
        average: 600,
        min: 100,
        max: 1000,
        monthsAnalyzed: 2,
        confidence: 'low' as const,
      };

      const message = formatRecommendationMessage(rec);

      expect(message).toContain('2 months');
    });

    it('should round amounts in message', () => {
      const rec = {
        suggested: 555.67,
        average: 505.34,
        min: 500,
        max: 600,
        monthsAnalyzed: 3,
        confidence: 'high' as const,
      };

      const message = formatRecommendationMessage(rec);

      expect(message).toContain('$556'); // Rounded suggested
      expect(message).toContain('$505'); // Rounded average
    });
  });

  describe('getConfidenceColor', () => {
    it('should return emerald for high confidence', () => {
      expect(getConfidenceColor('high')).toBe('emerald');
    });

    it('should return blue for medium confidence', () => {
      expect(getConfidenceColor('medium')).toBe('blue');
    });

    it('should return amber for low confidence', () => {
      expect(getConfidenceColor('low')).toBe('amber');
    });
  });
});
