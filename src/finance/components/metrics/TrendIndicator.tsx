/**
 * TrendIndicator Component
 *
 * Displays trend with arrow and percentage change.
 */

import React from 'react';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

export interface TrendIndicatorProps {
  value: number;
  format?: 'percentage' | 'currency' | 'number';
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const TrendIndicator: React.FC<TrendIndicatorProps> = ({
  value,
  format = 'percentage',
  showIcon = true,
  size = 'md',
  className = '',
}) => {
  const direction = value > 0 ? 'up' : value < 0 ? 'down' : 'neutral';
  const absValue = Math.abs(value);

  // Format value
  const formattedValue = React.useMemo(() => {
    switch (format) {
      case 'percentage':
        return `${absValue.toFixed(1)}%`;
      case 'currency':
        return `$${absValue.toLocaleString()}`;
      case 'number':
        return absValue.toLocaleString();
      default:
        return absValue.toString();
    }
  }, [absValue, format]);

  // Color classes
  const colorClass = direction === 'up'
    ? 'text-emerald-600'
    : direction === 'down'
    ? 'text-rose-600'
    : 'text-slate-500';

  // Size classes
  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  const Icon = direction === 'up' ? ArrowUp : direction === 'down' ? ArrowDown : Minus;

  return (
    <div className={`inline-flex items-center gap-1 font-medium ${colorClass} ${sizeClasses[size]} ${className}`}>
      {showIcon && <Icon className={iconSizes[size]} />}
      <span>{direction === 'up' ? '+' : direction === 'down' ? '-' : ''}{formattedValue}</span>
    </div>
  );
};

export default TrendIndicator;
