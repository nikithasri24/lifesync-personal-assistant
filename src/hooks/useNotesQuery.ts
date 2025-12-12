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
  getListItems,
  createListItem,
  updateListItem,
  deleteListItem,
  type CreateNoteInput,
  type UpdateNoteInput,
  type CreateListItemInput,
  type UpdateListItemInput,
} from '@/api/notesAPI';
import type { Note, ListItem } from '@/types';
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
      logger.debug('Notes', 'Notes', 'Creating note', { title: input.title });
      const result = await createNote(input);
      return result;
    },
    onSuccess: (newNote: Note, _input: CreateNoteInput) => {
      logger.info('Notes', 'Notes', 'Note created successfully', { id: newNote.id, title: newNote.title });
      // Invalidate and refetch notes list
      void queryClient.invalidateQueries({ queryKey: queryKeys.notes.lists() });

      // Optionally: Add new note to cache optimistically
      queryClient.setQueryData<Note[]>(queryKeys.notes.lists(), (old: Note[] | undefined): Note[] => {
        return old ? [...old, newNote] : [newNote];
      });
    },
    onError: (error: Error, input: CreateNoteInput) => {
      logger.error('Notes', 'Notes', 'Failed to create note', { error: error.message, title: input.title });
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
      logger.debug('Notes', 'Notes', 'Updating note', { id, updates });
      const result = await updateNote(id, updates);
      return result;
    },
    onSuccess: (updatedNote: Note, _variables: { id: string; updates: UpdateNoteInput }) => {
      logger.info('Notes', 'Notes', 'Note updated successfully', { id: updatedNote.id, title: updatedNote.title });
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
      logger.error('Notes', 'Notes', 'Failed to update note', { error: error.message, id });
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
      logger.debug('Notes', 'Notes', 'Deleting note', { id });
      const result = await deleteNote(id);
      return result;
    },
    onSuccess: (_data: void, deletedId: string) => {
      logger.info('Notes', 'Notes', 'Note deleted successfully', { id: deletedId });
      // Remove note from list cache
      queryClient.setQueryData<Note[]>(queryKeys.notes.lists(), (old: Note[] | undefined): Note[] | undefined => {
        return old?.filter((note: Note): boolean => note.id !== deletedId);
      });

      // Remove individual note cache
      queryClient.removeQueries({ queryKey: queryKeys.notes.detail(deletedId) });
    },
    onError: (error: Error, id: string) => {
      logger.error('Notes', 'Notes', 'Failed to delete note', { error: error.message, id });
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

// ============================================================================
// LIST ITEMS HOOKS
// ============================================================================

/**
 * Get all list items for a specific note
 *
 * @example
 * const { data: items, isLoading } = useListItems(noteId);
 */
export function useListItems(noteId: string | null): UseQueryResult<ListItem[], Error> {
  return useQuery({
    queryKey: noteId ? queryKeys.listItems.list(noteId) : ['listItems', 'null'],
    queryFn: () => {
      if (!noteId) throw new Error('Note ID is required');
      return getListItems(noteId);
    },
    enabled: !!noteId,
    ...queryOptions.user,
  });
}

/**
 * Create a new list item
 *
 * @example
 * const createMutation = useCreateListItem();
 * createMutation.mutate({ noteId: '123', input: { title: 'New item' } });
 */
export function useCreateListItem(): UseMutationResult<ListItem, Error, { noteId: string; input: CreateListItemInput }> {
  const queryClient = useQueryClient();

  return useMutation<ListItem, Error, { noteId: string; input: CreateListItemInput }>({
    mutationFn: async ({ noteId, input }): Promise<ListItem> => {
      logger.debug('Notes', 'Notes', 'Creating list item', { noteId, title: input.title });
      return await createListItem(noteId, input);
    },
    onSuccess: (newItem, { noteId }) => {
      logger.info('Notes', 'Notes', 'List item created successfully', { id: newItem.id, title: newItem.title });
      // Invalidate list items for this note
      void queryClient.invalidateQueries({ queryKey: queryKeys.listItems.list(noteId) });
      // Invalidate the note itself (to update timestamps)
      void queryClient.invalidateQueries({ queryKey: queryKeys.notes.detail(noteId) });

      // Optimistically add to cache
      queryClient.setQueryData<ListItem[]>(
        queryKeys.listItems.list(noteId),
        (old) => (old ? [...old, newItem] : [newItem])
      );
    },
    onError: (error, { input }) => {
      logger.error('Notes', 'Notes', 'Failed to create list item', { error: error.message, title: input.title });
    },
  });
}

/**
 * Update an existing list item
 *
 * @example
 * const updateMutation = useUpdateListItem();
 * updateMutation.mutate({ id: '123', noteId: '456', updates: { completed: true } });
 */
export function useUpdateListItem(): UseMutationResult<ListItem, Error, { id: string; noteId: string; updates: UpdateListItemInput }> {
  const queryClient = useQueryClient();

  return useMutation<ListItem, Error, { id: string; noteId: string; updates: UpdateListItemInput }>({
    mutationFn: async ({ id, updates }): Promise<ListItem> => {
      logger.debug('Notes', 'Notes', 'Updating list item', { id, updates });
      return await updateListItem(id, updates);
    },
    onSuccess: (updatedItem, { noteId }) => {
      logger.info('Notes', 'Notes', 'List item updated successfully', { id: updatedItem.id, title: updatedItem.title });
      // Update in list cache
      queryClient.setQueryData<ListItem[]>(
        queryKeys.listItems.list(noteId),
        (old) => old?.map((item) => (item.id === updatedItem.id ? updatedItem : item))
      );
      // Invalidate the note (to update timestamps)
      void queryClient.invalidateQueries({ queryKey: queryKeys.notes.detail(noteId) });
    },
    onError: (error, { id }) => {
      logger.error('Notes', 'Notes', 'Failed to update list item', { error: error.message, id });
    },
  });
}

/**
 * Delete a list item
 *
 * @example
 * const deleteMutation = useDeleteListItem();
 * deleteMutation.mutate({ id: '123', noteId: '456' });
 */
export function useDeleteListItem(): UseMutationResult<void, Error, { id: string; noteId: string }> {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { id: string; noteId: string }>({
    mutationFn: async ({ id }): Promise<void> => {
      logger.debug('Notes', 'Notes', 'Deleting list item', { id });
      await deleteListItem(id);
    },
    onSuccess: (_data, { id, noteId }) => {
      logger.info('Notes', 'Notes', 'List item deleted successfully', { id });
      // Remove from list cache
      queryClient.setQueryData<ListItem[]>(
        queryKeys.listItems.list(noteId),
        (old) => old?.filter((item) => item.id !== id)
      );
      // Invalidate the note (to update timestamps)
      void queryClient.invalidateQueries({ queryKey: queryKeys.notes.detail(noteId) });
    },
    onError: (error, { id }) => {
      logger.error('Notes', 'Notes', 'Failed to delete list item', { error: error.message, id });
    },
  });
}
