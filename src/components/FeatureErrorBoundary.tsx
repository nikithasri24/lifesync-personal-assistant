/**
 * Feature Error Boundary
 * 
 * A specialized error boundary for individual features/pages
 * Provides better error recovery and doesn't crash the entire app
 */

import React from 'react';
import { logger } from '../services/logger';
import { parseToLifeSyncError } from '../lib/errors';
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  feature: string; // Feature name (e.g., "Tasks", "Habits", "Notes")
  fallback?: React.ReactNode;
  onReset?: () => void;
  onBack?: () => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorCount: number;
}

export class FeatureErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorCount: 0 };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    const lifeSyncError = parseToLifeSyncError(error);
    
    logger.error(`FeatureErrorBoundary:${this.props.feature}`, lifeSyncError, {
      code: lifeSyncError.code,
      statusCode: lifeSyncError.statusCode,
      componentStack: errorInfo.componentStack,
      context: lifeSyncError.context,
      errorCount: this.state.errorCount + 1,
    });

    this.setState((prev) => ({ errorCount: prev.errorCount + 1 }));
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: undefined });
    this.props.onReset?.();
  };

  handleBack = (): void => {
    if (this.props.onBack) {
      this.props.onBack();
    } else {
      window.history.back();
    }
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const lifeSyncError = this.state.error ? parseToLifeSyncError(this.state.error) : null;
      const isDev = import.meta.env.DEV;

      // If error keeps happening (3+ times), show a more severe error
      const isCritical = this.state.errorCount >= 3;

      return (
        <div className="flex items-center justify-center p-8 min-h-[400px]">
          <div className="max-w-lg w-full bg-white dark:bg-slate-800 rounded-lg shadow-md border border-red-200 dark:border-red-800 p-6">
            {/* Error Icon */}
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
                <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
            </div>

            {/* Error Title */}
            <h3 className="text-lg font-bold text-gray-900 dark:text-white text-center mb-2">
              {isCritical ? `${this.props.feature} Unavailable` : `Error in ${this.props.feature}`}
            </h3>

            {/* Error Message */}
            <p className="text-sm text-gray-700 dark:text-gray-300 text-center mb-6">
              {isCritical
                ? `We're experiencing persistent issues with ${this.props.feature}. Please try again later or contact support.`
                : lifeSyncError?.userMessage || 'Something went wrong. Please try again.'}
            </p>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-center">
              {!isCritical && (
                <button
                  onClick={this.handleReset}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </button>
              )}
              <button
                onClick={this.handleBack}
                className="inline-flex items-center px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-900 dark:text-white text-sm font-medium rounded-md transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </button>
            </div>

            {/* Error Details (Development Only) */}
            {isDev && this.state.error && (
              <details className="mt-4">
                <summary className="cursor-pointer text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                  Error Details (Dev Only)
                </summary>
                <div className="bg-gray-100 dark:bg-slate-900 p-3 rounded border border-gray-300 dark:border-slate-700 overflow-auto max-h-48">
                  <pre className="text-xs text-red-600 dark:text-red-400 whitespace-pre-wrap">
                    {this.state.error.toString()}
                    {'\n\n'}
                    {lifeSyncError && `Code: ${lifeSyncError.code}\n`}
                    {this.state.error.stack}
                  </pre>
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

