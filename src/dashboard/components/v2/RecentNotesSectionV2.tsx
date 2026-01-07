/**
 * RecentNotesSectionV2 Component
 * Recent notes section with V2 design
 */

import React from 'react';
import { FileText } from 'lucide-react';
import type { Note } from '../../../types';
import { SectionHeaderV2 } from './SectionHeaderV2';
import { EmptyStateV2 } from './EmptyStateV2';
import { NoteCardV2 } from './NoteCardV2';

export interface RecentNotesSectionV2Props {
  notes: Note[];
  onViewAll: () => void;
}

export const RecentNotesSectionV2: React.FC<RecentNotesSectionV2Props> = ({
  notes,
  onViewAll,
}) => {
  return (
    <div className="
      bg-white dark:bg-gray-800
      rounded-2xl p-6
      border border-gray-200 dark:border-gray-700
      shadow-sm
    ">
      <SectionHeaderV2
        title="Recent Notes"
        icon={FileText}
        actionLabel="View all"
        onAction={onViewAll}
      />

      <div className="space-y-3">
        {notes.length === 0 ? (
          <EmptyStateV2
            icon={FileText}
            title="Capture your thoughts"
            description="Jot down ideas, reminders, or anything you want to remember."
            actionLabel="Write Your First Note"
            onAction={onViewAll}
            variant="secondary"
          />
        ) : (
          notes.map((note, index) => (
            <NoteCardV2
              key={note.id}
              note={note}
              onClick={onViewAll}
              index={index}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default RecentNotesSectionV2;

