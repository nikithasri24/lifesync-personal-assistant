/**
 * SectionHeaderV2 Component
 * Reusable section header with title and action button
 */

import React from 'react';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { ArrowRight } from 'lucide-react';

export interface SectionHeaderV2Props {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const SectionHeaderV2: React.FC<SectionHeaderV2Props> = ({
  title,
  subtitle,
  icon: Icon,
  actionLabel = 'View all',
  onAction,
  className = '',
}) => {
  return (
    <div className={`flex items-center justify-between mb-6 ${className}`}>
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
            <Icon className="h-5 w-5 text-gray-700 dark:text-gray-300" />
          </div>
        )}
        <div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
          {subtitle && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {onAction && (
        <motion.button
          onClick={onAction}
          whileHover={{ x: 4 }}
          whileTap={{ scale: 0.95 }}
          className="
            flex items-center gap-1.5
            text-sm font-medium
            text-[var(--color-primary-600)] dark:text-[var(--color-primary-400)]
            hover:text-[var(--color-primary-700)] dark:hover:text-[var(--color-primary-300)]
            transition-colors duration-200
          "
        >
          <span>{actionLabel}</span>
          <ArrowRight className="h-4 w-4" />
        </motion.button>
      )}
    </div>
  );
};

export default SectionHeaderV2;

