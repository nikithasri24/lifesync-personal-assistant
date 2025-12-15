import React from 'react';

interface ErrorBannerProps {
  error: string;
}

/**
 * Error banner display
 */
export function ErrorBanner({ error }: ErrorBannerProps): React.ReactElement | null {
  if (!error) return null;

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-20 max-w-md mx-auto">
      <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-900">
        {error}
      </div>
    </div>
  );
}
