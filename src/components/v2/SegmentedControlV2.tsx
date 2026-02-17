/**
 * SegmentedControlV2 Component
 * iOS-style segmented control for view/filter toggles
 * Reusable version with terracotta theme support
 */

import React from 'react';
import { useThemeColors } from '../../hooks/useThemeColors';

export interface Segment<T = string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
}

export interface SegmentedControlV2Props<T = string> {
  segments: Segment<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  'aria-label'?: string;
}

const sizeStyles = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-3 py-2 text-sm',
  lg: 'px-4 py-2.5 text-base',
};

export function SegmentedControlV2<T = string>({
  segments,
  value,
  onChange,
  size = 'md',
  className = '',
  'aria-label': ariaLabel = 'Segmented control',
}: SegmentedControlV2Props<T>) {
  const colors = useThemeColors();
  const sizeClass = sizeStyles[size];

  return (
    <div
      className={`flex gap-1 p-1 rounded-xl ${className}`}
      style={{
        backgroundColor: colors.bg.secondary,
      }}
      role="tablist"
      aria-label={ariaLabel}
    >
      {segments.map((segment) => {
        const isActive = segment.value === value;

        return (
          <button
            key={String(segment.value)}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-controls={`${String(segment.value)}-panel`}
            onClick={() => onChange(segment.value)}
            className={`
              flex-1 ${sizeClass}
              rounded-lg font-semibold
              transition-all duration-250 ease-out
              flex items-center justify-center gap-2
            `}
            style={{
              backgroundColor: isActive ? '#FFFFFF' : 'transparent',
              color: isActive ? colors.text.primary : colors.text.secondary,
              boxShadow: isActive ? '0 2px 4px rgba(0, 0, 0, 0.05)' : 'none',
              transform: isActive ? 'scale(1)' : 'scale(0.98)',
            }}
          >
            {segment.icon && <span className="flex-shrink-0">{segment.icon}</span>}
            <span>{segment.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export default SegmentedControlV2;
