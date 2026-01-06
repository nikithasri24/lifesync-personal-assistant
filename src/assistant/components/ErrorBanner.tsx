import React from 'react';
import { AlertCircle, X } from 'lucide-react';

interface ErrorBannerProps {
  error: string | null;
}

/**
 * Error banner display - Redesigned
 */
export function ErrorBanner({ error }: ErrorBannerProps): React.ReactElement | null {
  const [isVisible, setIsVisible] = React.useState(true);

  React.useEffect(() => {
    if (error) {
      setIsVisible(true);
    }
  }, [error]);

  if (!error || !isVisible) return null;

  return (
    <div className="fixed top-24 left-1/2 -translate-x-1/2 z-30 max-w-md mx-auto px-4 animate-slideDown">
      <div className="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 rounded-2xl px-5 py-4 shadow-xl">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 p-1 bg-red-100 rounded-lg">
            <AlertCircle className="h-5 w-5 text-red-600" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-red-900 mb-1">Something went wrong</h4>
            <p className="text-sm text-red-800">{error}</p>
          </div>
          <button
            onClick={() => setIsVisible(false)}
            className="flex-shrink-0 p-1 text-red-400 hover:text-red-600 hover:bg-red-100 rounded-lg transition-colors"
            aria-label="Dismiss error"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translate(-50%, -20px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }

        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
