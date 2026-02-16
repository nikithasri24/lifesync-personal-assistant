/**
 * Notes Page
 *
 * Migrated to use React Query for server state management
 * Extended to support list-type notes with checkable items
 * Supports merged mode for shared note viewing
 */

import { type FormEvent, useState, useMemo } from 'react';
import { useNotes, useCreateNote, useDeleteNote, useMergedNotesConnectionQuery } from '../hooks/useNotesQuery';
import { useCurrentUserId, usePartnerName } from '../utils/ownerUtils';
import type { NoteType } from '../types';
import { OwnerFilter, type OwnerFilterValue } from '../components/common/OwnerFilter';
import { PageLayoutV2 } from '../components/v2';
import { NotesErrorState } from '../notes/components/layout/NotesErrorState';
import { NotesLoadingState } from '../notes/components/layout/NotesLoadingState';
import { NotesHeader } from '../notes/components/layout/NotesHeader';
import { CreateNoteForm } from '../notes/components/layout/CreateNoteForm';
import { NotesList } from '../notes/components/layout/NotesList';

const Notes: React.FC = () => {
  // Merged mode support
  const { data: mergedConnection } = useMergedNotesConnectionQuery();
  const { data: currentUserId } = useCurrentUserId();
  const partnerName = usePartnerName(mergedConnection);
  const [ownerFilter, setOwnerFilter] = useState<OwnerFilterValue>('all');

  // React Query hooks - automatic loading, caching, and refetching
  const { data: notes = [], isLoading, error } = useNotes();
  const createMutation = useCreateNote();
  const deleteMutation = useDeleteNote();

  // Form state (client-only)
  const [noteType, setNoteType] = useState<NoteType>('note');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');

  // Filter notes by owner (merged mode)
  const filteredNotes = useMemo(() => {
    if (!mergedConnection || ownerFilter === 'all') return notes;

    if (ownerFilter === 'mine') {
      return notes.filter(note => note.user_id === currentUserId);
    } else if (ownerFilter === 'partner') {
      return notes.filter(note => note.user_id === mergedConnection.partnerId);
    }

    return notes;
  }, [notes, ownerFilter, currentUserId, mergedConnection]);

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
    <PageLayoutV2 maxWidth="lg" spacing="normal">
      <div className="flex items-center justify-between mb-6">
        <NotesHeader />

        {/* Owner Filter (Merged Mode) */}
        {mergedConnection && (
          <OwnerFilter
            value={ownerFilter}
            onChange={setOwnerFilter}
            partnerName={partnerName}
          />
        )}
      </div>

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

      <NotesList
        notes={filteredNotes}
        onDelete={handleDelete}
        showOwnerBadge={!!mergedConnection}
        currentUserId={currentUserId}
        partnerName={partnerName}
      />
    </PageLayoutV2>
  );
};

export default Notes;
