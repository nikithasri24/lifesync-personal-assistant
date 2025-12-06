import React from 'react';
import { Trophy } from 'lucide-react';
import { type Achievement } from '../../types';
import { AchievementCard } from '../cards';

interface AchievementsTabProps {
  achievements: Achievement[];
}

export const AchievementsTab: React.FC<AchievementsTabProps> = ({ achievements }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Achievements</h3>
        <div className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-300">
          <Trophy size={16} />
          <span>{achievements.filter(a => a.unlockedAt).length}/{achievements.length} unlocked</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {achievements.map((achievement) => (
          <AchievementCard key={achievement.id} achievement={achievement} />
        ))}
      </div>
    </div>
  );
};
