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
  gradient = 'from-blue-500/20 to-purple-500/20',
  onClick,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.03, y: -4 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className={`
        relative overflow-hidden
        bg-gradient-to-br ${gradient}
        backdrop-blur-sm
        rounded-2xl p-6
        border border-white/10
        shadow-lg
        ${onClick ? 'cursor-pointer' : ''}
        transition-all duration-300
      `}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-gradient-to-br from-white to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <p className="text-sm font-medium text-[var(--text-secondary)] opacity-80">
            {title}
          </p>
          {Icon && (
            <div className="p-2 rounded-xl bg-white/10 backdrop-blur-sm">
              <Icon className="h-5 w-5 text-[var(--text-primary)]" />
            </div>
          )}
        </div>

        {/* Value */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <p className="text-3xl font-bold text-[var(--text-primary)] mb-1">
            {value}
          </p>
        </motion.div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-3">
          {subtitle && (
            <p className="text-xs text-[var(--text-secondary)] opacity-70">
              {subtitle}
            </p>
          )}
          
          {trend && (
            <div className={`
              flex items-center gap-1 text-xs font-semibold
              ${trend.isPositive ? 'text-emerald-500' : 'text-red-500'}
            `}>
              <span>{trend.isPositive ? '↑' : '↓'}</span>
              <span>{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>
      </div>

      {/* Shine Effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
        initial={{ x: '-100%' }}
        animate={{ x: '100%' }}
        transition={{
          repeat: Infinity,
          duration: 3,
          ease: 'linear',
          repeatDelay: 5,
        }}
      />
    </motion.div>
  );
};

export default StatCard;

