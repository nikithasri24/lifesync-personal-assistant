/**
 * Header Component
 *
 * The main header for the Todos app.
 * Shows view title, search bar, filters, API status, and pomodoro timer.
 */

import React from 'react';
import { Search, Filter, Timer, Play, Pause, Square, Sun, Inbox, ArrowRight, Grid, Layers } from 'lucide-react';
import { format } from 'date-fns';
import type { Project, Filters, PomodoroTimer } from '../types';
import { FilterPanel } from './FilterPanel';
import { formatTime } from '../services/taskHelpers';

interface HeaderProps {
  /** Current view type */
  currentView: 'today' | 'inbox' | 'upcoming' | 'kanban' | 'matrix';
  /** Currently selected project ID */
  selectedProject: string;
  /** List of all projects */
  projects: Project[];
  /** Current search query */
  searchQuery: string;
  /** Called when search query changes */
  onSearchChange: (query: string) => void;
  /** Current filter values */
  filters: Filters;
  /** Whether filter panel is visible */
  showFilters: boolean;
  /** Called when filter panel visibility toggles */
  onToggleFilters: () => void;
  /** Called when any filter changes */
  onFilterChange: (filters: Filters) => void;
  /** Called when all filters should be cleared */
  onClearFilters: () => void;
  /** Current pomodoro timer state */
  pomodoroTimer: PomodoroTimer;
  /** Called when pomodoro play/pause is toggled */
  onPomodoroToggle: () => void;
  /** Called when pomodoro timer is reset */
  onPomodoroReset: () => void;
  /** API health status */
  apiHealth: {
    isOnline: boolean;
    lastChecked: Date | null;
    responseTime: number | null;
  };
  /** Whether tasks are currently loading */
  tasksLoading: boolean;
  /** List of all tasks (for getting task title in pomodoro) */
  tasks?: Array<{ id: string; title: string }>;
}

/**
 * Header - Main header with view title, search, filters, and pomodoro timer
 */
export function Header({
  currentView,
  selectedProject,
  projects,
  searchQuery,
  onSearchChange,
  filters,
  showFilters,
  onToggleFilters,
  onFilterChange,
  onClearFilters,
  pomodoroTimer,
  onPomodoroToggle,
  onPomodoroReset,
  apiHealth,
  tasksLoading,
  tasks = []
}: HeaderProps): React.ReactElement {
  // Get view title and description
  const getViewInfo = (): { icon: React.ReactNode; title: string; description: string } => {
    if (selectedProject !== 'all' && projects.find(p => p.id === selectedProject)) {
      const project = projects.find(p => p.id === selectedProject);
      return {
        icon: <div className="w-6 h-6 rounded-full" style={{ backgroundColor: project?.color }}></div>,
        title: project?.name ?? '',
        description: project?.description ?? ''
      };
    }

    switch (currentView) {
      case 'today':
        return {
          icon: <Sun className="w-6 h-6 text-orange-500" />,
          title: 'Today',
          description: format(new Date(), 'EEEE, MMMM do')
        };
      case 'inbox':
        return {
          icon: <Inbox className="w-6 h-6 text-blue-500" />,
          title: 'All',
          description: 'Manage all your tasks in one place'
        };
      case 'upcoming':
        return {
          icon: <ArrowRight className="w-6 h-6 text-green-500" />,
          title: 'Next 7 days',
          description: 'Tasks due in the next 7 days'
        };
      case 'kanban':
        return {
          icon: <Grid className="w-6 h-6 text-indigo-500" />,
          title: 'Kanban',
          description: 'Organize tasks in columns by status'
        };
      case 'matrix':
        return {
          icon: <Layers className="w-6 h-6 text-rose-500" />,
          title: 'Eisenhower Matrix',
          description: 'Prioritize tasks using the Eisenhower Matrix'
        };
      default:
        return {
          icon: <Inbox className="w-6 h-6 text-blue-500" />,
          title: 'All',
          description: 'Manage all your tasks in one place'
        };
    }
  };

  const viewInfo = getViewInfo();

  return (
    <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 px-6 py-6">
      <div className="flex items-center justify-between">
        {/* Left side - Title and description */}
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center space-x-3">
            {viewInfo.icon}
            <span>{viewInfo.title}</span>
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
            {viewInfo.description}
          </p>
        </div>

        {/* Right side - Controls */}
        <div className="flex items-center space-x-4">
          {/* API Status Indicator */}
          <div
            className="flex items-center space-x-2"
            title={`Last checked: ${apiHealth.lastChecked?.toLocaleTimeString() ?? 'Never'}`}
          >
            <div className={`w-2 h-2 rounded-full ${
              !apiHealth.isOnline ? 'bg-red-500' : tasksLoading ? 'bg-yellow-500' : 'bg-green-500'
            }`}></div>
            <span className={`text-xs font-medium ${
              !apiHealth.isOnline ? 'text-red-600' : tasksLoading ? 'text-yellow-600' : 'text-green-600'
            }`}>
              {!apiHealth.isOnline
                ? 'API Offline'
                : tasksLoading
                  ? 'Loading...'
                  : `API Online ${apiHealth.responseTime ? `(${apiHealth.responseTime}ms)` : ''}`
              }
            </span>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search tasks..."
              className="pl-10 pr-4 py-2 w-64 text-sm border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
            />
          </div>

          {/* Filters */}
          <div className="relative">
            <button
              onClick={onToggleFilters}
              className={`p-2 rounded-md transition-colors ${
                showFilters ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
              } dark:hover:bg-slate-700`}
            >
              <Filter size={18} />
            </button>

            <FilterPanel
              filters={filters}
              onFilterChange={onFilterChange}
              onClearFilters={onClearFilters}
              isVisible={showFilters}
              onClose={onToggleFilters}
            />
          </div>

          {/* Pomodoro Timer */}
          {pomodoroTimer.taskId && (
            <div className="flex items-center space-x-3 px-4 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <Timer className={`w-5 h-5 ${pomodoroTimer.isBreak ? 'text-green-600' : 'text-red-600'}`} />
              <div className="text-sm">
                <div className={`font-mono font-bold ${pomodoroTimer.isBreak ? 'text-green-700' : 'text-red-700'}`}>
                  {formatTime(pomodoroTimer.timeLeft)}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {pomodoroTimer.isBreak
                    ? 'Break time'
                    : tasks.find(t => t.id === pomodoroTimer.taskId)?.title ?? 'Focus session'}
                </div>
              </div>
              <div className="flex space-x-1">
                <button
                  onClick={onPomodoroToggle}
                  className={`p-1 rounded ${
                    pomodoroTimer.isActive
                      ? 'bg-red-200 text-red-800 hover:bg-red-300'
                      : 'bg-green-200 text-green-800 hover:bg-green-300'
                  } transition-colors`}
                >
                  {pomodoroTimer.isActive ? <Pause size={14} /> : <Play size={14} />}
                </button>
                <button
                  onClick={onPomodoroReset}
                  className="p-1 bg-gray-200 text-gray-700 hover:bg-gray-300 rounded transition-colors"
                >
                  <Square size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}