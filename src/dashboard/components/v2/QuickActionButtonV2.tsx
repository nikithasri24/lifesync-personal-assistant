/**
 * QuickActionButtonV2 Component
 * Quick action button with soft colors and smooth interactions
 */

import React from 'react';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

export interface QuickActionButtonV2Props {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'accent';
  disabled?: boolean;
}

const variantStyles = {
  primary: {
    bg: 'bg-[var(--color-primary-500)]/10 dark:bg-[var(--color-primary-500)]/20',
    hover: 'hover:bg-[var(--color-primary-500)]/20 dark:hover:bg-[var(--color-primary-500)]/30',
    icon: 'text-[var(--color-primary-600)] dark:text-[var(--color-primary-400)]',
    text: 'text-[var(--color-primary-700)] dark:text-[var(--color-primary-300)]',
  },
  secondary: {
    bg: 'bg-[var(--color-secondary-500)]/10 dark:bg-[var(--color-secondary-500)]/20',
    hover: 'hover:bg-[var(--color-secondary-500)]/20 dark:hover:bg-[var(--color-secondary-500)]/30',
    icon: 'text-[var(--color-secondary-600)] dark:text-[var(--color-secondary-400)]',
    text: 'text-[var(--color-secondary-700)] dark:text-[var(--color-secondary-300)]',
  },
  accent: {
    bg: 'bg-[var(--color-accent-500)]/10 dark:bg-[var(--color-accent-500)]/20',
    hover: 'hover:bg-[var(--color-accent-500)]/20 dark:hover:bg-[var(--color-accent-500)]/30',
    icon: 'text-[var(--color-accent-600)] dark:text-[var(--color-accent-400)]',
    text: 'text-[var(--color-accent-700)] dark:text-[var(--color-accent-300)]',
  },
};

export const QuickActionButtonV2: React.FC<QuickActionButtonV2Props> = ({
  icon: Icon,
  label,
  onClick,
  variant = 'primary',
  disabled = false,
}) => {
  const styles = variantStyles[variant];

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      className={`
        flex flex-col items-center gap-2.5 p-4 rounded-xl
        ${styles.bg} ${styles.hover}
        border border-gray-200 dark:border-gray-700
        transition-all duration-200
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        group
        min-h-[100px]
      `}
    >
      <div className={`
        p-2.5 rounded-lg
        bg-white dark:bg-gray-800
        shadow-sm
        transition-transform duration-200
        group-hover:scale-110
      `}>
        <Icon className={`h-5 w-5 ${styles.icon}`} />
      </div>

      <span className={`text-xs font-medium ${styles.text} text-center`}>
        {label}
      </span>
    </motion.button>
  );
};

export default QuickActionButtonV2;

