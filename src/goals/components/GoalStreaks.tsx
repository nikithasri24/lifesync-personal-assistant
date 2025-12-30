import React from 'react';
import { format, subDays } from 'date-fns';
import type { LifeGoal } from '../types/lifeGoals';
import { useRecordStreakMutation, useStreakHistoryQuery } from '@/hooks/useLifeGoalsQuery';
import ErrorState from '@/components/ErrorState';

interface GoalStreaksProps {
  goal: LifeGoal;
  onGoalUpdated?: () => void;
}

export function GoalStreaks({ goal: _goal, onGoalUpdated: _onGoalUpdated }: GoalStreaksProps): React.ReactElement {
  const goal = _goal;
  const today = format(new Date(), 'yyyy-MM-dd');
  const { data: streakHistory = [], error } = useStreakHistoryQuery(goal.id, 7);
  const recordStreakMutation = useRecordStreakMutation();

  const todayEntry = streakHistory.find((entry) => entry.date === today);
  const isCompletedToday = todayEntry?.completed ?? false;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900">Streaks</p>
          <p className="text-xs text-slate-500">
            Current streak: {goal.currentStreak} days • Best: {goal.longestStreak} days
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            recordStreakMutation.mutate({ goalId: goal.id, date: today, completed: !isCompletedToday });
          }}
          className={`rounded-full px-3 py-1 text-xs font-medium transition ${
            isCompletedToday
              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
          }`}
        >
          {isCompletedToday ? 'Undo today' : 'Mark today'}
        </button>
      </div>

      {error && (
        <div className="mt-3">
          <ErrorState error={error} />
        </div>
      )}

      <div className="mt-3 flex items-center gap-1">
        {Array.from({ length: 7 }).map((_, index) => {
          const date = format(subDays(new Date(), 6 - index), 'yyyy-MM-dd');
          const entry = streakHistory.find((streak) => streak.date === date);
          const completed = entry?.completed ?? false;
          return (
            <span
              key={date}
              className={`h-3 w-3 rounded-full ${
                completed ? 'bg-emerald-500' : 'bg-slate-200'
              }`}
              title={date}
            />
          );
        })}
      </div>
    </div>
  );
}

export default GoalStreaks;
