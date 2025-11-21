/**
 * ProjectionsPage - Financial projections and future planning
 * Shows net worth growth, goal timelines, and retirement projections
 */

import React, { lazy, Suspense } from 'react';
import {
  TrendingUp,
  Target,
  Calendar,
  DollarSign,
  PiggyBank,
  Zap,
  Settings,
} from 'lucide-react';
import type { Account, Transaction, Goal } from '../types';
import { getFinanceAPI } from '../data';
import {
  calculateNetWorth,
  calculateSavingsRate,
  projectNetWorth,
  calculateYearsToFI,
  calculate4PercentRule,
  calculateRequiredSavings,
  calculateCompoundInterest,
} from '../utils/calculations';
import { formatCurrency } from '../utils/currency';

// Lazy load chart components to defer loading Recharts
const NetWorthChart = lazy(() => import('../components/ProjectionCharts').then(module => ({ default: module.NetWorthChart })));
const CompoundInterestChart = lazy(() => import('../components/ProjectionCharts').then(module => ({ default: module.CompoundInterestChart })));

const ProjectionsPage: React.FC = () => {
  const [loading, setLoading] = React.useState(true);
  const [accounts, setAccounts] = React.useState<Account[]>([]);
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const [goals, setGoals] = React.useState<Goal[]>([]);

  // Projection settings
  const [projectionYears, setProjectionYears] = React.useState(10);
  const [annualReturnRate, setAnnualReturnRate] = React.useState(7);
  const [inflationRate, setInflationRate] = React.useState(3);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const api = await getFinanceAPI();

      const [accts, { items: txns }, gls] = await Promise.all([
        api.listAccounts(),
        api.listTransactions({ limit: 1000 }),
        api.listGoals(),
      ]);

      if (!mounted) return;
      setAccounts(accts);
      setTransactions(txns);
      setGoals(gls);
      setLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // Calculate current metrics
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

  // Generate net worth projections
  const netWorthProjections = projectNetWorth(
    netWorth.netWorth,
    savingsRate.monthlySavings,
    annualReturnRate,
    projectionYears
  );

  // Prepare chart data
  const netWorthChartData = [
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

  // Calculate goal projections
  const goalProjections = goals.map(goal => {
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

    // Calculate years to reach goal with current savings rate
    const targetDate = goal.targetDate ? new Date(goal.targetDate) : null;
    const yearsUntilTarget = targetDate
      ? (targetDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24 * 365)
      : 10; // Default to 10 years if no target date

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

  // Retirement projections
  const retirementRule = calculate4PercentRule(netWorth.netWorth);
  const targetRetirementAmount = (monthlyExpenses * 12) / 0.04;
  const retirementGap = targetRetirementAmount - netWorth.netWorth;

  // Generate compound interest data for visualization
  const investmentGrowthData = calculateCompoundInterest(
    netWorth.netWorth > 0 ? netWorth.netWorth : 10000,
    savingsRate.monthlySavings > 0 ? savingsRate.monthlySavings : 500,
    annualReturnRate,
    30
  );

  const compoundInterestChartData = investmentGrowthData.yearByYear.map(y => ({
    year: `Year ${y.year}`,
    totalValue: y.balance,
    contributions: y.contributions,
    gains: y.gains,
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent mx-auto mb-2" />
          <p className="text-sm text-primary opacity-60">Loading projections...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-primary mb-2">Financial Projections</h2>
        <p className="text-sm text-primary opacity-70">
          Visualize your financial future based on current trajectory and assumptions
        </p>
      </div>

      {/* Settings Panel */}
      <div className="rounded-2xl bg-primary/30 backdrop-blur-sm shadow-sm ring-1 border-primary/20 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-primary">Projection Settings</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-primary opacity-70 mb-2">
              Projection Years
            </label>
            <select
              value={projectionYears}
              onChange={e => setProjectionYears(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value={5}>5 Years</option>
              <option value={10}>10 Years</option>
              <option value={20}>20 Years</option>
              <option value={30}>30 Years</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-primary opacity-70 mb-2">
              Expected Return Rate
            </label>
            <select
              value={annualReturnRate}
              onChange={e => setAnnualReturnRate(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value={5}>5% (Conservative)</option>
              <option value={7}>7% (Moderate)</option>
              <option value={9}>9% (Aggressive)</option>
              <option value={10}>10% (Very Aggressive)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-primary opacity-70 mb-2">
              Inflation Rate
            </label>
            <select
              value={inflationRate}
              onChange={e => setInflationRate(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value={2}>2%</option>
              <option value={3}>3%</option>
              <option value={4}>4%</option>
            </select>
          </div>
        </div>
      </div>

      {/* Net Worth Projection Chart */}
      <div className="rounded-2xl bg-primary/30 backdrop-blur-sm shadow-sm ring-1 border-primary/20 p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-emerald-600" />
          <h3 className="text-lg font-semibold text-primary">Net Worth Projection</h3>
        </div>
        <p className="text-sm text-primary opacity-70 mb-4">
          Projected growth based on current savings rate of {savingsRate.savingsRate.toFixed(1)}%
          ({formatCurrency(savingsRate.monthlySavings)}/month)
        </p>
        <Suspense fallback={
          <div className="flex items-center justify-center h-[350px]">
            <div className="text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent mx-auto mb-2" />
              <p className="text-sm text-primary opacity-60">Loading chart...</p>
            </div>
          </div>
        }>
          <NetWorthChart data={netWorthChartData} />
        </Suspense>
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="text-center p-3 rounded-lg bg-emerald-50">
            <p className="text-xs text-emerald-700 mb-1">Best Case</p>
            <p className="text-lg font-bold text-emerald-900">
              {formatCurrency(netWorthProjections[projectionYears - 1]?.optimistic || 0)}
            </p>
          </div>
          <div className="text-center p-3 rounded-lg bg-blue-50">
            <p className="text-xs text-blue-700 mb-1">Expected</p>
            <p className="text-lg font-bold text-blue-900">
              {formatCurrency(netWorthProjections[projectionYears - 1]?.baseCase || 0)}
            </p>
          </div>
          <div className="text-center p-3 rounded-lg bg-amber-50">
            <p className="text-xs text-amber-700 mb-1">Worst Case</p>
            <p className="text-lg font-bold text-amber-900">
              {formatCurrency(netWorthProjections[projectionYears - 1]?.pessimistic || 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Compound Interest Visualization (30 Year) */}
      <div className="rounded-2xl bg-primary/30 backdrop-blur-sm shadow-sm ring-1 border-primary/20 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="h-5 w-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-primary">Power of Compound Interest (30 Years)</h3>
        </div>
        <p className="text-sm text-primary opacity-70 mb-4">
          Starting: {formatCurrency(netWorth.netWorth || 10000)} •
          Monthly: {formatCurrency(savingsRate.monthlySavings || 500)} •
          Return: {annualReturnRate}%
        </p>
        <Suspense fallback={
          <div className="flex items-center justify-center h-[350px]">
            <div className="text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent mx-auto mb-2" />
              <p className="text-sm text-primary opacity-60">Loading chart...</p>
            </div>
          </div>
        }>
          <CompoundInterestChart data={compoundInterestChartData.filter((_, i) => i % 2 === 0)} />
        </Suspense>
        <div className="mt-4 p-4 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50">
          <p className="text-sm font-semibold text-purple-900 mb-2">30-Year Summary:</p>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-purple-700">Total Contributed</p>
              <p className="font-bold text-purple-900">
                {formatCurrency(investmentGrowthData.totalContributed)}
              </p>
            </div>
            <div>
              <p className="text-emerald-700">Investment Gains</p>
              <p className="font-bold text-emerald-900">
                {formatCurrency(investmentGrowthData.totalGains)}
              </p>
            </div>
            <div>
              <p className="text-blue-700">Final Value</p>
              <p className="font-bold text-blue-900">
                {formatCurrency(investmentGrowthData.futureValue)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Goals Timeline */}
      {goals.length > 0 && (
        <div className="rounded-2xl bg-primary/30 backdrop-blur-sm shadow-sm ring-1 border-primary/20 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Target className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-primary">Goal Projections</h3>
          </div>
          <div className="space-y-3">
            {goalProjections.map(goal => {
              const progress = ((goal.currentAmount || 0) / goal.targetAmount) * 100;
              const isOnTrack = goal.onTrack;

              return (
                <div key={goal.id} className="p-4 rounded-lg bg-primary/20">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="font-semibold text-primary">{goal.name}</p>
                      <p className="text-xs text-primary opacity-60">
                        {formatCurrency(goal.currentAmount || 0)} / {formatCurrency(goal.targetAmount)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-semibold ${isOnTrack ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {goal.yearsToGoal === Infinity ? '∞' : goal.yearsToGoal.toFixed(1)} years
                      </p>
                      <p className="text-xs text-primary opacity-60">at current rate</p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div
                      className={`h-2 rounded-full ${isOnTrack ? 'bg-emerald-500' : 'bg-amber-500'}`}
                      style={{ width: `${Math.min(100, progress)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <p className="text-primary opacity-70">
                      {isOnTrack ? '✓ On track' : '⚠ Behind schedule'} •
                      Required: {formatCurrency(goal.monthlyRequired)}/mo
                    </p>
                    <p className="text-primary opacity-70">
                      {progress.toFixed(0)}% complete
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Retirement Planning */}
      <div className="rounded-2xl bg-primary/30 backdrop-blur-sm shadow-sm ring-1 border-primary/20 p-5">
        <div className="flex items-center gap-2 mb-4">
          <PiggyBank className="h-5 w-5 text-amber-600" />
          <h3 className="text-lg font-semibold text-primary">Retirement Planning</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-blue-50">
            <p className="text-sm text-blue-700 mb-2">Current Safe Withdrawal (4% Rule)</p>
            <p className="text-3xl font-bold text-blue-900">
              {formatCurrency(retirementRule.monthlyWithdrawal)}
            </p>
            <p className="text-xs text-blue-600 mt-1">per month</p>
            <p className="text-sm text-blue-700 mt-3">
              Based on current net worth of {formatCurrency(netWorth.netWorth)}
            </p>
          </div>
          <div className="p-4 rounded-lg bg-purple-50">
            <p className="text-sm text-purple-700 mb-2">Target Retirement Amount</p>
            <p className="text-3xl font-bold text-purple-900">
              {formatCurrency(targetRetirementAmount)}
            </p>
            <p className="text-xs text-purple-600 mt-1">
              to cover {formatCurrency(monthlyExpenses)}/mo expenses
            </p>
            {retirementGap > 0 && (
              <p className="text-sm text-purple-700 mt-3">
                Need {formatCurrency(retirementGap)} more to reach target
              </p>
            )}
          </div>
        </div>
        <div className="mt-4 p-4 rounded-lg bg-gradient-to-r from-emerald-50 to-teal-50">
          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-emerald-900 mb-1">
                Financial Independence Timeline
              </p>
              <p className="text-sm text-emerald-700">
                At your current savings rate of {savingsRate.savingsRate.toFixed(1)}%,
                you could achieve financial independence in approximately{' '}
                <span className="font-bold">
                  {yearsToFI.yearsToFI === Infinity ? '∞' : yearsToFI.yearsToFI.toFixed(0)} years
                </span>.
              </p>
              <p className="text-xs text-emerald-600 mt-2">
                {yearsToFI.interpretation}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Assumptions Note */}
      <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
        <p className="text-xs text-amber-800">
          <strong>Note:</strong> These projections are estimates based on your current financial situation and assumptions.
          Actual results may vary due to market conditions, life changes, and other factors.
          Adjust the settings above to see how different scenarios affect your projections.
        </p>
      </div>
    </div>
  );
};

export default ProjectionsPage;
