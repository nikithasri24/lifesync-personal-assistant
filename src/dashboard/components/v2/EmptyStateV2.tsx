/**
 * EmptyStateV2 Component
 * Empty state with icon, message, and optional action
 */

import React from 'react';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

export interface EmptyStateV2Props {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  variant?: 'primary' | 'secondary' | 'accent';
}

const variantStyles = {
  primary: {
    iconBg: 'from-[var(--color-primary-500)]/10 to-[var(--color-primary-600)]/20',
    iconColor: 'text-[var(--color-primary-600)] dark:text-[var(--color-primary-400)]',
    buttonBg: 'bg-[var(--color-primary-500)] hover:bg-[var(--color-primary-600)]',
  },
  secondary: {
    iconBg: 'from-[var(--color-secondary-500)]/10 to-[var(--color-secondary-600)]/20',
    iconColor: 'text-[var(--color-secondary-600)] dark:text-[var(--color-secondary-400)]',
    buttonBg: 'bg-[var(--color-secondary-500)] hover:bg-[var(--color-secondary-600)]',
  },
  accent: {
    iconBg: 'from-[var(--color-accent-500)]/10 to-[var(--color-accent-600)]/20',
    iconColor: 'text-[var(--color-accent-600)] dark:text-[var(--color-accent-400)]',
    buttonBg: 'bg-[var(--color-accent-500)] hover:bg-[var(--color-accent-600)]',
  },
};

export const EmptyStateV2: React.FC<EmptyStateV2Props> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  variant = 'primary',
}) => {
  const styles = variantStyles[variant];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="text-center py-12 px-4"
    >
      {/* Icon */}
      <div className={`
        inline-flex items-center justify-center
        w-16 h-16 rounded-full
        bg-gradient-to-br ${styles.iconBg}
        mb-4
      `}>
        <Icon className={`w-8 h-8 ${styles.iconColor}`} />
      </div>

      {/* Title */}
      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {title}
      </h4>

      {/* Description */}
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-xs mx-auto">
        {description}
      </p>

      {/* Action Button */}
      {actionLabel && onAction && (
        <motion.button
          onClick={onAction}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`
            inline-flex items-center gap-2
            px-4 py-2 rounded-lg
            ${styles.buttonBg}
            text-white text-sm font-medium
            shadow-sm hover:shadow-md
            transition-all duration-200
          `}
        >
          {actionLabel}
        </motion.button>
      )}
    </motion.div>
  );
};

export default EmptyStateV2;

