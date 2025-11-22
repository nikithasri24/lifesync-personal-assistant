import React from 'react';
import { Flame, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { type Goal } from '../../types';
import { getGoalProgress } from '../../utils';

interface GoalCardProps {
  goal: Goal;
}

export const GoalCard: React.FC<GoalCardProps> = ({ goal }) => {
  const progress = getGoalProgress(goal);
  const isCompleted = goal.status === 'completed' || progress >= 100;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h4 className="font-semibold text-slate-900 dark:text-white mb-1">{goal.title}</h4>
          {goal.description && (
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">{goal.description}</p>
          )}
          <div className="flex items-center space-x-3 text-xs text-slate-500 dark:text-slate-400">
            <span className={`px-2 py-1 rounded-full ${
              goal.priority === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
              goal.priority === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' :
              'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300'
            }`}>
              {goal.priority}
            </span>
            <span>{goal.type}</span>
          </div>
        </div>

        <div className="text-right">
          {goal.streak > 0 && (
            <div className="flex items-center space-x-1 text-orange-500 mb-1">
              <Flame size={14} />
              <span className="text-sm">{goal.streak}</span>
            </div>
          )}
          <div className="text-xs text-slate-500">+{goal.reward} XP</div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-slate-600 dark:text-slate-300">
            {goal.currentProgress}/{goal.target.value} {goal.target.unit}
          </span>
          <span className={`font-medium ${isCompleted ? 'text-green-500' : 'text-slate-900 dark:text-white'}`}>
            {Math.round(progress)}%
          </span>
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

      {goal.endDate && (
        <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
          Ends {format(goal.endDate, 'MMM d, yyyy')}
        </div>
      )}

      {isCompleted && (
        <div className="mt-3 flex items-center space-x-2 text-green-500">
          <CheckCircle size={16} />
          <span className="text-sm font-medium">Completed!</span>
        </div>
      )}
    </div>
  );
};
