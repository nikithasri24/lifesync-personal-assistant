/**
 * Journal Zustand Slice - UI STATE ONLY
 *
 * ⚠️ DEPRECATED: Server state removed - use React Query hooks instead
 * 
 * This slice now contains ONLY UI state (view modes, filters, etc.)
 * All server data (journal entries, loading states, CRUD operations) should use React Query.
 *
 * ✅ Use React Query hooks from @/hooks/useJournalQuery.ts:
 * - useJournalEntries() - Get all journal entries
 * - useJournalEntry(id) - Get single journal entry
 * - useCreateJournalEntry() - Create journal entry
 * - useUpdateJournalEntry() - Update journal entry
 * - useDeleteJournalEntry() - Delete journal entry
 *
 * Benefits of React Query:
 * - Automatic caching and background refetching
 * - Optimistic updates with automatic rollback on error
 * - Better loading and error states
 * - Proper separation: Server state (React Query) vs UI state (Zustand)
 */

import { type StateCreator } from 'zustand';

export interface JournalSlice {
  // UI State only - no server data!
  journalViewMode: 'timeline' | 'calendar' | 'list';
  journalFilterMood: string | null;
  journalFilterDateRange: { start: string; end: string } | null;
  journalSortBy: 'date' | 'mood' | 'created_at';
  journalSortOrder: 'asc' | 'desc';
  journalSearchQuery: string;
  journalSelectedDate: string | null;

  // UI Actions
  setJournalViewMode: (mode: 'timeline' | 'calendar' | 'list') => void;
  setJournalFilterMood: (mood: string | null) => void;
  setJournalFilterDateRange: (range: { start: string; end: string } | null) => void;
  setJournalSortBy: (sortBy: 'date' | 'mood' | 'created_at') => void;
  setJournalSortOrder: (order: 'asc' | 'desc') => void;
  setJournalSearchQuery: (query: string) => void;
  setJournalSelectedDate: (date: string | null) => void;
  resetJournalFilters: () => void;
}

export const createJournalSlice: StateCreator<JournalSlice, [], [], JournalSlice> = (set) => ({
  // Initial UI state
  journalViewMode: 'timeline',
  journalFilterMood: null,
  journalFilterDateRange: null,
  journalSortBy: 'date',
  journalSortOrder: 'desc',
  journalSearchQuery: '',
  journalSelectedDate: null,

  // UI Actions
  setJournalViewMode: (mode) => set({ journalViewMode: mode }),
  setJournalFilterMood: (mood) => set({ journalFilterMood: mood }),
  setJournalFilterDateRange: (range) => set({ journalFilterDateRange: range }),
  setJournalSortBy: (sortBy) => set({ journalSortBy: sortBy }),
  setJournalSortOrder: (order) => set({ journalSortOrder: order }),
  setJournalSearchQuery: (query) => set({ journalSearchQuery: query }),
  setJournalSelectedDate: (date) => set({ journalSelectedDate: date }),
  resetJournalFilters: () =>
    set({
      journalFilterMood: null,
      journalFilterDateRange: null,
      journalSearchQuery: '',
      journalSelectedDate: null,
    }),
});
