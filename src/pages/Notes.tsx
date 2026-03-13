/**
 * Notes Page
 *
 * Updated with V2 components to match notes-design-spec.html
 * Uses React Query for server state management
 * Supports merged mode for shared note viewing
 */

import { useState, useMemo } from 'react';
import { Plus, Search } from 'lucide-react';
import { usePagedNotes, useCreateNote, useUpdateNote, useDeleteNote } from '../hooks/useNotesQuery';
import { usePagination } from '../hooks/utilities/usePagination';
import { PaginationV2 } from '../components/ui/PaginationV2';
import { useMergedConnection, useCurrentUserId } from '@/hooks/useOwnerInfo';
import { useQueries } from '@tanstack/react-query';
import { getListItems } from '../api/notesAPI';
import type { NoteType } from '../types';
import { OwnerFilter, type OwnerFilterValue } from '../components/common/OwnerFilter';
import { NotesHeaderV2, NoteCardV2, NoteFormModalV2 } from '../notes/components/v2';
import { useThemeColors } from '../hooks/useThemeColors';
import { useModalState } from '../hooks/useModalState';
import { logger } from '@/services/logger';
import { useToast } from '../hooks/useToast';
import { FeatureErrorBoundary } from '../components/FeatureErrorBoundary';

type ViewMode = 'grid' | 'list';

