/**
 * 75 Hard Dashboard Widget
 *
 * Displays current challenge status and quick actions on the Dashboard.
 * Provides at-a-glance view and ability to complete tasks without navigating away.
 *
 * Features:
 * - Current day and progress bar
 * - Today's task checklist with quick checkoff
 * - Days completed and remaining counters
 * - Quick navigation to full 75 Hard page
 * - Responsive design with dark mode support
 *
 * @component
 */

import React from 'react';
import {
  Flame,
  CheckCircle2,
  Circle,
  ChevronRight,
  TrendingUp,
  Calendar
} from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';
import { toggleSFHTask } from '../stores/seventyFiveHardActions';
import { isSameDay, startOfDay } from 'date-fns';

export default function SeventyFiveHardWidget() {
  const { sfhChallenge, sfhCheckIns, setActiveView } = useAppStore();

  // Don't show widget if no active challenge
  if (!sfhChallenge || sfhChallenge.status !== 'active') {
    return null;
  }

  // Get today's check-in
  const today = startOfDay(new Date());
  const todayCheckIn = sfhCheckIns.find(c => isSameDay(c.date, today));

  if (!todayCheckIn) {
    return null;
  }

  // Calculate stats
  const completedTasks = todayCheckIn.taskCompletions.filter(tc => tc.completed).length;
  const totalTasks = sfhChallenge.tasks.length;
  const allComplete = completedTasks === totalTasks;
  const progress = (sfhChallenge.currentDay / 75) * 100;
  const daysRemaining = 75 - sfhChallenge.currentDay;

  // Handler to toggle task
  const handleToggleTask = async (taskId: string) => {
    await toggleSFHTask(taskId);
  };

  // Navigate to full 75 Hard page
  const handleViewFull = () => {
    setActiveView('seventy-five-hard');
  };

  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border-2 border-purple-200 dark:border-purple-800 p-6 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-2 rounded-lg">
            <Flame className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              75 Hard Challenge
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Day {sfhChallenge.currentDay} of 75
            </p>
          </div>
        </div>
        <button
          onClick={handleViewFull}
          className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg transition-colors"
        >
          View All
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="font-medium text-gray-700 dark:text-gray-300">
            Progress
          </span>
          <span className="text-gray-600 dark:text-gray-400">
            {Math.round(progress)}%
          </span>
        </div>
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-600 to-pink-600 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {sfhChallenge.currentDay}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            Days Done
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {daysRemaining}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            Remaining
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {completedTasks}/{totalTasks}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            Today
          </div>
        </div>
      </div>

      {/* Today's Tasks */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
            Today's Tasks
          </h4>
          {allComplete && (
            <span className="text-xs font-medium text-green-600 dark:text-green-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              All Done!
            </span>
          )}
        </div>

        {sfhChallenge.tasks.map((task) => {
          const completion = todayCheckIn.taskCompletions.find(tc => tc.taskId === task.id);
          const isCompleted = completion?.completed || false;

          return (
            <button
              key={task.id}
              onClick={() => handleToggleTask(task.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                isCompleted
                  ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                  : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700'
              }`}
            >
              {isCompleted ? (
                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
              ) : (
                <Circle className="w-5 h-5 text-gray-400 flex-shrink-0" />
              )}
              <div className="flex-1 text-left">
                <p className={`text-sm font-medium ${
                  isCompleted
                    ? 'text-green-900 dark:text-green-100 line-through'
                    : 'text-gray-900 dark:text-white'
                }`}>
                  {task.name}
                </p>
                {task.details && (
                  <p className={`text-xs ${
                    isCompleted
                      ? 'text-green-700 dark:text-green-300'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    {task.details}
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Quick Action Hint */}
      {!allComplete && (
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            💡 Tap tasks to mark complete, or visit 75 Hard page for photos & notes
          </p>
        </div>
      )}
    </div>
  );
}
