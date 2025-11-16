/**
 * Delete Challenge Modal
 *
 * Confirmation modal for deleting a challenge.
 * Shows warning and requires explicit confirmation.
 */

import React, { useState } from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';

interface DeleteChallengeModalProps {
  onConfirm: () => Promise<void>;
  onCancel: () => void;
  currentDay: number;
}

export default function DeleteChallengeModal({ onConfirm, onCancel, currentDay }: DeleteChallengeModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Delete Challenge?
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                This action cannot be undone
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-sm text-red-800 dark:text-red-300 font-medium mb-2">
              ⚠️ Warning: You are about to delete your challenge
            </p>
            <ul className="text-sm text-red-700 dark:text-red-400 space-y-1 ml-4 list-disc">
              <li>You're currently on Day {currentDay} of 75</li>
              <li>All your progress will be permanently deleted</li>
              <li>All check-ins and photos will be removed</li>
              <li>This cannot be undone</li>
            </ul>
          </div>

          <p className="text-gray-700 dark:text-gray-300">
            Are you sure you want to quit and delete this challenge? If you just want to restart from Day 1, use the <strong>Reset</strong> option instead (available when you miss a day).
          </p>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isDeleting}
          >
            Cancel
          </button>

          <button
            onClick={handleConfirm}
            disabled={isDeleting}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-5 h-5" />
            {isDeleting ? 'Deleting...' : 'Yes, Delete Challenge'}
          </button>
        </div>

        {/* Processing indicator */}
        {isDeleting && (
          <div className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Deleting challenge...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
