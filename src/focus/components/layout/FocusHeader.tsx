import React from 'react';

/**
 * Header for Focus timer page
 */
export function FocusHeader(): React.ReactElement {
  return (
    <header className="space-y-2">
      <h1 className="text-2xl font-semibold text-slate-900">Focus timer</h1>
      <p className="text-sm text-slate-600">
        A lightweight Pomodoro timer to help you carve out distraction-free sessions. Hit start and stay in flow.
      </p>
    </header>
  );
}
