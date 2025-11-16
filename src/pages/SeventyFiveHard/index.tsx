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

import React, { useEffect, useState } from 'react';
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

// Import components
import EmptyState from './components/EmptyState';
import ChallengeSetupForm from './components/ChallengeSetupForm';
import DailyCheckIn from './components/DailyCheckIn';
import FailurePromptModal from './components/FailurePromptModal';
import CompletedView from './components/CompletedView';
import DeleteChallengeModal from './components/DeleteChallengeModal';

export default function SeventyFiveHard() {
  const [showSetupForm, setShowSetupForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

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

  // Get today's check-in
  const todayCheckIn = checkIns.find(c => {
    const today = new Date();
    const checkInDate = new Date(c.date);
    return (
      checkInDate.getFullYear() === today.getFullYear() &&
      checkInDate.getMonth() === today.getMonth() &&
      checkInDate.getDate() === today.getDate()
    );
  });

  // ==================== Handlers ====================

  const handleStartChallenge = () => {
    setShowSetupForm(true);
  };

  const handleSubmitChallenge = async (tasks: Omit<import('../../types/seventyFiveHard').Task, 'id'>[]) => {
    const result = await startSFHChallenge(tasks);
    if (result.success) {
      setShowSetupForm(false);
    } else {
      // Error is already logged, could show toast here
      alert(result.error || 'Failed to start challenge');
    }
  };

  const handleCancelSetup = () => {
    setShowSetupForm(false);
  };

  const handleToggleTask = async (taskId: string) => {
    await toggleSFHTask(taskId);
  };

  const handleUploadPhoto = async (file: File) => {
    await uploadSFHPhoto(file);
  };

  const handleUpdateNotes = async (notes: string) => {
    await updateSFHCheckInNotes(notes);
  };

  const handleUpdateWeight = async (weight: number) => {
    await updateSFHCheckInWeight(weight);
  };

  const handleFailureYes = async () => {
    await handleSFHFailureResponse(true);
  };

  const handleFailureNo = async () => {
    await handleSFHFailureResponse(false);
  };

  const handleDeleteChallenge = () => {
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    const result = await deleteSFHChallenge();
    if (result.success) {
      setShowDeleteModal(false);
    } else {
      alert(result.error || 'Failed to delete challenge');
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
  };

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

  // Active challenge - show daily check-in
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <DailyCheckIn
        challenge={challenge}
        checkIn={todayCheckIn || null}
        onToggleTask={handleToggleTask}
        onUploadPhoto={handleUploadPhoto}
        onUpdateNotes={handleUpdateNotes}
        onUpdateWeight={handleUpdateWeight}
        onDeleteChallenge={handleDeleteChallenge}
      />
    </div>
  );
}
