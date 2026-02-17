import React from 'react';
import { useThemeColors } from '../../hooks/useThemeColors';

interface Segment {
  value: string;
  label: string;
}

interface SegmentedControlProps {
  segments: Segment[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function SegmentedControl({ segments, value, onChange, className = '' }: SegmentedControlProps) {
  const colors = useThemeColors();
  const activeIndex = segments.findIndex(seg => seg.value === value);

  return (
    <div
      className={`flex gap-1 p-1 rounded-xl ${className}`}
      style={{
        backgroundColor: colors.bg.secondary,
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
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-250 ease-out`}
            style={{
              backgroundColor: isActive ? '#FFFFFF' : 'transparent',
              color: isActive ? colors.text.primary : colors.text.secondary,
              boxShadow: isActive ? '0 2px 4px rgba(0, 0, 0, 0.05)' : 'none',
              transform: isActive ? 'scale(1)' : 'scale(0.98)',
            }}
          >
            {segment.label}
          </button>
        );
      })}
    </div>
  );
}
