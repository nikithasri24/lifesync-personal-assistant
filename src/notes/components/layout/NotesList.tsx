import React from 'react';
import NoteCard from '../../../components/lists/NoteCard';
import type { Note } from '../../../types';

interface NotesListProps {
  notes?: Note[];
  onDelete: (id: string) => void;
  // Merged mode props (optional)
  showOwnerBadge?: boolean;
  currentUserId?: string | null;
  partnerName?: string;
}

/**
 * List of notes with empty state
 */
export function NotesList({ notes, onDelete, showOwnerBadge = false, currentUserId, partnerName = 'Partner' }: NotesListProps): React.ReactElement {
  if (!notes || notes.length === 0) {
    return (
      <section className="space-y-3">
        <div className="rounded-lg border border-dashed border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 p-12 text-center text-slate-500 dark:text-slate-400">
          No notes or lists yet. Create your first one above!
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      {notes.map((note) => (
        <NoteCard
          key={note.id}
          note={note}
          onDelete={() => onDelete(note.id)}
          showOwnerBadge={showOwnerBadge}
          currentUserId={currentUserId}
          partnerName={partnerName}
        />
      ))}
    </section>
  );
}
