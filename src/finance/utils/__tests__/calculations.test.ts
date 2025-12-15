import { describe, it, expect } from 'vitest';
import {
  calculateNetWorth,
  calculateSavingsRate,
  calculateDebtToIncome,
  calculateEmergencyFund,
  calculateCompoundInterest,
  ruleOf72,
  calculateRealReturn,
  calculate4PercentRule,
  calculateYearsToFI,
  calculateRequiredSavings,
  calculateRetirementMultiplier,
  calculateCreditCardPayoff,
  calculateCreditUtilization,
  calculateFederalTax,
  calculateFICATax,
  calculate503020Budget,
  projectNetWorth,
} from '../calculations';

describe('calculations', () => {
  describe('calculateNetWorth', () => {
    it('should calculate net worth with only assets', () => {
      const accounts = [
        { balance: 10000, type: 'checking' },
        { balance: 50000, type: 'investment' },
      ];
      const result = calculateNetWorth(accounts);
      expect(result.totalAssets).toBe(60000);
      expect(result.totalLiabilities).toBe(0);
      expect(result.netWorth).toBe(60000);
    });

    it('should categorize liquid assets correctly', () => {
      const accounts = [
        { balance: 5000, type: 'checking' },
        { balance: 10000, type: 'savings' },
      ];
      const result = calculateNetWorth(accounts);
      expect(result.breakdown.liquidAssets).toBe(15000);
    });

    it('should categorize investments correctly', () => {
      const accounts = [
        { balance: 50000, type: 'investment' },
        { balance: 30000, type: '401k' },
      ];
      const result = calculateNetWorth(accounts);
      expect(result.breakdown.investments).toBe(80000);
    });

    it('should handle liabilities', () => {
      const accounts = [
        { balance: 10000, type: 'checking' },
        { balance: -5000, type: 'credit_card' },
      ];
      const result = calculateNetWorth(accounts);
      expect(result.totalLiabilities).toBe(5000);
      expect(result.breakdown.shortTermDebt).toBe(5000);
      expect(result.netWorth).toBe(5000);
    });

    it('should handle mixed assets and liabilities', () => {
      const accounts = [
        { balance: 20000, type: 'checking' },
        { balance: 100000, type: 'investment' },
        { balance: -3000, type: 'credit_card' },
        { balance: -200000, type: 'loan' },
      ];
      const result = calculateNetWorth(accounts);
      expect(result.totalAssets).toBe(120000);
      expect(result.totalLiabilities).toBe(203000);
      expect(result.netWorth).toBe(-83000);
    });

    it('should handle empty accounts array', () => {
      const result = calculateNetWorth([]);
      expect(result.netWorth).toBe(0);
    });
  });

  describe('calculateSavingsRate', () => {
    it('should calculate positive savings rate', () => {
      const result = calculateSavingsRate(5000, 4000);
      expect(result.savingsRate).toBe(20);
      expect(result.monthlySavings).toBe(1000);
      expect(result.annualSavings).toBe(12000);
    });

    it('should calculate negative savings rate', () => {
      const result = calculateSavingsRate(3000, 4000);
      expect(result.savingsRate).toBeCloseTo(-33.33, 1);
      expect(result.monthlySavings).toBe(-1000);
      expect(result.interpretation).toContain('urgent');
    });

    it('should handle zero income', () => {
      const result = calculateSavingsRate(0, 1000);
      expect(result.savingsRate).toBe(0);
      expect(result.interpretation).toContain('No income data');
    });

    it('should provide correct interpretation for excellent savings', () => {
      const result = calculateSavingsRate(10000, 2000);
      expect(result.savingsRate).toBe(80);
      expect(result.interpretation).toContain('FIRE');
    });
  });

  describe('calculateDebtToIncome', () => {
    it('should calculate good DTI ratio', () => {
      const result = calculateDebtToIncome(1000, 5000);
      expect(result.dti).toBe(20);
      expect(result.interpretation).toContain('Good');
      expect(result.lendingCapacity).toContain('most loans');
    });

    it('should calculate high DTI ratio', () => {
      const result = calculateDebtToIncome(2500, 5000);
      expect(result.dti).toBe(50);
      expect(result.interpretation).toContain('Very high');
    });

    it('should handle zero income', () => {
      const result = calculateDebtToIncome(1000, 0);
      expect(result.dti).toBe(0);
      expect(result.interpretation).toContain('No income data');
    });
  });

  describe('calculateEmergencyFund', () => {
    it('should calculate adequate emergency fund', () => {
      const result = calculateEmergencyFund(18000, 3000);
      expect(result.monthsCovered).toBe(6);
      expect(result.interpretation).toContain('Good');
      expect(result.shortfall).toBe(0);
    });

    it('should calculate shortfall', () => {
      const result = calculateEmergencyFund(6000, 3000);
      expect(result.monthsCovered).toBe(2);
      expect(result.shortfall).toBe(12000);
      expect(result.interpretation).toContain('At risk');
    });

    it('should handle zero expenses', () => {
      const result = calculateEmergencyFund(10000, 0);
      expect(result.monthsCovered).toBe(0);
    });
  });

  describe('calculateCompoundInterest', () => {
    it('should calculate future value with no contributions', () => {
      const result = calculateCompoundInterest(10000, 0, 7, 10);
      expect(result.futureValue).toBeGreaterThan(10000);
      expect(result.totalContributed).toBe(10000);
      expect(result.totalGains).toBeGreaterThan(0);
    });

    it('should calculate future value with monthly contributions', () => {
      const result = calculateCompoundInterest(10000, 500, 7, 10);
      expect(result.totalContributed).toBe(10000 + (500 * 12 * 10));
      expect(result.futureValue).toBeGreaterThan(result.totalContributed);
    });

    it('should provide year-by-year breakdown', () => {
      const result = calculateCompoundInterest(10000, 500, 7, 5);
      expect(result.yearByYear).toHaveLength(5);
      expect(result.yearByYear[0].year).toBe(1);
      expect(result.yearByYear[4].year).toBe(5);
    });

    it('should handle zero return rate', () => {
      const result = calculateCompoundInterest(10000, 100, 0, 5);
      expect(result.futureValue).toBe(10000 + (100 * 12 * 5));
      expect(result.totalGains).toBe(0);
    });
  });

  describe('ruleOf72', () => {
    it('should calculate years to double at 7% return', () => {
      const result = ruleOf72(7);
      expect(result.yearsToDouble).toBeCloseTo(10.29, 1);
    });

    it('should calculate years to double at 10% return', () => {
      const result = ruleOf72(10);
      expect(result.yearsToDouble).toBeCloseTo(7.2, 1);
    });

    it('should provide doubling schedule', () => {
      const result = ruleOf72(8);
      expect(result.doublings).toHaveLength(5);
      expect(result.doublings[0].multiplier).toBe(2);
      expect(result.doublings[4].multiplier).toBe(32);
    });

    it('should handle zero or negative return', () => {
      const result = ruleOf72(0);
      expect(result.yearsToDouble).toBe(Infinity);
      expect(result.doublings).toHaveLength(0);
    });
  });

  describe('calculateRealReturn', () => {
    it('should calculate positive real return', () => {
      const result = calculateRealReturn(10, 3);
      expect(result.realReturn).toBeGreaterThan(6);
      expect(result.realReturn).toBeLessThan(7);
    });

    it('should calculate negative real return', () => {
      const result = calculateRealReturn(2, 4);
      expect(result.realReturn).toBeLessThan(0);
      expect(result.interpretation).toContain('Losing purchasing power');
    });

    it('should handle zero inflation', () => {
      const result = calculateRealReturn(10, 0);
      expect(result.realReturn).toBeCloseTo(10, 1);
    });
  });

  describe('calculate4PercentRule', () => {
    it('should calculate safe annual withdrawal', () => {
      const result = calculate4PercentRule(1000000);
      expect(result.annualWithdrawal).toBe(40000);
      expect(result.monthlyWithdrawal).toBeCloseTo(3333.33, 2);
    });

    it('should calculate required portfolio for expenses', () => {
      const result = calculate4PercentRule(1000000);
      const required = result.requiredForExpenses(40000);
      expect(required).toBe(1000000);
    });

    it('should handle zero portfolio', () => {
      const result = calculate4PercentRule(0);
      expect(result.annualWithdrawal).toBe(0);
    });
  });

  describe('calculateYearsToFI', () => {
    it('should calculate years to FI with high savings rate', () => {
      const result = calculateYearsToFI(50, 0, 40000, 7);
      expect(result.yearsToFI).toBeGreaterThan(0);
      expect(result.yearsToFI).toBeLessThan(50);
      expect(result.targetNetWorth).toBe(1000000);
    });

    it('should return infinity for zero savings rate', () => {
      const result = calculateYearsToFI(0, 0, 40000);
      expect(result.yearsToFI).toBe(Infinity);
      expect(result.interpretation).toContain('Cannot achieve FI');
    });

    it('should calculate current progress', () => {
      const result = calculateYearsToFI(20, 250000, 40000);
      expect(result.currentProgress).toBe(25);
    });
  });

  describe('calculateRequiredSavings', () => {
    it('should calculate monthly savings needed', () => {
      const result = calculateRequiredSavings(100000, 0, 10, 7);
      expect(result.requiredMonthlySavings).toBeGreaterThan(0);
      expect(result.totalContributions).toBeGreaterThan(0);
      expect(result.onTrack).toBe(true);
    });

    it('should account for current savings', () => {
      const result = calculateRequiredSavings(100000, 50000, 10, 7);
      expect(result.requiredMonthlySavings).toBeLessThan(
        calculateRequiredSavings(100000, 0, 10, 7).requiredMonthlySavings
      );
    });

    it('should handle zero return rate', () => {
      const result = calculateRequiredSavings(12000, 0, 1, 0);
      expect(result.requiredMonthlySavings).toBe(1000);
    });
  });

  describe('calculateRetirementMultiplier', () => {
    it('should calculate on-track retirement savings', () => {
      const result = calculateRetirementMultiplier(40, 150000, 50000);
      expect(result.currentMultiplier).toBe(3);
      expect(result.onTrack).toBe(true);
    });

    it('should calculate behind-track retirement savings', () => {
      const result = calculateRetirementMultiplier(40, 50000, 50000);
      expect(result.currentMultiplier).toBe(1);
      expect(result.onTrack).toBe(false);
      expect(result.gap).toBeGreaterThan(0);
    });

    it('should handle zero salary', () => {
      const result = calculateRetirementMultiplier(40, 100000, 0);
      expect(result.currentMultiplier).toBe(0);
    });
  });

  describe('calculateCreditCardPayoff', () => {
    it('should calculate payoff time and interest', () => {
      const result = calculateCreditCardPayoff(5000, 19.99, 200);
      expect(result.monthsToPayoff).toBeGreaterThan(0);
      expect(result.totalInterest).toBeGreaterThan(0);
      expect(result.totalPaid).toBe(5000 + result.totalInterest);
    });

    it('should show benefit of doubled payments', () => {
      const result = calculateCreditCardPayoff(5000, 19.99, 200);
      expect(result.comparison.doubled.months).toBeLessThan(result.monthsToPayoff);
      expect(result.comparison.doubled.interest).toBeLessThan(result.totalInterest);
    });

    it('should handle zero balance', () => {
      const result = calculateCreditCardPayoff(0, 19.99, 100);
      expect(result.monthsToPayoff).toBe(0);
      expect(result.totalInterest).toBe(0);
    });

    it('should calculate savings from doubled payment', () => {
      const result = calculateCreditCardPayoff(5000, 19.99, 200);
      // Doubled payment should save months and interest compared to minimum
      expect(Math.abs(result.comparison.savings.months)).toBeGreaterThan(0);
      expect(Math.abs(result.comparison.savings.interest)).toBeGreaterThan(0);
    });
  });

  describe('calculateCreditUtilization', () => {
    it('should calculate excellent utilization', () => {
      const accounts = [
        { balance: -500, creditLimit: 10000, type: 'credit_card' },
      ];
      const result = calculateCreditUtilization(accounts);
      expect(result.utilizationRate).toBe(5);
      expect(result.interpretation).toBe('Excellent');
    });

    it('should calculate high utilization', () => {
      const accounts = [
        { balance: -8000, creditLimit: 10000, type: 'credit_card' },
      ];
      const result = calculateCreditUtilization(accounts);
      expect(result.utilizationRate).toBe(80);
      expect(result.interpretation).toBe('Critical');
    });

    it('should handle multiple credit cards', () => {
      const accounts = [
        { balance: -2000, creditLimit: 10000, type: 'credit_card' },
        { balance: -3000, creditLimit: 10000, type: 'credit_card' },
      ];
      const result = calculateCreditUtilization(accounts);
      expect(result.totalBalance).toBe(5000);
      expect(result.totalLimit).toBe(20000);
      expect(result.utilizationRate).toBe(25);
    });

    it('should ignore non-credit accounts', () => {
      const accounts = [
        { balance: -1000, creditLimit: 10000, type: 'credit_card' },
        { balance: 5000, type: 'checking' },
      ];
      const result = calculateCreditUtilization(accounts);
      expect(result.totalBalance).toBe(1000);
    });
  });

  describe('calculateFederalTax', () => {
    it('should calculate tax for low income', () => {
      const result = calculateFederalTax(50000, 'single');
      expect(result.totalTax).toBeGreaterThan(0);
      expect(result.effectiveRate).toBeLessThan(result.marginalRate);
    });

    it('should use progressive tax brackets', () => {
      const result = calculateFederalTax(100000, 'single');
      expect(result.breakdown.length).toBeGreaterThan(1);
    });

    it('should calculate higher tax for married filing', () => {
      const single = calculateFederalTax(100000, 'single');
      const married = calculateFederalTax(100000, 'married');
      expect(married.totalTax).toBeLessThan(single.totalTax);
    });

    it('should handle zero income', () => {
      const result = calculateFederalTax(0);
      expect(result.totalTax).toBe(0);
      expect(result.effectiveRate).toBe(0);
    });
  });

  describe('calculateFICATax', () => {
    it('should calculate employee FICA tax', () => {
      const result = calculateFICATax(100000, false);
      expect(result.socialSecurity).toBeGreaterThan(0);
      expect(result.medicare).toBeGreaterThan(0);
      expect(result.total).toBe(result.socialSecurity + result.medicare + result.additionalMedicare);
    });

    it('should calculate self-employed FICA tax', () => {
      const employee = calculateFICATax(100000, false);
      const selfEmployed = calculateFICATax(100000, true);
      expect(selfEmployed.total).toBeGreaterThan(employee.total);
      expect(selfEmployed.deduction).toBeGreaterThan(0);
    });

    it('should cap social security at wage base', () => {
      const result = calculateFICATax(200000, false);
      expect(result.socialSecurity).toBeLessThan(200000 * 0.062);
    });

    it('should apply additional Medicare tax', () => {
      const result = calculateFICATax(250000, false);
      expect(result.additionalMedicare).toBeGreaterThan(0);
    });
  });

  describe('calculate503020Budget', () => {
    it('should allocate budget according to 50/30/20 rule', () => {
      const result = calculate503020Budget(5000);
      expect(result.needs).toBe(2500);
      expect(result.wants).toBe(1500);
      expect(result.savings).toBe(1000);
    });

    it('should handle zero income', () => {
      const result = calculate503020Budget(0);
      expect(result.needs).toBe(0);
      expect(result.wants).toBe(0);
      expect(result.savings).toBe(0);
    });
  });

  describe('projectNetWorth', () => {
    it('should project growth over multiple years', () => {
      const result = projectNetWorth(100000, 1000, 7, 10);
      expect(result).toHaveLength(10);
      expect(result[9].year).toBe(10);
    });

    it('should show optimistic scenario higher than base', () => {
      const result = projectNetWorth(100000, 1000, 7, 5);
      expect(result[4].optimistic).toBeGreaterThan(result[4].baseCase);
    });

    it('should show pessimistic scenario lower than base', () => {
      const result = projectNetWorth(100000, 1000, 7, 5);
      expect(result[4].pessimistic).toBeLessThan(result[4].baseCase);
    });

    it('should account for monthly contributions', () => {
      const result = projectNetWorth(100000, 1000, 7, 5);
      const totalContributions = 100000 + (1000 * 12 * 5);
      expect(result[4].contributions).toBe(totalContributions);
    });

    it('should handle zero return rate', () => {
      const result = projectNetWorth(100000, 1000, 0, 5);
      expect(result[4].baseCase).toBe(100000 + (1000 * 12 * 5));
    });
  });
});
