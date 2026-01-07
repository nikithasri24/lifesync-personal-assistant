/**
 * Notes Zustand Slice - UI STATE ONLY
 *
 * ⚠️ DEPRECATED: Server state removed - use React Query hooks instead
 * 
 * This slice now contains ONLY UI state (view modes, filters, etc.)
 * All server data (notes, loading states, CRUD operations) should use React Query.
 *
 * ✅ Use React Query hooks from @/hooks/useNotesQuery.ts:
 * - useNotes() - Get all notes
 * - useNote(id) - Get single note
 * - useCreateNote() - Create note
 * - useUpdateNote() - Update note
 * - useDeleteNote() - Delete note
 *
 * Benefits of React Query:
 * - Automatic caching and background refetching
 * - Optimistic updates with automatic rollback on error
 * - Better loading and error states
 * - Proper separation: Server state (React Query) vs UI state (Zustand)
 */

import { type StateCreator } from 'zustand';

export interface NotesSlice {
  // UI State only - no server data!
  notesViewMode: 'grid' | 'list';
  notesFilterCategory: string | null;
  notesSortBy: 'created_at' | 'updated_at' | 'title';
  notesSortOrder: 'asc' | 'desc';
  notesSearchQuery: string;
  notesShowArchived: boolean;

  // UI Actions
  setNotesViewMode: (mode: 'grid' | 'list') => void;
  setNotesFilterCategory: (category: string | null) => void;
  setNotesSortBy: (sortBy: 'created_at' | 'updated_at' | 'title') => void;
  setNotesSortOrder: (order: 'asc' | 'desc') => void;
  setNotesSearchQuery: (query: string) => void;
  setNotesShowArchived: (show: boolean) => void;
  resetNotesFilters: () => void;
}

export const createNotesSlice: StateCreator<NotesSlice, [], [], NotesSlice> = (set) => ({
  // Initial UI state
  notesViewMode: 'grid',
  notesFilterCategory: null,
  notesSortBy: 'updated_at',
  notesSortOrder: 'desc',
  notesSearchQuery: '',
  notesShowArchived: false,

  // UI Actions
  setNotesViewMode: (mode) => set({ notesViewMode: mode }),
  setNotesFilterCategory: (category) => set({ notesFilterCategory: category }),
  setNotesSortBy: (sortBy) => set({ notesSortBy: sortBy }),
  setNotesSortOrder: (order) => set({ notesSortOrder: order }),
  setNotesSearchQuery: (query) => set({ notesSearchQuery: query }),
  setNotesShowArchived: (show) => set({ notesShowArchived: show }),
  resetNotesFilters: () =>
    set({
      notesFilterCategory: null,
      notesSearchQuery: '',
      notesShowArchived: false,
    }),
});
