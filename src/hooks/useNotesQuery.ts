/**
 * Notes Query Hooks
 *
 * React Query hooks for Notes domain
 * Demonstrates the pattern for server state management
 */

import { useQuery, useMutation, useQueryClient, type UseQueryResult, type UseMutationResult } from '@tanstack/react-query';
import { queryKeys, queryOptions } from '@/lib/react-query';
import {
  getNotes,
  getNote,
  createNote,
  updateNote,
  deleteNote,
  type CreateNoteInput,
  type UpdateNoteInput,
} from '@/api/notesAPI';
import type { Note } from '@/types';
import { logger } from '@/services/logger';

/**
 * Get all notes
 *
 * @example
 * const { data: notes, isLoading, error } = useNotes();
 */
export function useNotes(): UseQueryResult<Note[], Error> {
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
export function useNote(id: string): UseQueryResult<Note, Error> {
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
export function useCreateNote(): UseMutationResult<Note, Error, CreateNoteInput> {
  const queryClient = useQueryClient();

  return useMutation<Note, Error, CreateNoteInput>({
    mutationFn: async (input: CreateNoteInput): Promise<Note> => {
      logger.debug('Creating note', { title: input.title });
      const result = await createNote(input);
      return result;
    },
    onSuccess: (newNote: Note, _input: CreateNoteInput) => {
      logger.info('Note created successfully', { id: newNote.id, title: newNote.title });
      // Invalidate and refetch notes list
      void queryClient.invalidateQueries({ queryKey: queryKeys.notes.lists() });

      // Optionally: Add new note to cache optimistically
      queryClient.setQueryData<Note[]>(queryKeys.notes.lists(), (old: Note[] | undefined): Note[] => {
        return old ? [...old, newNote] : [newNote];
      });
    },
    onError: (error: Error, input: CreateNoteInput) => {
      logger.error('Failed to create note', { error: error.message, title: input.title });
    },
  });
}

/**
 * Update an existing note
 *
 * @example
 * const updateMutation = useUpdateNote();
 * updateMutation.mutate({ id: '123', updates: { title: 'Updated' });
 */
export function useUpdateNote(): UseMutationResult<Note, Error, { id: string; updates: UpdateNoteInput }> {
  const queryClient = useQueryClient();

  return useMutation<Note, Error, { id: string; updates: UpdateNoteInput }>({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateNoteInput }): Promise<Note> => {
      logger.debug('Updating note', { id, updates });
      const result = await updateNote(id, updates);
      return result;
    },
    onSuccess: (updatedNote: Note, _variables: { id: string; updates: UpdateNoteInput }) => {
      logger.info('Note updated successfully', { id: updatedNote.id, title: updatedNote.title });
      // Update note in list cache
      queryClient.setQueryData<Note[]>(queryKeys.notes.lists(), (old: Note[] | undefined): Note[] | undefined => {
        return old?.map((note: Note): Note =>
          note.id === updatedNote.id ? updatedNote : note
        );
      });

      // Update individual note cache
      queryClient.setQueryData<Note>(
        queryKeys.notes.detail(updatedNote.id),
        updatedNote
      );
    },
    onError: (error: Error, { id }: { id: string; updates: UpdateNoteInput }) => {
      logger.error('Failed to update note', { error: error.message, id });
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
export function useDeleteNote(): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (id: string): Promise<void> => {
      logger.debug('Deleting note', { id });
      const result = await deleteNote(id);
      return result;
    },
    onSuccess: (_data: void, deletedId: string) => {
      logger.info('Note deleted successfully', { id: deletedId });
      // Remove note from list cache
      queryClient.setQueryData<Note[]>(queryKeys.notes.lists(), (old: Note[] | undefined): Note[] | undefined => {
        return old?.filter((note: Note): boolean => note.id !== deletedId);
      });

      // Remove individual note cache
      queryClient.removeQueries({ queryKey: queryKeys.notes.detail(deletedId) });
    },
    onError: (error: Error, id: string) => {
      logger.error('Failed to delete note', { error: error.message, id });
    },
  });
}

/**
 * Example: Optimistic Updates
 *
 * For better UX, update UI immediately before server confirms
 */
export function useUpdateNoteOptimistic(): UseMutationResult<Note, Error, { id: string; updates: UpdateNoteInput }, { previousNotes: Note[] | undefined }> {
  const queryClient = useQueryClient();

  return useMutation<Note, Error, { id: string; updates: UpdateNoteInput }, { previousNotes: Note[] | undefined }>({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateNoteInput }): Promise<Note> =>
      updateNote(id, updates),

    // Before mutation runs
    onMutate: async ({ id, updates }: { id: string; updates: UpdateNoteInput }): Promise<{ previousNotes: Note[] | undefined }> => {
      // Cancel ongoing queries
      await queryClient.cancelQueries({ queryKey: queryKeys.notes.lists() });

      // Snapshot current value
      const previousNotes = queryClient.getQueryData<Note[]>(
        queryKeys.notes.lists()
      );

      // Optimistically update cache
      queryClient.setQueryData<Note[]>(queryKeys.notes.lists(), (old: Note[] | undefined): Note[] | undefined => {
        return old?.map((note: Note): Note =>
          note.id === id ? { ...note, ...updates } : note
        );
      });

      // Return context with snapshot
      return { previousNotes };
    },

    // On error, rollback
    onError: (_error: Error, _variables: { id: string; updates: UpdateNoteInput }, context: { previousNotes: Note[] | undefined } | undefined) => {
      if (context?.previousNotes) {
        queryClient.setQueryData(queryKeys.notes.lists(), context.previousNotes);
      }
    },

    // Always refetch after mutation
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.notes.lists() });
    },
  });
}
