import React from 'react';
import { useThemeColors } from '@/hooks/useThemeColors';

interface ProgressBarProps {
  percentage: number;
  height?: string;
  showLabel?: boolean;
}

/**
 * Terracotta gradient progress bar
 */
export function ProgressBar({ percentage, height = '8px', showLabel = false }: ProgressBarProps): React.ReactElement {
  const colors = useThemeColors();

  return (
    <div className="progress-bar-wrapper">
      <div
        className="progress-bar-container rounded-full overflow-hidden"
        style={{
          backgroundColor: colors.bg.secondary,
          height,
        }}
      >
        <div
          className="progress-bar h-full transition-all duration-300 ease-out"
          style={{
            width: `${percentage}%`,
            background: `linear-gradient(135deg, ${colors.accent.start} 0%, ${colors.accent.end} 100%)`,
          }}
        />
      </div>
      {showLabel && (
        <div className="text-xs font-semibold mt-1" style={{ color: colors.text.tertiary }}>
          {percentage}%
        </div>
      )}
    </div>
  );
}
