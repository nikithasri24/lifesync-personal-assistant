import React from 'react';

export { LineChart } from './visualizations/LineChart';
export { BarChart } from './visualizations/BarChart';
export { DonutChart } from './visualizations/DonutChart';
export { ProgressRing } from './visualizations/ProgressRing';
export { MetricCard } from './visualizations/MetricCard';

export type {
  ChartDataPoint,
  LineChartProps,
  BarChartProps,
  DonutChartProps,
  ProgressRingProps,
  MetricCardProps
} from './DataVisualization.types';

export function DashboardGrid({
  children,
  className = ''
}: {
  children: React.ReactNode;
  className?: string;
}): React.ReactElement {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 ${className}`}>
      {children}
    </div>
  );
}

export function ChartContainer({
  title,
  subtitle,
  children,
  actions,
  className = ''
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}): React.ReactElement {
  return (
    <div className={`bg-white rounded-xl shadow-lg border border-gray-200 p-6 ${className}`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center space-x-2">{actions}</div>}
      </div>
      {children}
    </div>
  );
}
