import { describe, it, expect } from 'vitest';
import {
  getContributionLimits,
  calculateRemainingContributionRoom,
  calculateVestedAmount,
  calculateEmployerMatch,
  calculateTotalRetirementValue,
  projectRetirementGrowth,
  validateAllocation,
  suggestAllocation,
  calculateYearsToRetirement,
  calculate4PercentRule,
  calculateRetirementReadiness,
} from '../retirementCalculations';
import { CONTRIBUTION_LIMITS_2024 } from '../../types';
import type { RetirementAccountWithStats, InvestmentAllocation } from '../../types';

describe('retirementCalculations', () => {
  describe('getContributionLimits', () => {
    it('should return 401k limits', () => {
      const limits = getContributionLimits('401k');
      expect(limits).toEqual({ base: 23000, catchUp: 7500 });
    });

    it('should return traditional IRA limits', () => {
      const limits = getContributionLimits('traditional_ira');
      expect(limits).toEqual({ base: 7000, catchUp: 1000 });
    });

    it('should return Roth IRA limits', () => {
      const limits = getContributionLimits('roth_ira');
      expect(limits).toEqual({ base: 7000, catchUp: 1000 });
    });

    it('should return individual HSA limits by default', () => {
      const limits = getContributionLimits('hsa');
      expect(limits).toEqual({ base: 4150, catchUp: 1000 });
    });

    it('should return family HSA limits when specified', () => {
      const limits = getContributionLimits('hsa', true);
      expect(limits).toEqual({ base: 8300, catchUp: 1000 });
    });

    it('should return SEP IRA limits', () => {
      const limits = getContributionLimits('sep_ira');
      expect(limits).toEqual({ base: 69000, catchUp: 0 });
    });

    it('should return SIMPLE IRA limits', () => {
      const limits = getContributionLimits('simple_ira');
      expect(limits).toEqual({ base: 16000, catchUp: 3500 });
    });

    it('should throw error for unknown account type', () => {
      expect(() => getContributionLimits('unknown' as any)).toThrow('No contribution limits found for account type: unknown');
    });
  });

  describe('calculateRemainingContributionRoom', () => {
    const mockRetirement: RetirementAccountWithStats = {
      id: '1',
      accountId: 'acc1',
      accountName: 'Test 401k',
      accountBalance: 50000,
      accountType: '401k',
      taxTreatment: 'pre_tax',
      annualContributionLimit: 23000,
      catchUpLimit: 7500,
      currentYearContributions: 10000,
      contributionYear: 2024,
      hasEmployerMatch: true,
      employerMatchPercentage: 100,
      employerMatchLimit: 6,
      employerMatchType: 'percentage',
      employerContributionsYTD: 3000,
      hasVestingSchedule: false,
      vestingPercentage: 100,
      unvestedBalance: 0,
      vestedBalance: 50000,
      totalValue: 50000,
      totalVested: 50000,
      totalYTDContributions: 13000,
      remainingEmployeeRoom: 13000,
      latestGains: 5000,
      latestRateOfReturn: 10,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    it('should calculate remaining room correctly for under-50', () => {
      const room = calculateRemainingContributionRoom(mockRetirement, 75000, 40);
      expect(room.employeeRoom).toBe(13000); // 23000 - 10000
      expect(room.employerRoom).toBe(1500); // 6% of 75000 = 4500, minus 3000 contributed
      expect(room.totalLimit).toBe(23000);
      expect(room.isOver50).toBe(false);
    });

    it('should include catch-up for age 50+', () => {
      const room = calculateRemainingContributionRoom(mockRetirement, 75000, 51);
      expect(room.employeeRoom).toBe(20500); // 23000 + 7500 - 10000
      expect(room.employerRoom).toBe(1500);
      expect(room.totalLimit).toBe(30500); // 23000 + 7500
      expect(room.isOver50).toBe(true);
    });

    it('should handle no employer match', () => {
      const retirement = { ...mockRetirement, hasEmployerMatch: false };
      const room = calculateRemainingContributionRoom(retirement, 75000, 40);
      expect(room.employerRoom).toBe(0);
    });

  });

  describe('calculateVestedAmount', () => {
    it('should return 0 for no vesting schedule (fully vested)', () => {
      const retirement: RetirementAccountWithStats = {
        id: '1',
        accountId: 'acc1',
        accountName: 'Test',
        accountBalance: 50000,
        accountType: '401k',
        taxTreatment: 'pre_tax',
        annualContributionLimit: 23000,
        currentYearContributions: 5000,
        contributionYear: 2024,
        hasEmployerMatch: false,
        hasVestingSchedule: false,
        vestingScheduleType: 'immediate',
        vestingPercentage: 100,
        unvestedBalance: 0,
        vestedBalance: 50000,
        totalValue: 50000,
        totalVested: 50000,
        totalYTDContributions: 5000,
        remainingEmployeeRoom: 18000,
        employerContributionsYTD: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const vested = calculateVestedAmount(retirement, 1);
      expect(vested).toBe(0); // No unvested balance to vest
    });

    it('should handle cliff vesting before cliff date', () => {
      const retirement: RetirementAccountWithStats = {
        id: '1',
        accountId: 'acc1',
        accountName: 'Test',
        accountBalance: 50000,
        accountType: '401k',
        taxTreatment: 'pre_tax',
        annualContributionLimit: 23000,
        currentYearContributions: 5000,
        contributionYear: 2024,
        hasEmployerMatch: true,
        employerContributionsYTD: 3000,
        hasVestingSchedule: true,
        vestingScheduleType: 'cliff',
        vestingCliffYears: 3,
        vestingPercentage: 0,
        unvestedBalance: 5000,
        vestedBalance: 45000,
        totalValue: 50000,
        totalVested: 45000,
        totalYTDContributions: 8000,
        remainingEmployeeRoom: 18000,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const vested = calculateVestedAmount(retirement, 2);
      expect(vested).toBe(0); // 0% of 5000 unvested = 0
    });

    it('should handle cliff vesting after cliff date', () => {
      const retirement: RetirementAccountWithStats = {
        id: '1',
        accountId: 'acc1',
        accountName: 'Test',
        accountBalance: 50000,
        accountType: '401k',
        taxTreatment: 'pre_tax',
        annualContributionLimit: 23000,
        currentYearContributions: 5000,
        contributionYear: 2024,
        hasEmployerMatch: true,
        employerContributionsYTD: 3000,
        hasVestingSchedule: true,
        vestingScheduleType: 'cliff',
        vestingCliffYears: 3,
        vestingPercentage: 100,
        unvestedBalance: 5000,
        vestedBalance: 45000,
        totalValue: 50000,
        totalVested: 45000,
        totalYTDContributions: 8000,
        remainingEmployeeRoom: 18000,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const vested = calculateVestedAmount(retirement, 3);
      expect(vested).toBe(5000); // 100% of 5000 unvested = 5000
    });

    it('should handle graded vesting', () => {
      const retirement: RetirementAccountWithStats = {
        id: '1',
        accountId: 'acc1',
        accountName: 'Test',
        accountBalance: 50000,
        accountType: '401k',
        taxTreatment: 'pre_tax',
        annualContributionLimit: 23000,
        currentYearContributions: 5000,
        contributionYear: 2024,
        hasEmployerMatch: true,
        employerContributionsYTD: 5000,
        hasVestingSchedule: true,
        vestingScheduleType: 'graded',
        vestingGradedYears: 5,
        vestingPercentage: 40,
        unvestedBalance: 3000,
        vestedBalance: 47000,
        totalValue: 50000,
        totalVested: 47000,
        totalYTDContributions: 10000,
        remainingEmployeeRoom: 18000,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // 2 years of employment with 5-year graded schedule = 40% vested
      // Unvested balance: 3000, 40% of that = 1200
      const vested = calculateVestedAmount(retirement, 2);
      expect(vested).toBe(1200);
    });
  });

  describe('calculateEmployerMatch', () => {
    const retirement: RetirementAccountWithStats = {
      id: '1',
      accountId: 'acc1',
      accountName: 'Test',
      accountBalance: 50000,
      accountType: '401k',
      taxTreatment: 'pre_tax',
      annualContributionLimit: 23000,
      currentYearContributions: 0,
      contributionYear: 2024,
      hasEmployerMatch: true,
      employerMatchPercentage: 100,
      employerMatchLimit: 6,
      employerMatchType: 'percentage',
      employerContributionsYTD: 0,
      hasVestingSchedule: false,
      vestingPercentage: 100,
      unvestedBalance: 0,
      vestedBalance: 50000,
      totalValue: 50000,
      totalVested: 50000,
      totalYTDContributions: 0,
      remainingEmployeeRoom: 23000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    it('should calculate percentage-based match correctly', () => {
      const match = calculateEmployerMatch(retirement, 5000, 100000);
      // Employee contributes 5000, which is 5% of salary
      // Employer matches 100% up to 6% of salary
      // So match = 5000 (5% matched at 100%)
      expect(match).toBe(5000);
    });

    it('should cap at employer match limit', () => {
      const match = calculateEmployerMatch(retirement, 10000, 100000);
      // Employee contributes 10000 (10% of salary)
      // Employer matches 100% up to 6% of salary
      // So match = 6000 (6% of 100000)
      expect(match).toBe(6000);
    });

    it('should handle partial match percentage', () => {
      const partialMatch = { ...retirement, employerMatchPercentage: 50 };
      const match = calculateEmployerMatch(partialMatch, 6000, 100000);
      // Employee contributes 6000 (6% of salary)
      // Employer matches 50% up to 6% of salary
      // So match = 3000 (50% of 6000)
      expect(match).toBe(3000);
    });

    it('should return 0 for no employer match', () => {
      const noMatch = { ...retirement, hasEmployerMatch: false };
      const match = calculateEmployerMatch(noMatch, 5000, 100000);
      expect(match).toBe(0);
    });
  });

  describe('calculateTotalRetirementValue', () => {
    it('should sum values correctly', () => {
      const accounts: RetirementAccountWithStats[] = [
        {
          id: '1',
          accountId: 'acc1',
          accountName: '401k',
          accountBalance: 50000,
          accountType: '401k',
          taxTreatment: 'pre_tax',
          annualContributionLimit: 23000,
          currentYearContributions: 10000,
          contributionYear: 2024,
          hasEmployerMatch: false,
          employerContributionsYTD: 0,
          hasVestingSchedule: false,
          vestingPercentage: 100,
          unvestedBalance: 0,
          vestedBalance: 50000,
          remainingEmployeeRoom: 13000,
          totalValue: 50000,
          totalVested: 50000,
          totalYTDContributions: 10000,
          latestGains: 5000,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '2',
          accountId: 'acc2',
          accountName: 'Roth IRA',
          accountBalance: 30000,
          accountType: 'roth_ira',
          taxTreatment: 'post_tax',
          annualContributionLimit: 7000,
          currentYearContributions: 3500,
          contributionYear: 2024,
          hasEmployerMatch: false,
          employerContributionsYTD: 0,
          hasVestingSchedule: false,
          vestingPercentage: 100,
          unvestedBalance: 0,
          vestedBalance: 30000,
          remainingEmployeeRoom: 3500,
          totalValue: 30000,
          totalVested: 30000,
          totalYTDContributions: 3500,
          latestGains: 2000,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      const totals = calculateTotalRetirementValue(accounts);
      expect(totals.totalValue).toBe(80000);
      expect(totals.totalVested).toBe(80000);
      expect(totals.totalUnvested).toBe(0);
      expect(totals.byType).toEqual({
        '401k': 50000,
        'Roth IRA': 30000,
      });
    });

    it('should handle empty array', () => {
      const totals = calculateTotalRetirementValue([]);
      expect(totals.totalValue).toBe(0);
      expect(totals.totalVested).toBe(0);
      expect(totals.totalUnvested).toBe(0);
      expect(totals.byType).toEqual({});
    });
  });

  describe('projectRetirementGrowth', () => {
    it('should project growth with compound interest', () => {
      const projections = projectRetirementGrowth(10000, 5000, 2500, 7, 10);
      expect(projections).toHaveLength(10);
      expect(projections[9].balance).toBeGreaterThan(10000);
      expect(projections[9].contributions).toBeGreaterThan(10000);
      expect(projections[9].gains).toBeGreaterThan(0);
    });

    it('should handle zero contributions', () => {
      const projections = projectRetirementGrowth(10000, 0, 0, 7, 10);
      expect(projections).toHaveLength(10);
      expect(projections[9].contributions).toBe(10000); // Only initial balance
      expect(projections[9].balance).toBeGreaterThan(10000); // Growth from initial balance
    });

    it('should project correct balance structure', () => {
      const projections = projectRetirementGrowth(0, 6000, 0, 7, 1);
      expect(projections).toHaveLength(1);
      expect(projections[0]).toHaveProperty('year', 1);
      expect(projections[0]).toHaveProperty('balance');
      expect(projections[0]).toHaveProperty('contributions');
      expect(projections[0]).toHaveProperty('gains');
      expect(projections[0].balance).toBeGreaterThan(6000);
    });
  });

  describe('validateAllocation', () => {
    it('should validate correct allocation', () => {
      const allocation: InvestmentAllocation = {
        stocks: 60,
        bonds: 30,
        cash: 10,
      };
      const result = validateAllocation(allocation);
      expect(result.isValid).toBe(true);
      expect(result.totalPercentage).toBe(100);
      expect(result.errors).toEqual([]);
    });

    it('should reject allocation over 100%', () => {
      const allocation: InvestmentAllocation = {
        stocks: 70,
        bonds: 40,
        cash: 10,
      };
      const result = validateAllocation(allocation);
      expect(result.isValid).toBe(false);
      expect(result.totalPercentage).toBe(120);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject allocation under 100%', () => {
      const allocation: InvestmentAllocation = {
        stocks: 50,
        bonds: 30,
      };
      const result = validateAllocation(allocation);
      expect(result.isValid).toBe(false);
      expect(result.totalPercentage).toBe(80);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle all asset classes', () => {
      const allocation: InvestmentAllocation = {
        stocks: 40,
        bonds: 30,
        cash: 10,
        realEstate: 10,
        commodities: 5,
        other: 5,
      };
      const result = validateAllocation(allocation);
      expect(result.isValid).toBe(true);
      expect(result.totalPercentage).toBe(100);
      expect(result.errors).toEqual([]);
    });
  });

  describe('suggestAllocation', () => {
    it('should suggest aggressive allocation for young investor', () => {
      const allocation = suggestAllocation(25);
      expect(allocation.stocks).toBe(85); // 110 - 25
      expect(allocation.bonds).toBe(15);
      expect(allocation.cash).toBe(0);
    });

    it('should suggest conservative allocation for older investor', () => {
      const allocation = suggestAllocation(65);
      expect(allocation.stocks).toBe(45); // 110 - 65
      expect(allocation.bonds).toBe(55);
      expect(allocation.cash).toBe(0);
    });

    it('should handle minimum age', () => {
      const allocation = suggestAllocation(20);
      expect(allocation.stocks).toBe(90); // max(20, min(90, 110-20)) = 90
      expect(allocation.bonds).toBe(10);
    });

    it('should handle maximum age', () => {
      const allocation = suggestAllocation(100);
      expect(allocation.stocks).toBe(20); // max(20, min(90, 110-100)) = 20
      expect(allocation.bonds).toBe(80);
      expect(allocation.cash).toBe(0);
    });

    it('should throw error for invalid age', () => {
      expect(() => suggestAllocation(17)).toThrow('Age must be between 18 and 100');
      expect(() => suggestAllocation(101)).toThrow('Age must be between 18 and 100');
    });
  });

  describe('calculateYearsToRetirement', () => {
    it('should calculate years needed with contributions', () => {
      const years = calculateYearsToRetirement(50000, 1000000, 10000, 7);
      expect(years).toBeGreaterThan(0);
      expect(years).toBeLessThan(50); // Should be achievable
    });

    it('should handle negative cases', () => {
      const years = calculateYearsToRetirement(1000000, 50000, 0, 7);
      expect(years).toBe(0); // Already have more than target
    });
  });

  describe('calculate4PercentRule', () => {
    it('should calculate safe withdrawal amounts', () => {
      const withdrawals = calculate4PercentRule(1000000);
      expect(withdrawals.annualWithdrawal).toBe(40000);
      expect(withdrawals.monthlyWithdrawal).toBeCloseTo(3333.33, 2);
      expect(withdrawals.requiredForExpenses(100000)).toBe(2500000); // 100000 / 0.04
    });

    it('should handle zero balance', () => {
      const withdrawals = calculate4PercentRule(0);
      expect(withdrawals.annualWithdrawal).toBe(0);
      expect(withdrawals.monthlyWithdrawal).toBe(0);
      expect(typeof withdrawals.requiredForExpenses).toBe('function');
    });

    it('should handle large balances', () => {
      const withdrawals = calculate4PercentRule(5000000);
      expect(withdrawals.annualWithdrawal).toBe(200000);
      expect(withdrawals.monthlyWithdrawal).toBeCloseTo(16666.67, 2);
    });
  });

  describe('calculateRetirementReadiness', () => {
    it('should calculate excellent readiness', () => {
      const readiness = calculateRetirementReadiness(35, 300000, 100000);
      expect(readiness.score).toBeGreaterThan(80);
      expect(['excellent', 'good']).toContain(readiness.status);
      expect(readiness.benchmarkMultiple).toBe(3); // Age 30-40 benchmark
      expect(readiness.currentMultiple).toBeGreaterThan(1);
      expect(readiness.message).toBeTruthy();
    });

    it('should calculate good readiness', () => {
      const readiness = calculateRetirementReadiness(45, 600000, 100000);
      expect(readiness.score).toBeGreaterThan(80);
      expect(['good', 'excellent']).toContain(readiness.status);
      expect(readiness.benchmarkMultiple).toBe(6); // Age 40-50 benchmark
    });

    it('should calculate behind status', () => {
      const readiness = calculateRetirementReadiness(55, 100000, 100000);
      expect(readiness.score).toBeLessThan(50);
      expect(['behind', 'very-behind', 'fair']).toContain(readiness.status);
      expect(readiness.benchmarkMultiple).toBe(8); // Age 50-60 benchmark
    });

    it('should handle zero savings', () => {
      const readiness = calculateRetirementReadiness(30, 0, 100000);
      expect(readiness.score).toBe(0);
      expect(readiness.status).toBe('very-behind');
      expect(readiness.currentMultiple).toBe(0);
    });

    it('should handle zero salary', () => {
      const readiness = calculateRetirementReadiness(30, 50000, 0);
      expect(readiness.score).toBe(0); // Can't calculate without salary
      expect(readiness.currentMultiple).toBe(0);
    });

    it('should provide helpful message', () => {
      const readiness = calculateRetirementReadiness(30, 100000, 100000);
      expect(readiness.message).toBeTruthy();
      expect(typeof readiness.message).toBe('string');
      expect(readiness).toHaveProperty('benchmarkMultiple');
      expect(readiness).toHaveProperty('currentMultiple');
    });
  });

  describe('CONTRIBUTION_LIMITS_2024', () => {
    it('should have all account types', () => {
      expect(CONTRIBUTION_LIMITS_2024['401k']).toBeDefined();
      expect(CONTRIBUTION_LIMITS_2024['403b']).toBeDefined();
      expect(CONTRIBUTION_LIMITS_2024.traditional_ira).toBeDefined();
      expect(CONTRIBUTION_LIMITS_2024.roth_ira).toBeDefined();
      expect(CONTRIBUTION_LIMITS_2024.sep_ira).toBeDefined();
      expect(CONTRIBUTION_LIMITS_2024.simple_ira).toBeDefined();
      expect(CONTRIBUTION_LIMITS_2024.hsa_individual).toBeDefined();
      expect(CONTRIBUTION_LIMITS_2024.hsa_family).toBeDefined();
    });

    it('should have correct structure', () => {
      Object.values(CONTRIBUTION_LIMITS_2024).forEach((limit) => {
        expect(limit).toHaveProperty('base');
        expect(limit).toHaveProperty('catchUp');
        expect(typeof limit.base).toBe('number');
        expect(typeof limit.catchUp).toBe('number');
      });
    });
  });
});
