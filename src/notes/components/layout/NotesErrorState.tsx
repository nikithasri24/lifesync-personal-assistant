import React from 'react';

interface NotesErrorStateProps {
  error: Error | null;
}

/**
 * Error state for Notes page
 */
export function NotesErrorState({ error }: NotesErrorStateProps): React.ReactElement {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 p-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-slate-900">Notes</h1>
        <p className="text-sm text-red-600">
          Error loading notes: {error instanceof Error ? error.message : 'Unknown error'}
        </p>
      </header>
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-700">
          Unable to load your notes. Please try refreshing the page.
        </p>
      </div>
    </div>
  );
}
