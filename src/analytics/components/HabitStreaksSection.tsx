import React, { type ReactElement } from 'react';
import { Flame } from 'lucide-react';

interface HabitStatItem {
  id?: string;
  name: string;
  color?: string;
  streak: number;
  totalCompletions: number;
}

interface HabitStreaksSectionProps {
  habitStats: HabitStatItem[];
}

/**
 * Habit streaks section showing sorted list by streak
 */
export function HabitStreaksSection({
  habitStats,
}: HabitStreaksSectionProps): React.ReactElement {
  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <Flame className="mr-2" size={20} />
        Habit Streaks
      </h3>
      <div className="space-y-3">
        {habitStats.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No habits to track</p>
        ) : (
          habitStats
            .sort((a, b): number => b.streak - a.streak)
            .map((habit, index): ReactElement => (
              <div key={habit.id ?? `habit-${index}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: habit.color }}
                  />
                  <div>
                    <p className="font-medium text-gray-900">{habit.name}</p>
                    <p className="text-xs text-gray-500">{habit.totalCompletions} total completions</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-orange-600">{habit.streak}</p>
                  <p className="text-xs text-gray-500">day streak</p>
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  );
}
