/**
 * MorningBriefingV2 Component
 * Daily summary with V2 design
 */

import React from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Calendar, ListTodo, CheckCircle2, Flame, Cloud, Sparkles } from 'lucide-react';
import { useDailyBriefing } from '../../../hooks/useBriefingQuery';
import { getWeatherEmoji } from '../../../services/briefing';

export interface MorningBriefingV2Props {
  className?: string;
  onCompleteTask?: (taskId: string) => Promise<void>;
  onCompleteHabit?: (habitId: string) => Promise<void>;
}

export const MorningBriefingV2: React.FC<MorningBriefingV2Props> = ({
  className = '',
  onCompleteTask,
  onCompleteHabit,
}) => {
  const { data: briefing, isLoading, error } = useDailyBriefing();

  if (isLoading) {
    return (
      <div className={`
        bg-white dark:bg-gray-800
        rounded-2xl p-6
        border border-gray-200 dark:border-gray-700
        shadow-sm
        ${className}
      `}>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
          <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </div>
    );
  }

  if (error || !briefing) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`
        bg-white dark:bg-gray-800
        rounded-2xl p-6
        border border-gray-200 dark:border-gray-700
        shadow-sm
        ${className}
      `}
    >
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-5 w-5 text-[var(--color-primary-500)]" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {briefing.greeting}! ✨
          </h2>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
          {briefing.dayOfWeek}, {format(new Date(), 'MMMM d')}
        </p>
      </div>

      {/* Weather */}
      {briefing.weather && (
        <div className="
          flex items-center gap-4 mb-6 p-4
          bg-gradient-to-r from-blue-500/10 to-sky-500/10
          dark:from-blue-500/20 dark:to-sky-500/20
          rounded-xl
          border border-blue-200 dark:border-blue-800
        ">
          <span className="text-4xl">{getWeatherEmoji(briefing.weather.condition)}</span>
          <div className="flex-1">
            <p className="font-bold text-xl text-gray-900 dark:text-white">
              {briefing.weather.temperature}°{briefing.weather.temperatureUnit}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
              {briefing.weather.conditionText}
            </p>
          </div>
          <div className="text-right text-sm text-gray-600 dark:text-gray-400">
            <p>H: {briefing.weather.high}° L: {briefing.weather.low}°</p>
            <p className="text-xs">{briefing.weather.location}</p>
          </div>
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <StatCard
          icon={<Calendar className="w-4 h-4" />}
          value={briefing.totalEvents}
          label="Events"
          variant="primary"
        />
        <StatCard
          icon={<ListTodo className="w-4 h-4" />}
          value={briefing.totalTasksDue}
          label="Tasks"
          variant="secondary"
        />
        <StatCard
          icon={<CheckCircle2 className="w-4 h-4" />}
          value={briefing.habitsToComplete.length}
          label="Habits"
          variant="accent"
        />
      </div>

      {/* Current Streak */}
      {briefing.currentStreak > 0 && (
        <div className="
          flex items-center justify-center gap-2
          bg-gradient-to-r from-orange-500 to-red-500
          px-4 py-3 rounded-xl
          shadow-sm
        ">
          <Flame className="w-5 h-5 text-yellow-200" />
          <span className="font-bold text-white text-base">
            {briefing.currentStreak} day streak
          </span>
          <Flame className="w-5 h-5 text-yellow-200" />
        </div>
      )}

      {/* Level Badge */}
      {briefing.level > 1 && (
        <div className="flex items-center justify-center mt-4">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Level {briefing.level} • Keep going! 🚀
          </span>
        </div>
      )}
    </motion.div>
  );
};

interface StatCardProps {
  icon: React.ReactNode;
  value: number;
  label: string;
  variant: 'primary' | 'secondary' | 'accent';
}

const StatCard: React.FC<StatCardProps> = ({ icon, value, label, variant }) => {
  const styles = {
    primary: 'bg-[var(--color-primary-500)]/10 dark:bg-[var(--color-primary-500)]/20 text-[var(--color-primary-600)] dark:text-[var(--color-primary-400)]',
    secondary: 'bg-[var(--color-secondary-500)]/10 dark:bg-[var(--color-secondary-500)]/20 text-[var(--color-secondary-600)] dark:text-[var(--color-secondary-400)]',
    accent: 'bg-[var(--color-accent-500)]/10 dark:bg-[var(--color-accent-500)]/20 text-[var(--color-accent-600)] dark:text-[var(--color-accent-400)]',
  };

  return (
    <div className={`p-3 rounded-xl ${styles[variant]}`}>
      <div className="flex items-center justify-center mb-1">
        {icon}
      </div>
      <p className="text-2xl font-bold text-center text-gray-900 dark:text-white">
        {value}
      </p>
      <p className="text-xs text-center text-gray-600 dark:text-gray-400 font-medium">
        {label}
      </p>
    </div>
  );
};

export default MorningBriefingV2;

