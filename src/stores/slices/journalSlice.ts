/**
 * Journal Store Slice
 *
 * Manages journal entries state and actions.
 * Extracted from useRealAppStore to improve maintainability.
 */

import { StateCreator } from 'zustand';
import type { JournalEntry } from '../../types';

const createId = () => Math.random().toString(36).substring(2, 15);

// State interface
export interface JournalSlice {
  // State
  journalEntries: JournalEntry[];
  journalEntriesLoaded: boolean;
  journalEntriesLoading: boolean;

  // Actions
  loadJournalEntries: () => Promise<void>;
  addJournalEntry: (entry: Omit<JournalEntry, 'id' | 'createdAt'>) => Promise<void>;
  deleteJournalEntry: (id: string) => Promise<void>;

  // Internal setters
  _setJournalEntries: (journalEntries: JournalEntry[]) => void;
}

// Create the slice
export const createJournalSlice: StateCreator<JournalSlice> = (set, get) => ({
  // Initial state
  journalEntries: [],
  journalEntriesLoaded: false,
  journalEntriesLoading: false,

  // Internal setters (used by initializeData)
  _setJournalEntries: (journalEntries) => set({ journalEntries, journalEntriesLoaded: true }),

  // ==================== Journal ====================

  loadJournalEntries: async () => {
    // Don't reload if already loaded or loading
    if (get().journalEntriesLoaded || get().journalEntriesLoading) return;

    set({ journalEntriesLoading: true });
    try {
      const { getJournalEntries } = await import('../../api/journalAPI');
      const journalEntries = await getJournalEntries();
      set({ journalEntries, journalEntriesLoaded: true, journalEntriesLoading: false });
    } catch (error) {
      console.error('Error loading journal entries:', error);
      set({ journalEntriesLoading: false });
    }
  },

  addJournalEntry: async (entry) => {
    try {
      // Import dynamically to avoid circular dependencies
      const { createJournalEntry } = await import('../../api/journalAPI');

      const journalEntry = await createJournalEntry({
        title: entry.title || undefined,
        content: entry.content,
        mood: entry.mood,
        tags: entry.tags ?? [],
        attachments: entry.attachments ?? [],
      });

      set((state) => ({ journalEntries: [journalEntry, ...state.journalEntries] }));
    } catch (error) {
      console.error('Error creating journal entry:', error);
      // Fallback to local storage for backwards compatibility
      const journalEntry: JournalEntry = {
        ...entry,
        id: createId(),
        createdAt: new Date(),
        attachments: entry.attachments ?? [],
        tags: entry.tags ?? [],
      };
      set((state) => ({ journalEntries: [journalEntry, ...state.journalEntries] }));
    }
  },

  deleteJournalEntry: async (id) => {
    try {
      const { deleteJournalEntry } = await import('../../api/journalAPI');
      await deleteJournalEntry(id);
      set((state) => ({
        journalEntries: state.journalEntries.filter((entry) => entry.id !== id),
      }));
    } catch (error) {
      console.error('Error deleting journal entry:', error);
      // Still remove from local state even if API fails
      set((state) => ({
        journalEntries: state.journalEntries.filter((entry) => entry.id !== id),
      }));
    }
  },
});
