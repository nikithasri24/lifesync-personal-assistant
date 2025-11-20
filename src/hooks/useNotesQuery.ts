/**
 * Notes Query Hooks
 *
 * React Query hooks for Notes domain
 * Demonstrates the pattern for server state management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, queryOptions } from '@/lib/react-query';
import {
  getNotes,
  getNote,
  createNote,
  updateNote,
  deleteNote,
  type Note,
  type NoteInput,
} from '@/api/notesAPI';

/**
 * Get all notes
 *
 * @example
 * const { data: notes, isLoading, error } = useNotes();
 */
export function useNotes() {
  return useQuery({
    queryKey: queryKeys.notes.lists(),
    queryFn: getNotes,
    ...queryOptions.user,
  });
}

/**
 * Get a single note by ID
 *
 * @example
 * const { data: note, isLoading } = useNote(noteId);
 */
export function useNote(id: string) {
  return useQuery({
    queryKey: queryKeys.notes.detail(id),
    queryFn: () => getNote(id),
    ...queryOptions.user,
    enabled: !!id, // Only fetch if ID exists
  });
}

/**
 * Create a new note
 *
 * @example
 * const createMutation = useCreateNote();
 * createMutation.mutate({ title: 'New Note', content: '...' });
 */
export function useCreateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createNote,
    onSuccess: (newNote) => {
      // Invalidate and refetch notes list
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.lists() });

      // Optionally: Add new note to cache optimistically
      queryClient.setQueryData<Note[]>(queryKeys.notes.lists(), (old) => {
        return old ? [...old, newNote] : [newNote];
      });
    },
  });
}

/**
 * Update an existing note
 *
 * @example
 * const updateMutation = useUpdateNote();
 * updateMutation.mutate({ id: '123', updates: { title: 'Updated' } });
 */
export function useUpdateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<NoteInput> }) =>
      updateNote(id, updates),
    onSuccess: (updatedNote) => {
      // Update note in list cache
      queryClient.setQueryData<Note[]>(queryKeys.notes.lists(), (old) => {
        return old?.map((note) =>
          note.id === updatedNote.id ? updatedNote : note
        );
      });

      // Update individual note cache
      queryClient.setQueryData(
        queryKeys.notes.detail(updatedNote.id),
        updatedNote
      );
    },
  });
}

/**
 * Delete a note
 *
 * @example
 * const deleteMutation = useDeleteNote();
 * deleteMutation.mutate('note-id-123');
 */
export function useDeleteNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteNote,
    onSuccess: (_data, deletedId) => {
      // Remove note from list cache
      queryClient.setQueryData<Note[]>(queryKeys.notes.lists(), (old) => {
        return old?.filter((note) => note.id !== deletedId);
      });

      // Remove individual note cache
      queryClient.removeQueries({ queryKey: queryKeys.notes.detail(deletedId) });
    },
  });
}

/**
 * Example: Optimistic Updates
 *
 * For better UX, update UI immediately before server confirms
 */
export function useUpdateNoteOptimistic() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<NoteInput> }) =>
      updateNote(id, updates),

    // Before mutation runs
    onMutate: async ({ id, updates }) => {
      // Cancel ongoing queries
      await queryClient.cancelQueries({ queryKey: queryKeys.notes.lists() });

      // Snapshot current value
      const previousNotes = queryClient.getQueryData<Note[]>(
        queryKeys.notes.lists()
      );

      // Optimistically update cache
      queryClient.setQueryData<Note[]>(queryKeys.notes.lists(), (old) => {
        return old?.map((note) =>
          note.id === id ? { ...note, ...updates } : note
        );
      });

      // Return context with snapshot
      return { previousNotes };
    },

    // On error, rollback
    onError: (_error, _variables, context) => {
      if (context?.previousNotes) {
        queryClient.setQueryData(queryKeys.notes.lists(), context.previousNotes);
      }
    },

    // Always refetch after mutation
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notes.lists() });
    },
  });
}
