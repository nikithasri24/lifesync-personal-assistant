import React, { Component, type ReactNode } from 'react';
import { logger } from '../services/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

/**
 * ErrorBoundary - Catches React errors and prevents white screen crashes
 *
 * Wraps the app to catch unhandled errors in components and show
 * a friendly fallback UI instead of a blank page.
 *
 * @example
 * <ErrorBoundary>
 *   <App />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log error to monitoring service
    logger.error('ErrorBoundary', error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
    });

    this.setState({
      errorInfo,
    });
  }

  private handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    // Reload the page to reset app state
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback UI provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="text-4xl" role="img" aria-label="warning">
                ⚠️
              </div>
              <h1 className="text-xl font-bold text-gray-900">
                Something went wrong
              </h1>
            </div>

            {/* Error message */}
            <div className="mb-4">
              <p className="text-gray-600 mb-3">
                We're sorry, but something unexpected happened. The error has been logged
                and we'll look into it.
              </p>

              {/* Show error details in development */}
              {import.meta.env.DEV && this.state.error && (
                <details className="mt-3">
                  <summary className="text-sm font-medium text-gray-700 cursor-pointer hover:text-gray-900">
                    Error Details (Development Only)
                  </summary>
                  <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded text-xs">
                    <p className="font-mono text-red-800 mb-2">
                      {this.state.error.message}
                    </p>
                    {this.state.error.stack && (
                      <pre className="overflow-auto text-red-700 whitespace-pre-wrap">
                        {this.state.error.stack}
                      </pre>
                    )}
                  </div>
                </details>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label="Reload page"
              >
                Reload Page
              </button>
              <button
                onClick={() => window.history.back()}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                aria-label="Go back to previous page"
              >
                Go Back
              </button>
            </div>

            {/* Help text */}
            <p className="mt-4 text-xs text-gray-500 text-center">
              If this problem persists, please contact support
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
