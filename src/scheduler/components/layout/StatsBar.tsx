import React from 'react';

interface StatsBarProps {
  totalTasks: number;
  inProgressTasks: number;
  completedTasks: number;
}

/**
 * Statistics bar showing task counts
 */
export function StatsBar({
  totalTasks,
  inProgressTasks,
  completedTasks,
}: StatsBarProps): React.ReactElement {
  return (
    <div className="px-6 py-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-gray-600 dark:text-gray-400">Total:</span>
          <span className="font-bold text-gray-900 dark:text-white">
            {totalTasks}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-600 dark:text-gray-400">In Progress:</span>
          <span className="font-bold text-blue-600 dark:text-blue-400">
            {inProgressTasks}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-600 dark:text-gray-400">Completed:</span>
          <span className="font-bold text-green-600 dark:text-green-400">
            {completedTasks}
          </span>
        </div>
      </div>
    </div>
  );
}
