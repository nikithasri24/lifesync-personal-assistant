/**
 * BudgetCard Component
 *
 * Enhanced budget card with color-coded progress, visual insights, and quick actions.
 * Matches the quality and design of the Reports page components.
 */

import React from 'react';
import { Edit2, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';
import BudgetProgressBar, { getBudgetStatus, getBudgetColor } from './BudgetProgressBar';
import type { Budget } from '../../types';

export interface BudgetCardProps {
  budget: Budget;
  spent: number;
  categoryName: string;
  previousMonthSpent?: number;
  onEdit?: () => void;
  className?: string;
}

const BudgetCard: React.FC<BudgetCardProps> = ({
  budget,
  spent,
  categoryName,
  previousMonthSpent,
  onEdit,
  className = '',
}) => {
  const { limit } = budget;
  const remaining = limit - spent;
  const percentage = limit > 0 ? (spent / limit) * 100 : 0;
  const status = getBudgetStatus(percentage);
  const color = getBudgetColor(status);

  // Calculate trend vs previous month
  const hasTrend = previousMonthSpent !== undefined && previousMonthSpent > 0;
  const trendPercentage = hasTrend
    ? ((spent - previousMonthSpent) / previousMonthSpent) * 100
    : 0;
  const isIncreasing = trendPercentage > 0;

  // Status-based styling
  const statusConfig = {
    safe: {
      borderColor: 'border-emerald-500/30',
      bgColor: 'bg-emerald-500/10',
      textColor: 'text-emerald-700',
      icon: '✓',
    },
    warning: {
      borderColor: 'border-amber-500/30',
      bgColor: 'bg-amber-500/10',
      textColor: 'text-amber-700',
      icon: '⚠️',
    },
    over: {
      borderColor: 'border-rose-500/30',
      bgColor: 'bg-rose-500/10',
      textColor: 'text-rose-700',
      icon: '🔴',
    },
  };

  const config = statusConfig[status];

  return (
    <div
      className={`rounded-2xl bg-primary/30 backdrop-blur-sm shadow-sm ring-1 ${config.borderColor} p-4 transition-all hover:shadow-md ${className}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-base font-semibold text-primary">{categoryName}</h3>
          <p className="text-xs text-primary opacity-60 mt-0.5">
            {budget.month} Budget
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-lg">{config.icon}</span>
          {onEdit && (
            <button
              onClick={onEdit}
              className="rounded-lg p-1.5 hover:bg-primary/20 transition-colors"
              aria-label={`Edit ${categoryName} budget`}
            >
              <Edit2 className="h-4 w-4 text-primary opacity-60 hover:opacity-100" />
            </button>
          )}
        </div>
      </div>

      {/* Budget amounts */}
      <div className="space-y-2 mb-3">
        <div className="flex items-baseline justify-between">
          <span className="text-xs font-medium text-primary opacity-70">Budgeted</span>
          <span className="text-sm font-semibold text-primary">
            {formatCurrency(limit)}
          </span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-xs font-medium text-primary opacity-70">Spent</span>
          <span className={`text-sm font-semibold ${config.textColor}`}>
            {formatCurrency(spent)}
          </span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-xs font-medium text-primary opacity-70">Remaining</span>
          <span
            className={`text-sm font-semibold ${
              remaining >= 0 ? 'text-emerald-700' : 'text-rose-700'
            }`}
          >
            {formatCurrency(Math.abs(remaining))}
            {remaining < 0 && ' over'}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <BudgetProgressBar spent={spent} limit={limit} showPercentage />

      {/* Insights */}
      <div className="mt-3 space-y-2">
        {/* Trend indicator */}
        {hasTrend && Math.abs(trendPercentage) > 5 && (
          <div className={`flex items-center gap-1.5 text-xs ${config.bgColor} rounded-lg px-2 py-1.5`}>
            {isIncreasing ? (
              <TrendingUp className="h-3.5 w-3.5 text-rose-600" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5 text-emerald-600" />
            )}
            <span className="text-primary opacity-80">
              {isIncreasing ? '+' : ''}
              {trendPercentage.toFixed(0)}% vs last month
            </span>
          </div>
        )}

        {/* Warning messages */}
        {status === 'warning' && (
          <div className="flex items-start gap-1.5 text-xs bg-amber-500/20 border border-amber-500/30 rounded-lg px-2 py-1.5">
            <AlertCircle className="h-3.5 w-3.5 text-amber-700 flex-shrink-0 mt-0.5" />
            <span className="text-primary opacity-90">
              You've used {percentage.toFixed(0)}% of your budget. Consider slowing spending.
            </span>
          </div>
        )}

        {status === 'over' && (
          <div className="flex items-start gap-1.5 text-xs bg-rose-500/20 border border-rose-500/30 rounded-lg px-2 py-1.5">
            <AlertCircle className="h-3.5 w-3.5 text-rose-700 flex-shrink-0 mt-0.5" />
            <span className="text-primary opacity-90">
              Over budget by {formatCurrency(Math.abs(remaining))}. Review this category's spending.
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default BudgetCard;
