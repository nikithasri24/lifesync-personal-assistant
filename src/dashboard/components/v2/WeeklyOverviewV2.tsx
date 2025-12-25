/**
 * WeeklyOverviewV2 Component
 * Weekly stats overview with soft design
 */

import React from 'react';
import { motion } from 'framer-motion';
import { CheckSquare, BookOpen, Target, TrendingUp } from 'lucide-react';

export interface WeeklyOverviewV2Props {
  completedTasks: number;
  journalEntries: number;
  totalHabits: number;
}

interface StatItemProps {
  icon: React.ElementType;
  label: string;
  value: number;
  index: number;
  variant: 'primary' | 'secondary' | 'accent';
}

const variantStyles = {
  primary: {
    iconBg: 'bg-[var(--color-primary-500)]/10 dark:bg-[var(--color-primary-500)]/20',
    iconColor: 'text-[var(--color-primary-600)] dark:text-[var(--color-primary-400)]',
    cardBg: 'bg-[var(--color-primary-500)]/5 dark:bg-[var(--color-primary-500)]/10',
    border: 'border-[var(--color-primary-200)] dark:border-[var(--color-primary-800)]',
  },
  secondary: {
    iconBg: 'bg-[var(--color-secondary-500)]/10 dark:bg-[var(--color-secondary-500)]/20',
    iconColor: 'text-[var(--color-secondary-600)] dark:text-[var(--color-secondary-400)]',
    cardBg: 'bg-[var(--color-secondary-500)]/5 dark:bg-[var(--color-secondary-500)]/10',
    border: 'border-[var(--color-secondary-200)] dark:border-[var(--color-secondary-800)]',
  },
  accent: {
    iconBg: 'bg-[var(--color-accent-500)]/10 dark:bg-[var(--color-accent-500)]/20',
    iconColor: 'text-[var(--color-accent-600)] dark:text-[var(--color-accent-400)]',
    cardBg: 'bg-[var(--color-accent-500)]/5 dark:bg-[var(--color-accent-500)]/10',
    border: 'border-[var(--color-accent-200)] dark:border-[var(--color-accent-800)]',
  },
};

const StatItem: React.FC<StatItemProps> = ({ icon: Icon, label, value, index, variant }) => {
  const styles = variantStyles[variant];

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1, duration: 0.3 }}
      whileHover={{ y: -2 }}
      className={`
        flex items-center justify-between p-4
        ${styles.cardBg}
        rounded-xl
        border ${styles.border}
        transition-all duration-200
      `}
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${styles.iconBg}`}>
          <Icon className={`h-5 w-5 ${styles.iconColor}`} />
        </div>
        <span className="font-medium text-gray-900 dark:text-white text-sm">
          {label}
        </span>
      </div>
      <span className="text-2xl font-bold text-gray-900 dark:text-white">
        {value}
      </span>
    </motion.div>
  );
};

export const WeeklyOverviewV2: React.FC<WeeklyOverviewV2Props> = ({
  completedTasks,
  journalEntries,
  totalHabits,
}) => {
  return (
    <div className="
      bg-white dark:bg-gray-800
      rounded-2xl p-6
      border border-gray-200 dark:border-gray-700
      shadow-sm
    ">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700">
          <TrendingUp className="h-5 w-5 text-gray-700 dark:text-gray-300" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
          This Week
        </h3>
      </div>

      <div className="space-y-4">
        <StatItem
          icon={CheckSquare}
          label="Tasks Completed"
          value={completedTasks}
          index={0}
          variant="accent"
        />
        <StatItem
          icon={BookOpen}
          label="Journal Entries"
          index={1}
          value={journalEntries}
          variant="secondary"
        />
        <StatItem
          icon={Target}
          label="Total Habits"
          value={totalHabits}
          index={2}
          variant="primary"
        />
      </div>
    </div>
  );
};

export default WeeklyOverviewV2;

