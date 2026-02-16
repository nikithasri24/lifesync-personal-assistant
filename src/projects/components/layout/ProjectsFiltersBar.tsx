import React from 'react';
import { Search, Filter, Grid, List } from 'lucide-react';
import type { StatusFilter } from '../../types';
import { OwnerFilter, type OwnerFilterValue } from '@/components/common/OwnerFilter';

interface ProjectsFiltersBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: StatusFilter;
  onStatusFilterChange: (filter: StatusFilter) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  // Merged mode props (optional)
  showOwnerFilter?: boolean;
  ownerFilter?: OwnerFilterValue;
  onOwnerFilterChange?: (filter: OwnerFilterValue) => void;
  partnerName?: string;
}

/**
 * Filters bar with search, status filter, and view toggle
 */
export function ProjectsFiltersBar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  viewMode,
  onViewModeChange,
  showOwnerFilter = false,
  ownerFilter = 'all',
  onOwnerFilterChange,
  partnerName = 'Partner',
}: ProjectsFiltersBarProps): React.ReactElement {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-800">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value as StatusFilter)}
            className="border-none bg-transparent text-sm text-slate-900 focus:outline-none dark:text-white"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="on_hold">On Hold</option>
          </select>
        </div>

        {/* Owner Filter (Merged Mode) */}
        {showOwnerFilter && onOwnerFilterChange && (
          <OwnerFilter
            value={ownerFilter}
            onChange={onOwnerFilterChange}
            partnerName={partnerName}
          />
        )}
      </div>

      {/* View Toggle */}
      <div className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white p-1 dark:border-slate-600 dark:bg-slate-800">
        <button
          onClick={() => onViewModeChange('grid')}
          className={`rounded p-2 transition-colors ${
            viewMode === 'grid'
              ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700'
          }`}
        >
          <Grid className="h-4 w-4" />
        </button>
        <button
          onClick={() => onViewModeChange('list')}
          className={`rounded p-2 transition-colors ${
            viewMode === 'list'
              ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700'
          }`}
        >
          <List className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
