/**
 * BudgetSummary Component
 *
 * Displays monthly budget overview with total budgeted, spent, and remaining amounts.
 * Includes overall progress bar and status indicators.
 */

import React from 'react';
import { PiggyBank, TrendingDown, TrendingUp, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';
import BudgetProgressBar from './BudgetProgressBar';
import { getBudgetStatus } from './budgetStatus';

export interface BudgetSummaryData {
  totalBudget: number;
  totalSpent: number;
  categoriesCount: number;
  overBudgetCount: number;
  warningCount: number;
  okCount: number;
}

export interface BudgetSummaryProps {
  data: BudgetSummaryData;
  month: string;
  className?: string;
}

const BudgetSummary: React.FC<BudgetSummaryProps> = ({ data, month, className = '' }) => {
  const { totalBudget, totalSpent, categoriesCount, overBudgetCount, warningCount, okCount } =
    data;
  const remaining = totalBudget - totalSpent;
  const percentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  const _status = getBudgetStatus(percentage);

  // Format month display
  const monthDisplay = new Date(month + '-01').toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div
      className={`rounded-2xl bg-primary/30 backdrop-blur-sm shadow-lg ring-1 ring-primary/20 p-6 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="rounded-xl bg-primary/20 p-2.5">
          <PiggyBank className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-primary">Budget Summary</h2>
          <p className="text-sm text-primary opacity-60">{monthDisplay}</p>
        </div>
      </div>

      {/* Main metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        {/* Total Budget */}
        <div className="rounded-lg bg-blue-500/20 border border-blue-500/30 p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-4 w-4 text-blue-600" />
            <span className="text-xs font-medium text-primary opacity-70">Total Budgeted</span>
          </div>
          <div className="text-2xl font-bold text-primary">{formatCurrency(totalBudget)}</div>
          <div className="text-xs text-primary opacity-60 mt-1">
            Across {categoriesCount} {categoriesCount === 1 ? 'category' : 'categories'}
          </div>
        </div>

        {/* Total Spent */}
        <div className="rounded-lg bg-rose-500/20 border border-rose-500/30 p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="h-4 w-4 text-rose-600" />
            <span className="text-xs font-medium text-primary opacity-70">Total Spent</span>
          </div>
          <div className="text-2xl font-bold text-primary">{formatCurrency(totalSpent)}</div>
          <div className="text-xs text-primary opacity-60 mt-1">
            {percentage.toFixed(1)}% of budget used
          </div>
        </div>

        {/* Remaining */}
        <div
          className={`rounded-lg ${
            remaining >= 0
              ? 'bg-emerald-500/20 border-emerald-500/30'
              : 'bg-rose-500/20 border-rose-500/30'
          } border p-4`}
        >
          <div className="flex items-center gap-2 mb-1">
            <PiggyBank className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium text-primary opacity-70">
              {remaining >= 0 ? 'Remaining' : 'Over Budget'}
            </span>
          </div>
          <div
            className={`text-2xl font-bold ${
              remaining >= 0 ? 'text-emerald-700' : 'text-rose-700'
            }`}
          >
            {formatCurrency(Math.abs(remaining))}
          </div>
          {remaining >= 0 ? (
            <div className="text-xs text-emerald-700 mt-1">Available to allocate</div>
          ) : (
            <div className="text-xs text-rose-700 mt-1">Exceeding budget</div>
          )}
        </div>
      </div>

      {/* Overall progress bar */}
      <div className="mb-4">
        <BudgetProgressBar spent={totalSpent} limit={totalBudget} showPercentage />
      </div>

      {/* Status breakdown */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500"></div>
            <span className="text-primary opacity-70">
              {okCount} on track
            </span>
          </div>
          {warningCount > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-amber-500"></div>
              <span className="text-primary opacity-70">
                {warningCount} warning
              </span>
            </div>
          )}
          {overBudgetCount > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-rose-500"></div>
              <span className="text-primary opacity-70">
                {overBudgetCount} over
              </span>
            </div>
          )}
        </div>

        {/* Alert if issues */}
        {(warningCount > 0 || overBudgetCount > 0) && (
          <div className="flex items-center gap-1.5 text-amber-700">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-xs font-medium">Attention needed</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default BudgetSummary;
