/**
 * IncomeReport Component
 *
 * Income analysis showing sources, trends, and month-over-month comparison.
 */

import React from 'react';
import { Card } from '../Card';
import { formatCurrency } from '../../utils/currency';
import type { Transaction, Category } from '../../types';
import type { DateRange } from '../../utils/timePeriodUtils';
import type { FinanceMetrics } from '../../hooks/useFinanceMetrics';
import { TrendingUp, DollarSign, Briefcase } from 'lucide-react';
import { aggregateByCategory } from '../../utils/categoryAggregator';

export interface IncomeReportProps {
  transactions: Transaction[];
  categories: Category[];
  dateRange: DateRange;
  metrics: FinanceMetrics;
}

const IncomeReport: React.FC<IncomeReportProps> = ({
  transactions,
  categories,
  dateRange,
  metrics,
}) => {
  // Get income-specific aggregates
  const incomeAggregates = React.useMemo(
    () => aggregateByCategory(
      metrics.cashFlow.incomeTransactions,
      categories,
      { type: 'credit', includeUncategorized: true }
    ),
    [metrics.cashFlow.incomeTransactions, categories]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-primary">Income Analysis</h3>
        <p className="mt-1 text-sm text-primary opacity-70">
          {dateRange.label} • Income sources and trends
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/20 p-4">
          <div className="text-sm font-medium text-primary">Total Income</div>
          <div className="mt-2 text-2xl font-semibold text-primary">
            {formatCurrency(metrics.summary.totalIncome)}
          </div>
          {metrics.trend && (
            <div className="mt-1 text-sm text-primary opacity-80">
              {metrics.trend.incomeChange >= 0 ? '+' : ''}
              {formatCurrency(metrics.trend.incomeChange)} vs last period
            </div>
          )}
        </div>

        <div className="rounded-lg border border-white/20 bg-white/10 p-4">
          <div className="text-sm font-medium text-primary">Income Sources</div>
          <div className="mt-2 text-2xl font-semibold text-primary">
            {incomeAggregates.length}
          </div>
          <div className="mt-1 text-sm text-primary opacity-70">
            {metrics.cashFlow.incomeTransactions.length} transactions
          </div>
        </div>

        <div className="rounded-lg border border-white/20 bg-white/10 p-4">
          <div className="text-sm font-medium text-primary">Average Income</div>
          <div className="mt-2 text-2xl font-semibold text-primary">
            {formatCurrency(
              metrics.cashFlow.incomeTransactions.length > 0
                ? metrics.summary.totalIncome / metrics.cashFlow.incomeTransactions.length
                : 0
            )}
          </div>
          <div className="mt-1 text-sm text-primary opacity-70">per transaction</div>
        </div>
      </div>

      {/* Income Sources Breakdown */}
      <Card
        title="Income Sources"
        actions={
          <div className="text-sm text-primary opacity-70">
            Showing all {incomeAggregates.length} sources
          </div>
        }
      >
        <div className="space-y-2">
          {incomeAggregates.length > 0 ? (
            incomeAggregates.map((source) => (
              <div
                key={source.categoryId}
                className="flex items-center justify-between rounded-lg bg-emerald-500/20 border border-emerald-500/30 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-emerald-500/30 p-2">
                    <DollarSign className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-primary">
                      {source.categoryName}
                    </div>
                    <div className="text-xs text-primary opacity-70">
                      {source.transactionCount} payment{source.transactionCount !== 1 ? 's' : ''} •
                      Avg {formatCurrency(source.averageAmount)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-base font-semibold text-primary">
                    {formatCurrency(source.totalAmount)}
                  </div>
                  <div className="text-xs text-primary opacity-70">
                    {source.percentage.toFixed(1)}% of total
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <Briefcase className="h-12 w-12 text-primary opacity-30 mx-auto mb-2" />
              <p className="text-primary opacity-70">No income recorded for this period</p>
            </div>
          )}
        </div>
      </Card>

      {/* Income Insights */}
      {incomeAggregates.length > 0 && (
        <Card title="Income Insights">
          <div className="space-y-3">
            {/* Primary income source */}
            {incomeAggregates[0] && incomeAggregates[0].percentage > 80 && (
              <div className="rounded-lg bg-blue-500/20 border border-blue-500/30 p-3">
                <div className="flex items-start gap-2">
                  <Briefcase className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-primary">
                      Single Primary Income Source
                    </div>
                    <div className="mt-1 text-sm text-primary opacity-90">
                      {incomeAggregates[0].categoryName} accounts for {incomeAggregates[0].percentage.toFixed(0)}% of your income.
                      Consider diversifying income streams for financial stability.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Income growth */}
            {metrics.trend && metrics.trend.incomeChangePercent > 5 && (
              <div className="rounded-lg bg-emerald-500/20 border border-emerald-500/30 p-3">
                <div className="flex items-start gap-2">
                  <TrendingUp className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-primary">
                      Income Growth
                    </div>
                    <div className="mt-1 text-sm text-primary opacity-90">
                      Your income increased by {metrics.trend.incomeChangePercent.toFixed(1)}%
                      ({formatCurrency(metrics.trend.incomeChange)}) compared to last period. Great progress!
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Income decline */}
            {metrics.trend && metrics.trend.incomeChangePercent < -5 && (
              <div className="rounded-lg bg-orange-500/20 border border-orange-500/30 p-3">
                <div className="flex items-start gap-2">
                  <TrendingUp className="h-5 w-5 text-primary flex-shrink-0 mt-0.5 rotate-180" />
                  <div>
                    <div className="text-sm font-medium text-primary">
                      Income Decline
                    </div>
                    <div className="mt-1 text-sm text-primary opacity-90">
                      Your income decreased by {Math.abs(metrics.trend.incomeChangePercent).toFixed(1)}%
                      ({formatCurrency(Math.abs(metrics.trend.incomeChange))}) compared to last period.
                      Consider reviewing your income sources.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Diversification */}
            {incomeAggregates.length >= 3 && (
              <div className="rounded-lg bg-green-500/20 border border-green-500/30 p-3">
                <div className="flex items-start gap-2">
                  <DollarSign className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-primary">
                      Well Diversified
                    </div>
                    <div className="mt-1 text-sm text-primary opacity-90">
                      You have {incomeAggregates.length} income sources, which provides good financial stability
                      and reduces dependency on a single source.
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

export default IncomeReport;
