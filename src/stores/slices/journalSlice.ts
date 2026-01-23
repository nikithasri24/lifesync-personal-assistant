/**
 * Journal Zustand Slice - UI STATE ONLY
 *
 * This slice contains ONLY UI state (view modes, filters, pagination, etc.)
 * All server data (journal entries, loading states, CRUD operations) use React Query.
 *
 * ✅ Use React Query hooks from @/hooks/useJournalQuery.ts:
 * - useJournalEntries() - Get all journal entries
 * - useJournalEntry(id) - Get single journal entry
 * - useCreateJournalEntry() - Create journal entry
 * - useUpdateJournalEntry() - Update journal entry
 * - useDeleteJournalEntry() - Delete journal entry
 */

import { type StateCreator } from 'zustand';

export interface JournalSlice {
  // View state
  journalViewMode: 'list' | 'calendar';

  // Filter state
  journalFilterDateRange: { start: string; end: string } | null;
  journalSearchQuery: string;
  journalSelectedDate: string | null; // For calendar view selected day

  // Pagination state
  journalCurrentPage: number;

  // Actions
  setJournalViewMode: (mode: 'list' | 'calendar') => void;
  setJournalFilterDateRange: (range: { start: string; end: string } | null) => void;
  setJournalSearchQuery: (query: string) => void;
  setJournalSelectedDate: (date: string | null) => void;
  setJournalCurrentPage: (page: number) => void;
  resetJournalFilters: () => void;
}

export const createJournalSlice: StateCreator<JournalSlice, [], [], JournalSlice> = (set) => ({
  // Initial state
  journalViewMode: 'list',
  journalFilterDateRange: null,
  journalSearchQuery: '',
  journalSelectedDate: null,
  journalCurrentPage: 0,

  // Actions
  setJournalViewMode: (mode) => set({ journalViewMode: mode, journalCurrentPage: 0 }),
  setJournalFilterDateRange: (range) => set({ journalFilterDateRange: range, journalCurrentPage: 0 }),
  setJournalSearchQuery: (query) => set({ journalSearchQuery: query, journalCurrentPage: 0 }),
  setJournalSelectedDate: (date) => set({ journalSelectedDate: date }),
  setJournalCurrentPage: (page) => set({ journalCurrentPage: page }),
  resetJournalFilters: () =>
    set({
      journalFilterDateRange: null,
      journalSearchQuery: '',
      journalSelectedDate: null,
      journalCurrentPage: 0,
    }),
});
