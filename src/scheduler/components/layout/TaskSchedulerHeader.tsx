import React from 'react';
import { Search, Filter, Timer, Plus } from 'lucide-react';

interface PomodoroTimer {
  taskId: string | null;
  timeLeft: number;
  isActive: boolean;
}

interface TaskSchedulerHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  showFilters: boolean;
  onToggleFilters: () => void;
  pomodoroTimer: PomodoroTimer;
  onTogglePomodoro: () => void;
  onCreateTask: () => void;
  importantTaskCount: number;
}

/**
 * Header for Task Scheduler with search, filters, pomodoro, and create button
 */
export function TaskSchedulerHeader({
  searchQuery,
  onSearchChange,
  showFilters,
  onToggleFilters,
  pomodoroTimer,
  onTogglePomodoro,
  onCreateTask,
  importantTaskCount,
}: TaskSchedulerHeaderProps): React.ReactElement {
  return (
    <div className="px-6 py-4">
      {/* Title Row */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Task Scheduler
        </h1>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 pr-4 py-2 w-64 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Filter Toggle */}
        <button
          onClick={onToggleFilters}
          className={`
            p-2 rounded-lg transition-colors
            ${showFilters
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }
          `}
        >
          <Filter className="w-5 h-5" />
        </button>

        {/* Pomodoro Timer */}
        {pomodoroTimer.taskId !== null && (
          <button
            onClick={onTogglePomodoro}
            className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            <Timer className="w-4 h-4" />
            <span className="text-sm">
              {Math.floor(pomodoroTimer.timeLeft / 60)}:
              {(pomodoroTimer.timeLeft % 60).toString().padStart(2, '0')}
            </span>
          </button>
        )}

        {/* Create Task Button */}
        <button
          onClick={onCreateTask}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Task
        </button>
      </div>

      {/* Priority Stats Row */}
      <div className="flex items-center gap-6 pb-4">
        <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span className="text-sm font-semibold text-blue-900 dark:text-blue-300">
            Important:
          </span>
          <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
            {importantTaskCount}
          </span>
        </div>
      </div>
    </div>
  );
}
