/**
 * Challenge Detail Modal
 * View and edit achievement reward details
 */

import React, { useState, useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';
import { useUpdateAchievementReward, useDeleteAchievementReward } from '../../hooks/useAchievementRewardsQuery';
import type { AchievementReward, RewardType } from '../../types';
import { useToast } from '@/hooks/useToast';

interface ChallengeDetailModalProps {
  isOpen: boolean;
  challenge: AchievementReward;
  onClose: () => void;
}

export const ChallengeDetailModal: React.FC<ChallengeDetailModalProps> = ({
  isOpen,
  challenge,
  onClose,
}) => {
  const { showToast } = useToast();
  const { mutate: updateChallenge, isPending: isUpdating } = useUpdateAchievementReward();
  const { mutate: deleteChallenge, isPending: isDeleting } = useDeleteAchievementReward();

  // Form state
  const [title, setTitle] = useState(challenge.title);
  const [description, setDescription] = useState(challenge.description || '');
  const [targetValue, setTargetValue] = useState(challenge.target_value?.toString() || '');
  const [currentProgress, setCurrentProgress] = useState(challenge.current_progress.toString());
  const [rewardType, setRewardType] = useState<RewardType>(challenge.reward_type);
  const [rewardDescription, setRewardDescription] = useState(challenge.reward_description || '');
  const [hideReward, setHideReward] = useState(challenge.hide_reward);
  const [expiresAt, setExpiresAt] = useState(
    challenge.expiration_date ? challenge.expiration_date.split('T')[0] : ''
  );
  const [isEditing, setIsEditing] = useState(false);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !targetValue.trim()) {
      if (showToast) {
        showToast('Please fill in all required fields', 'error');
      }
      return;
    }

    updateChallenge(
      {
        id: challenge.id,
        title,
        description: description || null,
        target_value: parseFloat(targetValue),
        current_progress: parseFloat(currentProgress),
        reward_type: rewardType,
        reward_description: rewardDescription || null,
        hide_reward: hideReward,
        expiration_date: expiresAt || null,
      },
      {
        onSuccess: () => {
          if (showToast) {
            showToast('Challenge updated successfully! 🎯', 'success');
          }
          setIsEditing(false);
        },
        onError: (error) => {
          if (showToast) {
            showToast(`Failed to update challenge: ${error.message}`, 'error');
          }
        },
      }
    );
  };

  const handleDelete = () => {
    if (!confirm('Are you sure you want to delete this challenge? This cannot be undone.')) {
      return;
    }

    deleteChallenge(challenge.id, {
      onSuccess: () => {
        if (showToast) {
          showToast('Challenge deleted', 'success');
        }
        onClose();
      },
      onError: (error) => {
        if (showToast) {
          showToast(`Failed to delete challenge: ${error.message}`, 'error');
        }
      },
    });
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const progress = challenge.target_value
    ? Math.min((parseFloat(currentProgress) / parseFloat(targetValue)) * 100, 100)
    : 0;

  const isCompleted = challenge.status === 'unlocked';
  const isExpired = challenge.status === 'expired';

  return (
    <div
      className="fixed top-0 left-0 right-0 bottom-0 z-[60] flex items-end justify-center lg:items-center"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(4px)',
        marginTop: 'calc(-1 * env(safe-area-inset-top, 0px))',
        paddingTop: 'env(safe-area-inset-top, 0px)',
        height: 'calc(100vh + env(safe-area-inset-top, 0px) + env(safe-area-inset-bottom, 0px))',
      }}
      onClick={handleBackdropClick}
    >
      <div
        className="w-full bg-white lg:rounded-3xl rounded-t-3xl overflow-hidden"
        style={{
          maxHeight: '90vh',
          maxWidth: '600px',
        }}
      >
        {/* Drag Handle (mobile) */}
        <div className="lg:hidden pt-2">
          <div className="w-9 h-1 bg-gray-300 rounded-full mx-auto" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Edit Challenge' : 'Challenge Details'}
          </h2>
          <div className="flex items-center gap-2">
            {!isEditing && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                aria-label="Delete challenge"
              >
                <Trash2 className="w-5 h-5 text-red-500" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div
          className="overflow-y-auto p-6 space-y-5"
          style={{ maxHeight: 'calc(90vh - 140px)' }}
        >
          {/* Status Badges */}
          {(isCompleted || isExpired) && (
            <div className="flex gap-2">
              {isCompleted && (
                <div
                  className="px-3 py-1 rounded-full text-xs font-bold"
                  style={{ backgroundColor: '#3B82F6', color: 'white' }}
                >
                  ✓ Completed
                </div>
              )}
              {isExpired && (
                <div
                  className="px-3 py-1 rounded-full text-xs font-bold"
                  style={{ backgroundColor: '#6B7280', color: 'white' }}
                >
                  Expired
                </div>
              )}
            </div>
          )}

          {isEditing ? (
            <form onSubmit={handleSave} className="space-y-5">
              {/* Title */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">
                  Challenge Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">
                  Description (optional)
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none resize-none transition-all"
                />
              </div>

              {/* Target & Progress */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">
                  Progress
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs mb-1 block text-gray-600">
                      Current Progress
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={currentProgress}
                      onChange={(e) => setCurrentProgress(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-xs mb-1 block text-gray-600">
                      Target Value
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={targetValue}
                      onChange={(e) => setTargetValue(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Reward Type */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">
                  Reward Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center gap-2 p-3 border border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                    <input
                      type="radio"
                      name="reward-type"
                      value="message"
                      checked={rewardType === 'message'}
                      onChange={(e) => setRewardType(e.target.value as RewardType)}
                      className="w-4 h-4 text-terracotta-400 focus:ring-terracotta-300"
                    />
                    <span className="text-sm font-medium text-gray-900">
                      💌 Message
                    </span>
                  </label>
                  <label className="flex items-center gap-2 p-3 border border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                    <input
                      type="radio"
                      name="reward-type"
                      value="activity"
                      checked={rewardType === 'activity'}
                      onChange={(e) => setRewardType(e.target.value as RewardType)}
                      className="w-4 h-4 text-terracotta-400 focus:ring-terracotta-300"
                    />
                    <span className="text-sm font-medium text-gray-900">
                      🎯 Activity
                    </span>
                  </label>
                  <label className="flex items-center gap-2 p-3 border border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                    <input
                      type="radio"
                      name="reward-type"
                      value="gift"
                      checked={rewardType === 'gift'}
                      onChange={(e) => setRewardType(e.target.value as RewardType)}
                      className="w-4 h-4 text-terracotta-400 focus:ring-terracotta-300"
                    />
                    <span className="text-sm font-medium text-gray-900">
                      🎁 Gift
                    </span>
                  </label>
                  <label className="flex items-center gap-2 p-3 border border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                    <input
                      type="radio"
                      name="reward-type"
                      value="surprise"
                      checked={rewardType === 'surprise'}
                      onChange={(e) => setRewardType(e.target.value as RewardType)}
                      className="w-4 h-4 text-terracotta-400 focus:ring-terracotta-300"
                    />
                    <span className="text-sm font-medium text-gray-900">
                      ✨ Surprise
                    </span>
                  </label>
                </div>
              </div>

              {/* Reward Description */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">
                  Reward Description
                </label>
                <textarea
                  rows={3}
                  value={rewardDescription}
                  onChange={(e) => setRewardDescription(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none resize-none transition-all"
                />
              </div>

              {/* Hide Reward */}
              <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={hideReward}
                  onChange={(e) => setHideReward(e.target.checked)}
                  className="w-5 h-5 text-terracotta-400 rounded"
                />
                <div>
                  <span className="font-medium text-gray-900">
                    Hide reward until unlocked
                  </span>
                  <p className="text-xs mt-0.5 text-gray-600">
                    Show as "Mystery Reward 🎁" until challenge is completed
                  </p>
                </div>
              </label>

              {/* Expiration */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">
                  Expiration (optional)
                </label>
                <input
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
                />
              </div>
            </form>
          ) : (
            <>
              {/* View Mode */}
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {challenge.title}
                </h3>
                {challenge.description && (
                  <p className="text-gray-600">{challenge.description}</p>
                )}
              </div>

              {/* Progress Bar */}
              {!isCompleted && !isExpired && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-700">
                      Progress
                    </span>
                    <span className="text-sm font-bold text-gray-900">
                      {Math.round(progress)}%
                    </span>
                  </div>
                  <div className="w-full h-3 rounded-full overflow-hidden bg-gray-200">
                    <div
                      className="h-full transition-all duration-500"
                      style={{
                        width: `${progress}%`,
                        background: 'linear-gradient(90deg, #D4A574 0%, #C18B5E 100%)',
                      }}
                    />
                  </div>
                  <p className="text-sm mt-2 text-gray-600">
                    Current: {challenge.current_progress} | Target: {challenge.target_value}
                  </p>
                </div>
              )}

              {/* Reward Display */}
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">
                    {challenge.hide_reward && !isCompleted ? '🎁' :
                      challenge.reward_type === 'message' ? '💌' :
                      challenge.reward_type === 'activity' ? '🎯' :
                      challenge.reward_type === 'gift' ? '🎁' : '✨'}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-700 mb-1">
                      {isCompleted ? 'Your Reward:' : 'Reward:'}
                    </p>
                    <p className="text-gray-900">
                      {challenge.hide_reward && !isCompleted
                        ? 'Mystery Reward (unlocks when complete)'
                        : challenge.reward_description || 'Reward awaits!'}
                    </p>
                  </div>
                </div>
              </div>

              {challenge.expiration_date && (
                <div className="text-sm text-gray-600">
                  <strong>Expires:</strong>{' '}
                  {new Date(challenge.expiration_date).toLocaleDateString()}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
          {isEditing ? (
            <>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold text-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={handleSave}
                disabled={isUpdating}
                className="flex-1 px-4 py-3 rounded-xl font-semibold text-white transition-opacity disabled:opacity-50"
                style={{
                  background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)',
                }}
              >
                {isUpdating ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold text-gray-700 transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="flex-1 px-4 py-3 rounded-xl font-semibold text-white transition-opacity"
                style={{
                  background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)',
                }}
              >
                Edit Challenge
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
