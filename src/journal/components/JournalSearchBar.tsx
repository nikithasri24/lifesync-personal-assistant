import React from 'react';
import { Filter, Search, Calendar } from 'lucide-react';
import { useThemeColors } from '@/hooks/useThemeColors';

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
  const colors = useThemeColors();

  // Calculate active filter count
  const filterCount =
    (searchQuery ? 1 : 0) +
    selectedTags.length +
    (dateRange ? 1 : 0);

  return (
    <div className="space-y-3" data-testid="journal-search-bar">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-xl">🔍</div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search entries..."
            className="w-full rounded-xl py-2 pl-10 pr-3 text-sm focus:outline-none"
            style={{
              border: `2px solid ${colors.border.light}`,
              backgroundColor: colors.bg.white,
              color: colors.text.primary,
            }}
            data-testid="journal-search-input"
          />
        </div>
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition"
          style={{
            background: showFilters || hasActiveFilters
              ? 'rgba(212, 165, 116, 0.2)'
              : colors.bg.tertiary,
            color: colors.text.primary,
            border: `2px solid ${showFilters || hasActiveFilters ? '#C18B5E' : 'transparent'}`,
          }}
          aria-label={showFilters ? 'Hide filters' : 'Show filters'}
          data-testid="journal-filters-toggle"
        >
          <Filter className="h-4 w-4" />
          Filters
          {hasActiveFilters && (
            <span className="rounded-full px-1.5 text-xs text-white" style={{ backgroundColor: '#C18B5E' }}>
              {filterCount}
            </span>
          )}
        </button>
      </div>

      {showFilters && (
        <div
          className="rounded-xl p-4 space-y-4"
          style={{
            border: `2px solid ${colors.border.light}`,
            backgroundColor: colors.bg.white,
          }}
          data-testid="journal-filters-panel"
        >
          {/* Date Range Filter */}
          <div>
            <label className="block text-sm font-medium mb-2 flex items-center gap-2" style={{ color: colors.text.primary }}>
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
                className="rounded-lg px-3 py-1.5 text-sm focus:outline-none"
                style={{
                  border: `2px solid ${colors.border.light}`,
                  backgroundColor: colors.bg.white,
                  color: colors.text.primary,
                }}
                data-testid="journal-date-start"
              />
              <span className="text-sm" style={{ color: colors.text.tertiary }}>to</span>
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
                className="rounded-lg px-3 py-1.5 text-sm focus:outline-none"
                style={{
                  border: `2px solid ${colors.border.light}`,
                  backgroundColor: colors.bg.white,
                  color: colors.text.primary,
                }}
                data-testid="journal-date-end"
              />
              {dateRange && (
                <button
                  type="button"
                  onClick={() => setDateRange(null)}
                  className="text-xs hover:opacity-70"
                  style={{ color: colors.text.secondary }}
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
              <label className="block text-sm font-medium mb-2" style={{ color: colors.text.primary }}>Tags</label>
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTagFilter(tag)}
                    className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium transition"
                    style={{
                      background: selectedTags.includes(tag)
                        ? 'linear-gradient(135deg, rgba(212, 165, 116, 0.3) 0%, rgba(193, 139, 94, 0.3) 100%)'
                        : colors.bg.tertiary,
                      color: colors.text.primary,
                      border: `2px solid ${selectedTags.includes(tag) ? '#C18B5E' : 'transparent'}`,
                    }}
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
              className="text-sm font-medium hover:opacity-70"
              style={{ color: colors.text.secondary }}
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

