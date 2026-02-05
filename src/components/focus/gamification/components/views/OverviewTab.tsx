import React from 'react';
import { Plus, Flame } from 'lucide-react';
import { type Achievement, type Goal } from '../../types';
import { getRarityColor, getRarityBorder, getGoalProgress } from '../../utils';

interface OverviewTabProps {
  achievements: Achievement[];
  goals: Goal[];
  onOpenCreateGoal: () => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  achievements,
  goals,
  onOpenCreateGoal
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Recent Achievements */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Recent Achievements</h3>
        <div className="space-y-3">
          {achievements.filter(a => a.unlockedAt).slice(0, 3).map((achievement) => (
            <div key={achievement.id} className={`flex items-center space-x-3 p-3 rounded-lg border-2 ${getRarityBorder(achievement.rarity)} bg-gradient-to-r ${getRarityColor(achievement.rarity)}/10`}>
              <div className="text-2xl">{achievement.icon}</div>
              <div className="flex-1">
                <div className="font-medium text-slate-900 dark:text-white">{achievement.name}</div>
                <div className="text-sm text-slate-600 dark:text-slate-300">{achievement.description}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-slate-900 dark:text-white">+{achievement.reward} XP</div>
                <div className={`text-xs px-2 py-1 rounded-full bg-gradient-to-r ${getRarityColor(achievement.rarity)} text-white`}>
                  {achievement.rarity}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active Goals */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Active Goals</h3>
          <button
            onClick={onOpenCreateGoal}
            className="flex items-center space-x-1 text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
            aria-label="Add goal"
          >
            <Plus size={16} />
            <span className="text-sm">Add Goal</span>
          </button>
        </div>
        <div className="space-y-3">
          {goals.filter(g => g.status === 'active').slice(0, 3).map((goal) => {
            const progress = getGoalProgress(goal);
            const isCompleted = progress >= 100;

            return (
              <div key={goal.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-slate-900 dark:text-white">{goal.title}</div>
                    <div className="text-sm text-slate-600 dark:text-slate-300">
                      {goal.currentProgress}/{goal.target.value} {goal.target.unit}
                    </div>
                  </div>
                  <div className="text-right">
                    {goal.streak > 0 && (
                      <div className="flex items-center space-x-1 text-orange-500">
                        <Flame size={14} />
                        <span className="text-sm">{goal.streak}</span>
                      </div>
                    )}
                    <div className="text-xs text-slate-500">+{goal.reward} XP</div>
                  </div>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      isCompleted ? 'bg-green-500' : 'bg-gradient-to-r from-indigo-500 to-purple-500'
                    }`}
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
