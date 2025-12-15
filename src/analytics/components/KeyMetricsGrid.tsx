import React from 'react';
import { TrendingUp, CheckSquare, Target, Flame } from 'lucide-react';

interface HabitStat {
  name: string;
  streak: number;
  [key: string]: unknown;
}

interface KeyMetricsGridProps {
  totalProductivityScore: number;
  avgDailyScore: number;
  bestHabit: HabitStat | null;
  todoCompletionRate: number;
  completedTodos: number;
  totalTodos: number;
  overallHabitRate: number;
}

/**
 * Grid of key metrics cards for Analytics page
 */
export function KeyMetricsGrid({
  totalProductivityScore,
  avgDailyScore,
  bestHabit,
  todoCompletionRate,
  completedTodos,
  totalTodos,
  overallHabitRate,
}: KeyMetricsGridProps): React.ReactElement {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Weekly Score</p>
            <p className="text-3xl font-bold text-primary-600">{totalProductivityScore}</p>
            <p className="text-xs text-gray-500">{avgDailyScore}/day avg</p>
          </div>
          <div className="bg-primary-600 p-3 rounded-lg">
            <TrendingUp className="text-white" size={24} />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Best Streak</p>
            <p className="text-3xl font-bold text-orange-600">{bestHabit?.streak ?? 0}</p>
            <p className="text-xs text-gray-500 truncate">{bestHabit?.name ?? 'No habits'}</p>
          </div>
          <div className="bg-orange-500 p-3 rounded-lg">
            <Flame className="text-white" size={24} />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Task Rate</p>
            <p className="text-3xl font-bold text-green-600">{todoCompletionRate}%</p>
            <p className="text-xs text-gray-500">{completedTodos}/{totalTodos} done</p>
          </div>
          <div className="bg-green-500 p-3 rounded-lg">
            <CheckSquare className="text-white" size={24} />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Habit Rate</p>
            <p className="text-3xl font-bold text-purple-600">{overallHabitRate}%</p>
            <p className="text-xs text-gray-500">This week avg</p>
          </div>
          <div className="bg-purple-500 p-3 rounded-lg">
            <Target className="text-white" size={24} />
          </div>
        </div>
      </div>
    </div>
  );
}
