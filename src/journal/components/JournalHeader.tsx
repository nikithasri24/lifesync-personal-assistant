import React from 'react';

/**
 * Header for Journal page
 */
export function JournalHeader(): React.ReactElement {
  return (
    <header className="flex flex-col gap-2">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Journal</h1>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Capture daily reflections and thoughts
      </p>
    </header>
  );
}
