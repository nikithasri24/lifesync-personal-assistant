import React from 'react';
import { useThemeColors } from '../../hooks/useThemeColors';

interface Segment {
  value: string;
  label: string;
  badge?: number;
}

interface SegmentedControlProps {
  segments: Segment[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  scrollable?: boolean;
}

export function SegmentedControl({ segments, value, onChange, className = '', scrollable = false }: SegmentedControlProps) {
  const colors = useThemeColors();
  const activeIndex = segments.findIndex(seg => seg.value === value);

  return (
    <div
      className={`flex gap-1 p-1 rounded-xl ${scrollable ? '' : ''} ${className}`}
      style={{
        backgroundColor: colors.bg.secondary,
        minWidth: scrollable ? 'max-content' : undefined,
      }}
      role="tablist"
      aria-label="View selection"
    >
      {segments.map((segment, index) => {
        const isActive = segment.value === value;

        return (
          <button
            key={segment.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-controls={`${segment.value}-panel`}
            onClick={() => onChange(segment.value)}
            className={`${scrollable ? 'flex-shrink-0' : 'flex-1'} px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-250 ease-out whitespace-nowrap`}
            style={{
              backgroundColor: isActive ? '#FFFFFF' : 'transparent',
              color: isActive ? colors.text.primary : colors.text.secondary,
              boxShadow: isActive ? '0 2px 4px rgba(0, 0, 0, 0.05)' : 'none',
              transform: isActive ? 'scale(1)' : 'scale(0.98)',
            }}
          >
            {segment.label}
            {segment.badge !== undefined && segment.badge > 0 && (
              <span
                className="ml-1.5 px-1.5 py-0.5 text-xs font-bold rounded-full"
                style={{
                  backgroundColor: colors.accent.end,
                  color: '#FFFFFF',
                }}
              >
                {segment.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
