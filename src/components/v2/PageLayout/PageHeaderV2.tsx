/**
 * PageHeaderV2 Component
 * Reusable page header with V2 design
 */

import React from 'react';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

export interface PageHeaderV2Props {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  actions?: React.ReactNode;
  className?: string;
}

export const PageHeaderV2: React.FC<PageHeaderV2Props> = ({
  title,
  subtitle,
  icon: Icon,
  actions,
  className = '',
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${className}`}
    >
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="
            p-3 rounded-xl
            bg-gradient-to-br from-[var(--color-primary-500)] to-[var(--color-secondary-500)]
            shadow-sm
          ">
            <Icon className="h-6 w-6 text-white" />
          </div>
        )}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex items-center gap-2">
          {actions}
        </div>
      )}
    </motion.div>
  );
};

export default PageHeaderV2;

