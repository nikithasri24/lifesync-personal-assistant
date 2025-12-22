import React from 'react';
import { logger } from '../services/logger';
import { parseToLifeSyncError } from '../lib/errors';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  feature?: string; // Optional feature name for better error context
  onReset?: () => void; // Optional reset callback
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    const lifeSyncError = parseToLifeSyncError(error);

    logger.error(
      this.props.feature ? `ErrorBoundary:${this.props.feature}` : 'ErrorBoundary',
      lifeSyncError,
      {
        code: lifeSyncError.code,
        statusCode: lifeSyncError.statusCode,
        componentStack: errorInfo.componentStack,
        context: lifeSyncError.context,
      }
    );

    this.setState({ errorInfo });
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    this.props.onReset?.();
  };

  handleGoHome = (): void => {
    window.location.href = '/';
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const lifeSyncError = this.state.error ? parseToLifeSyncError(this.state.error) : null;
      const isDev = import.meta.env.DEV;

      return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-red-200 dark:border-red-800 p-8">
            {/* Error Icon */}
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-full">
                <AlertTriangle className="w-12 h-12 text-red-600 dark:text-red-400" />
              </div>
            </div>

            {/* Error Title */}
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-2">
              {lifeSyncError?.userMessage || 'Something went wrong'}
            </h2>

            {/* Feature Context */}
            {this.props.feature && (
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-6">
                Error in {this.props.feature}
              </p>
            )}

            {/* Error Message */}
            <p className="text-gray-700 dark:text-gray-300 text-center mb-8">
              We're sorry for the inconvenience. The application encountered an unexpected error.
            </p>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-center mb-6">
              <button
                onClick={this.handleReset}
                className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </button>
              <button
                onClick={this.handleGoHome}
                className="inline-flex items-center px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-900 dark:text-white font-medium rounded-lg transition-colors"
              >
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </button>
            </div>

            {/* Error Details (Development Only) */}
            {isDev && this.state.error && (
              <details className="mt-6">
                <summary className="cursor-pointer font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Error Details (Development Only)
                </summary>
                <div className="bg-gray-100 dark:bg-slate-900 p-4 rounded border border-gray-300 dark:border-slate-700 overflow-auto">
                  <div className="mb-4">
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Error:</p>
                    <pre className="text-xs text-red-600 dark:text-red-400 whitespace-pre-wrap">
                      {this.state.error.toString()}
                    </pre>
                  </div>
                  {lifeSyncError && (
                    <div className="mb-4">
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Error Code:</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{lifeSyncError.code}</p>
                    </div>
                  )}
                  {this.state.error.stack && (
                    <div className="mb-4">
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Stack Trace:</p>
                      <pre className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                        {this.state.error.stack}
                      </pre>
                    </div>
                  )}
                  {this.state.errorInfo?.componentStack && (
                    <div>
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Component Stack:</p>
                      <pre className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}