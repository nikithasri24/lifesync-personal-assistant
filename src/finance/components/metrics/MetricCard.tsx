/**
 * MetricCard Component
 *
 * Reusable card for displaying financial metrics with optional trend indicators.
 */

import React from 'react';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

export interface MetricCardProps {
  title: string;
  value: number;
  change?: number;
  changePercent?: number;
  format?: 'currency' | 'percentage' | 'number';
  colorScheme?: 'default' | 'positive' | 'negative' | 'neutral';
  subtitle?: string;
  icon?: React.ReactNode;
  className?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  changePercent,
  format = 'currency',
  colorScheme = 'default',
  subtitle,
  icon,
  className = '',
}) => {
  // Format value based on type
  const formattedValue = React.useMemo(() => {
    switch (format) {
      case 'currency':
        return formatCurrency(value);
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'number':
        return value.toLocaleString();
      default:
        return value.toString();
    }
  }, [value, format]);

  // Determine trend direction
  const trendDirection = React.useMemo(() => {
    if (change === undefined && changePercent === undefined) return 'none';
    const changeValue = change ?? changePercent ?? 0;
    if (changeValue > 0) return 'up';
    if (changeValue < 0) return 'down';
    return 'neutral';
  }, [change, changePercent]);

  // Color classes based on scheme and direction
  const colorClasses = React.useMemo(() => {
    if (colorScheme === 'positive') {
      return {
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
      };
    } else if (colorScheme === 'negative') {
      return {
        bg: 'bg-rose-50',
        text: 'text-rose-700',
        border: 'border-rose-200',
      };
    } else if (colorScheme === 'neutral') {
      return {
        bg: 'bg-slate-50',
        text: 'text-slate-700',
        border: 'border-slate-200',
      };
    } else {
      // Default - determine by value
      if (value >= 0) {
        return {
          bg: 'bg-white',
          text: 'text-slate-900',
          border: 'border-slate-200',
        };
      } else {
        return {
          bg: 'bg-white',
          text: 'text-rose-700',
          border: 'border-slate-200',
        };
      }
    }
  }, [colorScheme, value]);

  // Trend color classes
  const trendColorClass = React.useMemo(() => {
    if (trendDirection === 'up') return 'text-emerald-600';
    if (trendDirection === 'down') return 'text-rose-600';
    return 'text-slate-500';
  }, [trendDirection]);

  const TrendIcon = trendDirection === 'up' ? ArrowUp : trendDirection === 'down' ? ArrowDown : Minus;

  return (
    <div className={`rounded-lg border ${colorClasses.border} ${colorClasses.bg} p-4 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-semibold text-primary">{title}</p>
          <p className="mt-2 text-3xl font-bold text-primary">
            {formattedValue}
          </p>
          {subtitle && (
            <p className="mt-1 text-xs text-primary opacity-80">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className="ml-4 flex-shrink-0">
            {icon}
          </div>
        )}
      </div>

      {(change !== undefined || changePercent !== undefined) && (
        <div className="mt-3 flex items-center text-sm text-primary">
          <TrendIcon className="h-4 w-4 mr-1" />
          <span className="font-medium">
            {changePercent !== undefined
              ? `${Math.abs(changePercent).toFixed(1)}%`
              : formatCurrency(Math.abs(change!))}
          </span>
          <span className="ml-1 opacity-70">vs last period</span>
        </div>
      )}
    </div>
  );
};

export default MetricCard;
