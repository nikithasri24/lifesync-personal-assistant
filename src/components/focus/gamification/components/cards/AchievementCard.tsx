import React from 'react';
import { CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { type Achievement } from '../../types';
import { getRarityColor, getRarityBorder } from '../../utils';

interface AchievementCardProps {
  achievement: Achievement;
}

export const AchievementCard: React.FC<AchievementCardProps> = ({ achievement }) => {
  const isUnlocked = !!achievement.unlockedAt;
  const progress = achievement.progress ?? 0;

  return (
    <div
      className={`relative p-6 rounded-xl border-2 transition-all ${
        isUnlocked
          ? `${getRarityBorder(achievement.rarity)} bg-gradient-to-br ${getRarityColor(achievement.rarity)}/10`
          : 'border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50'
      } ${!isUnlocked && progress > 0 ? 'ring-2 ring-indigo-200 dark:ring-indigo-800' : ''}`}
    >
      {isUnlocked && (
        <div className="absolute top-2 right-2">
          <CheckCircle className="w-5 h-5 text-green-500" />
        </div>
      )}

      <div className={`text-4xl mb-3 ${!isUnlocked ? 'opacity-50' : ''}`}>
        {achievement.icon}
      </div>

      <h4 className={`font-semibold mb-1 ${isUnlocked ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
        {achievement.name}
      </h4>

      <p className={`text-sm mb-3 ${isUnlocked ? 'text-slate-600 dark:text-slate-300' : 'text-slate-400 dark:text-slate-500'}`}>
        {achievement.description}
      </p>

      {!isUnlocked && progress > 0 && (
        <div className="mb-3">
          <div className="flex justify-between text-xs text-slate-600 dark:text-slate-300 mb-1">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className={`text-xs px-2 py-1 rounded-full bg-gradient-to-r ${getRarityColor(achievement.rarity)} text-white`}>
          {achievement.rarity}
        </span>
        <span className={`text-sm font-bold ${isUnlocked ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
          +{achievement.reward} XP
        </span>
      </div>

      {isUnlocked && achievement.unlockedAt && (
        <div className="text-xs text-slate-500 dark:text-slate-400 mt-2">
          Unlocked {format(achievement.unlockedAt, 'MMM d, yyyy')}
        </div>
      )}
    </div>
  );
};
