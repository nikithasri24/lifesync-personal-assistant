/**
 * Retirement Account Calculation Utilities
 *
 * This module provides calculation functions for retirement account features including:
 * - Contribution limits and remaining room
 * - Vesting schedules and vested balances
 * - Employer match calculations
 * - Retirement account growth projections
 * - Investment allocation validation
 */

import type {
  RetirementAccountType,
  RetirementAccountWithStats,
  InvestmentAllocation,
  ContributionRoom,
} from '../types';
import { CONTRIBUTION_LIMITS_2024 } from '../types';

/**
 * Get contribution limits for a retirement account type
 * @param accountType - Type of retirement account (401k, IRA, HSA, etc.)
 * @param isFamilyCoverage - For HSA accounts, whether it's family vs individual coverage
 * @param year - Tax year (currently only 2024 is supported)
 * @returns Object with base and catch-up contribution limits
 */
export function getContributionLimits(
  accountType: RetirementAccountType,
  isFamilyCoverage: boolean = false,
  year: number = 2024
): { base: number; catchUp: number } {
  // Currently only supporting 2024 limits
  if (year !== 2024) {
    throw new Error(`Contribution limits for year ${year} not available. Only 2024 is currently supported.`);
  }

  if (accountType === 'hsa') {
    return isFamilyCoverage
      ? CONTRIBUTION_LIMITS_2024.hsa_family
      : CONTRIBUTION_LIMITS_2024.hsa_individual;
  }

  const limits = CONTRIBUTION_LIMITS_2024[accountType];
  if (!limits) {
    throw new Error(`No contribution limits found for account type: ${accountType}`);
  }

  return limits;
}

/**
 * Calculate remaining contribution room for the current year
 * @param retirement - Retirement account with stats
 * @param annualSalary - Annual salary (used for employer match calculations)
 * @param age - Account holder's age (determines catch-up contribution eligibility)
 * @returns Contribution room breakdown
 */
export function calculateRemainingContributionRoom(
  retirement: RetirementAccountWithStats,
  annualSalary: number,
  age: number
): ContributionRoom {
  const isOver50 = age >= 50;
  const catchUpEligible = isOver50 && retirement.catchUpLimit ? retirement.catchUpLimit : 0;
  const totalEmployeeLimit = retirement.annualContributionLimit + catchUpEligible;

  const employeeRoom = Math.max(0, totalEmployeeLimit - retirement.currentYearContributions);

  let employerRoom = 0;
  if (retirement.hasEmployerMatch && retirement.employerMatchLimit) {
    const maxEmployerMatch = (annualSalary * retirement.employerMatchLimit) / 100;
    employerRoom = Math.max(0, maxEmployerMatch - retirement.employerContributionsYTD);
  }

  return {
    employeeRoom,
    employerRoom,
    totalLimit: totalEmployeeLimit,
    isOver50,
  };
}

/**
 * Calculate vested amount based on years of service
 * @param retirement - Retirement account with vesting schedule
 * @param employmentYears - Number of years employed (can be fractional)
 * @returns Amount of unvested balance that is now vested
 */
export function calculateVestedAmount(
  retirement: RetirementAccountWithStats,
  employmentYears: number
): number {
  if (!retirement.hasVestingSchedule) {
    return 0; // Fully vested (no unvested balance)
  }

  let vestingPercentage = 0;

  switch (retirement.vestingScheduleType) {
    case 'immediate':
      vestingPercentage = 100;
      break;

    case 'cliff':
      // All or nothing at cliff
      vestingPercentage = employmentYears >= (retirement.vestingCliffYears ?? 0) ? 100 : 0;
      break;

    case 'graded':
      // Linear vesting over graded period
      const gradedYears = retirement.vestingGradedYears ?? 5;
      vestingPercentage = Math.min(100, (employmentYears / gradedYears) * 100);
      break;

    default:
      vestingPercentage = 0;
  }

  return (retirement.unvestedBalance * vestingPercentage) / 100;
}

/**
 * Calculate employer match for a given employee contribution
 * @param retirement - Retirement account with employer match configuration
 * @param employeeContribution - Amount of employee contribution
 * @param annualSalary - Annual salary (used to calculate match limit)
 * @returns Amount of employer match
 */
