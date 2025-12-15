import type { Account, Transaction, Goal } from '../types';
import {
  calculateNetWorth,
  calculateSavingsRate,
  calculateYearsToFI,
  calculateRequiredSavings,
} from './calculations';
import type { projectNetWorth, calculateCompoundInterest } from './calculations';

export interface ProjectionMetrics {
  netWorth: ReturnType<typeof calculateNetWorth>;
  savingsRate: ReturnType<typeof calculateSavingsRate>;
  yearsToFI: ReturnType<typeof calculateYearsToFI>;
  monthlyIncome: number;
  monthlyExpenses: number;
}

export interface GoalProjection extends Goal {
  yearsToGoal: number;
  onTrack: boolean;
  monthlyRequired: number;
  yearsUntilTarget?: number;
}

export function calculateProjectionMetrics(
  accounts: Account[],
  transactions: Transaction[]
): ProjectionMetrics {
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  const recentTransactions = transactions.filter(
    t => new Date(t.dateISO) >= threeMonthsAgo
  );

  const monthlyIncome = recentTransactions
    .filter(t => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0) / 3;

  const monthlyExpenses = Math.abs(
    recentTransactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + t.amount, 0) / 3
  );

  const netWorth = calculateNetWorth(accounts);
  const savingsRate = calculateSavingsRate(monthlyIncome, monthlyExpenses);
  const yearsToFI = calculateYearsToFI(
    savingsRate.savingsRate,
    netWorth.netWorth,
    monthlyExpenses * 12
  );

  return {
    netWorth,
    savingsRate,
    yearsToFI,
    monthlyIncome,
    monthlyExpenses,
  };
}

export function calculateGoalProjections(
  goals: Goal[],
  savingsRate: ReturnType<typeof calculateSavingsRate>,
  annualReturnRate: number
): GoalProjection[] {
  return goals.map(goal => {
    const currentProgress = goal.currentAmount || 0;
    const targetAmount = goal.targetAmount;
    const remaining = targetAmount - currentProgress;

    if (remaining <= 0) {
      return {
        ...goal,
        yearsToGoal: 0,
        onTrack: true,
        monthlyRequired: 0,
      };
    }

    const targetDate = goal.dueDateISO ? new Date(String(goal.dueDateISO)) : null;
    const yearsUntilTarget = targetDate
      ? (targetDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24 * 365)
      : 10;

    const requiredSavings = calculateRequiredSavings(
      targetAmount,
      currentProgress,
      Math.max(1, yearsUntilTarget),
      annualReturnRate
    );

    const yearsAtCurrentRate =
      savingsRate.monthlySavings > 0
        ? remaining / (savingsRate.monthlySavings * 12)
        : Infinity;

    return {
      ...goal,
      yearsToGoal: yearsAtCurrentRate,
      onTrack: yearsAtCurrentRate <= yearsUntilTarget,
      monthlyRequired: requiredSavings.requiredMonthlySavings,
      yearsUntilTarget,
    };
  });
}

export function prepareNetWorthChartData(
  netWorth: ReturnType<typeof calculateNetWorth>,
  netWorthProjections: ReturnType<typeof projectNetWorth>
): Array<{
  year: string;
  value: number;
  optimistic: number;
  pessimistic: number;
  contributions?: number;
}> {
  return [
    {
      year: 'Today',
      value: netWorth.netWorth,
      optimistic: netWorth.netWorth,
      pessimistic: netWorth.netWorth,
    },
    ...netWorthProjections.map(p => ({
      year: `Year ${p.year}`,
      value: p.baseCase,
      optimistic: p.optimistic,
      pessimistic: p.pessimistic,
      contributions: p.contributions,
    })),
  ];
}

export function prepareCompoundInterestChartData(
  investmentGrowthData: ReturnType<typeof calculateCompoundInterest>
): Array<{
  year: string;
  totalValue: number;
  contributions: number;
  gains: number;
}> {
  return investmentGrowthData.yearByYear.map(y => ({
    year: `Year ${y.year}`,
    totalValue: y.balance,
    contributions: y.contributions,
    gains: y.gains,
  }));
}
