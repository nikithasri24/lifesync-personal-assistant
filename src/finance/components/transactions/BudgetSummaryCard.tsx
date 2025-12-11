/**
 * BudgetSummaryCard
 * Displays budget summary metrics including total budgeted, spent, remaining, and alerts
 */

import React from 'react';
import { Card } from '../Card';
import { formatCurrency } from '../../utils/currency';

interface BudgetSummaryMetrics {
  categoriesWithBudgets: number;
  totalCategories: number;
  totalBudgeted: number;
  totalSpent: number;
  totalRemaining: number;
  overBudgetCount: number;
  utilizationPercent: number;
}

interface BudgetSummaryCardProps {
  summary: BudgetSummaryMetrics;
}

export const BudgetSummaryCard: React.FC<BudgetSummaryCardProps> = ({ summary }) => {
  if (summary.categoriesWithBudgets === 0) {
    return null;
  }

  return (
    <Card title="Budget Summary">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Budgeted */}
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="text-xs font-medium text-blue-700 mb-1">Total Budgeted</div>
          <div className="text-2xl font-bold text-blue-900">{formatCurrency(summary.totalBudgeted)}</div>
          <div className="text-xs text-blue-600 mt-1">
            {summary.categoriesWithBudgets} of {summary.totalCategories} categories
          </div>
        </div>

        {/* Total Spent */}
        <div className="bg-slate-50 rounded-lg p-4">
          <div className="text-xs font-medium text-slate-700 mb-1">Total Spent</div>
          <div className="text-2xl font-bold text-slate-900">{formatCurrency(summary.totalSpent)}</div>
          <div className="text-xs text-slate-600 mt-1">
            {summary.utilizationPercent.toFixed(1)}% utilized
          </div>
        </div>

        {/* Remaining */}
        <div className={`rounded-lg p-4 ${
          summary.totalRemaining < 0 ? 'bg-rose-50' : 'bg-emerald-50'
        }`}>
          <div className={`text-xs font-medium mb-1 ${
            summary.totalRemaining < 0 ? 'text-rose-700' : 'text-emerald-700'
          }`}>
            {summary.totalRemaining < 0 ? 'Over Budget' : 'Remaining'}
          </div>
          <div className={`text-2xl font-bold ${
            summary.totalRemaining < 0 ? 'text-rose-900' : 'text-emerald-900'
          }`}>
            {formatCurrency(Math.abs(summary.totalRemaining))}
          </div>
          <div className={`text-xs mt-1 ${
            summary.totalRemaining < 0 ? 'text-rose-600' : 'text-emerald-600'
          }`}>
            {summary.totalRemaining < 0 ? 'Need to reduce' : 'Available to spend'}
          </div>
        </div>

        {/* Alerts */}
        <div className={`rounded-lg p-4 ${
          summary.overBudgetCount > 0 ? 'bg-amber-50' : 'bg-green-50'
        }`}>
          <div className={`text-xs font-medium mb-1 ${
            summary.overBudgetCount > 0 ? 'text-amber-700' : 'text-green-700'
          }`}>
            Budget Status
          </div>
          <div className={`text-2xl font-bold ${
            summary.overBudgetCount > 0 ? 'text-amber-900' : 'text-green-900'
          }`}>
            {summary.overBudgetCount}
          </div>
          <div className={`text-xs mt-1 ${
            summary.overBudgetCount > 0 ? 'text-amber-600' : 'text-green-600'
          }`}>
            {summary.overBudgetCount > 0
              ? `${summary.overBudgetCount} over budget`
              : 'All on track'}
          </div>
        </div>
      </div>

      {/* Overall Progress Bar */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-700">Overall Budget Progress</span>
          <span className="text-xs text-slate-600">
            {summary.utilizationPercent.toFixed(1)}%
          </span>
        </div>
        <div className="h-3 w-full rounded-full bg-slate-200 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              summary.utilizationPercent > 100
                ? 'bg-rose-500'
                : summary.utilizationPercent > 90
                ? 'bg-amber-500'
                : 'bg-emerald-500'
            }`}
            style={{
              width: `${Math.min(100, summary.utilizationPercent)}%`,
            }}
          />
        </div>
      </div>
    </Card>
  );
};

export type { BudgetSummaryMetrics };