export function calculateEmployerMatch(
  retirement: RetirementAccountWithStats,
  employeeContribution: number,
  annualSalary: number
): number {
  if (!retirement.hasEmployerMatch) {
    return 0;
  }

  const matchPercentage = retirement.employerMatchPercentage ?? 100;
  const matchLimit = retirement.employerMatchLimit ?? 6;

  // Maximum matchable employee contribution (% of salary)
  const maxMatchableContribution = (annualSalary * matchLimit) / 100;

  // Actual matched amount
  const matchableAmount = Math.min(employeeContribution, maxMatchableContribution);
  const matchAmount = (matchableAmount * matchPercentage) / 100;

  return matchAmount;
}

/**
 * Calculate total retirement account value across all accounts
 * @param retirementAccounts - Array of retirement accounts
 * @returns Object with total vested, unvested, and value by account type
 */
export function calculateTotalRetirementValue(
  retirementAccounts: RetirementAccountWithStats[]
): {
  totalVested: number;
  totalUnvested: number;
  totalValue: number;
  byType: Record<string, number>;
} {
  let totalVested = 0;
  let totalUnvested = 0;
  const byType: Record<string, number> = {};

  retirementAccounts.forEach(account => {
    const vested = account.vestedBalance;
    const unvested = account.unvestedBalance;

    totalVested += vested;
    totalUnvested += unvested;

    // Group by account name (e.g., "401k", "Roth IRA")
    const accountType = account.accountName;
    byType[accountType] = (byType[accountType] ?? 0) + vested + unvested;
  });

  return {
    totalVested,
    totalUnvested,
    totalValue: totalVested + totalUnvested,
    byType,
  };
}

/**
 * Project retirement account growth over time
 * Uses compound interest formula with monthly contributions
 * @param currentBalance - Current account balance
 * @param annualContribution - Annual employee contribution
 * @param employerMatch - Annual employer match
 * @param annualReturnRate - Expected annual return rate (as percentage, e.g., 7 for 7%)
 * @param years - Number of years to project
 * @returns Array of projections for each year
 */
export function projectRetirementGrowth(
  currentBalance: number,
  annualContribution: number,
  employerMatch: number,
  annualReturnRate: number,
  years: number
): Array<{
  year: number;
  balance: number;
  contributions: number;
  gains: number;
}> {
  const projections = [];
  let balance = currentBalance;
  let totalContributions = currentBalance;

  const monthlyContribution = (annualContribution + employerMatch) / 12;
  const monthlyRate = annualReturnRate / 12 / 100;

  for (let year = 1; year <= years; year++) {
    for (let month = 1; month <= 12; month++) {
      balance = balance * (1 + monthlyRate) + monthlyContribution;
      totalContributions += monthlyContribution;
    }

    projections.push({
      year,
      balance: Math.round(balance * 100) / 100,
      contributions: Math.round(totalContributions * 100) / 100,
      gains: Math.round((balance - totalContributions) * 100) / 100,
    });
  }

  return projections;
}

/**
 * Validate investment allocation percentages
 * Ensures all percentages sum to 100% (with small tolerance for rounding)
 * @param allocation - Investment allocation object
 * @returns Validation result with any errors
 */
export function validateAllocation(allocation: InvestmentAllocation): {
  isValid: boolean;
  totalPercentage: number;
  errors: string[];
} {
  const errors: string[] = [];
  let totalPercentage = 0;

  // Sum up all allocation percentages
  Object.entries(allocation).forEach(([key, value]) => {
    if (key === 'funds') {
      // Sum fund allocations
      (value as Array<{ name: string; ticker?: string; percentage: number }>).forEach(fund => {
        if (fund.percentage < 0) {
          errors.push(`Fund ${fund.name || 'unknown'} has negative percentage`);
        }
        totalPercentage += fund.percentage;
      });
    } else if (typeof value === 'number') {
      if (value < 0) {
        errors.push(`${key} has negative percentage`);
      }
      totalPercentage += value;
    }
  });

  // Allow small rounding tolerance (0.1%)
  if (totalPercentage > 100.1) {
    errors.push(`Total allocation (${totalPercentage.toFixed(1)}%) exceeds 100%`);
  }

  if (totalPercentage < 99.9 && totalPercentage > 0) {
    errors.push(`Total allocation (${totalPercentage.toFixed(1)}%) is less than 100%`);
  }

  return {
    isValid: errors.length === 0,
    totalPercentage: Math.round(totalPercentage * 10) / 10,
    errors,
  };
}

/**
 * Calculate age-appropriate asset allocation
 * Uses the "110 minus age" rule of thumb
 * @param age - Account holder's age
 * @returns Suggested allocation with stocks and bonds
 */
