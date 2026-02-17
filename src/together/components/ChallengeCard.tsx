/**
 * Challenge Card Component
 * Displays achievement reward progress
 */

import React from 'react';
import { Gift } from 'lucide-react';
import type { AchievementReward } from '../types';
import { useThemeColors } from '@/hooks/useThemeColors';

interface ChallengeCardProps {
  challenge: AchievementReward;
  onClick: () => void;
}

export const ChallengeCard: React.FC<ChallengeCardProps> = ({
  challenge,
  onClick,
}) => {
  const colors = useThemeColors();

  const progress = Math.min(
    (challenge.current_value / challenge.target_value) * 100,
    100
  );

  const isCompleted = challenge.status === 'unlocked';
  const isExpired = challenge.status === 'expired';

  const getRewardIcon = () => {
    if (challenge.hide_reward_until_unlock && !isCompleted) {
      return '🎁';
    }
    switch (challenge.reward_type) {
      case 'message':
        return '💌';
      case 'activity':
        return '🎯';
      case 'gift':
        return '🎁';
      case 'surprise':
        return '✨';
      default:
        return '🎁';
    }
  };

  const getRewardText = () => {
    if (challenge.hide_reward_until_unlock && !isCompleted) {
      return 'Mystery Reward (unlocks when complete)';
    }
    return challenge.reward_content || 'Reward awaits!';
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
            <h3 className="text-lg font-bold" style={{ color: colors.text.primary }}>
              {challenge.title}
            </h3>
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
      {!isCompleted && !isExpired && (
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
            Current: {challenge.current_value} {challenge.target_metric} | Target:{' '}
            {challenge.target_value} {challenge.target_metric}
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
              {isCompleted ? 'Your Reward:' : 'Reward:'}
            </p>
            <p className="text-sm" style={{ color: colors.text.primary }}>
              {getRewardText()}
            </p>
          </div>
        </div>
      </div>

      {isCompleted && (
        <button
          className="w-full mt-3 px-4 py-2 rounded-lg font-semibold text-white transition-colors hover:opacity-90"
          style={{
            background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
          }}
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
        >
          Claim Reward 🎉
        </button>
      )}
    </div>
  );
};
