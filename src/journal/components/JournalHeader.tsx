import React from 'react';

/**
 * Header for Journal page
 */
export function JournalHeader(): React.ReactElement {
  return (
    <header
      className="px-6 pt-16 pb-6"
      style={{
        background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)',
        color: 'white',
      }}
    >
      <h1 className="text-3xl font-extrabold text-white">
        📓 Journal
      </h1>
      <p className="text-sm text-white/90 mt-2">
        Daily reflections & memories
      </p>
    </header>
  );
}
