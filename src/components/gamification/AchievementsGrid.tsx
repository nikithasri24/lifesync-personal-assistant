/**
 * Achievements Grid Component
 * Displays all achievements with filtering and progress tracking
 */

import React, { useState, useMemo } from 'react';
import { Trophy, Filter } from 'lucide-react';
import { AchievementBadge } from './AchievementBadge';
import { useAchievementsWithProgress } from '@/hooks/useGamificationQuery';
import type { AchievementCategory, AchievementRarity } from '@/services/gamification/types';

type FilterType = 'all' | 'unlocked' | 'in-progress' | 'locked';

export const AchievementsGrid: React.FC = () => {
  const { achievements, isLoading } = useAchievementsWithProgress();
  const [filter, setFilter] = useState<FilterType>('all');
  const [categoryFilter, setCategoryFilter] = useState<AchievementCategory | 'all'>('all');

  const filteredAchievements = useMemo(() => {
    let result = achievements;

    // Status filter
    switch (filter) {
      case 'unlocked':
        result = result.filter(a => a.isUnlocked);
        break;
      case 'in-progress':
        result = result.filter(a => !a.isUnlocked && a.progress > 0);
        break;
      case 'locked':
        result = result.filter(a => !a.isUnlocked && a.progress === 0);
        break;
    }

    // Category filter
    if (categoryFilter !== 'all') {
      result = result.filter(a => a.category === categoryFilter);
    }

    return result;
  }, [achievements, filter, categoryFilter]);

  const stats = useMemo(() => ({
    total: achievements.length,
    unlocked: achievements.filter(a => a.isUnlocked).length,
    inProgress: achievements.filter(a => !a.isUnlocked && a.progress > 0).length,
  }), [achievements]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="animate-pulse bg-slate-100 dark:bg-slate-800 rounded-xl h-48" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg">
            <Trophy className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Achievements</h2>
            <p className="text-sm text-slate-500">
              {stats.unlocked} / {stats.total} unlocked
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="flex items-center gap-1.5 mr-2">
          <Filter className="h-4 w-4 text-slate-400" />
        </div>
        
        {/* Status Filter */}
        {(['all', 'unlocked', 'in-progress', 'locked'] as FilterType[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-sm rounded-full transition-all ${
              filter === f
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            {f === 'all' ? 'All' : f === 'in-progress' ? 'In Progress' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}

        <span className="mx-2 text-slate-300">|</span>

        {/* Category Filter */}
        {(['all', 'streak', 'completion', 'milestone', 'time'] as const).map((c) => (
          <button
            key={c}
            onClick={() => setCategoryFilter(c)}
            className={`px-3 py-1.5 text-sm rounded-full transition-all ${
              categoryFilter === c
                ? 'bg-purple-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            {c.charAt(0).toUpperCase() + c.slice(1)}
          </button>
        ))}
      </div>

      {/* Achievements Grid */}
      {filteredAchievements.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          No achievements found for this filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredAchievements.map((achievement) => (
            <AchievementBadge
              key={achievement.id}
              name={achievement.name}
              description={achievement.description}
              icon={achievement.icon}
              rarity={achievement.rarity}
              xpReward={achievement.xpReward}
              isUnlocked={achievement.isUnlocked}
              progress={achievement.progress}
              unlockedAt={achievement.unlockedAt}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AchievementsGrid;

