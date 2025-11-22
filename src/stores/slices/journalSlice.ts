/**
 * Journal Slice
 *
 * Manages journal entries state and operations
 */

import { type StateCreator } from 'zustand';
import type {
  JournalEntry,
  JournalEntryInput,
  JournalFilters,
} from '@/api/journalAPI';
import { logger } from '@/services/logger';

export interface JournalSlice {
  // State
  journalEntries: JournalEntry[];
  journalLoaded: boolean;
  journalLoading: boolean;

  // Actions
  loadJournal: () => Promise<void>;
  addJournalEntry: (input: JournalEntryInput) => Promise<JournalEntry>;
  updateJournalEntry: (
    id: string,
    updates: Partial<JournalEntryInput>
  ) => Promise<JournalEntry>;
  deleteJournalEntry: (id: string) => Promise<void>;
  searchJournalEntries: (filters: JournalFilters) => Promise<JournalEntry[]>;
  getJournalEntryById: (id: string) => JournalEntry | undefined;
}

export const createJournalSlice: StateCreator<
  JournalSlice,
  [],
  [],
  JournalSlice
> = (set, get) => ({
  // Initial state
  journalEntries: [],
  journalLoaded: false,
  journalLoading: false,

  // Actions
  loadJournal: async () => {
    if (get().journalLoaded || get().journalLoading) return;

    set({ journalLoading: true });
    try {
      const { getJournalEntries } = await import('@/api/journalAPI');
      const entries = await getJournalEntries();
      set({ journalEntries: entries, journalLoaded: true, journalLoading: false });
    } catch (error) {
      logger.error('Journal', error as Error, { context: 'loadJournal' });
      set({ journalLoading: false });
      throw error;
    }
  },

  addJournalEntry: async (input) => {
    try {
      const { createJournalEntry } = await import('@/api/journalAPI');
      const entry = await createJournalEntry(input);
      set((state) => ({ journalEntries: [entry, ...state.journalEntries] }));
      return entry;
    } catch (error) {
      logger.error('Journal', error as Error, { context: 'addJournalEntry' });
      throw error;
    }
  },

  updateJournalEntry: async (id, updates) => {
    try {
      const { updateJournalEntry } = await import('@/api/journalAPI');
      const updatedEntry = await updateJournalEntry(id, updates);
      set((state) => ({
        journalEntries: state.journalEntries.map((e) =>
          e.id === id ? updatedEntry : e
        ),
      }));
      return updatedEntry;
    } catch (error) {
      logger.error('Journal', error as Error, { context: 'updateJournalEntry' });
      throw error;
    }
  },

  deleteJournalEntry: async (id) => {
    try {
      const { deleteJournalEntry } = await import('@/api/journalAPI');
      await deleteJournalEntry(id);
      set((state) => ({
        journalEntries: state.journalEntries.filter((e) => e.id !== id),
      }));
    } catch (error) {
      logger.error('Journal', error as Error, { context: 'deleteJournalEntry' });
      throw error;
    }
  },

  searchJournalEntries: async (filters) => {
    try {
      const { searchJournalEntries } = await import('@/api/journalAPI');
      return await searchJournalEntries(filters);
    } catch (error) {
      logger.error('Journal', error as Error, { context: 'searchJournalEntries' });
      throw error;
    }
  },

  getJournalEntryById: (id) => {
    return get().journalEntries.find((e) => e.id === id);
  },
});
