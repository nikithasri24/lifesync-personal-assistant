/**
 * NetWorthTrendChart Component
 *
 * Line chart showing net worth over time with time period selector.
 */

import React, { useMemo, useState } from 'react';
import { ChartLazy } from '../ChartLazy';
import { formatCurrency } from '../../utils/currency';
import type { NetPoint } from '../../types';

export interface NetWorthTrendChartProps {
  data: NetPoint[];
  className?: string;
  height?: number;
  showTimePeriodSelector?: boolean;
}

type TimePeriod = '1M' | '3M' | '6M' | '1Y' | 'ALL';

const NetWorthTrendChart: React.FC<NetWorthTrendChartProps> = ({
  data,
  className = '',
  height = 300,
  showTimePeriodSelector = true,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('6M');

  // Filter data based on selected period
  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return [];

    const sorted = [...data].sort((a, b) => a.month.localeCompare(b.month));

    if (selectedPeriod === 'ALL') {
      return sorted;
    }

    const monthsToShow = {
      '1M': 1,
      '3M': 3,
      '6M': 6,
      '1Y': 12,
    }[selectedPeriod];

    return sorted.slice(-monthsToShow);
  }, [data, selectedPeriod]);

  // Calculate net worth for each point
  const chartData = useMemo(() => {
    return filteredData.map(point => ({
      month: point.month,
      'Net Worth': point.assets - point.liabilities,
      Assets: point.assets,
      Liabilities: point.liabilities,
    }));
  }, [filteredData]);

  // Calculate change
  const change = useMemo(() => {
    if (chartData.length < 2) return { amount: 0, percent: 0 };

    const first = chartData[0]['Net Worth'];
    const last = chartData[chartData.length - 1]['Net Worth'];
    const amount = last - first;
    const percent = first !== 0 ? (amount / first) * 100 : 0;

    return { amount, percent };
  }, [chartData]);

  const currentNetWorth = chartData.length > 0
    ? chartData[chartData.length - 1]['Net Worth']
    : 0;

  return (
    <div className={`rounded-lg border border-slate-200 bg-white p-4 ${className}`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium text-slate-600">Net Worth</h3>
          <p className="mt-1 text-2xl font-semibold text-slate-900">
            {formatCurrency(currentNetWorth)}
          </p>
          <p className={`mt-1 text-sm ${change.amount >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {change.amount >= 0 ? '+' : ''}{formatCurrency(change.amount)} ({change.percent.toFixed(1)}%)
            <span className="ml-1 text-slate-500">
              {selectedPeriod === '1M' ? '1 month' : selectedPeriod === '3M' ? '3 months' : selectedPeriod === '6M' ? '6 months' : selectedPeriod === '1Y' ? '1 year' : 'all time'}
            </span>
          </p>
        </div>

        {showTimePeriodSelector && (
          <div className="flex gap-1">
            {(['1M', '3M', '6M', '1Y', 'ALL'] as TimePeriod[]).map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                  selectedPeriod === period
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {period}
              </button>
            ))}
          </div>
        )}
      </div>

      {chartData.length > 0 ? (
        <ChartLazy
          data={chartData}
          xKey="month"
          yKeys={[
            { key: 'Net Worth', color: '#0f172a', type: 'line' },
          ]}
          height={height}
        />
      ) : (
        <div className="flex items-center justify-center" style={{ height }}>
          <p className="text-sm text-slate-500">No net worth data available</p>
        </div>
      )}
    </div>
  );
};

export default NetWorthTrendChart;
