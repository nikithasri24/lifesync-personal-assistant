/**
 * useJournalFilters Hook
 *
 * Custom hook that encapsulates journal filter state and logic.
 * Uses Zustand for persistent filter state across navigation.
 * Eliminates props drilling by providing direct access to filter state.
 */

import { useMemo, useState, useCallback } from 'react';
import { useComposedStore } from '@/stores/useComposedStore';
import { useShallow } from 'zustand/react/shallow';
import type { JournalEntryFilters } from '@/api/journalAPI';
import type { JournalEntry } from '@/types';

interface DateRange {
  start: string;
  end: string;
}

interface UseJournalFiltersReturn {
  // State
  searchQuery: string;
  selectedTags: string[];
  showFilters: boolean;
  hasActiveFilters: boolean;
  filters: JournalEntryFilters | undefined;
  dateRange: DateRange | null;

  // Actions
  setSearchQuery: (query: string) => void;
  toggleTagFilter: (tag: string) => void;
  setShowFilters: (show: boolean) => void;
  setDateRange: (range: DateRange | null) => void;
  clearFilters: () => void;

  // Derived data
  getAvailableTags: (entries: JournalEntry[]) => string[];
}

export function useJournalFilters(): UseJournalFiltersReturn {
  // Get Zustand state (persistent across navigation)
  // Using useShallow to prevent infinite loops from object reference changes
  const {
    journalSearchQuery,
    journalFilterDateRange,
    setJournalSearchQuery,
    setJournalFilterDateRange,
    resetJournalFilters,
  } = useComposedStore(
    useShallow((state) => ({
      journalSearchQuery: state.journalSearchQuery,
      journalFilterDateRange: state.journalFilterDateRange,
      setJournalSearchQuery: state.setJournalSearchQuery,
      setJournalFilterDateRange: state.setJournalFilterDateRange,
      resetJournalFilters: state.resetJournalFilters,
    }))
  );

  // Local state for UI-specific concerns (tags selection, filter panel visibility)
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Use the Zustand searchQuery and dateRange
  const searchQuery = journalSearchQuery;
  const setSearchQuery = setJournalSearchQuery;
  const dateRange = journalFilterDateRange;
  const setDateRange = setJournalFilterDateRange;

  // Derived state
  const hasActiveFilters = Boolean(searchQuery) || selectedTags.length > 0 || dateRange !== null;

  // Build filters object for React Query
  const filters: JournalEntryFilters | undefined = useMemo(() => {
    const filterObj: Partial<JournalEntryFilters> = {};

    if (searchQuery) {
      filterObj.searchQuery = searchQuery;
    }
    if (selectedTags.length > 0) {
      filterObj.tags = selectedTags;
    }
    if (dateRange) {
      filterObj.startDate = new Date(dateRange.start);
      filterObj.endDate = new Date(dateRange.end);
    }

    return Object.keys(filterObj).length > 0 ? filterObj : undefined;
  }, [searchQuery, selectedTags, dateRange]);

  // Actions
  const toggleTagFilter = (tag: string): void => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const clearFilters = (): void => {
    resetJournalFilters();
    setSelectedTags([]);
  };

  // Helper to extract available tags from entries
  const getAvailableTags = (entries: JournalEntry[]): string[] => {
    const tagSet = new Set<string>();
    entries.forEach((entry) => {
      entry.tags.forEach((tag) => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  };

  return {
    // State
    searchQuery,
    selectedTags,
    showFilters,
    hasActiveFilters,
    filters,
    dateRange,

    // Actions
    setSearchQuery,
    toggleTagFilter,
    setShowFilters,
    setDateRange,
    clearFilters,

    // Derived data
    getAvailableTags,
  };
}

