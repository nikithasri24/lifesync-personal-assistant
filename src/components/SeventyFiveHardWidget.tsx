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

import React, { useMemo, useCallback } from 'react';
import {
  Flame,
  CheckCircle2,
  Circle,
  ChevronRight
} from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';
import { toggleSFHTask } from '../seventyFiveHard/actions';
import { isSameDay, startOfDay } from 'date-fns';
import { getDailyQuote } from '../utils/motivationalQuotes';
import { logger } from '../services/logger';

interface SFHTask {
  id: string;
  title: string;
  description?: string;
}

interface TaskCompletion {
  taskId: string;
  completed: boolean;
}

interface SFHCheckIn {
  date: Date;
  taskCompletions: TaskCompletion[];
}

interface SFHChallenge {
  status: string;
  currentDay: number;
  tasks: SFHTask[];
}

export default function SeventyFiveHardWidget(): React.JSX.Element | null {
  const { sfhChallenge, sfhCheckIns, setActiveView } = useAppStore();

  // Memoize today's date to avoid recalculating
  const today = useMemo(() => startOfDay(new Date()), []);

  // Memoize today's check-in lookup - must be called before early returns
  const todayCheckIn = useMemo(
    () => (sfhCheckIns as SFHCheckIn[]).find((c: SFHCheckIn) => isSameDay(c.date, today)) ?? null,
    [sfhCheckIns, today]
  );

  // Memoize task completion map for O(1) lookups
  const taskCompletionMap = useMemo(() => {
    const map = new Map<string, boolean>();
    if (todayCheckIn) {
      todayCheckIn.taskCompletions.forEach((tc: TaskCompletion) => {
        map.set(tc.taskId, tc.completed);
      });
    }
    return map;
  }, [todayCheckIn]);

  // Memoize stats calculations
  const stats = useMemo(() => {
    if (!todayCheckIn || !sfhChallenge) {
      return {
        completedTasks: 0,
        totalTasks: 0,
        allComplete: false,
        progress: 0,
        daysRemaining: 75,
      };
    }
    const completedTasks = todayCheckIn.taskCompletions.filter((tc: TaskCompletion) => tc.completed).length;
    const totalTasks = (sfhChallenge as SFHChallenge).tasks.length;
    return {
      completedTasks,
      totalTasks,
      allComplete: completedTasks === totalTasks,
      progress: ((sfhChallenge as SFHChallenge).currentDay / 75) * 100,
      daysRemaining: 75 - (sfhChallenge as SFHChallenge).currentDay,
    };
  }, [todayCheckIn, sfhChallenge]);

  // Memoize handler to toggle task
  const handleToggleTask = useCallback((taskId: string) => {
    (toggleSFHTask as (taskId: string) => Promise<void>)(taskId).catch((error: unknown) => {
      logger.error('SeventyFiveHardWidget', 'Failed to toggle task:', error);
    });
  }, []);

  // Memoize navigation handler
  const handleViewFull = useCallback(() => {
    setActiveView('seventy-five-hard');
  }, [setActiveView]);

  // Early return conditions - after all hooks
  if (!sfhChallenge || (sfhChallenge as SFHChallenge).status !== 'active') {
    return null;
  }

  if (!todayCheckIn) {
    return null;
  }

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
              Day {(sfhChallenge as SFHChallenge).currentDay} of 75
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
            {Math.round(stats.progress)}%
          </span>
        </div>
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-600 to-pink-600 transition-all duration-500"
            style={{ width: `${stats.progress}%` }}
          />
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {(sfhChallenge as SFHChallenge).currentDay}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            Days Done
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {stats.daysRemaining}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            Remaining
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {stats.completedTasks}/{stats.totalTasks}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            Today
          </div>
        </div>
      </div>

      {/* Today's Tasks */}
      <div className="space-y-2">
        {stats.allComplete ? (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-3 border border-green-200 dark:border-green-800">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs font-medium text-green-900 dark:text-green-100 leading-relaxed">
                {getDailyQuote((sfhChallenge as SFHChallenge).currentDay)}
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                Today's Tasks
              </h4>
            </div>

            {(sfhChallenge as SFHChallenge).tasks
              .filter((task: SFHTask) => !taskCompletionMap.get(task.id))
              .map((task: SFHTask) => {
                return (
                  <button
                    key={task.id}
                    onClick={() => handleToggleTask(task.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg transition-all bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700"
                  >
                    <Circle className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {task.title}
                      </p>
                      {task.description && (
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {task.description}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
          </>
        )}
      </div>

      {/* Quick Action Hint */}
      {!stats.allComplete && (
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Tap tasks to mark complete, or visit 75 Hard page for photos & notes
          </p>
        </div>
      )}
    </div>
  );
}
