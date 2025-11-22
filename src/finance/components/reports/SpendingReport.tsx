/**
 * SpendingReport Component
 *
 * Detailed spending analysis by category with breakdowns and insights.
 */

import React from 'react';
import { Card } from '../Card';
import { Progress } from '../Progress';
import { formatCurrency } from '../../utils/currency';
import type { Transaction, Category } from '../../types';
import type { DateRange } from '../../utils/timePeriodUtils';
import type { FinanceMetrics } from '../../hooks/useFinanceMetrics';
import { TrendingDown, AlertCircle } from 'lucide-react';

export interface SpendingReportProps {
  transactions: Transaction[];
  categories: Category[];
  dateRange: DateRange;
  metrics: FinanceMetrics;
}

const SpendingReport: React.FC<SpendingReportProps> = ({
  _transactions,
  _categories,
  dateRange,
  metrics,
}) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900">Spending Analysis</h3>
        <p className="mt-1 text-sm text-slate-600">
          {dateRange.label} • Breakdown by category and insights
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/20 p-4">
          <div className="text-sm font-semibold text-primary">Total Spending</div>
          <div className="mt-2 text-3xl font-bold text-primary">
            {formatCurrency(metrics.summary.totalExpenses)}
          </div>
          {metrics.trend && (
            <div className="mt-1 text-sm font-medium text-primary opacity-80">
              {metrics.trend.expensesChange >= 0 ? '+' : ''}
              {formatCurrency(metrics.trend.expensesChange)} vs last period
            </div>
          )}
        </div>

        <div className="rounded-lg border border-white/20 bg-white/10 p-4">
          <div className="text-sm font-semibold text-primary">Categories</div>
          <div className="mt-2 text-3xl font-bold text-primary">
            {metrics.categoryStats.totalCategories}
          </div>
          <div className="mt-1 text-sm font-medium text-primary opacity-70">
            Avg {formatCurrency(metrics.categoryStats.averagePerCategory)} per category
          </div>
        </div>

        <div className="rounded-lg border border-white/20 bg-white/10 p-4">
          <div className="text-sm font-semibold text-primary">Top Category</div>
          <div className="mt-2 text-lg font-bold text-primary">
            {metrics.categoryStats.topCategory?.categoryName || 'N/A'}
          </div>
          <div className="mt-1 text-sm font-medium text-primary opacity-70">
            {metrics.categoryStats.topCategory
              ? formatCurrency(metrics.categoryStats.topCategory.totalAmount)
              : 'No expenses'}
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <Card title="Spending by Category">
        <div className="space-y-3">
          {metrics.categoryAggregates.length > 0 ? (
            metrics.categoryAggregates.map((cat) => (
              <div key={cat.categoryId} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-primary">
                        {cat.categoryName}
                      </span>
                      {cat.percentage > 30 && (
                        <AlertCircle className="h-4 w-4 text-orange-400" />
                      )}
                    </div>
                    <div className="text-sm text-primary opacity-70">
                      {cat.transactionCount} transactions • Avg {formatCurrency(cat.averageAmount)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-bold text-primary">
                      {formatCurrency(cat.totalAmount)}
                    </div>
                    <div className="text-sm text-primary opacity-70">
                      {cat.percentage.toFixed(1)}%
                    </div>
                  </div>
                </div>
                <Progress value={cat.percentage} max={100} className="h-2" />
              </div>
            ))
          ) : (
            <p className="text-center py-8 text-primary opacity-70">No spending data for this period</p>
          )}
        </div>
      </Card>

      {/* Insights */}
      {metrics.categoryAggregates.length > 0 && (
        <Card title="Spending Insights">
          <div className="space-y-3">
            {/* High spending categories */}
            {metrics.categoryAggregates.filter(cat => cat.percentage > 25).length > 0 && (
              <div className="rounded-lg bg-orange-500/20 border border-orange-500/30 p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-primary">
                      High Concentration Alert
                    </div>
                    <div className="mt-1 text-sm text-primary opacity-90">
                      {metrics.categoryAggregates.filter(cat => cat.percentage > 25).map(cat => cat.categoryName).join(', ')}
                      {' '}account{metrics.categoryAggregates.filter(cat => cat.percentage > 25).length > 1 ? '' : 's'} for over 25% of your spending.
                      Consider diversifying your expenses or reviewing these categories for potential savings.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Trend insight */}
            {metrics.trend && metrics.trend.expensesChangePercent > 10 && (
              <div className="rounded-lg bg-yellow-500/20 border border-yellow-500/30 p-3">
                <div className="flex items-start gap-2">
                  <TrendingDown className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-primary">
                      Spending Increased
                    </div>
                    <div className="mt-1 text-sm text-primary opacity-90">
                      Your spending is up {metrics.trend.expensesChangePercent.toFixed(1)}% compared to last period
                      ({formatCurrency(metrics.trend.expensesChange)} more). Review your recent transactions to identify areas to cut back.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Positive trend */}
            {metrics.trend && metrics.trend.expensesChangePercent < -5 && (
              <div className="rounded-lg bg-emerald-500/20 border border-emerald-500/30 p-3">
                <div className="flex items-start gap-2">
                  <TrendingDown className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-primary">
                      Great Progress!
                    </div>
                    <div className="mt-1 text-sm text-primary opacity-90">
                      You've reduced spending by {Math.abs(metrics.trend.expensesChangePercent).toFixed(1)}%
                      ({formatCurrency(Math.abs(metrics.trend.expensesChange))} saved) compared to last period. Keep it up!
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default SpendingReport;
