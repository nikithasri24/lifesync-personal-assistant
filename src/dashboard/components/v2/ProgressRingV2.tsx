/**
 * ProgressRingV2 Component
 * Circular progress indicator with soft, muted colors
 */

import React from 'react';
import { motion } from 'framer-motion';

export interface ProgressRingV2Props {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  showPercentage?: boolean;
  color?: 'primary' | 'secondary' | 'accent' | 'success' | 'warning';
}

const colorMap = {
  primary: {
    ring: 'stroke-[var(--color-primary-500)]',
    bg: 'stroke-gray-200 dark:stroke-gray-700',
    text: 'text-[var(--color-primary-600)] dark:text-[var(--color-primary-400)]',
  },
  secondary: {
    ring: 'stroke-[var(--color-secondary-500)]',
    bg: 'stroke-gray-200 dark:stroke-gray-700',
    text: 'text-[var(--color-secondary-600)] dark:text-[var(--color-secondary-400)]',
  },
  accent: {
    ring: 'stroke-[var(--color-accent-500)]',
    bg: 'stroke-gray-200 dark:stroke-gray-700',
    text: 'text-[var(--color-accent-600)] dark:text-[var(--color-accent-400)]',
  },
  success: {
    ring: 'stroke-green-500',
    bg: 'stroke-gray-200 dark:stroke-gray-700',
    text: 'text-green-600 dark:text-green-500',
  },
  warning: {
    ring: 'stroke-amber-500',
    bg: 'stroke-gray-200 dark:stroke-gray-700',
    text: 'text-amber-600 dark:text-amber-500',
  },
};

export const ProgressRingV2: React.FC<ProgressRingV2Props> = ({
  percentage,
  size = 120,
  strokeWidth = 8,
  label,
  showPercentage = true,
  color = 'primary',
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;
  const colors = colorMap[color];

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            className={colors.bg}
            strokeWidth={strokeWidth}
            fill="none"
          />
          
          {/* Progress circle */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            className={colors.ring}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </svg>

        {/* Center text */}
        {showPercentage && (
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.span
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className={`text-2xl font-bold ${colors.text}`}
            >
              {Math.round(percentage)}%
            </motion.span>
          </div>
        )}
      </div>

      {/* Label */}
      {label && (
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 text-center">
          {label}
        </p>
      )}
    </div>
  );
};

export default ProgressRingV2;

