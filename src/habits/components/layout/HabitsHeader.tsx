import React from 'react';

/**
 * Header for Habits page
 */
export function HabitsHeader(): React.ReactElement {
  return (
    <header className="flex flex-col gap-2">
      <h1 className="text-2xl font-semibold text-slate-900">Habit tracker</h1>
      <p className="text-sm text-slate-600">A lightweight overview to help you stay consistent with the routines that matter.</p>
    </header>
  );
}
