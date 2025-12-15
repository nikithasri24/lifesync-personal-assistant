/**
 * Notes Page
 *
 * Migrated to use React Query for server state management
 * Extended to support list-type notes with checkable items
 */

import { type FormEvent, useState } from 'react';
import { useNotes, useCreateNote, useDeleteNote } from '../hooks/useNotesQuery';
import type { NoteType } from '../types';
import { NotesErrorState } from '../notes/components/layout/NotesErrorState';
import { NotesLoadingState } from '../notes/components/layout/NotesLoadingState';
import { NotesHeader } from '../notes/components/layout/NotesHeader';
import { CreateNoteForm } from '../notes/components/layout/CreateNoteForm';
import { NotesList } from '../notes/components/layout/NotesList';

const Notes: React.FC = () => {
  // React Query hooks - automatic loading, caching, and refetching
  const { data: notes, isLoading, error } = useNotes();
  const createMutation = useCreateNote();
  const deleteMutation = useDeleteNote();

  // Form state (client-only)
  const [noteType, setNoteType] = useState<NoteType>('note');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (!title.trim()) return;
    if (noteType === 'note' && !content.trim()) return;

    // Use mutation instead of store action
    createMutation.mutate(
      {
        title: title.trim() || 'Untitled',
        content: noteType === 'list' ? '' : content.trim(),
        tags: tags ? tags.split(',').map((tag) => tag.trim()) : [],
        noteType,
      },
      {
        onSuccess: () => {
          // Clear form on success
          setTitle('');
          setContent('');
          setTags('');
          setNoteType('note');
        },
      }
    );
  };

  const handleDelete = (id: string): void => {
    deleteMutation.mutate(id);
  };

  // Error state
  if (error) {
    return <NotesErrorState error={error} />;
  }

  // Loading state
  if (isLoading) {
    return <NotesLoadingState />;
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 p-6">
      <NotesHeader />

      <CreateNoteForm
        noteType={noteType}
        onNoteTypeChange={setNoteType}
        title={title}
        onTitleChange={setTitle}
        content={content}
        onContentChange={setContent}
        tags={tags}
        onTagsChange={setTags}
        onSubmit={handleSubmit}
        isPending={createMutation.isPending}
        isError={createMutation.isError}
      />

      <NotesList notes={notes} onDelete={handleDelete} />
    </div>
  );
};

export default Notes;
