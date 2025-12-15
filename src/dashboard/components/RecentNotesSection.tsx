import React from 'react';
import { FileText, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { LoadingButton } from '../../components/LoadingButton';
import type { Note } from '../../types';

interface RecentNotesSectionProps {
  notes: Note[];
  onViewAll: () => void;
}

/**
 * Recent notes section with tags
 */
export function RecentNotesSection({
  notes,
  onViewAll,
}: RecentNotesSectionProps): React.ReactElement {
  return (
    <div className="card animate-scale-in">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-primary font-display">Recent Notes</h3>
        <button
          onClick={onViewAll}
          className="text-accent hover:text-accent font-medium text-sm transition-colors duration-200"
        >
          View all →
        </button>
      </div>
      <div className="space-y-3">
        {notes.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 mb-4">
              <FileText className="w-8 h-8 text-amber-600" />
            </div>
            <h4 className="text-lg font-semibold text-primary mb-2">Capture your thoughts</h4>
            <p className="text-sm text-secondary mb-4 max-w-xs mx-auto">
              Jot down ideas, reminders, or anything you want to remember.
            </p>
            <LoadingButton
              onClick={onViewAll}
              variant="primary"
              size="md"
              className="bg-gradient-to-r from-amber-500 to-orange-600 hover:shadow-lg hover:scale-105"
            >
              <Plus className="w-4 h-4" />
              Write Your First Note
            </LoadingButton>
          </div>
        ) : (
          notes.map((note: Note, index: number) => (
            <div
              key={note.id}
              className="group p-4 bg-tertiary rounded-xl hover:shadow-md transition-all duration-200 hover:-translate-y-1"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <h4 className="text-sm font-medium text-primary mb-2 group-hover:text-accent transition-colors duration-200">
                {note.title}
              </h4>
              <p className="text-xs text-secondary mb-3">
                {format(new Date(note.updatedAt), 'MMM dd, yyyy')}
              </p>
              <div className="flex flex-wrap gap-2">
                {note.tags.slice(0, 3).map((tag: string) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-accent-soft text-accent rounded-full text-xs font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
