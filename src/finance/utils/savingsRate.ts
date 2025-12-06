/**
 * Savings Rate Calculator
 *
 * Calculates savings rate as a percentage of income.
 * Formula: (Income - Expenses) / Income * 100
 */

export interface SavingsRateResult {
  savingsRate: number;
  savings: number;
  income: number;
  expenses: number;
  isPositive: boolean;
}

/**
 * Calculate savings rate percentage
 *
 * @param income - Total income for the period
 * @param expenses - Total expenses for the period
 * @returns Savings rate as a percentage (can be negative)
 */
export function calculateSavingsRate(income: number, expenses: number): number {
  if (income === 0) {
    return 0;
  }

  const savings = income - expenses;
  return (savings / income) * 100;
}

/**
 * Calculate detailed savings rate with metadata
 */
export function calculateSavingsRateDetailed(
  income: number,
  expenses: number
): SavingsRateResult {
  const savings = income - expenses;
  const savingsRate = calculateSavingsRate(income, expenses);

  return {
    savingsRate,
    savings,
    income,
    expenses,
    isPositive: savings >= 0,
  };
}

/**
 * Format savings rate for display
 *
 * @param rate - Savings rate percentage
 * @returns Formatted string (e.g., "11.4%" or "-5.2%")
 */
export function formatSavingsRate(rate: number): string {
  const sign = rate >= 0 ? '' : '';
  return `${sign}${rate.toFixed(1)}%`;
}

/**
 * Get savings rate status and color
 *
 * @param rate - Savings rate percentage
 * @returns Status object with label and color class
 */
export function getSavingsRateStatus(rate: number): {
  label: string;
  colorClass: string;
  iconClass: string;
} {
  if (rate >= 20) {
    return {
      label: 'Excellent',
      colorClass: 'text-emerald-700 bg-emerald-50',
      iconClass: 'text-emerald-600',
    };
  } else if (rate >= 10) {
    return {
      label: 'Good',
      colorClass: 'text-green-700 bg-green-50',
      iconClass: 'text-green-600',
    };
  } else if (rate >= 5) {
    return {
      label: 'Fair',
      colorClass: 'text-yellow-700 bg-yellow-50',
      iconClass: 'text-yellow-600',
    };
  } else if (rate >= 0) {
    return {
      label: 'Low',
      colorClass: 'text-orange-700 bg-orange-50',
      iconClass: 'text-orange-600',
    };
  } else {
    return {
      label: 'Deficit',
      colorClass: 'text-rose-700 bg-rose-50',
      iconClass: 'text-rose-600',
    };
  }
}

/**
 * Calculate target savings needed to reach a goal savings rate
 *
 * @param income - Total income
 * @param targetRate - Target savings rate percentage
 * @returns Amount needed to save
 */
export function calculateTargetSavings(income: number, targetRate: number): number {
  return (income * targetRate) / 100;
}

/**
 * Calculate maximum affordable expenses for a target savings rate
 *
 * @param income - Total income
 * @param targetRate - Target savings rate percentage
 * @returns Maximum expenses to maintain target rate
 */
export function calculateMaxExpensesForTarget(income: number, targetRate: number): number {
  const targetSavings = calculateTargetSavings(income, targetRate);
  return income - targetSavings;
}
