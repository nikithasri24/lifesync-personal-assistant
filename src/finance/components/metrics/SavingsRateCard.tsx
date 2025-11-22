/**
 * SavingsRateCard Component
 *
 * Specialized card for displaying savings rate with visual indicator.
 */

import React from 'react';
import { TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { formatSavingsRate, getSavingsRateStatus } from '../../utils/savingsRate';

export interface SavingsRateCardProps {
  savingsRate: number;
  savings: number;
  income: number;
  expenses: number;
  className?: string;
}

const SavingsRateCard: React.FC<SavingsRateCardProps> = ({
  savingsRate,
  savings,
  income,
  _expenses,
  className = '',
}) => {
  const status = getSavingsRateStatus(savingsRate);
  const isPositive = savingsRate >= 0;

  // Calculate percentage for progress bar
  const progressPercent = Math.min(Math.max(savingsRate, 0), 100);

  return (
    <div className={`rounded-lg border border-slate-200 bg-white p-4 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-primary">Savings Rate</p>
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${status.colorClass}`}>
              {status.label}
            </span>
          </div>

          <div className="mt-2 flex items-baseline gap-2">
            <p className="text-3xl font-bold text-primary">
              {formatSavingsRate(savingsRate)}
            </p>
          </div>

          <div className="mt-3 text-sm text-primary opacity-70">
            <p>Saving <span className="font-semibold text-primary opacity-100">${Math.abs(savings).toLocaleString()}</span> of ${income.toLocaleString()} income</p>
          </div>
        </div>

        <div className="flex-shrink-0 text-primary opacity-80">
          {isPositive ? (
            <TrendingUp className="h-8 w-8" />
          ) : (
            <TrendingDown className="h-8 w-8" />
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-4">
        <div className="h-2 w-full rounded-full bg-slate-100">
          <div
            className={`h-2 rounded-full transition-all ${
              savingsRate >= 20
                ? 'bg-emerald-500'
                : savingsRate >= 10
                ? 'bg-green-500'
                : savingsRate >= 5
                ? 'bg-yellow-500'
                : savingsRate >= 0
                ? 'bg-orange-500'
                : 'bg-rose-500'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="mt-1 flex justify-between text-xs text-slate-500">
          <span>0%</span>
          <span>20% (Goal)</span>
        </div>
      </div>

      {/* Savings Insight */}
      {savingsRate < 10 && savingsRate >= 0 && (
        <div className="mt-3 flex items-start gap-2 rounded-lg bg-yellow-50 p-2 text-xs text-yellow-800">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <p>
            Aim for 10-20% savings rate for healthy finances.
            Reduce expenses by ${Math.ceil((income * 0.1) - savings).toLocaleString()} to reach 10%.
          </p>
        </div>
      )}

      {savingsRate < 0 && (
        <div className="mt-3 flex items-start gap-2 rounded-lg bg-rose-50 p-2 text-xs text-rose-800">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <p>
            You're spending more than you earn. Review your budget and cut unnecessary expenses.
          </p>
        </div>
      )}
    </div>
  );
};

export default SavingsRateCard;
