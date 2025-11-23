/**
 * Completed View Component
 *
 * Shown when user completes all 75 days.
 * - Celebration message
 * - Challenge statistics
 * - History view of all check-ins
 */

import React from 'react';
import { Trophy, Calendar, TrendingUp, Award } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { calculateStats, areAllTasksComplete } from '../../../types/seventyFiveHard';
import type { SeventyFiveHardChallenge, DailyCheckIn } from '../../../types/seventyFiveHard';

interface CompletedViewProps {
  challenge: SeventyFiveHardChallenge;
  checkIns: DailyCheckIn[];
}

export default function CompletedView({ challenge, checkIns }: CompletedViewProps): React.JSX.Element {
  const stats = calculateStats(challenge, checkIns);
  const duration = challenge.completedAt
    ? differenceInDays(challenge.completedAt, challenge.startDate) + 1
    : 75;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Celebration Header */}
      <div className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-500 rounded-lg p-8 text-center text-white shadow-xl">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-full mb-4">
          <Trophy className="w-12 h-12" />
        </div>
        <h1 className="text-4xl font-bold mb-2">Congratulations!</h1>
        <p className="text-xl mb-1">You completed the 75 Hard Challenge!</p>
        <p className="text-yellow-100">
          Finished on {challenge.completedAt && format(challenge.completedAt, 'MMMM d, yyyy')}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Duration</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{duration}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Days</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Completion Rate</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.completionRate}%</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Tasks completed</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-2">
            <Award className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Current Streak</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.currentStreak}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Consecutive days</p>
        </div>
      </div>

      {/* Challenge Details */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Your Journey</h2>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Start Date:</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {format(challenge.startDate, 'MMMM d, yyyy')}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">End Date:</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {challenge.completedAt && format(challenge.completedAt, 'MMMM d, yyyy')}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Total Tasks:</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {challenge.tasks.length} × 75 days = {challenge.tasks.length * 75} tasks
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Days Completed:</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {stats.totalDaysCompleted} days
            </span>
          </div>
        </div>
      </div>

      {/* Your Tasks */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Your Tasks</h2>
        <div className="space-y-2">
          {challenge.tasks.map((task, index) => (
            <div key={task.id} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="flex-shrink-0 w-6 h-6 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-full flex items-center justify-center text-sm font-semibold">
                {index + 1}
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">{task.title}</h3>
                {task.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">{task.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* History */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Daily History</h2>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {checkIns.map((checkIn) => {
            const allComplete = areAllTasksComplete(checkIn.taskCompletions);
            return (
              <div
                key={checkIn.id}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  allComplete
                    ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                    : 'bg-gray-50 dark:bg-gray-700/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium text-gray-900 dark:text-white">
                    Day {checkIn.dayNumber}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {format(checkIn.date, 'MMM d, yyyy')}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-sm ${allComplete ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}>
                    {checkIn.taskCompletions.filter(tc => tc.completed).length}/{checkIn.taskCompletions.length} tasks
                  </span>
                  {allComplete && (
                    <Trophy className="w-4 h-4 text-green-600 dark:text-green-400" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Motivational message */}
      <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-6 text-center">
        <p className="text-lg font-medium text-primary-900 dark:text-primary-100 mb-2">
          You've proven to yourself that you can do hard things.
        </p>
        <p className="text-primary-700 dark:text-primary-300">
          This discipline and mental toughness will serve you in everything you do. Well done!
        </p>
      </div>
    </div>
  );
}
