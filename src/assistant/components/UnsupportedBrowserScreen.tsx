import React from 'react';

/**
 * Screen shown when browser doesn't support voice features
 */
export function UnsupportedBrowserScreen(): React.ReactElement {
  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-md p-8 text-center bg-white rounded-2xl shadow-lg">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">Browser Not Supported</h2>
        <p className="text-slate-600">
          Voice conversations require Chrome, Safari, or Edge browser.
          Please switch to a supported browser to use this feature.
        </p>
      </div>
    </div>
  );
}
