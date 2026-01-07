/**
 * Gamification Widget
 * Compact display of XP, level, and streak for dashboard/header
 */

import React from 'react';
import { Trophy, Flame, Star, TrendingUp } from 'lucide-react';
import { useGamificationProfile } from '@/hooks/useGamificationQuery';

interface GamificationWidgetProps {
  variant?: 'compact' | 'full';
  className?: string;
}

export const GamificationWidget: React.FC<GamificationWidgetProps> = ({ 
  variant = 'compact',
  className = '' 
}) => {
  const { data: profile, isLoading } = useGamificationProfile();

  if (isLoading || !profile) {
    return (
      <div className={`animate-pulse bg-slate-100 dark:bg-slate-800 rounded-lg h-12 ${className}`} />
    );
  }

  const xpProgress = profile.xpToNextLevel > 0 
    ? ((profile.totalXp % profile.xpToNextLevel) / profile.xpToNextLevel) * 100 
    : 100;

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        {/* Level Badge */}
        <div className="flex items-center gap-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-2.5 py-1 rounded-full text-sm font-medium">
          <Star className="h-3.5 w-3.5" />
          <span>Lv.{profile.currentLevel}</span>
        </div>

        {/* XP */}
        <div className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400">
          <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
          <span>{profile.totalXp.toLocaleString()} XP</span>
        </div>

        {/* Streak */}
        {profile.currentStreak > 0 && (
          <div className="flex items-center gap-1 text-sm text-orange-600 dark:text-orange-400">
            <Flame className="h-3.5 w-3.5" />
            <span>{profile.currentStreak} day{profile.currentStreak !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>
    );
  }

  // Full variant
  return (
    <div className={`bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg">
            <Trophy className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">Level {profile.currentLevel}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">{profile.rankTitle}</p>
          </div>
        </div>
        
        {profile.currentStreak > 0 && (
          <div className="flex items-center gap-1.5 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-3 py-1.5 rounded-full">
            <Flame className="h-4 w-4" />
            <span className="font-medium">{profile.currentStreak} 🔥</span>
          </div>
        )}
      </div>

      {/* XP Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>{profile.totalXp.toLocaleString()} XP</span>
          <span>{profile.xpToNextLevel.toLocaleString()} to next level</span>
        </div>
        <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-500"
            style={{ width: `${xpProgress}%` }}
          />
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-200 dark:border-slate-700">
        <div className="text-center">
          <p className="text-lg font-bold text-slate-900 dark:text-white">{profile.tasksCompleted}</p>
          <p className="text-xs text-slate-500">Tasks</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-slate-900 dark:text-white">{profile.habitsCompleted}</p>
          <p className="text-xs text-slate-500">Habits</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-slate-900 dark:text-white">{profile.goalsAchieved}</p>
          <p className="text-xs text-slate-500">Goals</p>
        </div>
      </div>
    </div>
  );
};

export default GamificationWidget;

