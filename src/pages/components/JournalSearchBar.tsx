import React from 'react';
import { Filter, Search } from 'lucide-react';
import type { JournalMood } from '../../types';

interface JournalSearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  selectedMoods: JournalMood[];
  selectedTags: string[];
  hasActiveFilters: boolean;
  MOOD_OPTIONS: JournalMood[];
  availableTags: string[];
  toggleMoodFilter: (mood: JournalMood) => void;
  toggleTagFilter: (tag: string) => void;
  clearFilters: () => void;
  MOOD_COLORS: Record<JournalMood, string>;
}

export function JournalSearchBar({
  searchQuery,
  setSearchQuery,
  showFilters,
  setShowFilters,
  selectedMoods,
  selectedTags,
  hasActiveFilters,
  MOOD_OPTIONS,
  availableTags,
  toggleMoodFilter,
  toggleTagFilter,
  clearFilters,
  MOOD_COLORS,
}: JournalSearchBarProps): React.JSX.Element {
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search entries..."
            className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 pl-10 pr-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:text-slate-100"
          />
        </div>
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition ${
            showFilters || hasActiveFilters
              ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400'
              : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
          }`}
        >
          <Filter className="h-4 w-4" />
          Filters
          {hasActiveFilters && <span className="rounded-full bg-indigo-600 px-1.5 text-xs text-white">{(selectedMoods.length + selectedTags.length + (searchQuery ? 1 : 0))}</span>}
        </button>
      </div>

      {showFilters && (
        <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 space-y-4">
          {/* Mood Filters */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Mood</label>
            <div className="flex flex-wrap gap-2">
              {MOOD_OPTIONS.map((mood) => (
                <button
                  key={mood}
                  type="button"
                  onClick={() => toggleMoodFilter(mood)}
                  className={`rounded-full px-3 py-1 text-sm font-medium capitalize transition ${
                    selectedMoods.includes(mood)
                      ? MOOD_COLORS[mood]
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                >
                  {mood}
                </button>
              ))}
            </div>
          </div>

          {/* Tag Filters */}
          {availableTags.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Tags</label>
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTagFilter(tag)}
                    className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium transition ${
                      selectedTags.includes(tag)
                        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
                    }`}
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
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}