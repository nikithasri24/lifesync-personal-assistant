/**
 * Achievement Badge Component
 * Displays an individual achievement with progress and unlock status
 */

import React from 'react';
import { CheckCircle, Lock } from 'lucide-react';
import { format } from 'date-fns';
import type { AchievementRarity } from '@/services/gamification/types';

interface AchievementBadgeProps {
  name: string;
  description: string;
  icon: string;
  rarity: AchievementRarity;
  xpReward: number;
  isUnlocked: boolean;
  progress: number;
  unlockedAt?: Date;
  size?: 'sm' | 'md' | 'lg';
}

const rarityColors: Record<AchievementRarity, { bg: string; border: string; text: string }> = {
  common: {
    bg: 'from-slate-400 to-slate-500',
    border: 'border-slate-400',
    text: 'text-slate-600',
  },
  rare: {
    bg: 'from-blue-400 to-blue-600',
    border: 'border-blue-500',
    text: 'text-blue-600',
  },
  epic: {
    bg: 'from-purple-400 to-purple-600',
    border: 'border-purple-500',
    text: 'text-purple-600',
  },
  legendary: {
    bg: 'from-amber-400 to-orange-500',
    border: 'border-amber-500',
    text: 'text-amber-600',
  },
};

export const AchievementBadge: React.FC<AchievementBadgeProps> = ({
  name,
  description,
  icon,
  rarity,
  xpReward,
  isUnlocked,
  progress,
  unlockedAt,
  size = 'md',
}) => {
  const colors = rarityColors[rarity];
  
  const sizeClasses = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  const iconSizes = {
    sm: 'text-2xl',
    md: 'text-3xl',
    lg: 'text-5xl',
  };

  return (
    <div
      className={`relative rounded-xl border-2 transition-all duration-300 ${sizeClasses[size]} ${
        isUnlocked
          ? `${colors.border} bg-gradient-to-br ${colors.bg}/10`
          : 'border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50'
      } ${!isUnlocked && progress > 0 ? 'ring-2 ring-indigo-200 dark:ring-indigo-800' : ''}
      hover:shadow-lg hover:scale-[1.02]`}
    >
      {/* Unlocked indicator */}
      {isUnlocked && (
        <div className="absolute top-2 right-2">
          <CheckCircle className="w-5 h-5 text-green-500" />
        </div>
      )}

      {/* Locked indicator */}
      {!isUnlocked && progress === 0 && (
        <div className="absolute top-2 right-2">
          <Lock className="w-4 h-4 text-slate-400" />
        </div>
      )}

      {/* Icon */}
      <div className={`mb-3 ${iconSizes[size]} ${!isUnlocked ? 'opacity-50 grayscale' : ''}`}>
        {icon}
      </div>

      {/* Name */}
      <h4 className={`font-semibold mb-1 ${
        isUnlocked ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'
      }`}>
        {name}
      </h4>

      {/* Description */}
      <p className={`text-sm mb-3 ${
        isUnlocked ? 'text-slate-600 dark:text-slate-300' : 'text-slate-400 dark:text-slate-500'
      }`}>
        {description}
      </p>

      {/* Progress bar (when not unlocked) */}
      {!isUnlocked && (
        <div className="mb-3">
          <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${colors.bg} rounded-full transition-all duration-500`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-1">{progress}% complete</p>
        </div>
      )}

      {/* Footer: Rarity & XP */}
      <div className="flex items-center justify-between">
        <span className={`text-xs px-2 py-1 rounded-full bg-gradient-to-r ${colors.bg} text-white capitalize`}>
          {rarity}
        </span>
        <span className={`text-sm font-bold ${
          isUnlocked ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'
        }`}>
          +{xpReward} XP
        </span>
      </div>

      {/* Unlock date */}
      {isUnlocked && unlockedAt && (
        <div className="text-xs text-slate-500 dark:text-slate-400 mt-2">
          Unlocked {format(unlockedAt, 'MMM d, yyyy')}
        </div>
      )}
    </div>
  );
};

export default AchievementBadge;

