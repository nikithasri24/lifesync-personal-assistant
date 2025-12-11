/**
 * SkincareStats - Analytics dashboard for skincare tracking
 * Shows completion rates, streaks, and progress charts
 */

import React from 'react';
import { Flame, TrendingUp, Calendar, CheckCircle2 } from 'lucide-react';
import { useCompletionStats, useSkincareStreak } from '../../hooks/useSkincareQuery';

interface SkincareStatsProps {
  className?: string;
}

const SkincareStats: React.FC<SkincareStatsProps> = ({ className = '' }) => {
  // Get date range for last 7 days
  const today = new Date();
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6); // -6 to include today

  const startDate = sevenDaysAgo.toISOString().split('T')[0];
  const endDate = today.toISOString().split('T')[0];

  // Fetch stats
  const { data: stats, isLoading: statsLoading } = useCompletionStats(startDate, endDate);
  const { data: streak, isLoading: streakLoading } = useSkincareStreak();

  const loading = statsLoading || streakLoading;

  if (loading) {
    return (
      <div className={`bg-white rounded-xl p-6 border border-gray-200 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-20 bg-gray-200 rounded" />
            <div className="h-20 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  const completionRate = stats?.completionRate || 0;
  const currentStreak = streak?.currentStreak || 0;
  const bestStreak = streak?.bestStreak || 0;
  const completedDays = stats?.completedDays || 0;
  const totalDays = stats?.totalDays || 7;
  const amCompletions = stats?.amCompletions || 0;
  const pmCompletions = stats?.pmCompletions || 0;

  return (
    <div className={`bg-white rounded-xl p-6 border border-gray-200 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Progress</h3>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Current Streak */}
        <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg p-4 border border-orange-200">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="h-5 w-5 text-orange-600" />
            <span className="text-sm font-medium text-orange-900">Current Streak</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-orange-600">{currentStreak}</span>
            <span className="text-sm text-orange-600">
              {currentStreak === 1 ? 'day' : 'days'}
            </span>
          </div>
          {bestStreak > currentStreak && (
            <p className="text-xs text-orange-700 mt-1">Best: {bestStreak} days</p>
          )}
        </div>

        {/* Completion Rate (Last 7 Days) */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">This Week</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-blue-600">
              {completionRate.toFixed(0)}%
            </span>
          </div>
          <p className="text-xs text-blue-700 mt-1">
            {completedDays} of {totalDays} days completed
          </p>
        </div>

        {/* AM Completions */}
        <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-lg p-4 border border-amber-200">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-5 w-5 text-amber-600" />
            <span className="text-sm font-medium text-amber-900">AM Routines</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-amber-600">{amCompletions}</span>
            <span className="text-sm text-amber-600">this week</span>
          </div>
          <div className="mt-2 h-1.5 bg-amber-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-600 rounded-full transition-all duration-300"
              style={{ width: `${(amCompletions / totalDays) * 100}%` }}
            />
          </div>
        </div>

        {/* PM Completions */}
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-4 border border-indigo-200">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="h-5 w-5 text-indigo-600" />
            <span className="text-sm font-medium text-indigo-900">PM Routines</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-indigo-600">{pmCompletions}</span>
            <span className="text-sm text-indigo-600">this week</span>
          </div>
          <div className="mt-2 h-1.5 bg-indigo-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 rounded-full transition-all duration-300"
              style={{ width: `${(pmCompletions / totalDays) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Weekly Heatmap */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Last 7 Days</h4>
        <div className="flex gap-2">
          {Array.from({ length: 7 }).map((_, index) => {
            const date = new Date(sevenDaysAgo);
            date.setDate(date.getDate() + index);
            const dateStr = date.toISOString().split('T')[0];
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });

            // For now, just show if it's a completed day (simple version)
            // In a full implementation, we'd check the actual logs
            const isCompleted = index < completedDays; // Simplified logic

            return (
              <div key={dateStr} className="flex-1">
                <div
                  className={`h-16 rounded-lg border-2 transition-all duration-200 ${
                    isCompleted
                      ? 'bg-green-500 border-green-600'
                      : 'bg-gray-100 border-gray-200'
                  }`}
                  title={dateStr}
                />
                <p className="text-xs text-center text-gray-600 mt-1">{dayName}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Motivational Message */}
      {currentStreak > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
            <p className="text-sm font-medium text-green-900">
              {currentStreak >= 7
                ? `Amazing! You've maintained your routine for ${currentStreak} days! 🎉`
                : currentStreak >= 3
                ? `Great job! Keep up the ${currentStreak}-day streak! 💪`
                : `You're on a roll! ${currentStreak} day${currentStreak > 1 ? 's' : ''} strong! ✨`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SkincareStats;
