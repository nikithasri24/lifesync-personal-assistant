/**
 * Notes Page
 *
 * Updated with V2 components to match notes-design-spec.html
 * Uses React Query for server state management
 * Supports merged mode for shared note viewing
 */

import { useState, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { useNotes, useCreateNote, useDeleteNote, useMergedNotesConnectionQuery } from '../hooks/useNotesQuery';
import { useCurrentUserId, usePartnerName } from '../utils/ownerUtils';
import type { NoteType } from '../types';
import { OwnerFilter, type OwnerFilterValue } from '../components/common/OwnerFilter';
import { NotesHeaderV2, NoteCardV2, NoteFormModalV2 } from '../notes/components/v2';
import { SegmentedControlV2, FABV2 } from '../components/v2';
import { useThemeColors } from '../hooks/useThemeColors';
import { logger } from '@/services/logger';

type ViewMode = 'grid' | 'list';

const Notes: React.FC = () => {
  const colors = useThemeColors();

  // Merged mode support
  const { data: mergedConnection } = useMergedNotesConnectionQuery();
  const { data: currentUserId } = useCurrentUserId();
  const partnerName = usePartnerName(mergedConnection);
  const [ownerFilter, setOwnerFilter] = useState<OwnerFilterValue>('all');

  // React Query hooks - automatic loading, caching, and refetching
  const { data: notes = [], isLoading, error } = useNotes();
  const createMutation = useCreateNote();
  const deleteMutation = useDeleteNote();

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingNote, setEditingNote] = useState<{
    id: string;
    title: string;
    content: string;
    tags: string[];
    noteType: NoteType;
  } | null>(null);

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

  // Get unique tags for stats
  const totalTags = useMemo(() => {
    const tagSet = new Set<string>();
    filteredNotes.forEach(note => {
      note.tags.forEach(tag => tagSet.add(tag));
    });
    return tagSet.size;
  }, [filteredNotes]);

  // Handle create/update note
  const handleSubmit = (data: {
    title: string;
    content: string;
    tags: string[];
    noteType: NoteType;
  }) => {
    if (editingNote) {
      // Update existing note
      // TODO: Implement update mutation
      logger.info('Notes', 'Update note not yet implemented', { noteId: editingNote.id });
    } else {
      // Create new note
      createMutation.mutate(
        {
          title: data.title,
          content: data.content,
          tags: data.tags,
          noteType: data.noteType,
        },
        {
          onSuccess: () => {
            setShowFormModal(false);
            setEditingNote(null);
          },
        }
      );
    }
  };

  const handleDelete = (id: string): void => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleEditNote = (note: typeof notes[0]) => {
    setEditingNote({
      id: note.id,
      title: note.title,
      content: note.content,
      tags: note.tags,
      noteType: note.note_type || 'note',
    });
    setShowFormModal(true);
  };

  // Parse list items from content (for checklist notes)
  const parseListItems = (content: string): Array<{ text: string; completed: boolean }> => {
    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      // If not valid JSON, return empty array
    }
    return [];
  };

  // Error state
  if (error) {
    return (
      <div
        className="min-h-screen"
        style={{ backgroundColor: colors.bg.primary }}
      >
        <NotesHeaderV2 totalNotes={0} totalTags={0} />
        <div className="p-6">
          <div
            className="rounded-xl p-4 text-center"
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              color: '#DC2626',
            }}
          >
            <p className="font-semibold">Unable to load notes</p>
            <p className="text-sm mt-1 opacity-80">Please try refreshing the page</p>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div
        className="min-h-screen"
        style={{ backgroundColor: colors.bg.primary }}
      >
        <NotesHeaderV2 totalNotes={0} totalTags={0} />
        <div className="p-6 text-center" style={{ color: colors.text.secondary }}>
          <p>Loading notes...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen pb-24"
      style={{ backgroundColor: colors.bg.primary }}
    >
      {/* Header */}
      <NotesHeaderV2 totalNotes={filteredNotes.length} totalTags={totalTags} />

      {/* Owner Filter (Merged Mode) */}
      {mergedConnection && (
        <div
          className="px-5 py-4 border-b"
          style={{
            backgroundColor: colors.bg.card,
            borderColor: colors.border.light,
          }}
        >
          <OwnerFilter
            value={ownerFilter}
            onChange={setOwnerFilter}
            partnerName={partnerName}
          />
        </div>
      )}

      {/* View Toggle */}
      <div
        className="px-5 py-4 border-b"
        style={{
          backgroundColor: colors.bg.card,
          borderColor: colors.border.light,
        }}
      >
        <SegmentedControlV2
          segments={[
            { value: 'grid', label: '📱 Grid' },
            { value: 'list', label: '📄 List' },
          ]}
          value={viewMode}
          onChange={(value) => setViewMode(value as ViewMode)}
          size="md"
        />
      </div>

      {/* Notes Count */}
      <div className="px-5 py-3">
        <h2 className="text-lg font-bold" style={{ color: colors.text.primary }}>
          All Notes ({filteredNotes.length})
        </h2>
      </div>

      {/* Notes Grid/List */}
      {filteredNotes.length === 0 ? (
        <div className="text-center py-20 px-6">
          <div className="text-6xl mb-4 opacity-50">📝</div>
          <h3
            className="text-lg font-bold mb-2"
            style={{ color: colors.text.primary }}
          >
            No notes yet
          </h3>
          <p
            className="text-sm"
            style={{ color: colors.text.secondary }}
          >
            Create text notes or checklists to capture your thoughts and ideas.
          </p>
        </div>
      ) : (
        <div
          className={`px-5 ${
            viewMode === 'grid'
              ? 'grid grid-cols-2 gap-3'
              : 'flex flex-col gap-3'
          }`}
        >
          {filteredNotes.map((note) => {
            const noteType = (note.note_type as NoteType) || 'note';
            const listItems = noteType === 'list' ? parseListItems(note.content) : [];

            return (
              <NoteCardV2
                key={note.id}
                id={note.id}
                title={note.title}
                content={note.content}
                noteType={noteType}
                tags={note.tags}
                createdAt={note.created_at}
                listItems={listItems}
                onClick={() => handleEditNote(note)}
                viewMode={viewMode}
                showOwnerBadge={!!mergedConnection}
                owner={
                  mergedConnection
                    ? {
                        isOwner: note.user_id === currentUserId,
                        displayName: note.user_id === currentUserId ? 'You' : partnerName,
                      }
                    : undefined
                }
              />
            );
          })}
        </div>
      )}

      {/* FAB (Floating Action Button) */}
      <FABV2
        icon={Plus}
        onClick={() => {
          setEditingNote(null);
          setShowFormModal(true);
        }}
        position="bottom-right"
        size="md"
        label="Create note"
      />

      {/* Create/Edit Modal */}
      <NoteFormModalV2
        isOpen={showFormModal}
        onClose={() => {
          setShowFormModal(false);
          setEditingNote(null);
        }}
        onSubmit={handleSubmit}
        initialData={editingNote || undefined}
        isEditing={!!editingNote}
        isPending={createMutation.isPending}
      />
    </div>
  );
};

export default Notes;
