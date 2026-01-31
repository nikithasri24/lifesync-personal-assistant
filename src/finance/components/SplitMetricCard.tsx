/**
 * SplitMetricCard Component
 * Displays a metric split by owner (Me/Partner/Household) in merged mode
 */

import React from 'react';
import { formatCurrency } from '../utils/currency';

interface SplitMetricCardProps {
  title: string;
  myValue: number;
  partnerValue: number;
  partnerName?: string;
  type?: 'currency' | 'number' | 'percentage';
  colorScheme?: 'income' | 'expense' | 'neutral' | 'networth';
  showPercentages?: boolean;
}

export const SplitMetricCard: React.FC<SplitMetricCardProps> = ({
  title,
  myValue,
  partnerValue,
  partnerName = 'Partner',
  type = 'currency',
  colorScheme = 'neutral',
  showPercentages = true,
}) => {
  const total = myValue + partnerValue;
  const myPercentage = total > 0 ? (myValue / total) * 100 : 50;
  const partnerPercentage = total > 0 ? (partnerValue / total) * 100 : 50;

  const formatValue = (value: number): string => {
    if (type === 'currency') return formatCurrency(value);
    if (type === 'percentage') return `${value.toFixed(1)}%`;
    return value.toLocaleString();
  };

  // Color schemes with gradients and modern colors
  const colorSchemes = {
    income: {
      bg: 'bg-gradient-to-br from-emerald-50 to-teal-50',
      cardBorder: 'ring-1 ring-emerald-200/50',
      myColor: 'bg-gradient-to-r from-blue-500 to-blue-600',
      partnerColor: 'bg-gradient-to-r from-purple-500 to-purple-600',
      textColor: 'text-emerald-700',
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
    },
    expense: {
      bg: 'bg-gradient-to-br from-rose-50 to-pink-50',
      cardBorder: 'ring-1 ring-rose-200/50',
      myColor: 'bg-gradient-to-r from-blue-500 to-blue-600',
      partnerColor: 'bg-gradient-to-r from-purple-500 to-purple-600',
      textColor: 'text-rose-700',
      iconBg: 'bg-rose-100',
      iconColor: 'text-rose-600',
    },
    neutral: {
      bg: 'bg-gradient-to-br from-slate-50 to-gray-50',
      cardBorder: 'ring-1 ring-slate-200/50',
      myColor: 'bg-gradient-to-r from-blue-500 to-blue-600',
      partnerColor: 'bg-gradient-to-r from-purple-500 to-purple-600',
      textColor: 'text-slate-700',
      iconBg: 'bg-slate-100',
      iconColor: 'text-slate-600',
    },
    networth: {
      bg: 'bg-gradient-to-br from-indigo-50 to-blue-50',
      cardBorder: 'ring-1 ring-indigo-200/50',
      myColor: 'bg-gradient-to-r from-blue-500 to-blue-600',
      partnerColor: 'bg-gradient-to-r from-purple-500 to-purple-600',
      textColor: 'text-indigo-700',
      iconBg: 'bg-indigo-100',
      iconColor: 'text-indigo-600',
    },
  };

  const colors = colorSchemes[colorScheme];

  return (
    <div className={`rounded-xl ${colors.bg} ${colors.cardBorder} p-5 shadow-sm hover:shadow-md transition-shadow duration-200`}>
      {/* Title and Total */}
      <div className="mb-4">
        <div className={`text-xs font-semibold uppercase tracking-wider ${colors.textColor} mb-1.5`}>
          {title}
        </div>
        <div className="text-3xl font-bold text-slate-900 tracking-tight">
          {formatValue(total)}
        </div>
      </div>

      {/* Progress Bar with enhanced styling */}
      <div className="mb-4 h-3 w-full overflow-hidden rounded-full bg-white/60 shadow-inner">
        <div className="flex h-full">
          <div
            className={`${colors.myColor} transition-all duration-500 ease-out shadow-sm`}
            style={{ width: `${myPercentage}%` }}
          />
          <div
            className={`${colors.partnerColor} transition-all duration-500 ease-out shadow-sm`}
            style={{ width: `${partnerPercentage}%` }}
          />
        </div>
      </div>

      {/* Breakdown with enhanced styling */}
      <div className="space-y-3">
        <div className="flex items-center justify-between group">
          <div className="flex items-center gap-2.5">
            <div className={`h-3.5 w-3.5 rounded-full ${colors.myColor} shadow-sm ring-2 ring-white`} />
            <span className="font-semibold text-slate-700 text-sm">Me</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 text-sm">{formatValue(myValue)}</span>
            {showPercentages && total > 0 && (
              <span className="text-xs font-medium text-slate-500 bg-white/50 px-2 py-0.5 rounded-full">
                {myPercentage.toFixed(0)}%
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between group">
          <div className="flex items-center gap-2.5">
            <div className={`h-3.5 w-3.5 rounded-full ${colors.partnerColor} shadow-sm ring-2 ring-white`} />
            <span className="font-semibold text-slate-700 text-sm">{partnerName}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 text-sm">{formatValue(partnerValue)}</span>
            {showPercentages && total > 0 && (
              <span className="text-xs font-medium text-slate-500 bg-white/50 px-2 py-0.5 rounded-full">
                {partnerPercentage.toFixed(0)}%
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