const NotesContent: React.FC = () => {
  const colors = useThemeColors();
  const { showToast } = useToast();

  // Merged mode support
  const { data: mergedConnection } = useMergedConnection('notes');
  const { data: currentUserId } = useCurrentUserId();
  const partnerName = mergedConnection?.partnerName ?? 'Partner';
  const [ownerFilter, setOwnerFilter] = useState<OwnerFilterValue>('all');

  // Pagination state
  const { page, setPage, resetPage } = usePagination();

  // React Query hooks - server-side paginated notes
  const { data: pagedData, isLoading, error } = usePagedNotes(undefined, page);
  const notes = pagedData?.items ?? [];
  const createMutation = useCreateNote();
  const updateMutation = useUpdateNote();
  const deleteMutation = useDeleteNote();

  // Fetch list items for all checklist notes
  const listItemQueries = useQueries({
    queries: notes
      .filter(note => note.noteType === 'list')
      .map(note => ({
        queryKey: ['listItems', note.id],
        queryFn: () => getListItems(note.id),
        enabled: !!note.id,
      })),
  });

  // Create a map of noteId -> listItems for easy lookup
  const listItemsMap = useMemo(() => {
    const map = new Map();
    notes.forEach((note, index) => {
      if (note.noteType === 'list') {
        const queryIndex = notes.slice(0, index).filter(n => n.noteType === 'list').length;
        const items = listItemQueries[queryIndex]?.data || [];
        map.set(note.id, items.map(item => ({
          text: item.title,
          completed: item.completed,
        })));
      }
    });
    return map;
  }, [notes, listItemQueries]);

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal state using useModalState hook
  const modals = useModalState({
    showForm: false,
    editingNoteId: null as string | null,
  });

  // Filter notes by owner (merged mode) and search query
  const filteredNotes = useMemo(() => {
    let result = notes;

    if (mergedConnection && ownerFilter !== 'all') {
      if (ownerFilter === 'mine') {
        result = result.filter(note => note.user_id === currentUserId);
      } else if (ownerFilter === 'partner') {
        result = result.filter(note => note.user_id === mergedConnection.partnerId);
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(note =>
        note.title.toLowerCase().includes(q) ||
        note.content.toLowerCase().includes(q)
      );
    }

    return result;
  }, [notes, ownerFilter, currentUserId, mergedConnection, searchQuery]);

  // Get unique tags for stats
  const totalTags = useMemo(() => {
    const tagSet = new Set<string>();
    filteredNotes.forEach(note => {
      note.tags.forEach(tag => tagSet.add(tag));
    });
    return tagSet.size;
  }, [filteredNotes]);

  // Handle create/update note
  const handleSubmit = async (data: {
    title: string;
    content: string;
    tags: string[];
    noteType: NoteType;
  }) => {
    try {
      if (modals.state.editingNoteId) {
        // Update existing note
        await updateMutation.mutateAsync({
          id: modals.state.editingNoteId,
          updates: {
            title: data.title,
            content: data.content,
            tags: data.tags,
            noteType: data.noteType,
          },
        });
        showToast('Note updated successfully! ✏️', 'success');
      } else {
        // Create new note
        await createMutation.mutateAsync({
          title: data.title,
          content: data.content,
          tags: data.tags,
          noteType: data.noteType,
        });
        showToast('Note created successfully! 📝', 'success');
      }
      modals.close('showForm');
      modals.set('editingNoteId', null);
    } catch (error) {
      showToast(`Failed to ${modals.state.editingNoteId ? 'update' : 'create'} note: ${(error as Error).message}`, 'error');
      throw error; // Re-throw to prevent modal from closing on error
    }
  };

  const handleDelete = (): void => {
    if (modals.state.editingNoteId) {
      deleteMutation.mutate(modals.state.editingNoteId, {
        onSuccess: () => {
          showToast('Note deleted! 🗑️', 'success');
          modals.close('showForm');
          modals.set('editingNoteId', null);
        },
      });
    }
  };

  const handleEditNote = (note: typeof notes[0]) => {
    modals.set('editingNoteId', note.id);
    modals.open('showForm');
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

  // Get editing note data
  const editingNote = modals.state.editingNoteId
    ? notes.find(n => n.id === modals.state.editingNoteId)
    : null;

  // Get list items for the editing note if it's a checklist
  const editingListItems = editingNote?.noteType === 'list' && editingNote?.id
    ? listItemsMap.get(editingNote.id) || []
    : [];

  // Convert list items to content format for the modal
  const editingContent = editingNote
    ? editingNote.noteType === 'list' && editingListItems.length > 0
      ? editingListItems.map((item: { text: string; completed: boolean }) => item.text).join('\n')
      : editingNote.content
    : '';

  // Error state
  if (error) {
    return (
      <div style={{ backgroundColor: colors.bg.primary, minHeight: '100vh' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1.5rem', paddingBottom: '5rem' }}>
          <NotesHeaderV2 />
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
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div style={{ backgroundColor: colors.bg.primary, minHeight: '100vh' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1.5rem', paddingBottom: '5rem' }}>
          <NotesHeaderV2 />
          <div className="p-6 text-center" style={{ color: colors.text.secondary }}>
            <p>Loading notes...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: colors.bg.primary, minHeight: '100vh' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1.5rem', paddingBottom: '5rem' }}>
        {/* Header */}
        <NotesHeaderV2 />

        {/* Owner Filter (Merged Mode) */}
        {mergedConnection && (
          <div className="mb-6">
            <OwnerFilter
              value={ownerFilter}
              onChange={(v) => { setOwnerFilter(v); resetPage(); }}
              partnerName={partnerName}
            />
          </div>
        )}

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: colors.text.tertiary }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
          />
        </div>

        {/* View Toggle */}
        <div className="mb-6 p-1 rounded-xl flex gap-1" style={{ backgroundColor: colors.bg.secondary }}>
          <button
            onClick={() => setViewMode('grid')}
            className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all ${
              viewMode === 'grid' ? 'bg-white shadow-sm' : ''
            }`}
            style={{
              color: viewMode === 'grid' ? '#C18B5E' : colors.text.secondary,
            }}
            aria-label="Grid view"
          >
            📱 Grid
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all ${
              viewMode === 'list' ? 'bg-white shadow-sm' : ''
            }`}
            style={{
              color: viewMode === 'list' ? '#C18B5E' : colors.text.secondary,
            }}
            aria-label="List view"
          >
            📄 List
          </button>
        </div>

        {/* Notes Count */}
        <div className="mb-4">
          <h2 className="text-lg font-bold" style={{ color: colors.text.primary }}>
            All Notes ({pagedData?.total ?? filteredNotes.length})
          </h2>
        </div>

        {/* Notes Grid/List */}
        {filteredNotes.length === 0 ? (
          <div className="text-center py-20 px-6">
            <div className="text-6xl mb-4 opacity-50">📝</div>
            <h3 className="text-lg font-bold mb-2" style={{ color: colors.text.primary }}>
              No notes yet
            </h3>
            <p className="text-sm" style={{ color: colors.text.secondary }}>
              Create text notes or checklists to capture your thoughts and ideas.
            </p>
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-2 gap-3' : 'flex flex-col gap-3'}>
            {filteredNotes.map((note) => {
              const noteType = note.noteType || 'note';
              // Get list items from the map for checklist notes, or parse from content as fallback
              const listItems = noteType === 'list'
                ? (listItemsMap.get(note.id) || parseListItems(note.content))
                : [];

              return (
                <NoteCardV2
                  key={note.id}
                  id={note.id}
                  title={note.title}
                  content={note.content}
                  noteType={noteType}
                  tags={note.tags}
                  createdAt={note.createdAt.toISOString()}
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

        {/* Pagination */}
        {pagedData && pagedData.totalPages > 1 && (
          <PaginationV2
            currentPage={pagedData.page}
            totalPages={pagedData.totalPages}
            totalItems={pagedData.total}
            pageSize={pagedData.pageSize}
            onPageChange={setPage}
          />
        )}

        {/* FAB (Floating Action Button) */}
        <button
          onClick={() => {
            modals.set('editingNoteId', null);
            modals.open('showForm');
          }}
          className="fixed w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white text-2xl transition-transform active:scale-95"
          style={{
            bottom: '96px',
            right: '32px',
            background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)',
            boxShadow: '0 4px 16px rgba(193, 139, 94, 0.4)',
            zIndex: 50,
          }}
          aria-label="Create new note"
        >
          +
        </button>

        {/* Create/Edit Modal */}
        <NoteFormModalV2
          isOpen={modals.state.showForm}
          onClose={() => {
            modals.close('showForm');
            modals.set('editingNoteId', null);
          }}
          onSubmit={handleSubmit}
          onDelete={handleDelete}
          initialData={editingNote ? {
            title: editingNote.title,
            content: editingContent,
            tags: editingNote.tags,
            noteType: editingNote.noteType || 'note',
          } : undefined}
          isEditing={!!modals.state.editingNoteId}
          isPending={createMutation.isPending || updateMutation.isPending || deleteMutation.isPending}
        />
      </div>
    </div>
  );
};

const Notes: React.FC = () => {
  return (
    <FeatureErrorBoundary feature="Notes">
      <NotesContent />
    </FeatureErrorBoundary>
  );
};

export default Notes;
