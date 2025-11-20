import { describe, it, expect } from 'vitest';
import {
  calculateSavingsRate,
  calculateSavingsRateDetailed,
  formatSavingsRate,
  getSavingsRateStatus,
  calculateTargetSavings,
  calculateMaxExpensesForTarget,
} from '../savingsRate';

describe('savingsRate', () => {
  describe('calculateSavingsRate', () => {
    it('should calculate positive savings rate', () => {
      const rate = calculateSavingsRate(5000, 4000);
      expect(rate).toBe(20); // (5000 - 4000) / 5000 * 100 = 20%
    });

    it('should calculate negative savings rate (spending more than income)', () => {
      const rate = calculateSavingsRate(3000, 4000);
      expect(rate).toBeCloseTo(-33.33, 1); // (3000 - 4000) / 3000 * 100 ≈ -33.33%
    });

    it('should return 0% when income is 0', () => {
      const rate = calculateSavingsRate(0, 1000);
      expect(rate).toBe(0);
    });

    it('should return 100% when expenses are 0', () => {
      const rate = calculateSavingsRate(5000, 0);
      expect(rate).toBe(100);
    });

    it('should calculate small savings rates accurately', () => {
      const rate = calculateSavingsRate(10000, 9500);
      expect(rate).toBe(5); // (10000 - 9500) / 10000 * 100 = 5%
    });

    it('should handle zero income and zero expenses', () => {
      const rate = calculateSavingsRate(0, 0);
      expect(rate).toBe(0);
    });
  });

  describe('calculateSavingsRateDetailed', () => {
    it('should return detailed savings information for positive savings', () => {
      const result = calculateSavingsRateDetailed(5000, 4000);

      expect(result).toEqual({
        savingsRate: 20,
        savings: 1000,
        income: 5000,
        expenses: 4000,
        isPositive: true,
      });
    });

    it('should return detailed information for negative savings', () => {
      const result = calculateSavingsRateDetailed(3000, 4000);

      expect(result.savingsRate).toBeCloseTo(-33.33, 1);
      expect(result.savings).toBe(-1000);
      expect(result.income).toBe(3000);
      expect(result.expenses).toBe(4000);
      expect(result.isPositive).toBe(false);
    });

    it('should handle zero savings (break even)', () => {
      const result = calculateSavingsRateDetailed(5000, 5000);

      expect(result.savingsRate).toBe(0);
      expect(result.savings).toBe(0);
      expect(result.isPositive).toBe(true); // Zero is considered non-negative
    });

    it('should calculate detailed information for 100% savings rate', () => {
      const result = calculateSavingsRateDetailed(5000, 0);

      expect(result.savingsRate).toBe(100);
      expect(result.savings).toBe(5000);
      expect(result.income).toBe(5000);
      expect(result.expenses).toBe(0);
      expect(result.isPositive).toBe(true);
    });
  });

  describe('formatSavingsRate', () => {
    it('should format positive rate', () => {
      const formatted = formatSavingsRate(20.5);
      expect(formatted).toBe('20.5%');
    });

    it('should format negative rate', () => {
      const formatted = formatSavingsRate(-10.3);
      expect(formatted).toBe('-10.3%');
    });

    it('should format zero rate', () => {
      const formatted = formatSavingsRate(0);
      expect(formatted).toBe('0.0%');
    });

    it('should round to 1 decimal place', () => {
      const formatted = formatSavingsRate(15.6789);
      expect(formatted).toBe('15.7%');
    });

    it('should format whole numbers with decimal', () => {
      const formatted = formatSavingsRate(25);
      expect(formatted).toBe('25.0%');
    });
  });

  describe('getSavingsRateStatus', () => {
    it('should return "Excellent" for rate >= 20%', () => {
      const status = getSavingsRateStatus(25);
      expect(status.label).toBe('Excellent');
      expect(status.colorClass).toBe('text-emerald-700 bg-emerald-50');
      expect(status.iconClass).toBe('text-emerald-600');
    });

    it('should return "Excellent" for exactly 20%', () => {
      const status = getSavingsRateStatus(20);
      expect(status.label).toBe('Excellent');
    });

    it('should return "Good" for rate >= 10% and < 20%', () => {
      const status = getSavingsRateStatus(15);
      expect(status.label).toBe('Good');
      expect(status.colorClass).toBe('text-green-700 bg-green-50');
      expect(status.iconClass).toBe('text-green-600');
    });

    it('should return "Good" for exactly 10%', () => {
      const status = getSavingsRateStatus(10);
      expect(status.label).toBe('Good');
    });

    it('should return "Fair" for rate >= 5% and < 10%', () => {
      const status = getSavingsRateStatus(7);
      expect(status.label).toBe('Fair');
      expect(status.colorClass).toBe('text-yellow-700 bg-yellow-50');
      expect(status.iconClass).toBe('text-yellow-600');
    });

    it('should return "Fair" for exactly 5%', () => {
      const status = getSavingsRateStatus(5);
      expect(status.label).toBe('Fair');
    });

    it('should return "Low" for rate >= 0% and < 5%', () => {
      const status = getSavingsRateStatus(2);
      expect(status.label).toBe('Low');
      expect(status.colorClass).toBe('text-orange-700 bg-orange-50');
      expect(status.iconClass).toBe('text-orange-600');
    });

    it('should return "Low" for exactly 0%', () => {
      const status = getSavingsRateStatus(0);
      expect(status.label).toBe('Low');
    });

    it('should return "Deficit" for negative rates', () => {
      const status = getSavingsRateStatus(-10);
      expect(status.label).toBe('Deficit');
      expect(status.colorClass).toBe('text-rose-700 bg-rose-50');
      expect(status.iconClass).toBe('text-rose-600');
    });

    it('should return "Deficit" for very negative rates', () => {
      const status = getSavingsRateStatus(-100);
      expect(status.label).toBe('Deficit');
    });
  });

  describe('calculateTargetSavings', () => {
    it('should calculate target savings for 20% rate', () => {
      const targetSavings = calculateTargetSavings(5000, 20);
      expect(targetSavings).toBe(1000); // 5000 * 20 / 100 = 1000
    });

    it('should calculate target savings for 10% rate', () => {
      const targetSavings = calculateTargetSavings(10000, 10);
      expect(targetSavings).toBe(1000);
    });

    it('should calculate target savings for 0% rate', () => {
      const targetSavings = calculateTargetSavings(5000, 0);
      expect(targetSavings).toBe(0);
    });

    it('should calculate target savings for 100% rate', () => {
      const targetSavings = calculateTargetSavings(5000, 100);
      expect(targetSavings).toBe(5000);
    });

    it('should handle decimal rates', () => {
      const targetSavings = calculateTargetSavings(5000, 15.5);
      expect(targetSavings).toBe(775); // 5000 * 15.5 / 100 = 775
    });

    it('should return 0 for zero income', () => {
      const targetSavings = calculateTargetSavings(0, 20);
      expect(targetSavings).toBe(0);
    });
  });

  describe('calculateMaxExpensesForTarget', () => {
    it('should calculate max expenses for 20% savings rate', () => {
      const maxExpenses = calculateMaxExpensesForTarget(5000, 20);
      expect(maxExpenses).toBe(4000); // 5000 - (5000 * 20 / 100) = 4000
    });

    it('should calculate max expenses for 50% savings rate', () => {
      const maxExpenses = calculateMaxExpensesForTarget(10000, 50);
      expect(maxExpenses).toBe(5000);
    });

    it('should allow all income as expenses for 0% savings rate', () => {
      const maxExpenses = calculateMaxExpensesForTarget(5000, 0);
      expect(maxExpenses).toBe(5000);
    });

    it('should allow no expenses for 100% savings rate', () => {
      const maxExpenses = calculateMaxExpensesForTarget(5000, 100);
      expect(maxExpenses).toBe(0);
    });

    it('should handle decimal target rates', () => {
      const maxExpenses = calculateMaxExpensesForTarget(5000, 15.5);
      expect(maxExpenses).toBe(4225); // 5000 - 775 = 4225
    });
  });

  describe('Integration scenarios', () => {
    it('should correctly calculate and format a typical scenario', () => {
      const income = 6000;
      const expenses = 4500;

      const detailed = calculateSavingsRateDetailed(income, expenses);
      const formatted = formatSavingsRate(detailed.savingsRate);
      const status = getSavingsRateStatus(detailed.savingsRate);

      expect(detailed.savingsRate).toBe(25); // (6000 - 4500) / 6000 * 100 = 25%
      expect(detailed.savings).toBe(1500);
      expect(detailed.isPositive).toBe(true);
      expect(formatted).toBe('25.0%');
      expect(status.label).toBe('Excellent');
    });

    it('should handle deficit scenario', () => {
      const income = 3000;
      const expenses = 3500;

      const detailed = calculateSavingsRateDetailed(income, expenses);
      const formatted = formatSavingsRate(detailed.savingsRate);
      const status = getSavingsRateStatus(detailed.savingsRate);

      expect(detailed.savings).toBe(-500);
      expect(detailed.isPositive).toBe(false);
      expect(formatted).toContain('-');
      expect(status.label).toBe('Deficit');
    });

    it('should calculate required expense reduction to hit target', () => {
      const income = 5000;
      const currentExpenses = 4500;
      const targetRate = 20;

      const currentRate = calculateSavingsRate(income, currentExpenses);
      const maxAllowedExpenses = calculateMaxExpensesForTarget(income, targetRate);
      const reductionNeeded = currentExpenses - maxAllowedExpenses;

      expect(currentRate).toBe(10); // Currently at 10% savings
      expect(maxAllowedExpenses).toBe(4000); // Need to keep expenses at 4000
      expect(reductionNeeded).toBe(500); // Need to reduce expenses by 500
    });
  });
});
