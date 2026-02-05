import React from 'react';
import { Filter, Search, Calendar } from 'lucide-react';

interface DateRange {
  start: string;
  end: string;
}

interface JournalSearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  selectedTags: string[];
  hasActiveFilters: boolean;
  availableTags: string[];
  toggleTagFilter: (tag: string) => void;
  clearFilters: () => void;
  dateRange: DateRange | null;
  setDateRange: (range: DateRange | null) => void;
}

export function JournalSearchBar({
  searchQuery,
  setSearchQuery,
  showFilters,
  setShowFilters,
  selectedTags,
  hasActiveFilters,
  availableTags,
  toggleTagFilter,
  clearFilters,
  dateRange,
  setDateRange,
}: JournalSearchBarProps): React.JSX.Element {
  // Calculate active filter count
  const filterCount =
    (searchQuery ? 1 : 0) +
    selectedTags.length +
    (dateRange ? 1 : 0);
  return (
    <div className="space-y-3" data-testid="journal-search-bar">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search entries..."
            className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 pl-10 pr-3 py-2 text-sm focus:border-slate-400 focus:outline-none dark:text-white"
            data-testid="journal-search-input"
          />
        </div>
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
            showFilters || hasActiveFilters
              ? 'bg-slate-200 dark:bg-slate-300 text-slate-800'
              : 'bg-slate-100 dark:bg-slate-200 text-slate-800 dark:text-slate-800 hover:bg-slate-200 dark:hover:bg-slate-300'
          }`}
          aria-label={showFilters ? 'Hide filters' : 'Show filters'}
          data-testid="journal-filters-toggle"
        >
          <Filter className="h-4 w-4" />
          Filters
          {hasActiveFilters && <span className="rounded-full bg-slate-600 px-1.5 text-xs text-white">{filterCount}</span>}
        </button>
      </div>

      {showFilters && (
        <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 space-y-4" data-testid="journal-filters-panel">
          {/* Date Range Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-white mb-2 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Date Range
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="date"
                value={dateRange?.start || ''}
                onChange={(e) => {
                  const start = e.target.value;
                  if (start) {
                    setDateRange({
                      start,
                      end: dateRange?.end || start,
                    });
                  } else if (!dateRange?.end) {
                    setDateRange(null);
                  }
                }}
                className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-1.5 text-sm focus:border-slate-400 focus:outline-none dark:text-white"
                data-testid="journal-date-start"
              />
              <span className="text-sm text-slate-500 dark:text-slate-400">to</span>
              <input
                type="date"
                value={dateRange?.end || ''}
                onChange={(e) => {
                  const end = e.target.value;
                  if (end) {
                    setDateRange({
                      start: dateRange?.start || end,
                      end,
                    });
                  } else if (!dateRange?.start) {
                    setDateRange(null);
                  }
                }}
                className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-1.5 text-sm focus:border-slate-400 focus:outline-none dark:text-white"
                data-testid="journal-date-end"
              />
              {dateRange && (
                <button
                  type="button"
                  onClick={() => setDateRange(null)}
                  className="text-xs text-slate-600 dark:text-white hover:text-slate-700 dark:hover:text-slate-200"
                  aria-label="Clear date range filter"
                  data-testid="journal-date-clear"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Tag Filters */}
          {availableTags.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-white mb-2">Tags</label>
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTagFilter(tag)}
                    className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium transition ${
                      selectedTags.includes(tag)
                        ? 'bg-slate-200 text-slate-900 dark:bg-slate-600 dark:text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
                    }`}
                    aria-label={`Filter by tag: ${tag}`}
                    data-testid={`journal-tag-filter-${tag}`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-sm text-slate-600 dark:text-white hover:text-slate-700 dark:hover:text-slate-200 font-medium"
              aria-label="Clear all filters"
              data-testid="journal-clear-filters"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}

