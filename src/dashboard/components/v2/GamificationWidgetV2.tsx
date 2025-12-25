/**
 * GamificationWidgetV2 Component
 * Compact gamification display with V2 design
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Flame, Star, TrendingUp } from 'lucide-react';
import { useGamificationProfile } from '../../../hooks/useGamificationQuery';

export interface GamificationWidgetV2Props {
  variant?: 'compact' | 'full';
  className?: string;
}

export const GamificationWidgetV2: React.FC<GamificationWidgetV2Props> = ({
  variant = 'compact',
  className = '',
}) => {
  const { data: profile, isLoading } = useGamificationProfile();

  if (isLoading || !profile) {
    return (
      <div className={`animate-pulse bg-gray-100 dark:bg-gray-800 rounded-lg h-12 ${className}`} />
    );
  }

  const xpProgress = profile.xpToNextLevel > 0
    ? ((profile.totalXp % profile.xpToNextLevel) / profile.xpToNextLevel) * 100
    : 100;

  if (variant === 'compact') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className={`flex items-center gap-3 ${className}`}
      >
        {/* Level Badge */}
        <div className="
          flex items-center gap-1.5
          bg-gradient-to-r from-[var(--color-primary-500)] to-[var(--color-secondary-500)]
          text-white px-3 py-1.5 rounded-full
          text-sm font-medium
          shadow-sm
        ">
          <Star className="h-3.5 w-3.5" />
          <span>Lv.{profile.currentLevel}</span>
        </div>

        {/* XP */}
        <div className="flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300">
          <TrendingUp className="h-3.5 w-3.5 text-[var(--color-accent-500)]" />
          <span className="font-medium">{profile.totalXp.toLocaleString()} XP</span>
        </div>

        {/* Streak */}
        {profile.currentStreak > 0 && (
          <div className="flex items-center gap-1.5 text-sm text-orange-600 dark:text-orange-400">
            <Flame className="h-3.5 w-3.5" />
            <span className="font-medium">{profile.currentStreak} day{profile.currentStreak !== 1 ? 's' : ''}</span>
          </div>
        )}
      </motion.div>
    );
  }

  // Full variant
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
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="
            p-2.5 rounded-xl
            bg-gradient-to-br from-[var(--color-primary-500)] to-[var(--color-secondary-500)]
          ">
            <Trophy className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Level {profile.currentLevel}
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {profile.rankTitle}
            </p>
          </div>
        </div>

        {profile.currentStreak > 0 && (
          <div className="
            flex items-center gap-1.5
            bg-orange-500/10 dark:bg-orange-500/20
            text-orange-600 dark:text-orange-400
            px-3 py-1.5 rounded-full
          ">
            <Flame className="h-4 w-4" />
            <span className="font-medium">{profile.currentStreak} 🔥</span>
          </div>
        )}
      </div>

      {/* XP Progress Bar */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
          <span>{profile.totalXp.toLocaleString()} XP</span>
          <span>{profile.xpToNextLevel.toLocaleString()} to next level</span>
        </div>
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${xpProgress}%` }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="
              h-full rounded-full
              bg-gradient-to-r from-[var(--color-primary-500)] to-[var(--color-secondary-500)]
            "
          />
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {profile.tasksCompleted}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400">Tasks</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {profile.habitsCompleted}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400">Habits</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {profile.goalsAchieved}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400">Goals</p>
        </div>
      </div>
    </motion.div>
  );
};

export default GamificationWidgetV2;

