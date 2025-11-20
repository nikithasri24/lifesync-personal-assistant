/**
 * Notes Slice
 *
 * Manages notes state and operations
 */

import { StateCreator } from 'zustand';
import type { Note, NoteInput } from '@/api/notesAPI';
import { logger } from '@/services/logger';

export interface NotesSlice {
  // State
  notes: Note[];
  notesLoaded: boolean;
  notesLoading: boolean;

  // Actions
  loadNotes: () => Promise<void>;
  addNote: (input: NoteInput) => Promise<Note>;
  updateNote: (id: string, updates: Partial<NoteInput>) => Promise<Note>;
  deleteNote: (id: string) => Promise<void>;
  getNoteById: (id: string) => Note | undefined;
}

export const createNotesSlice: StateCreator<NotesSlice, [], [], NotesSlice> = (
  set,
  get
) => ({
  // Initial state
  notes: [],
  notesLoaded: false,
  notesLoading: false,

  // Actions
  loadNotes: async () => {
    if (get().notesLoaded || get().notesLoading) return;

    set({ notesLoading: true });
    try {
      const { getNotes } = await import('@/api/notesAPI');
      const notes = await getNotes();
      set({ notes, notesLoaded: true, notesLoading: false });
    } catch (error) {
      logger.error('Notes', error as Error, { context: 'loadNotes' });
      set({ notesLoading: false });
      throw error;
    }
  },

  addNote: async (input) => {
    try {
      const { createNote } = await import('@/api/notesAPI');
      const note = await createNote(input);
      set((state) => ({ notes: [...state.notes, note] }));
      return note;
    } catch (error) {
      logger.error('Notes', error as Error, { context: 'addNote' });
      throw error;
    }
  },

  updateNote: async (id, updates) => {
    try {
      const { updateNote } = await import('@/api/notesAPI');
      const updatedNote = await updateNote(id, updates);
      set((state) => ({
        notes: state.notes.map((n) => (n.id === id ? updatedNote : n)),
      }));
      return updatedNote;
    } catch (error) {
      logger.error('Notes', error as Error, { context: 'updateNote', noteId: id });
      throw error;
    }
  },

  deleteNote: async (id) => {
    try {
      const { deleteNote } = await import('@/api/notesAPI');
      await deleteNote(id);
      set((state) => ({
        notes: state.notes.filter((n) => n.id !== id),
      }));
    } catch (error) {
      logger.error('Notes', error as Error, { context: 'deleteNote', noteId: id });
      throw error;
    }
  },

  getNoteById: (id) => {
    return get().notes.find((n) => n.id === id);
  },
});
