/**
 * BadgeV2 Component
 * Pill badges for tags, categories, priorities, and status indicators
 * Supports terracotta theme with multiple variants
 */

import React from 'react';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useTheme } from '../../contexts/ThemeContext';
import type { LucideIcon } from 'lucide-react';

export interface BadgeV2Props {
  children?: React.ReactNode;
  text?: string;
  variant?: 'default' | 'primary' | 'accent' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
  onRemove?: () => void;
  className?: string;
}

const variantStyles = {
  default: {
    light: {
      bg: 'rgba(212, 165, 116, 0.15)',
      text: '#C18B5E',
      border: 'transparent',
    },
    dark: {
      bg: 'rgba(212, 165, 116, 0.25)',
      text: '#E5B88A',
      border: 'transparent',
    },
  },
  primary: {
    light: {
      bg: 'rgba(212, 165, 116, 0.2)',
      text: '#C18B5E',
      border: 'transparent',
    },
    dark: {
      bg: 'rgba(212, 165, 116, 0.3)',
      text: '#E5B88A',
      border: 'transparent',
    },
  },
  accent: {
    light: {
      bg: 'rgba(212, 165, 116, 0.15)',
      text: '#C18B5E',
      border: 'transparent',
    },
    dark: {
      bg: 'rgba(212, 165, 116, 0.25)',
      text: '#E5B88A',
      border: 'transparent',
    },
  },
  success: {
    light: {
      bg: 'rgba(52, 199, 89, 0.15)',
      text: '#16A34A',
      border: '#22C55E',
    },
    dark: {
      bg: 'rgba(52, 199, 89, 0.25)',
      text: '#4ADE80',
      border: '#22C55E',
    },
  },
  warning: {
    light: {
      bg: 'rgba(251, 191, 36, 0.15)',
      text: '#D97706',
      border: '#F59E0B',
    },
    dark: {
      bg: 'rgba(251, 191, 36, 0.25)',
      text: '#FCD34D',
      border: '#F59E0B',
    },
  },
  danger: {
    light: {
      bg: 'rgba(239, 68, 68, 0.15)',
      text: '#DC2626',
      border: '#EF4444',
    },
    dark: {
      bg: 'rgba(239, 68, 68, 0.25)',
      text: '#FCA5A5',
      border: '#EF4444',
    },
  },
  info: {
    light: {
      bg: 'rgba(59, 130, 246, 0.15)',
      text: '#2563EB',
      border: '#3B82F6',
    },
    dark: {
      bg: 'rgba(59, 130, 246, 0.25)',
      text: '#93C5FD',
      border: '#3B82F6',
    },
  },
};

const sizeStyles = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
  lg: 'px-4 py-1.5 text-base',
};

export const BadgeV2: React.FC<BadgeV2Props> = ({
  children,
  text,
  variant = 'default',
  size = 'md',
  icon: Icon,
  onRemove,
  className = '',
}) => {
  const colors = useThemeColors();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const styles = variantStyles[variant][isDark ? 'dark' : 'light'];

  const content = text || children;

  return (
    <span
      className={`
        inline-flex items-center gap-1.5
        ${sizeStyles[size]}
        rounded-full
        font-semibold
        ${styles.border !== 'transparent' ? 'border' : ''}
        transition-all duration-200
        ${className}
      `}
      style={{
        backgroundColor: styles.bg,
        color: styles.text,
        borderColor: styles.border,
      }}
    >
      {Icon && <Icon className="w-3 h-3" />}
      <span>{content}</span>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="
            ml-0.5 -mr-1
            w-4 h-4
            rounded-full
            flex items-center justify-center
            hover:bg-black/10
            transition-colors duration-150
          "
          aria-label="Remove badge"
        >
          <span className="text-xs font-bold">×</span>
        </button>
      )}
    </span>
  );
};

export default BadgeV2;
