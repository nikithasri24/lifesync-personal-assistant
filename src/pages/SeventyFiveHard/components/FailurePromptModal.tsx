/**
 * Failure Prompt Modal
 *
 * Shown when user didn't complete all tasks yesterday.
 * - Asks "Did you complete all tasks yesterday?"
 * - YES: Marks tasks as complete, continues challenge
 * - NO: Resets challenge to day 1
 */

import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';

interface FailurePromptModalProps {
  date: Date;
  onYes: () => Promise<void>;
  onNo: () => Promise<void>;
}

export default function FailurePromptModal({ date, onYes, onNo }: FailurePromptModalProps): React.JSX.Element {
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const handleYes = async (): Promise<void> => {
    setIsProcessing(true);
    try {
      await onYes();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNo = async (): Promise<void> => {
    setIsProcessing(true);
    try {
      await onNo();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Check-in Required
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {format(date, 'EEEE, MMMM d')}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-gray-700 dark:text-gray-300 text-lg">
            Did you complete <strong>all tasks</strong> yesterday?
          </p>

          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-2">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <strong className="text-gray-900 dark:text-white">Important:</strong> The 75 Hard challenge requires honesty.
            </p>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 ml-4 list-disc">
              <li>If you completed all tasks, click <strong>Yes</strong> to continue</li>
              <li>If you missed any tasks, click <strong>No</strong> to restart</li>
            </ul>
          </div>

          {/* Warning box */}
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
            <p className="text-sm text-red-800 dark:text-red-300">
              Clicking <strong>No</strong> will reset your challenge to Day 1.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => { void handleNo(); }}
            disabled={isProcessing}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RotateCcw className="w-5 h-5" />
            No, Reset Challenge
          </button>

          <button
            onClick={() => { void handleYes(); }}
            disabled={isProcessing}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCircle2 className="w-5 h-5" />
            Yes, I Completed All
          </button>
        </div>

        {/* Processing indicator */}
        {isProcessing && (
          <div className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Processing...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
