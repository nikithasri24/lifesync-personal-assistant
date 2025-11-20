/**
 * Journal Slice
 *
 * Manages journal entries state and operations
 */

import { StateCreator } from 'zustand';
import type {
  JournalEntry,
  JournalEntryInput,
  JournalFilters,
} from '@/api/journalAPI';

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
      console.error('Error loading journal entries:', error);
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
      console.error('Error creating journal entry:', error);
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
      console.error('Error updating journal entry:', error);
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
      console.error('Error deleting journal entry:', error);
      throw error;
    }
  },

  searchJournalEntries: async (filters) => {
    try {
      const { searchJournalEntries } = await import('@/api/journalAPI');
      return await searchJournalEntries(filters);
    } catch (error) {
      console.error('Error searching journal entries:', error);
      throw error;
    }
  },

  getJournalEntryById: (id) => {
    return get().journalEntries.find((e) => e.id === id);
  },
});
