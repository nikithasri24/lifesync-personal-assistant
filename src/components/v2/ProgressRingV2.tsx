/**
 * ProgressRingV2 Component
 *
 * Circular progress indicator with terracotta gradient
 * Used by Projects and Goals pages for visual progress tracking
 *
 * Features:
 * - Circular SVG progress ring
 * - Percentage display in center
 * - Terracotta gradient stroke
 * - Animated on mount
 * - Multiple sizes (sm, md, lg, xl)
 * - Light and dark mode support
 */

import React from 'react';
import { motion } from 'framer-motion';
import { useThemeColors } from '@/hooks/useThemeColors';

export interface ProgressRingV2Props {
  /** Progress percentage (0-100) */
  percentage: number;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Show percentage text in center */
  showLabel?: boolean;
  /** Custom label instead of percentage */
  label?: string;
  /** Stroke width in pixels */
  strokeWidth?: number;
  /** Custom className for styling */
  className?: string;
}

const SIZE_CONFIG = {
  sm: { size: 48, strokeWidth: 4, fontSize: 12 },
  md: { size: 80, strokeWidth: 6, fontSize: 16 },
  lg: { size: 120, strokeWidth: 8, fontSize: 24 },
  xl: { size: 180, strokeWidth: 10, fontSize: 32 },
};

export const ProgressRingV2: React.FC<ProgressRingV2Props> = ({
  percentage,
  size = 'md',
  showLabel = true,
  label,
  strokeWidth: customStrokeWidth,
  className = '',
}) => {
  const colors = useThemeColors();
  const config = SIZE_CONFIG[size];
  const actualStrokeWidth = customStrokeWidth ?? config.strokeWidth;

  // Calculate SVG circle properties
  const radius = (config.size - actualStrokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  // Clamp percentage between 0 and 100
  const clampedPercentage = Math.min(100, Math.max(0, percentage));

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: config.size, height: config.size }}
    >
      <svg
        width={config.size}
        height={config.size}
        viewBox={`0 0 ${config.size} ${config.size}`}
        className="transform -rotate-90"
      >
        {/* Gradient definition */}
        <defs>
          <linearGradient id={`progress-gradient-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors.accent.start} />
            <stop offset="100%" stopColor={colors.accent.end} />
          </linearGradient>
        </defs>

        {/* Background circle */}
        <circle
          cx={config.size / 2}
          cy={config.size / 2}
          r={radius}
          fill="none"
          stroke={colors.border.light}
          strokeWidth={actualStrokeWidth}
        />

        {/* Progress circle */}
        <motion.circle
          cx={config.size / 2}
          cy={config.size / 2}
          r={radius}
          fill="none"
          stroke={`url(#progress-gradient-${size})`}
          strokeWidth={actualStrokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </svg>

      {/* Center label */}
      {showLabel && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            fontSize: config.fontSize,
            fontWeight: 700,
            color: colors.text.primary,
          }}
        >
          {label ?? `${Math.round(clampedPercentage)}%`}
        </div>
      )}
    </div>
  );
};
