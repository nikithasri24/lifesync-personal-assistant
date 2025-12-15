import React from 'react';

/**
 * Header for Notes page
 */
export function NotesHeader(): React.ReactElement {
  return (
    <header className="flex flex-col gap-2">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Notes & Lists</h1>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Capture quick notes or create trackable lists for movies, books, places, and more.
      </p>
    </header>
  );
}
