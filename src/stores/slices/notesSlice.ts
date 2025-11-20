/**
 * Notes Store Slice
 *
 * Manages notes state and actions.
 * Extracted from useRealAppStore to improve maintainability.
 */

import { StateCreator } from 'zustand';
import type { Note } from '../../types';

const createId = () => Math.random().toString(36).substring(2, 15);

// State interface
export interface NotesSlice {
  // State
  notes: Note[];
  notesLoaded: boolean;
  notesLoading: boolean;

  // Actions
  loadNotes: () => Promise<void>;
  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateNote: (id: string, updates: Partial<Note>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;

  // Internal setters
  _setNotes: (notes: Note[]) => void;
}

// Create the slice
export const createNotesSlice: StateCreator<NotesSlice> = (set, get) => ({
  // Initial state
  notes: [],
  notesLoaded: false,
  notesLoading: false,

  // Internal setters (used by initializeData)
  _setNotes: (notes) => set({ notes, notesLoaded: true }),

  // ==================== Notes ====================

  loadNotes: async () => {
    // Don't reload if already loaded or loading
    if (get().notesLoaded || get().notesLoading) return;

    set({ notesLoading: true });
    try {
      const { getNotes } = await import('../../api/notesAPI');
      const notes = await getNotes();
      set({ notes, notesLoaded: true, notesLoading: false });
    } catch (error) {
      console.error('Error loading notes:', error);
      set({ notesLoading: false });
    }
  },

  addNote: async (noteInput) => {
    try {
      // Import dynamically to avoid circular dependencies
      const { createNote } = await import('../../api/notesAPI');

      const note = await createNote({
        title: noteInput.title || undefined,
        content: noteInput.content,
        tags: noteInput.tags ?? [],
        category: noteInput.category || undefined,
      });

      set((state) => ({ notes: [note, ...state.notes] }));
    } catch (error) {
      console.error('Error creating note:', error);
      // Fallback to local storage for backwards compatibility
      const note: Note = {
        ...noteInput,
        id: createId(),
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: noteInput.tags ?? [],
      };
      set((state) => ({ notes: [note, ...state.notes] }));
    }
  },

  updateNote: async (id, updates) => {
    try {
      const { updateNote } = await import('../../api/notesAPI');

      const updatedNote = await updateNote(id, {
        title: updates.title,
        content: updates.content,
        tags: updates.tags,
        category: updates.category,
      });

      set((state) => ({
        notes: state.notes.map((note) => (note.id === id ? updatedNote : note)),
      }));
    } catch (error) {
      console.error('Error updating note:', error);
      // Fallback to local update
      set((state) => ({
        notes: state.notes.map((note) =>
          note.id === id ? { ...note, ...updates, updatedAt: new Date() } : note
        ),
      }));
    }
  },

  deleteNote: async (id) => {
    try {
      const { deleteNote } = await import('../../api/notesAPI');
      await deleteNote(id);
      set((state) => ({ notes: state.notes.filter((note) => note.id !== id) }));
    } catch (error) {
      console.error('Error deleting note:', error);
      // Still remove from local state even if API fails
      set((state) => ({ notes: state.notes.filter((note) => note.id !== id) }));
    }
  },
});
