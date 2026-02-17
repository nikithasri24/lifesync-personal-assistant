/**
 * FilterPanel Component
 *
 * A dropdown panel for filtering tasks by priority, status, and due date.
 * Provides a clean interface for applying and clearing filters.
 */

import React from 'react';
import type { Filters } from '../types';

interface FilterPanelProps {
  /** Current filter values */
  filters: Filters;
  /** Called when any filter changes */
  onFilterChange: (filters: Filters) => void;
  /** Called when all filters should be cleared */
  onClearFilters: () => void;
  /** Whether the panel is visible */
  isVisible: boolean;
  /** Called when the panel should close */
  onClose: () => void;
}

/**
 * FilterPanel - Dropdown panel for filtering tasks
 */
export function FilterPanel({
  filters,
  onFilterChange,
  onClearFilters,
  isVisible,
  onClose: _onClose
}: FilterPanelProps): React.JSX.Element | null {
  if (!isVisible) {
    return null;
  }

  const handlePriorityChange = (priority: string): void => {
    onFilterChange({ ...filters, priority });
  };

  const handleStatusChange = (status: string): void => {
    onFilterChange({ ...filters, status });
  };

  const handleDueDateChange = (dueDate: string): void => {
    onFilterChange({ ...filters, dueDate });
  };

  return (
    <div className="absolute right-0 top-12 w-64 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg z-10 p-4">
      <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Filter Tasks</h3>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Priority
          </label>
          <select
            value={filters.priority}
            onChange={(e) => handlePriorityChange(e.target.value)}
            className="w-full px-3 py-1 text-sm border border-gray-300 dark:border-slate-600 rounded focus:outline-none focus:ring-2 focus:ring-[#E5B88A] dark:bg-slate-700 dark:text-white"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Status
          </label>
          <select
            value={filters.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="w-full px-3 py-1 text-sm border border-gray-300 dark:border-slate-600 rounded focus:outline-none focus:ring-2 focus:ring-[#E5B88A] dark:bg-slate-700 dark:text-white"
          >
            <option value="all">All Status</option>
            <option value="todo">To Do</option>
            <option value="done">Done</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Due Date
          </label>
          <select
            value={filters.dueDate}
            onChange={(e) => handleDueDateChange(e.target.value)}
            className="w-full px-3 py-1 text-sm border border-gray-300 dark:border-slate-600 rounded focus:outline-none focus:ring-2 focus:ring-[#E5B88A] dark:bg-slate-700 dark:text-white"
          >
            <option value="all">All Dates</option>
            <option value="overdue">Overdue</option>
            <option value="today">Due Today</option>
            <option value="week">This Week</option>
            <option value="none">No Due Date</option>
          </select>
        </div>

        <button
          onClick={onClearFilters}
          className="w-full px-3 py-2 text-sm text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded transition-colors"
        >
          Clear Filters
        </button>
      </div>
    </div>
  );
}
