/**
 * ProjectionsPage - Financial projections and future planning
 * Shows net worth growth, goal timelines, and retirement projections
 */

import React, { lazy, Suspense } from 'react';
import {
  TrendingUp,
  Zap,
} from 'lucide-react';
import type { Account, Transaction, Goal } from '../types';
import {
  projectNetWorth,
  calculateCompoundInterest,
} from '../utils/calculations';
import { useAccountsQuery, useTransactionsQuery, useGoalsQuery } from '../hooks/useFinanceQuery';
import {
  calculateProjectionMetrics,
  calculateGoalProjections,
  prepareNetWorthChartData,
  prepareCompoundInterestChartData,
} from '../utils/projectionCalculations';
import { formatCurrency } from '../utils/currency';
import { ProjectionSettings } from '../components/projections/ProjectionSettings';
import { GoalProjectionsCard } from '../components/projections/GoalProjectionsCard';
import { RetirementPlanningCard } from '../components/projections/RetirementPlanningCard';

// Lazy load chart components to defer loading Recharts
const NetWorthChart = lazy(() => import('../components/ProjectionCharts').then(module => ({ default: module.NetWorthChart })));
const CompoundInterestChart = lazy(() => import('../components/ProjectionCharts').then(module => ({ default: module.CompoundInterestChart })));

const ProjectionsPage: React.FC = () => {
  // Use React Query hooks for data fetching
  const { data: accounts = [], isLoading: accountsLoading } = useAccountsQuery();
  const { data: transactions = [], isLoading: transactionsLoading } = useTransactionsQuery({ limit: 1000 });
  const { data: goals = [], isLoading: goalsLoading } = useGoalsQuery();

  const loading = accountsLoading || transactionsLoading || goalsLoading;

  // Projection settings
  const [projectionYears, setProjectionYears] = React.useState(10);
  const [annualReturnRate, setAnnualReturnRate] = React.useState(7);
  const [inflationRate, setInflationRate] = React.useState(3);

  const metrics = calculateProjectionMetrics(accounts, transactions);
  const { netWorth, savingsRate, yearsToFI, monthlyExpenses } = metrics;

  const netWorthProjections = projectNetWorth(
    netWorth.netWorth,
    savingsRate.monthlySavings,
    annualReturnRate,
    projectionYears
  );

  const netWorthChartData = prepareNetWorthChartData(netWorth, netWorthProjections);

  const goalProjections = calculateGoalProjections(goals, savingsRate, annualReturnRate);

  const investmentGrowthData = calculateCompoundInterest(
    netWorth.netWorth > 0 ? netWorth.netWorth : 10000,
    savingsRate.monthlySavings > 0 ? savingsRate.monthlySavings : 500,
    annualReturnRate,
    30
  );

  const compoundInterestChartData = prepareCompoundInterestChartData(investmentGrowthData);

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

      <ProjectionSettings
        projectionYears={projectionYears}
        setProjectionYears={setProjectionYears}
        annualReturnRate={annualReturnRate}
        setAnnualReturnRate={setAnnualReturnRate}
        inflationRate={inflationRate}
        setInflationRate={setInflationRate}
      />

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

      <GoalProjectionsCard goalProjections={goalProjections} />

      <RetirementPlanningCard
        netWorth={netWorth.netWorth}
        monthlyExpenses={monthlyExpenses}
        savingsRate={savingsRate.savingsRate}
        yearsToFI={yearsToFI.yearsToFI}
        yearsToFIInterpretation={yearsToFI.interpretation}
      />

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
