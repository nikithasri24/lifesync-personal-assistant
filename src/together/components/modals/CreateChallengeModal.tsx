/**
 * Create Challenge Modal
 * Link achievements to rewards for your partner
 */

import React, { useState, useEffect } from 'react';
import { X, Search } from 'lucide-react';
import { useCreateAchievementReward } from '../../hooks/useAchievementRewardsQuery';
import type { PartnerLink, RewardType } from '../../types';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useToast } from '@/hooks/useToast';

interface CreateChallengeModalProps {
  isOpen: boolean;
  partnerLink: PartnerLink | null;
  onClose: () => void;
}

export const CreateChallengeModal: React.FC<CreateChallengeModalProps> = ({
  isOpen,
  partnerLink,
  onClose,
}) => {
  const colors = useThemeColors();
  const { toast } = useToast();
  const { mutate: createChallenge, isPending } = useCreateAchievementReward();

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetMetric, setTargetMetric] = useState('');
  const [targetValue, setTargetValue] = useState('');
  const [rewardType, setRewardType] = useState<RewardType>('message');
  const [rewardContent, setRewardContent] = useState('');
  const [hideReward, setHideReward] = useState(true);
  const [expiresAt, setExpiresAt] = useState('');

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!partnerLink) {
      if (toast) {
        toast('Please connect with a partner first', 'error');
      }
      return;
    }

    if (!title.trim() || !targetMetric.trim() || !targetValue.trim()) {
      if (toast) {
        toast('Please fill in all required fields', 'error');
      }
      return;
    }

    createChallenge(
      {
        title,
        description,
        target_metric: targetMetric,
        target_value: parseFloat(targetValue),
        current_value: 0,
        reward_type: rewardType,
        reward_content: rewardContent,
        hide_reward_until_unlock: hideReward,
        expires_at: expiresAt || null,
        connection_id: partnerLink.id,
        partner_id: partnerLink.partner_id,
      },
      {
        onSuccess: () => {
          if (toast) {
            toast('Challenge created successfully! 🎯', 'success');
          }
          onClose();
          // Reset form
          setTitle('');
          setDescription('');
          setTargetMetric('');
          setTargetValue('');
          setRewardType('message');
          setRewardContent('');
          setHideReward(true);
          setExpiresAt('');
        },
        onError: (error) => {
          if (toast) {
            toast(`Failed to create challenge: ${error.message}`, 'error');
          }
        },
      }
    );
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const getRewardPlaceholder = () => {
    switch (rewardType) {
      case 'message':
        return 'Congratulations! I\'ll cook your favorite meal this weekend to celebrate!';
      case 'activity':
        return 'Weekend hiking trip to your favorite trail';
      case 'gift':
        return 'New running shoes from Nike';
      case 'surprise':
        return 'A special surprise awaits you!';
      default:
        return 'Enter reward details...';
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center lg:items-center"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={handleBackdropClick}
    >
      <div
        className="w-full lg:max-w-2xl bg-white lg:rounded-3xl rounded-t-3xl overflow-hidden"
        style={{
          maxHeight: '90vh',
          boxShadow: '0 -4px 24px rgba(0, 0, 0, 0.15)',
        }}
      >
        {/* Drag Handle (mobile) */}
        <div className="lg:hidden pt-2">
          <div
            className="w-9 h-1 rounded-full mx-auto"
            style={{ backgroundColor: colors.border.medium }}
          />
        </div>

        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-5 border-b"
          style={{ borderColor: colors.border.light }}
        >
          <h2
            className="text-2xl font-bold"
            style={{ color: colors.text.primary }}
          >
            Create Challenge
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" style={{ color: colors.text.tertiary }} />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="overflow-y-auto p-6 space-y-5"
          style={{ maxHeight: 'calc(90vh - 140px)' }}
        >
          {/* For */}
          <div>
            <label
              className="block text-sm font-semibold mb-2"
              style={{ color: colors.text.primary }}
            >
              For
            </label>
            <div
              className="px-4 py-3 rounded-xl"
              style={{
                backgroundColor: colors.bg.secondary,
                color: colors.text.primary,
              }}
            >
              {partnerLink?.partner_email || 'Connect with partner first'}
            </div>
          </div>

          {/* Challenge Title */}
          <div>
            <label
              className="block text-sm font-semibold mb-2"
              style={{ color: colors.text.primary }}
            >
              Challenge Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Master Your First Pull-Up!"
              className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none"
              style={{ borderColor: colors.border.medium }}
              required
            />
          </div>

          {/* Description */}
          <div>
            <label
              className="block text-sm font-semibold mb-2"
              style={{ color: colors.text.primary }}
            >
              Description (optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="You've been working so hard on this - I know you can do it!"
              className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none resize-none"
              style={{ borderColor: colors.border.medium }}
            />
          </div>

          {/* Target */}
          <div>
            <label
              className="block text-sm font-semibold mb-2"
              style={{ color: colors.text.primary }}
            >
              Target
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs mb-1 block" style={{ color: colors.text.secondary }}>
                  Metric
                </label>
                <input
                  type="text"
                  value={targetMetric}
                  onChange={(e) => setTargetMetric(e.target.value)}
                  placeholder="pull-ups"
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none"
                  style={{ borderColor: colors.border.medium }}
                  required
                />
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: colors.text.secondary }}>
                  Goal Value
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                  placeholder="1"
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none"
                  style={{ borderColor: colors.border.medium }}
                  required
                />
              </div>
            </div>
            <p className="text-xs mt-1" style={{ color: colors.text.tertiary }}>
              Example: "pushups" with goal "30" = Complete 30 pushups
            </p>
          </div>

          {/* Reward Type */}
          <div>
            <label
              className="block text-sm font-semibold mb-2"
              style={{ color: colors.text.primary }}
            >
              Reward Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label
                className="flex items-center gap-2 p-3 border rounded-xl cursor-pointer hover:bg-gray-50 transition-colors"
                style={{ borderColor: colors.border.medium }}
              >
                <input
                  type="radio"
                  name="reward-type"
                  value="message"
                  checked={rewardType === 'message'}
                  onChange={(e) => setRewardType(e.target.value as RewardType)}
                  className="w-4 h-4"
                  style={{ accentColor: '#D4A574' }}
                />
                <span className="text-sm font-medium" style={{ color: colors.text.primary }}>
                  💌 Message
                </span>
              </label>
              <label
                className="flex items-center gap-2 p-3 border rounded-xl cursor-pointer hover:bg-gray-50 transition-colors"
                style={{ borderColor: colors.border.medium }}
              >
                <input
                  type="radio"
                  name="reward-type"
                  value="activity"
                  checked={rewardType === 'activity'}
                  onChange={(e) => setRewardType(e.target.value as RewardType)}
                  className="w-4 h-4"
                  style={{ accentColor: '#D4A574' }}
                />
                <span className="text-sm font-medium" style={{ color: colors.text.primary }}>
                  🎯 Activity
                </span>
              </label>
              <label
                className="flex items-center gap-2 p-3 border rounded-xl cursor-pointer hover:bg-gray-50 transition-colors"
                style={{ borderColor: colors.border.medium }}
              >
                <input
                  type="radio"
                  name="reward-type"
                  value="gift"
                  checked={rewardType === 'gift'}
                  onChange={(e) => setRewardType(e.target.value as RewardType)}
                  className="w-4 h-4"
                  style={{ accentColor: '#D4A574' }}
                />
                <span className="text-sm font-medium" style={{ color: colors.text.primary }}>
                  🎁 Gift
                </span>
              </label>
              <label
                className="flex items-center gap-2 p-3 border rounded-xl cursor-pointer hover:bg-gray-50 transition-colors"
                style={{ borderColor: colors.border.medium }}
              >
                <input
                  type="radio"
                  name="reward-type"
                  value="surprise"
                  checked={rewardType === 'surprise'}
                  onChange={(e) => setRewardType(e.target.value as RewardType)}
                  className="w-4 h-4"
                  style={{ accentColor: '#D4A574' }}
                />
                <span className="text-sm font-medium" style={{ color: colors.text.primary }}>
                  ✨ Surprise
                </span>
              </label>
            </div>
          </div>

          {/* Reward Content */}
          <div>
            <label
              className="block text-sm font-semibold mb-2"
              style={{ color: colors.text.primary }}
            >
              Reward Description
            </label>
            <textarea
              rows={3}
              value={rewardContent}
              onChange={(e) => setRewardContent(e.target.value)}
              placeholder={getRewardPlaceholder()}
              className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none resize-none"
              style={{ borderColor: colors.border.medium }}
            />
          </div>

          {/* Hide Reward */}
          <label
            className="flex items-center gap-3 p-3 rounded-xl cursor-pointer"
            style={{ backgroundColor: colors.bg.secondary }}
          >
            <input
              type="checkbox"
              checked={hideReward}
              onChange={(e) => setHideReward(e.target.checked)}
              className="w-5 h-5 rounded"
              style={{ accentColor: '#D4A574' }}
            />
            <div>
              <span className="font-medium" style={{ color: colors.text.primary }}>
                Hide reward until unlocked
              </span>
              <p className="text-xs mt-0.5" style={{ color: colors.text.secondary }}>
                Show as "Mystery Reward 🎁" until challenge is completed
              </p>
            </div>
          </label>

          {/* Expiration */}
          <div>
            <label
              className="block text-sm font-semibold mb-2"
              style={{ color: colors.text.primary }}
            >
              Expiration (optional)
            </label>
            <input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none"
              style={{ borderColor: colors.border.medium }}
            />
            <p className="text-xs mt-1" style={{ color: colors.text.tertiary }}>
              Leave blank for no expiration
            </p>
          </div>
        </form>

        {/* Footer */}
        <div
          className="px-6 py-4 border-t flex gap-3"
          style={{ borderColor: colors.border.light }}
        >
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold transition-colors"
            style={{ color: colors.text.primary }}
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isPending}
            className="flex-1 px-4 py-3 rounded-xl font-semibold text-white transition-opacity disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)',
            }}
          >
            {isPending ? 'Creating...' : 'Create Challenge 🎯'}
          </button>
        </div>
      </div>
    </div>
  );
};