export function suggestAllocation(age: number): InvestmentAllocation {
  if (age < 18 || age > 100) {
    throw new Error('Age must be between 18 and 100');
  }

  const stockPercentage = Math.max(20, Math.min(90, 110 - age));
  const bondPercentage = 100 - stockPercentage;

  return {
    stocks: stockPercentage,
    bonds: bondPercentage,
    cash: 0,
  };
}

/**
 * Calculate years until retirement based on target savings and contribution rate
 * @param currentSavings - Current retirement savings
 * @param targetSavings - Target retirement savings goal
 * @param annualContribution - Annual total contribution (employee + employer)
 * @param annualReturnRate - Expected annual return rate (as percentage)
 * @returns Estimated years until target is reached
 */
export function calculateYearsToRetirement(
  currentSavings: number,
  targetSavings: number,
  annualContribution: number,
  annualReturnRate: number
): number {
  if (currentSavings >= targetSavings) {
    return 0;
  }

  if (annualContribution <= 0 && annualReturnRate <= 0) {
    return Infinity; // Will never reach target
  }

  const monthlyContribution = annualContribution / 12;
  const monthlyRate = annualReturnRate / 12 / 100;
  let balance = currentSavings;
  let months = 0;
  const maxMonths = 600; // 50 years maximum

  while (balance < targetSavings && months < maxMonths) {
    balance = balance * (1 + monthlyRate) + monthlyContribution;
    months++;
  }

  return months >= maxMonths ? Infinity : Math.round((months / 12) * 10) / 10;
}

/**
 * Calculate safe withdrawal amount using the 4% rule
 * @param retirementBalance - Total retirement account balance
 * @returns Annual and monthly safe withdrawal amounts
 */
export function calculate4PercentRule(retirementBalance: number): {
  annualWithdrawal: number;
  monthlyWithdrawal: number;
  requiredForExpenses: (annualExpenses: number) => number;
} {
  const annualWithdrawal = retirementBalance * 0.04;
  const monthlyWithdrawal = annualWithdrawal / 12;

  return {
    annualWithdrawal: Math.round(annualWithdrawal * 100) / 100,
    monthlyWithdrawal: Math.round(monthlyWithdrawal * 100) / 100,
    requiredForExpenses: (annualExpenses: number) => annualExpenses / 0.04,
  };
}

/**
 * Calculate retirement readiness score (0-100)
 * Based on current savings vs age-based benchmarks
 * Common benchmark: Have 1x salary by 30, 3x by 40, 6x by 50, 8x by 60
 * @param age - Account holder's age
 * @param currentSavings - Total retirement savings
 * @param annualSalary - Annual salary
 * @returns Score from 0-100 and status message
 */
export function calculateRetirementReadiness(
  age: number,
  currentSavings: number,
  annualSalary: number
): {
  score: number;
  status: 'excellent' | 'good' | 'fair' | 'behind' | 'very-behind';
  benchmarkMultiple: number;
  currentMultiple: number;
  message: string;
} {
  // Age-based salary multiplier benchmarks
  const getBenchmark = (age: number): number => {
    if (age < 30) return 1;
    if (age < 40) return 3;
    if (age < 50) return 6;
    if (age < 60) return 8;
    return 10;
  };

  const benchmarkMultiple = getBenchmark(age);
  const targetSavings = annualSalary * benchmarkMultiple;
  const currentMultiple = annualSalary > 0 ? currentSavings / annualSalary : 0;

  // Calculate score (0-100)
  const percentOfBenchmark = targetSavings > 0 ? (currentSavings / targetSavings) * 100 : 0;
  const score = Math.min(100, Math.max(0, percentOfBenchmark));

  // Determine status
  let status: 'excellent' | 'good' | 'fair' | 'behind' | 'very-behind';
  let message: string;

  if (score >= 100) {
    status = 'excellent';
    message = `You're ahead of schedule! You have ${currentMultiple.toFixed(1)}x your salary saved.`;
  } else if (score >= 80) {
    status = 'good';
    message = `You're on track. Keep up the good work!`;
  } else if (score >= 60) {
    status = 'fair';
    message = `You're making progress, but consider increasing contributions.`;
  } else if (score >= 40) {
    status = 'behind';
    message = `You're behind the benchmark. Consider increasing your savings rate.`;
  } else {
    status = 'very-behind';
    message = `Significant catch-up needed. Consider maximizing contributions.`;
  }

  return {
    score: Math.round(score),
    status,
    benchmarkMultiple,
    currentMultiple: Math.round(currentMultiple * 10) / 10,
    message,
  };
}
