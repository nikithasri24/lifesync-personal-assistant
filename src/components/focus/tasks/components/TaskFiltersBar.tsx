/**
 * Task Filters Bar Component
 * Search, filters, and sorting controls
 */

import React from 'react';
import { Search } from 'lucide-react';
import type { FilterType, SortByType, ProjectView } from '../types';

interface TaskFiltersBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  selectedProject: string;
  onProjectChange: (projectId: string) => void;
  sortBy: SortByType;
  onSortChange: (sortBy: SortByType) => void;
  projects: ProjectView[];
}

export const TaskFiltersBar: React.FC<TaskFiltersBarProps> = ({
  searchQuery,
  onSearchChange,
  filter,
  onFilterChange,
  selectedProject,
  onProjectChange,
  sortBy,
  onSortChange,
  projects
}) => {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex items-center space-x-2">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search tasks..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
        />
      </div>

      <select
        value={filter}
        onChange={(e) => onFilterChange(e.target.value as FilterType)}
        className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
      >
        <option value="all">All Tasks</option>
        <option value="today">Due Today</option>
        <option value="overdue">Overdue</option>
        <option value="completed">Completed</option>
      </select>

      <select
        value={selectedProject}
        onChange={(e) => onProjectChange(e.target.value)}
        className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
      >
        <option value="all">All Projects</option>
        {projects.map(project => (
          <option key={project.id} value={project.id}>{project.name}</option>
        ))}
      </select>

      <select
        value={sortBy}
        onChange={(e) => onSortChange(e.target.value as SortByType)}
        className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
      >
        <option value="priority">Sort by Priority</option>
        <option value="dueDate">Sort by Due Date</option>
        <option value="estimatedTime">Sort by Time</option>
        <option value="createdAt">Sort by Created</option>
      </select>
    </div>
  );
};
