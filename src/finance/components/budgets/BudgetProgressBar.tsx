/**
 * BudgetProgressBar Component
 *
 * Color-coded progress bar for budget tracking with YNAB-style thresholds:
 * - Green (0-79%): Safe spending
 * - Yellow (80-99%): Warning - approaching limit
 * - Red (100%+): Over budget
 */

import React from 'react';

export interface BudgetProgressBarProps {
  spent: number;
  limit: number;
  className?: string;
  showPercentage?: boolean;
}

export type BudgetStatus = 'safe' | 'warning' | 'over';

export const getBudgetStatus = (percentage: number): BudgetStatus => {
  if (percentage >= 100) return 'over';
  if (percentage >= 80) return 'warning';
  return 'safe';
};

const getBudgetColor = (status: BudgetStatus): string => {
  switch (status) {
    case 'over':
      return 'rose'; // Red
    case 'warning':
      return 'amber'; // Yellow
    case 'safe':
    default:
      return 'emerald'; // Green
  }
};

const BudgetProgressBar: React.FC<BudgetProgressBarProps> = ({
  spent,
  limit,
  className = '',
  showPercentage = false,
}) => {
  const percentage = limit > 0 ? (spent / limit) * 100 : 0;
  const cappedPercentage = Math.min(100, percentage); // Cap visual at 100%
  const status = getBudgetStatus(percentage);
  const color = getBudgetColor(status);

  // Color classes based on status
  const colorClasses: Record<string, { bg: string; text: string }> = {
    emerald: {
      bg: 'bg-emerald-500',
      text: 'text-emerald-700',
    },
    amber: {
      bg: 'bg-amber-500',
      text: 'text-amber-700',
    },
    rose: {
      bg: 'bg-rose-500',
      text: 'text-rose-700',
    },
  };

  const { bg, text } = colorClasses[color];

  return (
    <div className={`space-y-1 ${className}`}>
      {/* Progress bar */}
      <div className="h-2.5 w-full rounded-full bg-primary/20">
        <div
          className={`h-2.5 rounded-full ${bg} transition-all duration-300`}
          style={{ width: `${cappedPercentage}%` }}
        />
      </div>

      {/* Percentage indicator */}
      {showPercentage && (
        <div className="flex items-center justify-between text-xs">
          <span className={`font-semibold ${text}`}>
            {percentage.toFixed(0)}% used
          </span>
          {percentage >= 100 && (
            <span className="text-rose-600 font-semibold">Over budget!</span>
          )}
        </div>
      )}
    </div>
  );
};

export default BudgetProgressBar;
