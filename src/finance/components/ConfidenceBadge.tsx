/**
 * Confidence Badge Component
 *
 * Displays confidence score for auto-categorized transactions
 * Visual indicator helps users quickly identify categorization quality
 */

import React from 'react';

export interface ConfidenceBadgeProps {
  score: number | null | undefined;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({
  score,
  showLabel = false,
  size = 'sm'
}) => {
  // No badge if manually categorized (null score)
  if (score === null || score === undefined) {
    return showLabel ? (
      <span className="text-xs text-slate-500">Manual</span>
    ) : null;
  }

  // Determine confidence level
  const getConfidenceLevel = (): 'high' | 'medium' | 'low' => {
    if (score >= 0.85) return 'high';
    if (score >= 0.6) return 'medium';
    return 'low';
  };

  const level = getConfidenceLevel();

  // Styling based on confidence level
  const styles = {
    high: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      icon: '✓',
      label: 'High confidence'
    },
    medium: {
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-200',
      icon: '◆',
      label: 'Medium confidence'
    },
    low: {
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      border: 'border-rose-200',
      icon: '⚠',
      label: 'Low confidence - review'
    }
  };

  const style = styles[level];

  // Size classes
  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-3 py-1.5'
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1 rounded-full border
        ${style.bg} ${style.text} ${style.border} ${sizeClasses[size]}
        font-medium
      `}
      title={`${style.label}: ${Math.round(score * 100)}%`}
    >
      <span className="leading-none">{style.icon}</span>
      {showLabel && (
        <span className="leading-none">{Math.round(score * 100)}%</span>
      )}
    </span>
  );
};

/**
 * Confidence indicator for transaction rows
 * Compact version suitable for table cells
 */
export const ConfidenceIndicator: React.FC<{ score: number | null | undefined }> = ({ score }) => {
  if (score === null || score === undefined) {
    return <span className="text-slate-400 text-xs">—</span>;
  }

  const level = score >= 0.85 ? 'high' : score >= 0.6 ? 'medium' : 'low';

  const colors = {
    high: 'bg-emerald-500',
    medium: 'bg-amber-500',
    low: 'bg-rose-500'
  };

  return (
    <div className="flex items-center gap-1.5" title={`${Math.round(score * 100)}% confidence`}>
      <div className={`w-2 h-2 rounded-full ${colors[level]}`} />
      <span className="text-xs text-slate-600">{Math.round(score * 100)}%</span>
    </div>
  );
};

/**
 * Confidence progress bar
 * Used in categorization preview/review screens
 */
export const ConfidenceProgress: React.FC<{ score: number }> = ({ score }) => {
  const percentage = Math.round(score * 100);
  const level = score >= 0.85 ? 'high' : score >= 0.6 ? 'medium' : 'low';

  const colors = {
    high: 'bg-emerald-600',
    medium: 'bg-amber-600',
    low: 'bg-rose-600'
  };

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-slate-600">
        <span>Confidence</span>
        <span className="font-medium">{percentage}%</span>
      </div>
      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${colors[level]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
