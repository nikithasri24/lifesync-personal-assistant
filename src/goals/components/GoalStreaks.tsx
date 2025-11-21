/**
 * Goal Streaks Component
 * Daily check-ins, streak tracking, and calendar visualization
 */

import React, { useState, useEffect } from 'react';
import { Calendar, Flame, CheckCircle2, XCircle, TrendingUp, Award } from 'lucide-react';
import { recordStreak, getStreakHistory, updateLifeGoal } from '../api/lifeGoalsAPI';
import type { LifeGoal, LifeGoalStreakEntry } from '../types/lifeGoals';
import { logger } from '../../services/logger';

interface GoalStreaksProps {
  goal: LifeGoal;
  onGoalUpdated: (goal: LifeGoal) => void;
}

const GoalStreaks: React.FC<GoalStreaksProps> = ({ goal, onGoalUpdated }) => {
  const [streakHistory, setStreakHistory] = useState<LifeGoalStreakEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [todayNote, setTodayNote] = useState('');

  const today = new Date().toISOString().split('T')[0];
  const todayEntry = streakHistory.find(entry => entry.date === today);
  const hasCheckedInToday = todayEntry?.completed ?? false;

  useEffect(() => {
    loadStreakHistory();
  }, [goal.id]);

  const loadStreakHistory = async () => {
    try {
      setLoading(true);
      const history = await getStreakHistory(goal.id, 90); // Last 90 days
      setStreakHistory(history);
    } catch (error) {
      logger.error('Error loading streak history:', { error });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (completed: boolean) => {
    try {
      setCheckingIn(true);

      // Record streak entry
      const entry = await recordStreak(goal.id, today, completed, todayNote || undefined);

      // Calculate new streak
      const sortedHistory = [...streakHistory, entry].sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      const newCurrentStreak = calculateCurrentStreak(sortedHistory);
      const newLongestStreak = Math.max(goal.longestStreak || 0, newCurrentStreak);

      // Update goal with new streak values
      const updatedGoal = await updateLifeGoal(goal.id, {
        currentStreak: newCurrentStreak,
        longestStreak: newLongestStreak,
      });

      setStreakHistory(sortedHistory);
      onGoalUpdated(updatedGoal);
      setTodayNote('');
    } catch (error) {
      logger.error('Error checking in:', { error });
      alert('Failed to record check-in');
    } finally {
      setCheckingIn(false);
    }
  };

  const calculateCurrentStreak = (history: LifeGoalStreakEntry[]): number => {
    let streak = 0;
    const sortedCompleted = history
      .filter(e => e.completed)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (sortedCompleted.length === 0) return 0;

    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);

    for (const entry of sortedCompleted) {
      const entryDate = new Date(entry.date);
      entryDate.setHours(0, 0, 0, 0);

      const daysDiff = Math.floor((todayDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDiff === streak) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  };

  const renderCalendar = () => {
    // Get last 42 days (6 weeks) for calendar grid
    const days: Date[] = [];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 41);

    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      days.push(date);
    }

    return (
      <div className="grid grid-cols-7 gap-1">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
          <div key={i} className="text-center text-xs font-medium text-slate-500 pb-1">
            {day}
          </div>
        ))}
        {days.map((date, i) => {
          const dateStr = date.toISOString().split('T')[0];
          const entry = streakHistory.find(e => e.date === dateStr);
          const isToday = dateStr === today;
          const isCurrentMonth = date.getMonth() === new Date().getMonth();

          return (
            <div
              key={i}
              className={`aspect-square rounded flex items-center justify-center text-xs relative group ${
                entry?.completed
                  ? 'bg-green-500 text-white font-semibold'
                  : entry && !entry.completed
                  ? 'bg-red-100 text-red-600'
                  : isCurrentMonth
                  ? 'bg-slate-100 text-slate-400'
                  : 'bg-slate-50 text-slate-300'
              } ${isToday ? 'ring-2 ring-indigo-500' : ''}`}
            >
              {date.getDate()}
              {entry?.notes && (
                <div className="absolute hidden group-hover:block bottom-full mb-1 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                  {entry.notes}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  if (!goal.streakEnabled) {
    return null;
  }

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-4">
      {/* Streak Stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Flame className={`h-5 w-5 ${goal.currentStreak && goal.currentStreak > 0 ? 'text-orange-500' : 'text-slate-400'}`} />
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {goal.currentStreak || 0} day streak
              </p>
              <p className="text-xs text-slate-500">
                Best: {goal.longestStreak || 0} days
              </p>
            </div>
          </div>

          {goal.streakTarget && (
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-indigo-600" />
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Target: {goal.streakTarget} days
                </p>
                <p className="text-xs text-slate-500">
                  {goal.streakTarget - (goal.currentStreak || 0)} to go
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Today's check-in */}
        {hasCheckedInToday ? (
          <div className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg border border-green-200">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-sm font-medium">Checked in today!</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Add a note (optional)"
              value={todayNote}
              onChange={(e) => setTodayNote(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded text-sm w-40"
              disabled={checkingIn}
            />
            <button
              onClick={() => handleCheckIn(true)}
              disabled={checkingIn}
              className="px-3 py-2 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700 disabled:bg-slate-300 flex items-center gap-1"
            >
              <CheckCircle2 className="h-4 w-4" />
              Check In
            </button>
            <button
              onClick={() => handleCheckIn(false)}
              disabled={checkingIn}
              className="px-3 py-2 bg-red-100 text-red-700 rounded text-sm font-medium hover:bg-red-200 disabled:bg-slate-300 flex items-center gap-1"
            >
              <XCircle className="h-4 w-4" />
              Missed
            </button>
          </div>
        )}
      </div>

      {/* Calendar visualization */}
      <div className="bg-white border border-slate-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="h-4 w-4 text-slate-600" />
          <h4 className="text-sm font-semibold text-slate-900">Last 6 Weeks</h4>
        </div>
        {renderCalendar()}

        <div className="flex items-center gap-4 mt-3 text-xs text-slate-600">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded" />
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-100 rounded" />
            <span>Missed</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-slate-100 rounded" />
            <span>No data</span>
          </div>
        </div>
      </div>

      {/* Completion rate */}
      {streakHistory.length > 0 && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-indigo-600" />
              <span className="text-sm font-medium text-indigo-900">Completion Rate</span>
            </div>
            <span className="text-lg font-bold text-indigo-600">
              {Math.round((streakHistory.filter(e => e.completed).length / streakHistory.length) * 100)}%
            </span>
          </div>
          <p className="text-xs text-indigo-700 mt-1">
            {streakHistory.filter(e => e.completed).length} of {streakHistory.length} days tracked
          </p>
        </div>
      )}
    </div>
  );
};

export default GoalStreaks;
