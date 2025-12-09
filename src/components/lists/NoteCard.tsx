import React, { useState } from 'react';
import { Trash2, FileText, List as ListIcon, ChevronDown, ChevronUp } from 'lucide-react';
import type { Note } from '../../types';
import { useListItems, useCreateListItem, useUpdateListItem, useDeleteListItem } from '../../hooks/useNotesQuery';
import ListItemRow from './ListItemRow';
import AddListItem from './AddListItem';

interface NoteCardProps {
  note: Note;
  onDelete: () => void;
}

const NoteCard: React.FC<NoteCardProps> = ({ note, onDelete }) => {
  const [isExpanded, setIsExpanded] = useState(note.noteType === 'list');

  // List items hooks (only used if note is a list)
  const { data: listItems, isLoading: itemsLoading } = useListItems(note.noteType === 'list' ? note.id : null);
  const createItemMutation = useCreateListItem();
  const updateItemMutation = useUpdateListItem();
  const deleteItemMutation = useDeleteListItem();

  const handleAddItem = (title: string, notes?: string, url?: string) => {
    createItemMutation.mutate({
      noteId: note.id,
      input: { title, notes, url },
    });
  };

  const handleToggleComplete = (itemId: string, currentCompleted: boolean) => {
    updateItemMutation.mutate({
      id: itemId,
      noteId: note.id,
      updates: { completed: !currentCompleted },
    });
  };

  const handleUpdateItem = (itemId: string, updates: any) => {
    updateItemMutation.mutate({
      id: itemId,
      noteId: note.id,
      updates,
    });
  };

  const handleDeleteItem = (itemId: string) => {
    deleteItemMutation.mutate({ id: itemId, noteId: note.id });
  };

  const completedCount = listItems?.filter((item) => item.completed).length || 0;
  const totalCount = listItems?.length || 0;

  return (
    <article className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {note.noteType === 'list' ? (
              <ListIcon className="h-4 w-4 text-indigo-500 flex-shrink-0" />
            ) : (
              <FileText className="h-4 w-4 text-slate-500 flex-shrink-0" />
            )}
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
              {note.title}
            </p>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {note.noteType === 'list' && `${completedCount} of ${totalCount} completed • `}
            Last updated {new Date(note.updatedAt).toLocaleString()}
          </p>

          {note.tags && note.tags.length > 0 && (
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              #{note.tags.join(' #')}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1">
          {note.noteType === 'list' && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="rounded p-1 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
              title={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          )}
          <button
            type="button"
            onClick={onDelete}
            className="rounded-full border border-slate-200 dark:border-slate-600 p-1 text-slate-500 dark:text-slate-400 transition hover:bg-slate-100 dark:hover:bg-slate-700"
            aria-label="Delete note"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Content for regular notes */}
      {note.noteType === 'note' && note.content && (
        <p className="mt-2 whitespace-pre-line text-sm text-slate-700 dark:text-slate-300">
          {note.content}
        </p>
      )}

      {/* List items for list notes */}
      {note.noteType === 'list' && isExpanded && (
        <div className="mt-4 space-y-2">
          {itemsLoading ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">Loading items...</p>
          ) : listItems && listItems.length > 0 ? (
            listItems.map((item) => (
              <ListItemRow
                key={item.id}
                item={item}
                onToggleComplete={() => handleToggleComplete(item.id, item.completed)}
                onDelete={() => handleDeleteItem(item.id)}
                onUpdate={(updates) => handleUpdateItem(item.id, updates)}
              />
            ))
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
              No items yet. Add your first one below!
            </p>
          )}

          <AddListItem
            onAdd={handleAddItem}
            disabled={createItemMutation.isPending}
          />
        </div>
      )}
    </article>
  );
};

export default NoteCard;
