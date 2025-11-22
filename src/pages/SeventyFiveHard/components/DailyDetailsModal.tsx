/**
 * Daily Details Modal Component
 *
 * Modal that displays comprehensive details for a specific day in the 75 Hard challenge.
 * Supports keyboard navigation and accessibility features.
 *
 * Features:
 * - Full-size photo display
 * - Task completion status
 * - Weight tracking
 * - Daily notes
 * - Keyboard navigation (arrow keys, ESC)
 * - Previous/Next day navigation
 * - Responsive design
 * - Dark mode support
 *
 * @component
 */

import React, { useEffect, useCallback } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Camera,
  Scale,
  FileText,
  Calendar,
  CheckCircle2,
  Circle
} from 'lucide-react';
import { format } from 'date-fns';
import type { SeventyFiveHardChallenge, DailyCheckIn, Task } from '../../../types/seventyFiveHard';

interface DailyDetailsModalProps {
  checkIn: DailyCheckIn;
  challenge: SeventyFiveHardChallenge;
  onClose: () => void;
  onNavigate?: (direction: 'prev' | 'next') => void;
  canNavigatePrev?: boolean;
  canNavigateNext?: boolean;
}

/**
 * Daily Details Modal Component
 * Shows comprehensive view of a single day's check-in
 */
export default function DailyDetailsModal({
  checkIn,
  challenge,
  onClose,
  onNavigate,
  canNavigatePrev = false,
  canNavigateNext = false
}: DailyDetailsModalProps) {
  // ==================== Keyboard Navigation ====================

  /**
   * Handle keyboard events for navigation and closing
   */
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowLeft' && canNavigatePrev && onNavigate) {
      onNavigate('prev');
    } else if (e.key === 'ArrowRight' && canNavigateNext && onNavigate) {
      onNavigate('next');
    }
  }, [onClose, onNavigate, canNavigatePrev, canNavigateNext]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [handleKeyDown]);

  // ==================== Helper Functions ====================

  /**
   * Get task definition from challenge by taskId
   */
  const _getTask = (taskId: string): Task | undefined => {
    return challenge.tasks.find(t => t.id === taskId);
  };

  /**
   * Check if task is completed in this check-in
   */
  const isTaskCompleted = (taskId: string): boolean => {
    const completion = checkIn.taskCompletions.find(tc => tc.taskId === taskId);
    return completion?.completed || false;
  };

  // ==================== Render ====================

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Modal Content */}
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{ display: 'flex', flexDirection: 'column' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700" style={{ flexShrink: 0 }}>
          <div className="flex items-center gap-4">
            {/* Day Badge */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-full font-bold text-lg">
              Day {checkIn.dayNumber}
            </div>

            {/* Date */}
            <div>
              <h2 id="modal-title" className="text-xl font-semibold text-gray-900 dark:text-white">
                {format(checkIn.date, 'EEEE, MMMM d, yyyy')}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {format(checkIn.date, 'h:mm a')}
              </p>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-6 space-y-6" style={{ flex: 1, minHeight: 0 }}>
          {/* Photo Section */}
          {checkIn.photo && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-gray-900 dark:text-white font-medium">
                <Camera className="w-5 h-5 text-purple-600" />
                <h3>Progress Photo</h3>
              </div>
              <div className="rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                <img
                  src={checkIn.photo}
                  alt={`Progress photo from day ${checkIn.dayNumber}`}
                  className="w-full h-auto max-h-96 object-contain"
                />
              </div>
            </div>
          )}

          {/* Tasks Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-gray-900 dark:text-white font-medium">
              <CheckCircle2 className="w-5 h-5 text-purple-600" />
              <h3>Tasks</h3>
            </div>
            <div className="space-y-2">
              {challenge.tasks.map((task) => {
                const completed = isTaskCompleted(task.id);
                return (
                  <div
                    key={task.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border-2 ${
                      completed
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                        : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    {completed ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                    ) : (
                      <Circle className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className={`font-medium ${
                        completed
                          ? 'text-green-900 dark:text-green-100'
                          : 'text-gray-900 dark:text-gray-100'
                      }`}>
                        {task.title}
                      </p>
                      {task.description && (
                        <p className={`text-sm ${
                          completed
                            ? 'text-green-700 dark:text-green-300'
                            : 'text-gray-600 dark:text-gray-400'
                        }`}>
                          {task.description}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Weight Section */}
          {checkIn.weight !== undefined && checkIn.weight !== null && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-gray-900 dark:text-white font-medium">
                <Scale className="w-5 h-5 text-purple-600" />
                <h3>Weight</h3>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-200 dark:border-purple-800 rounded-lg p-4">
                <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">
                  {checkIn.weight.toFixed(1)}
                  <span className="text-lg font-normal text-purple-700 dark:text-purple-300 ml-2">kg</span>
                </p>
              </div>
            </div>
          )}

          {/* Notes Section */}
          {checkIn.notes && checkIn.notes.trim().length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-gray-900 dark:text-white font-medium">
                <FileText className="w-5 h-5 text-purple-600" />
                <h3>Notes</h3>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/50 border-2 border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                  {checkIn.notes}
                </p>
              </div>
            </div>
          )}

          {/* Empty State if no additional data */}
          {!checkIn.photo && !checkIn.weight && (!checkIn.notes || checkIn.notes.trim().length === 0) && (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-400">
                No additional data tracked for this day
              </p>
            </div>
          )}
        </div>

        {/* Footer with Navigation */}
        {onNavigate && (canNavigatePrev || canNavigateNext) && (
          <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700" style={{ flexShrink: 0 }}>
            <button
              onClick={() => onNavigate('prev')}
              disabled={!canNavigatePrev}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                canNavigatePrev
                  ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/50'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
              }`}
              aria-label="Previous day"
            >
              <ChevronLeft className="w-5 h-5" />
              Previous Day
            </button>

            <p className="text-sm text-gray-600 dark:text-gray-400">
              Use arrow keys to navigate
            </p>

            <button
              onClick={() => onNavigate('next')}
              disabled={!canNavigateNext}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                canNavigateNext
                  ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/50'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
              }`}
              aria-label="Next day"
            >
              Next Day
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
