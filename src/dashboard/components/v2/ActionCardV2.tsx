/**
 * ActionCardV2 Component
 * Larger interactive card for important actions
 */

import React from 'react';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { ArrowRight } from 'lucide-react';

export interface ActionCardV2Props {
  title: string;
  description: string;
  icon: LucideIcon;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'accent';
  badge?: string;
  disabled?: boolean;
}

const variantStyles = {
  primary: {
    bg: 'bg-gradient-to-br from-[var(--color-primary-500)]/5 to-[var(--color-primary-600)]/10',
    border: 'border-[var(--color-primary-300)] dark:border-[var(--color-primary-700)]',
    icon: 'bg-[var(--color-primary-500)]/10 text-[var(--color-primary-600)] dark:text-[var(--color-primary-400)]',
    badge: 'bg-[var(--color-primary-500)] text-white',
    arrow: 'text-[var(--color-primary-600)] dark:text-[var(--color-primary-400)]',
  },
  secondary: {
    bg: 'bg-gradient-to-br from-[var(--color-secondary-500)]/5 to-[var(--color-secondary-600)]/10',
    border: 'border-[var(--color-secondary-300)] dark:border-[var(--color-secondary-700)]',
    icon: 'bg-[var(--color-secondary-500)]/10 text-[var(--color-secondary-600)] dark:text-[var(--color-secondary-400)]',
    badge: 'bg-[var(--color-secondary-500)] text-white',
    arrow: 'text-[var(--color-secondary-600)] dark:text-[var(--color-secondary-400)]',
  },
  accent: {
    bg: 'bg-gradient-to-br from-[var(--color-accent-500)]/5 to-[var(--color-accent-600)]/10',
    border: 'border-[var(--color-accent-300)] dark:border-[var(--color-accent-700)]',
    icon: 'bg-[var(--color-accent-500)]/10 text-[var(--color-accent-600)] dark:text-[var(--color-accent-400)]',
    badge: 'bg-[var(--color-accent-500)] text-white',
    arrow: 'text-[var(--color-accent-600)] dark:text-[var(--color-accent-400)]',
  },
};

export const ActionCardV2: React.FC<ActionCardV2Props> = ({
  title,
  description,
  icon: Icon,
  onClick,
  variant = 'primary',
  badge,
  disabled = false,
}) => {
  const styles = variantStyles[variant];

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: disabled ? 1 : 1.02, y: disabled ? 0 : -4 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      className={`
        relative w-full text-left p-6 rounded-xl
        ${styles.bg}
        border ${styles.border}
        shadow-sm hover:shadow-md
        transition-all duration-300
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        group
      `}
    >
      {/* Badge */}
      {badge && (
        <div className={`
          absolute top-4 right-4
          px-2 py-1 rounded-full text-xs font-semibold
          ${styles.badge}
        `}>
          {badge}
        </div>
      )}

      {/* Icon */}
      <div className={`
        inline-flex p-3 rounded-lg mb-4
        ${styles.icon}
        transition-transform duration-300
        group-hover:scale-110
      `}>
        <Icon className="h-6 w-6" />
      </div>

      {/* Content */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {title}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {description}
        </p>
      </div>

      {/* Arrow */}
      <div className={`
        absolute bottom-6 right-6
        ${styles.arrow}
        transition-transform duration-300
        group-hover:translate-x-1
      `}>
        <ArrowRight className="h-5 w-5" />
      </div>
    </motion.button>
  );
};

export default ActionCardV2;

