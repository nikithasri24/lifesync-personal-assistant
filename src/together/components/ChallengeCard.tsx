/**
 * Challenge Card Component
 * Displays achievement reward progress
 */

import React from 'react';
import { Gift, Check } from 'lucide-react';
import type { AchievementReward } from '../types';
import { useThemeColors } from '@/hooks/useThemeColors';
import { OwnerBadge } from '@/components/common/OwnerBadge';
import { useUpdateAchievementReward } from '../hooks/useAchievementRewardsQuery';

interface ChallengeCardProps {
  challenge: AchievementReward;
  onClick: () => void;
  showOwner?: boolean;
  currentUserId?: string;
  partnerName?: string;
}

export const ChallengeCard: React.FC<ChallengeCardProps> = ({
  challenge,
  onClick,
  showOwner = false,
  currentUserId,
  partnerName = 'Partner',
}) => {
  const colors = useThemeColors();
  const { mutate: updateChallenge, isPending: isClaiming } = useUpdateAchievementReward();

  const progress = challenge.target_value
    ? Math.min((challenge.current_progress / challenge.target_value) * 100, 100)
    : 0;

  // Consider challenge completed if progress reached 100%
  const isProgressComplete = progress >= 100;
  // Consider reward claimed if status is 'completed' with completed_at set
  const isClaimed = challenge.status === 'completed' && challenge.completed_at !== null;
  const isExpired = challenge.status === 'expired';
  // Show reward if claimed OR progress is complete
  const isCompleted = isClaimed || isProgressComplete;

  // Creator always sees the reward; undefined userId → defaults to recipient (safe/conservative)
  const isCreator = !!currentUserId && currentUserId === challenge.creator_id;

  const getRewardIcon = () => {
    switch (challenge.reward_type) {
      case 'message':  return '💌';
      case 'activity': return '🎯';
      case 'gift':     return '🎁';
      case 'surprise': return '✨';
      default:         return '🎁';
    }
  };

  const getRewardText = () => {
    if (isCompleted) return challenge.reward_description || 'Reward awaits!';
    if (isCreator)   return challenge.reward_description || 'Reward awaits!';
    const teaser: Record<string, string> = {
      message:  'A personal message is waiting for you…',
      activity: 'A date or activity is waiting for you…',
      gift:     'A gift is waiting for you…',
      surprise: 'A surprise is waiting for you…',
    };
    return teaser[challenge.reward_type] ?? 'Complete the challenge to unlock your reward!';
  };

  const getRewardLabel = () => {
    if (isCompleted) return 'Reward Unlocked! 🎉';
    if (isCreator)   return "Gift you've prepared:";
    return 'Your reward:';
  };

  const handleClaimReward = (e: React.MouseEvent) => {
    e.stopPropagation();

    // Mark challenge as completed with timestamp
    updateChallenge({
      id: challenge.id,
      status: 'completed',
      completed_at: new Date().toISOString(),
    });
  };

  return (
    <div
      className="p-5 rounded-xl border hover:shadow-md transition-shadow cursor-pointer"
      style={{
        backgroundColor: isCompleted
          ? '#F0F9FF'
          : isExpired
          ? colors.bg.secondary
          : colors.bg.white,
        borderColor: isCompleted ? '#3B82F6' : colors.border.light,
        opacity: isExpired ? 0.6 : 1,
      }}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-3xl">💪</span>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold" style={{ color: colors.text.primary }}>
                {challenge.title}
              </h3>
              {showOwner && currentUserId && (
                <OwnerBadge
                  userId={challenge.creator_id}
                  currentUserId={currentUserId}
                  partnerName={partnerName}
                  size="sm"
                />
              )}
            </div>
            {challenge.description && (
              <p className="text-sm mt-1" style={{ color: colors.text.secondary }}>
                {challenge.description}
              </p>
            )}
          </div>
        </div>
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

      {/* Progress Bar */}
      {!isProgressComplete && !isExpired && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium" style={{ color: colors.text.secondary }}>
              Progress
            </span>
            <span className="text-xs font-bold" style={{ color: colors.text.primary }}>
              {Math.round(progress)}%
            </span>
          </div>
          <div
            className="w-full h-2 rounded-full overflow-hidden"
            style={{ backgroundColor: colors.border.light }}
          >
            <div
              className="h-full transition-all duration-500"
              style={{
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #D4A574 0%, #C18B5E 100%)',
              }}
            />
          </div>
          <p className="text-xs mt-1" style={{ color: colors.text.tertiary }}>
            Current: {challenge.current_progress} | Target: {challenge.target_value}
          </p>
        </div>
      )}

      {/* Reward Preview */}
      <div
        className="p-3 rounded-lg"
        style={{
          backgroundColor: isCompleted
            ? 'rgba(59, 130, 246, 0.1)'
            : colors.bg.secondary,
        }}
      >
        <div className="flex items-start gap-2">
          <span className="text-xl">{getRewardIcon()}</span>
          <div className="flex-1">
            <p className="text-xs font-semibold mb-1" style={{ color: colors.text.secondary }}>
              {getRewardLabel()}
            </p>
            <p className="text-sm" style={{ color: colors.text.primary }}>
              {getRewardText()}
            </p>
          </div>
        </div>
      </div>

      {/* Claim/Claimed Button - only show when progress is complete */}
      {isProgressComplete && !isExpired && (
        <>
          {isClaimed ? (
            <button
              className="w-full mt-3 px-4 py-2 rounded-lg font-semibold text-white transition-colors cursor-default"
              style={{
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              }}
              disabled
            >
              <div className="flex items-center justify-center gap-2">
                <Check className="w-5 h-5" />
                <span>Claimed</span>
              </div>
            </button>
          ) : (
            <button
              className="w-full mt-3 px-4 py-2 rounded-lg font-semibold text-white transition-colors hover:opacity-90 disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
              }}
              onClick={handleClaimReward}
              disabled={isClaiming}
            >
              {isClaiming ? 'Claiming...' : 'Claim Reward 🎉'}
            </button>
          )}
        </>
      )}
    </div>
  );
};
