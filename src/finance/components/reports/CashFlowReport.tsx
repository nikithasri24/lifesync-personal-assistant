/**
 * CashFlowReport Component
 *
 * Displays cash flow visualization with Sankey diagram.
 * Shows flow from income sources through categories to expenses/savings.
 */

import React from 'react';
import SankeyChart from '../visualizations/SankeyChart';
import { Card } from '../Card';
import { formatCurrency } from '../../utils/currency';
import type { Transaction, Category } from '../../types';
import type { DateRange } from '../../utils/timePeriodUtils';
import type { FinanceMetrics } from '../../hooks/useFinanceMetrics';

export interface CashFlowReportProps {
  transactions: Transaction[];
  categories: Category[];
  dateRange: DateRange;
  metrics: FinanceMetrics;
}

const CashFlowReport: React.FC<CashFlowReportProps> = ({


  dateRange,
  metrics,
}) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-primary">Cash Flow</h3>
        <p className="mt-1 text-sm text-primary opacity-70">
          {dateRange.label} • Visualizing money flow from income to expenses
        </p>
      </div>

      {/* Sankey Diagram */}
      <Card title="Money Flow Visualization">
        <div className="min-h-[400px]">
          {metrics.sankeyData.length > 0 ? (
            <SankeyChart
              data={metrics.sankeyData}
              width={800}
              height={500}
            />
          ) : (
            <div className="flex items-center justify-center py-12">
              <p className="text-primary opacity-70">No cash flow data for this period</p>
            </div>
          )}
        </div>
      </Card>

      {/* Cash Flow Summary */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Income Breakdown */}
        <Card title="Income Sources">
          <div className="space-y-2">
            {metrics.cashFlow.incomeTransactions.length > 0 ? (
              <>
                {metrics.cashFlowByCategory
                  .filter(cat => {
                    return metrics.cashFlow.incomeTransactions.some(
                      t => t.categoryId === cat.categoryId
                    );
                  })
                  .slice(0, 5)
                  .map((cat) => (
                    <div
                      key={cat.categoryId}
                      className="flex items-center justify-between rounded-lg bg-white/10 border border-white/20 px-3 py-2"
                    >
                      <div className="flex-1">
                        <div className="text-sm font-medium text-primary">
                          {cat.categoryName}
                        </div>
                        <div className="text-xs text-primary opacity-70">
                          {cat.transactionCount} transaction{cat.transactionCount !== 1 ? 's' : ''}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-primary">
                          {formatCurrency(cat.amount)}
                        </div>
                        <div className="text-xs text-primary opacity-70">
                          {cat.percentage.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  ))}
                {metrics.cashFlow.incomeTransactions.length === 0 && (
                  <p className="text-sm text-primary opacity-70 text-center py-4">
                    No income transactions
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-primary opacity-70 text-center py-4">
                No income for this period
              </p>
            )}
          </div>
        </Card>

        {/* Expense Breakdown */}
        <Card title="Top Expense Categories">
          <div className="space-y-2">
            {metrics.topCategories.length > 0 ? (
              <>
                {metrics.topCategories.slice(0, 5).map((cat) => (
                  <div
                    key={cat.categoryId}
                    className="flex items-center justify-between rounded-lg bg-white/10 border border-white/20 px-3 py-2"
                  >
                    <div className="flex-1">
                      <div className="text-sm font-medium text-primary">
                        {cat.categoryName}
                      </div>
                      <div className="text-xs text-primary opacity-70">
                        {cat.transactionCount} transaction{cat.transactionCount !== 1 ? 's' : ''}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-primary">
                        {formatCurrency(cat.totalAmount)}
                      </div>
                      <div className="text-xs text-primary opacity-70">
                        {cat.percentage.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <p className="text-sm text-primary opacity-70 text-center py-4">
                No expenses for this period
              </p>
            )}
          </div>
        </Card>
      </div>

      {/* Period Summary */}
      <Card title="Period Summary">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="rounded-lg bg-emerald-500/20 border border-emerald-500/30 p-4">
            <div className="text-sm font-medium text-primary">Total Income</div>
            <div className="mt-2 text-2xl font-semibold text-primary">
              {formatCurrency(metrics.cashFlow.totalIncome)}
            </div>
            <div className="mt-1 text-xs text-primary opacity-80">
              {metrics.cashFlow.incomeTransactions.length} transactions
            </div>
          </div>
          <div className="rounded-lg bg-rose-500/20 border border-rose-500/30 p-4">
            <div className="text-sm font-medium text-primary">Total Expenses</div>
            <div className="mt-2 text-2xl font-semibold text-primary">
              {formatCurrency(metrics.cashFlow.totalExpenses)}
            </div>
            <div className="mt-1 text-xs text-primary opacity-80">
              {metrics.cashFlow.expenseTransactions.length} transactions
            </div>
          </div>
          <div className={`rounded-lg p-4 border ${
            metrics.cashFlow.netCashFlow >= 0
              ? 'bg-blue-500/20 border-blue-500/30'
              : 'bg-orange-500/20 border-orange-500/30'
          }`}>
            <div className="text-sm font-medium text-primary">
              Net Cash Flow
            </div>
            <div className="mt-2 text-2xl font-semibold text-primary">
              {formatCurrency(metrics.cashFlow.netCashFlow)}
            </div>
            <div className="mt-1 text-xs text-primary opacity-80">
              {metrics.cashFlow.netCashFlow >= 0 ? 'Surplus' : 'Deficit'}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default CashFlowReport;
