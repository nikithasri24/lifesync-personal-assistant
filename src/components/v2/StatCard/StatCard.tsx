/**
 * StatCardV2 Component
 * Premium stat card with animations and gradients
 */

import React from 'react';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  gradient?: string;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  gradient = 'from-[var(--color-primary-500)]/10 to-[var(--color-secondary-500)]/10',
  onClick,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      onClick={onClick}
      className={`
        relative overflow-hidden
        bg-white dark:bg-gray-800
        rounded-xl p-6
        border border-gray-200 dark:border-gray-700
        shadow-sm hover:shadow-md
        ${onClick ? 'cursor-pointer' : ''}
        transition-all duration-300
      `}
    >
      {/* Subtle gradient overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-50`} />

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {title}
          </p>
          {Icon && (
            <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700/50">
              <Icon className="h-5 w-5 text-gray-700 dark:text-gray-300" />
            </div>
          )}
        </div>

        {/* Value */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {value}
          </p>
        </motion.div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-3">
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {subtitle}
            </p>
          )}

          {trend && (
            <div className={`
              flex items-center gap-1 text-xs font-semibold
              ${trend.isPositive ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}
            `}>
              <span>{trend.isPositive ? '↑' : '↓'}</span>
              <span>{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default StatCard;

