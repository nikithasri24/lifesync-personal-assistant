/**
 * Unit tests for savingsRate.ts
 *
 * Tests the core savings rate calculations used on the Finance Dashboard.
 * A bug here would silently show wrong savings percentages to users.
 */

import { describe, it, expect } from 'vitest';
import {
  calculateSavingsRate,
  calculateSavingsRateDetailed,
  formatSavingsRate,
  getSavingsRateStatus,
  calculateTargetSavings,
  calculateMaxExpensesForTarget,
} from '../utils/savingsRate';

// ─── calculateSavingsRate ────────────────────────────────────────────────────

describe('calculateSavingsRate', () => {
  it('returns correct percentage when expenses < income', () => {
    expect(calculateSavingsRate(10000, 7500)).toBeCloseTo(25);
  });

  it('returns 0 when income is 0', () => {
    expect(calculateSavingsRate(0, 500)).toBe(0);
  });

  it('returns 0 when income equals expenses', () => {
    expect(calculateSavingsRate(5000, 5000)).toBe(0);
  });

  it('returns negative rate when expenses exceed income', () => {
    expect(calculateSavingsRate(1000, 1200)).toBeCloseTo(-20);
  });

  it('returns 100 when expenses are 0', () => {
    expect(calculateSavingsRate(5000, 0)).toBe(100);
  });

  it('handles decimal income and expenses', () => {
    // (3000 - 2250) / 3000 * 100 = 25
    expect(calculateSavingsRate(3000, 2250)).toBeCloseTo(25);
  });
});

// ─── calculateSavingsRateDetailed ────────────────────────────────────────────

describe('calculateSavingsRateDetailed', () => {
  it('returns correct shape with all fields', () => {
    const result = calculateSavingsRateDetailed(10000, 7000);
    expect(result).toMatchObject({
      savingsRate: expect.any(Number),
      savings: 3000,
      income: 10000,
      expenses: 7000,
      isPositive: true,
    });
  });

  it('sets isPositive to false when spending exceeds income', () => {
    const result = calculateSavingsRateDetailed(1000, 1500);
    expect(result.isPositive).toBe(false);
    expect(result.savings).toBe(-500);
  });

  it('sets isPositive to true when savings are exactly 0', () => {
    const result = calculateSavingsRateDetailed(5000, 5000);
    expect(result.isPositive).toBe(true);
    expect(result.savings).toBe(0);
  });

  it('savingsRate inside the result matches standalone calculateSavingsRate', () => {
    const income = 8000;
    const expenses = 5600;
    const detailed = calculateSavingsRateDetailed(income, expenses);
    expect(detailed.savingsRate).toBeCloseTo(calculateSavingsRate(income, expenses));
  });
});

// ─── formatSavingsRate ───────────────────────────────────────────────────────

describe('formatSavingsRate', () => {
  it('formats a positive rate with one decimal and % sign', () => {
    expect(formatSavingsRate(25)).toBe('25.0%');
  });

  it('formats zero as 0.0%', () => {
    expect(formatSavingsRate(0)).toBe('0.0%');
  });

  it('formats a negative rate with leading minus', () => {
    expect(formatSavingsRate(-5.2)).toBe('-5.2%');
  });

  it('rounds to one decimal place', () => {
    expect(formatSavingsRate(11.456)).toBe('11.5%');
    expect(formatSavingsRate(11.444)).toBe('11.4%');
  });
});

// ─── getSavingsRateStatus ────────────────────────────────────────────────────

describe('getSavingsRateStatus', () => {
  it('returns Excellent for rate >= 20', () => {
    expect(getSavingsRateStatus(20).label).toBe('Excellent');
    expect(getSavingsRateStatus(50).label).toBe('Excellent');
  });

  it('returns Good for rate in [10, 20)', () => {
    expect(getSavingsRateStatus(10).label).toBe('Good');
    expect(getSavingsRateStatus(15).label).toBe('Good');
    expect(getSavingsRateStatus(19.9).label).toBe('Good');
  });

  it('returns Fair for rate in [5, 10)', () => {
    expect(getSavingsRateStatus(5).label).toBe('Fair');
    expect(getSavingsRateStatus(7.5).label).toBe('Fair');
    expect(getSavingsRateStatus(9.9).label).toBe('Fair');
  });

  it('returns Low for rate in [0, 5)', () => {
    expect(getSavingsRateStatus(0).label).toBe('Low');
    expect(getSavingsRateStatus(3).label).toBe('Low');
    expect(getSavingsRateStatus(4.9).label).toBe('Low');
  });

  it('returns Deficit for rate < 0', () => {
    expect(getSavingsRateStatus(-1).label).toBe('Deficit');
    expect(getSavingsRateStatus(-100).label).toBe('Deficit');
  });

  it('returns colorClass and iconClass on each status', () => {
    for (const rate of [-5, 2, 7, 15, 30]) {
      const { colorClass, iconClass } = getSavingsRateStatus(rate);
      expect(colorClass).toBeTruthy();
      expect(iconClass).toBeTruthy();
    }
  });
});

// ─── calculateTargetSavings ──────────────────────────────────────────────────

describe('calculateTargetSavings', () => {
  it('returns correct amount for 20% target', () => {
    expect(calculateTargetSavings(10000, 20)).toBeCloseTo(2000);
  });

  it('returns 0 when target rate is 0', () => {
    expect(calculateTargetSavings(5000, 0)).toBe(0);
  });

  it('returns full income when target rate is 100', () => {
    expect(calculateTargetSavings(5000, 100)).toBeCloseTo(5000);
  });

  it('handles non-integer target rates', () => {
    // 7.5% of 8000 = 600
    expect(calculateTargetSavings(8000, 7.5)).toBeCloseTo(600);
  });
});

// ─── calculateMaxExpensesForTarget ───────────────────────────────────────────

describe('calculateMaxExpensesForTarget', () => {
  it('returns income minus target savings', () => {
    // target 20% of 10000 = 2000 savings → max expenses = 8000
    expect(calculateMaxExpensesForTarget(10000, 20)).toBeCloseTo(8000);
  });

  it('returns full income when target rate is 0', () => {
    expect(calculateMaxExpensesForTarget(5000, 0)).toBeCloseTo(5000);
  });

  it('returns 0 when target rate is 100', () => {
    expect(calculateMaxExpensesForTarget(5000, 100)).toBeCloseTo(0);
  });
});
