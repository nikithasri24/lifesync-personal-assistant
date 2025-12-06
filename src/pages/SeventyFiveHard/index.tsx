/**
 * 75 Hard Challenge - Main Page
 *
 * Simplified implementation using new clean architecture:
 * - ONE active challenge per user
 * - Direct store actions (no service layer)
 * - Self-contained check-ins (not in Todos)
 * - Auto-reset on missed day with confirmation
 *
 * Complexity: ~200 lines (down from 2300+)
 */

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useAppStore } from '../../stores/useAppStore';
import {
  loadSFHChallenge,
  startSFHChallenge,
  toggleSFHTask,
  uploadSFHPhoto,
  updateSFHCheckInNotes,
  updateSFHCheckInWeight,
  handleSFHFailureResponse,
  deleteSFHChallenge,
} from '../../stores/seventyFiveHardActions';
import { isSameDay, startOfDay } from 'date-fns';

// Import components
import EmptyState from './components/EmptyState';
import ChallengeSetupForm from './components/ChallengeSetupForm';
import DailyCheckIn from './components/DailyCheckIn';
import ProgressView from './components/ProgressView';
import FailurePromptModal from './components/FailurePromptModal';
import CompletedView from './components/CompletedView';
import DeleteChallengeModal from './components/DeleteChallengeModal';

export default function SeventyFiveHard() {
  const [showSetupForm, setShowSetupForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'today' | 'progress'>('today');

  // Get state from store
  const {
    sfhChallenge: challenge,
    sfhCheckIns: checkIns,
    sfhShowFailurePrompt: showFailurePrompt,
    sfhFailureDate: failureDate,
    sfhShowCelebration: showCelebration,
  } = useAppStore();

  // Load challenge on mount
  useEffect(() => {
    loadSFHChallenge();
  }, []);

  // Memoize today's check-in lookup (more efficient than manual comparison)
  const todayCheckIn = useMemo(() => {
    const today = startOfDay(new Date());
    return checkIns.find(c => isSameDay(c.date, today)) || null;
  }, [checkIns]);

  // ==================== Handlers ====================

  const handleStartChallenge = useCallback(() => {
    setShowSetupForm(true);
  }, []);

  const handleSubmitChallenge = useCallback(async (tasks: Omit<import('../../types/seventyFiveHard').Task, 'id'>[]) => {
    const result = await startSFHChallenge(tasks);
    if (result.success) {
      setShowSetupForm(false);
    } else {
      // Error is already logged, could show toast here
      alert(result.error || 'Failed to start challenge');
    }
  }, []);

  const handleCancelSetup = useCallback(() => {
    setShowSetupForm(false);
  }, []);

  const handleToggleTask = useCallback(async (taskId: string) => {
    await toggleSFHTask(taskId);
  }, []);

  const handleUploadPhoto = useCallback(async (file: File) => {
    await uploadSFHPhoto(file);
  }, []);

  const handleUpdateNotes = useCallback(async (notes: string) => {
    await updateSFHCheckInNotes(notes);
  }, []);

  const handleUpdateWeight = useCallback(async (weight: number) => {
    await updateSFHCheckInWeight(weight);
  }, []);

  const handleFailureYes = useCallback(async () => {
    await handleSFHFailureResponse(true);
  }, []);

  const handleFailureNo = useCallback(async () => {
    await handleSFHFailureResponse(false);
  }, []);

  const handleDeleteChallenge = useCallback(() => {
    setShowDeleteModal(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    const result = await deleteSFHChallenge();
    if (result.success) {
      setShowDeleteModal(false);
    } else {
      alert(result.error || 'Failed to delete challenge');
    }
  }, []);

  const handleCancelDelete = useCallback(() => {
    setShowDeleteModal(false);
  }, []);

  // ==================== Render ====================

  // Show delete confirmation modal
  if (showDeleteModal && challenge) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DeleteChallengeModal
          currentDay={challenge.currentDay}
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
        />
      </div>
    );
  }

  // Show failure prompt modal
  if (showFailurePrompt && failureDate) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <FailurePromptModal
          date={failureDate}
          onYes={handleFailureYes}
          onNo={handleFailureNo}
        />
      </div>
    );
  }

  // Show setup form modal
  if (showSetupForm) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ChallengeSetupForm
          onSubmit={handleSubmitChallenge}
          onCancel={handleCancelSetup}
        />
      </div>
    );
  }

  // No active challenge - show empty state
  if (!challenge) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <EmptyState onStart={handleStartChallenge} />
      </div>
    );
  }

  // Challenge completed - show celebration
  if (challenge.status === 'completed') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CompletedView challenge={challenge} checkIns={checkIns} />
      </div>
    );
  }

  // Active challenge - show tabs and content
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('today')}
          className={`flex-1 sm:flex-none sm:px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
            activeTab === 'today'
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md shadow-purple-500/30'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
          }`}
        >
          Today
        </button>
        <button
          onClick={() => setActiveTab('progress')}
          className={`flex-1 sm:flex-none sm:px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
            activeTab === 'progress'
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md shadow-purple-500/30'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
          }`}
        >
          Progress
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'today' ? (
        <DailyCheckIn
          challenge={challenge}
          checkIn={todayCheckIn || null}
          onToggleTask={handleToggleTask}
          onUploadPhoto={handleUploadPhoto}
          onUpdateNotes={handleUpdateNotes}
          onUpdateWeight={handleUpdateWeight}
          onDeleteChallenge={handleDeleteChallenge}
        />
      ) : (
        <ProgressView
          challenge={challenge}
          checkIns={checkIns}
        />
      )}
    </div>
  );
}
