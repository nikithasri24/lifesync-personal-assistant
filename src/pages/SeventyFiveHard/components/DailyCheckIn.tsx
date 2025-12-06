/**
 * Daily Check-In Component
 *
 * Shows today's tasks with checkboxes for completion.
 * - Real-time task toggling
 * - Progress bar
 * - Photo upload
 * - Notes and weight tracking
 * - Success message when all tasks complete
 */

import React, { useState, useEffect, useRef } from 'react';
import { Camera, Edit3, Scale, CheckCircle2, MoreVertical, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { getCompletionPercentage } from '../../../types/seventyFiveHard';
import type { SeventyFiveHardChallenge, DailyCheckIn as DailyCheckInType } from '../../../types/seventyFiveHard';

interface DailyCheckInProps {
  challenge: SeventyFiveHardChallenge;
  checkIn: DailyCheckInType | null;
  onToggleTask: (taskId: string) => Promise<void>;
  onUploadPhoto: (file: File) => Promise<void>;
  onUpdateNotes: (notes: string) => Promise<void>;
  onUpdateWeight: (weight: number) => Promise<void>;
  onDeleteChallenge: () => void;
}

export default function DailyCheckIn({
  challenge,
  checkIn,
  onToggleTask,
  onUploadPhoto,
  onUpdateNotes,
  onUpdateWeight,
  onDeleteChallenge
}: DailyCheckInProps): React.JSX.Element {
  const [notes, setNotes] = useState(checkIn?.notes ?? '');
  const [weight, setWeight] = useState(checkIn?.weight?.toString() ?? '');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // Debounce timers
  const notesDebounceTimer = useRef<NodeJS.Timeout | null>(null);
  const weightDebounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Sync local state when checkIn changes
  useEffect(() => {
    if (checkIn) {
      setNotes(checkIn.notes ?? '');
      setWeight(checkIn.weight?.toString() ?? '');
    }
  }, [checkIn]);

  // Cleanup debounce timers on unmount
  useEffect(() => {
    return () => {
      if (notesDebounceTimer.current) clearTimeout(notesDebounceTimer.current);
      if (weightDebounceTimer.current) clearTimeout(weightDebounceTimer.current);
    };
  }, []);

  if (!checkIn) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <p className="text-yellow-800 dark:text-yellow-300">
          Loading today's check-in...
        </p>
      </div>
    );
  }

  const tasksCompleted = checkIn.taskCompletions.filter(tc => tc.completed).length;
  const totalTasks = challenge.tasks.length;
  const completionPercentage = getCompletionPercentage(checkIn.taskCompletions);
  const allComplete = tasksCompleted === totalTasks;

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    void onUploadPhoto(file)
      .catch(() => {
        // TODO: Add proper error handling
      })
      .finally(() => {
        setIsUploadingPhoto(false);
      });
  };

  const handleNotesChange = (newNotes: string): void => {
    setNotes(newNotes);

    // Clear existing timer
    if (notesDebounceTimer.current) {
      clearTimeout(notesDebounceTimer.current);
    }

    // Set new timer to update after 1 second of no typing
    notesDebounceTimer.current = setTimeout(() => {
      // Enforce max length (database constraint is 1000)
      if (newNotes.length > 1000) {
        // TODO: Replace with toast or modal notification
        setNotes(checkIn?.notes ?? '');
        return;
      }

      // Only update if changed
      if (newNotes !== checkIn?.notes) {
        void onUpdateNotes(newNotes);
      }
    }, 1000);
  };

  const handleNotesBlur = (): void => {
    // Clear debounce timer and save immediately on blur
    if (notesDebounceTimer.current) {
      clearTimeout(notesDebounceTimer.current);
    }

    // Enforce max length (database constraint is 1000)
    if (notes.length > 1000) {
      // TODO: Replace with toast or modal notification
      setNotes(checkIn?.notes ?? '');
      return;
    }

    // Only update if changed
    if (notes !== checkIn?.notes) {
      void onUpdateNotes(notes).catch(() => {
        // TODO: Add proper error handling
      });
    }
  };

  const handleWeightChange = (newWeight: string): void => {
    setWeight(newWeight);

    // Clear existing timer
    if (weightDebounceTimer.current) {
      clearTimeout(weightDebounceTimer.current);
    }

    // Set new timer to update after 1 second of no typing
    weightDebounceTimer.current = setTimeout(() => {
      const weightNum = parseFloat(newWeight);

      // Validate weight is a number
      if (isNaN(weightNum)) {
        return;
      }

      // Validate reasonable range (20-500 kg or ~50-1100 lbs)
      if (weightNum < 20 || weightNum > 1100) {
        return;
      }

      // Only update if changed
      if (weightNum !== checkIn?.weight) {
        void onUpdateWeight(weightNum);
      }
    }, 1000);
  };

  const handleWeightBlur = (): void => {
    // Clear debounce timer and validate immediately on blur
    if (weightDebounceTimer.current) {
      clearTimeout(weightDebounceTimer.current);
    }

    const weightNum = parseFloat(weight);

    // Validate weight is a number
    if (isNaN(weightNum)) {
      setWeight(checkIn?.weight?.toString() ?? '');
      return;
    }

    // Validate reasonable range (20-500 kg or ~50-1100 lbs)
    if (weightNum < 20 || weightNum > 1100) {
      // TODO: Replace with toast or modal notification
      setWeight(checkIn?.weight?.toString() ?? '');
      return;
    }

    // Only update if changed
    if (weightNum !== checkIn?.weight) {
      void onUpdateWeight(weightNum).catch(() => {
        // TODO: Add proper error handling
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Day {challenge.currentDay} of 75</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Started {format(challenge.startDate, 'MMM d, yyyy')}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-4xl font-bold text-gray-900 dark:text-white">{tasksCompleted}/{totalTasks}</div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Tasks Complete</p>
            </div>
            {/* Menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Options"
              >
                <MoreVertical className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              {showMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      onDeleteChallenge();
                    }}
                    className="w-full flex items-center gap-2 px-4 py-3 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Challenge
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-purple-600 to-pink-600 h-full transition-all duration-500 ease-out rounded-full"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-2 text-center">
            {completionPercentage}% complete
          </p>
        </div>
      </div>

      {/* Success message */}
      {allComplete && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-300 dark:border-green-700 rounded-lg p-4 flex items-center gap-3 shadow-md">
          <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-green-900 dark:text-green-100">
              Great job! All tasks completed for today!
            </h3>
            <p className="text-sm text-green-700 dark:text-green-300 mt-1">
              {challenge.currentDay < 75
                ? `Come back tomorrow for Day ${challenge.currentDay + 1}`
                : "You've completed the 75 Hard Challenge! 🎉"
              }
            </p>
          </div>
        </div>
      )}

      {/* Tasks */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white">Today's Tasks</h3>
        </div>

        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {challenge.tasks.map(task => {
            const completion = checkIn.taskCompletions.find(tc => tc.taskId === task.id);
            const isComplete = completion?.completed ?? false;

            return (
              <label
                key={task.id}
                className="flex items-start gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors group"
              >
                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={isComplete}
                  onChange={() => void onToggleTask(task.id)}
                  className="mt-1 w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                />

                {/* Task details */}
                <div className="flex-1">
                  <h4
                    className={`font-medium transition-all ${
                      isComplete
                        ? 'text-gray-400 dark:text-gray-500 line-through'
                        : 'text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400'
                    }`}
                  >
                    {task.title}
                  </h4>
                  {task.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {task.description}
                    </p>
                  )}
                  {isComplete && completion?.completedAt && (
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                      Completed at {format(new Date(completion.completedAt), 'h:mm a')}
                    </p>
                  )}
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* Optional data */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Photo upload */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <label className="block">
            <div className="flex items-center gap-2 mb-2">
              <Camera className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <span className="font-medium text-gray-900 dark:text-white">Progress Photo</span>
            </div>

            {checkIn.photo ? (
              <div className="relative group">
                <img
                  src={checkIn.photo}
                  alt="Progress photo"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm">Click to change</span>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-primary-500 transition-colors">
                <Camera className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {isUploadingPhoto ? 'Uploading...' : 'Click to upload photo'}
                </p>
              </div>
            )}

            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
              disabled={isUploadingPhoto}
            />
          </label>
        </div>

        {/* Weight tracking */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <label className="block">
            <div className="flex items-center gap-2 mb-2">
              <Scale className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <span className="font-medium text-gray-900 dark:text-white">Weight (optional)</span>
            </div>
            <input
              type="number"
              value={weight}
              onChange={(e) => handleWeightChange(e.target.value)}
              onBlur={handleWeightBlur}
              placeholder="Enter weight"
              step="0.1"
              min="20"
              max="1100"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Track your progress (kg or lbs)
            </p>
          </label>
        </div>
      </div>

      {/* Notes */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <label className="block">
          <div className="flex items-center gap-2 mb-2">
            <Edit3 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <span className="font-medium text-gray-900 dark:text-white">Notes (optional)</span>
          </div>
          <textarea
            value={notes}
            onChange={(e) => handleNotesChange(e.target.value)}
            onBlur={handleNotesBlur}
            placeholder="How did today go? Any challenges or wins?"
            rows={4}
            maxLength={1000}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {notes.length}/1000 characters
          </p>
        </label>
      </div>
    </div>
  );
}
