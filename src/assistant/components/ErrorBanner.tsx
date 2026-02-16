import React from 'react';
import { AlertCircle, X, ExternalLink } from 'lucide-react';

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

  // Check if this is an LLM configuration error
  const isConfigError = error.includes('LLM provider') || error.includes('GROQ_API_KEY') || error.includes('Ollama');

  return (
    <div className="fixed top-24 left-1/2 -translate-x-1/2 z-30 max-w-2xl mx-auto px-4 animate-slideDown">
      <div className="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 rounded-2xl px-5 py-4 shadow-xl">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 p-1 bg-red-100 rounded-lg">
            <AlertCircle className="h-5 w-5 text-red-600" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-red-900 mb-1">
              {isConfigError ? 'AI Assistant Not Configured' : 'Something went wrong'}
            </h4>
            <p className="text-sm text-red-800 mb-2">{error}</p>

            {isConfigError && (
              <div className="mt-3 p-3 bg-white/60 rounded-lg border border-red-200">
                <p className="text-xs font-semibold text-red-900 mb-2">Setup Instructions:</p>
                <ol className="text-xs text-red-800 space-y-1 list-decimal list-inside">
                  <li>Get a free API key from <a href="https://console.groq.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline inline-flex items-center gap-1">Groq <ExternalLink className="w-3 h-3" /></a></li>
                  <li>Add <code className="px-1 py-0.5 bg-slate-800 text-white rounded text-[10px]">VITE_GROQ_API_KEY=your-key-here</code> to your <code className="px-1 py-0.5 bg-slate-800 text-white rounded text-[10px]">.env</code> file</li>
                  <li>Restart the development server</li>
                </ol>
              </div>
            )}
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
