/**
 * Create Challenge Modal - MIGRATED to use FormModalV2
 * Link achievements to rewards for your partner
 *
 * MIGRATION COMPLETE:
 * - Reduced from 436 lines to ~310 lines (29% reduction)
 * - Removed all boilerplate (ESC key, backdrop, auto-save, modal structure)
 * - Form state managed by FormModalV2
 */

import React from 'react';
import { useCreateAchievementReward } from '../../hooks/useAchievementRewardsQuery';
import type { PartnerLink, RewardType } from '../../types';
import { useToast } from '@/hooks/useToast';
import { validateChallenge } from '../../utils/validation';
import { FormModalV2 } from '@/components/v2';

interface CreateChallengeModalProps {
  isOpen: boolean;
  partnerLink: PartnerLink | null;
  onClose: () => void;
}

interface ChallengeFormData {
  title: string;
  description: string;
  targetMetric: string;
  targetValue: string;
  rewardType: RewardType;
  rewardContent: string;
  hideReward: boolean;
  expiresAt: string;
}

export const CreateChallengeModal: React.FC<CreateChallengeModalProps> = ({
  isOpen,
  partnerLink,
  onClose,
}) => {
  const { showToast } = useToast();
  const { mutate: createChallenge, isPending } = useCreateAchievementReward();

  // Default form data
  const defaultFormData: ChallengeFormData = {
    title: '',
    description: '',
    targetMetric: '',
    targetValue: '',
    rewardType: 'message',
    rewardContent: '',
    hideReward: true,
    expiresAt: '',
  };

  const getRewardPlaceholder = (rewardType: RewardType) => {
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
    <FormModalV2<ChallengeFormData>
      isOpen={isOpen}
      onClose={onClose}
      title="Create Challenge"
      defaultData={defaultFormData}
      draftKey="together_create_challenge_draft"
      isPending={isPending}
      submitText="Create Challenge 🎯"
      onSubmit={async (formData) => {
        if (!partnerLink) {
          showToast?.('Please connect with a partner first', 'error');
          throw new Error('No partner connection');
        }

        const parsedTargetValue = parseFloat(formData.targetValue);
        const challengeDescription = formData.description.trim() || `Complete ${formData.targetValue} ${formData.targetMetric}`;

        // Validate form data
        const validation = validateChallenge({
          title: formData.title,
          target_value: parsedTargetValue,
          reward_description: formData.rewardContent,
          expiration_date: formData.expiresAt || undefined,
        });

        if (!validation.valid) {
          const errorMessage = Object.values(validation.errors)[0] || 'Please check your input';
          showToast?.(errorMessage, 'error');
          throw new Error(errorMessage);
        }

        return new Promise<void>((resolve, reject) => {
          createChallenge(
            {
              title: formData.title.trim(),
              description: challengeDescription,
              linked_type: 'habit' as const,
              linked_id: partnerLink.id,
              target_type: 'count' as const,
              target_value: parsedTargetValue,
              reward_type: formData.rewardType,
              reward_description: formData.rewardContent.trim(),
              reward_message_id: null,
              hide_reward: formData.hideReward,
              expiration_date: formData.expiresAt || null,
              connection_id: partnerLink.id,
              recipient_id: partnerLink.partner_id,
            },
            {
              onSuccess: () => {
                showToast?.('Challenge created successfully! 🎯', 'success');
                resolve();
              },
              onError: (error) => {
                showToast?.(`Failed to create challenge: ${error.message}`, 'error');
                reject(error);
              },
            }
          );
        });
      }}
      validate={(formData) => {
        if (!formData.title.trim()) return 'Challenge title is required';
        if (!formData.targetMetric.trim()) return 'Target metric is required';
        if (!formData.targetValue || parseFloat(formData.targetValue) <= 0) {
          return 'Target value must be greater than 0';
        }
        return null;
      }}
    >
      {(formState, setFormState) => (
        <>
          {/* For */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">
              For
            </label>
            <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-900">
              {partnerLink?.partner_email || 'Connect with partner first'}
            </div>
          </div>

          {/* Challenge Title */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">
              Challenge Title
            </label>
            <input
              type="text"
              value={formState.title}
              onChange={(e) => setFormState({ ...formState, title: e.target.value })}
              placeholder="Master Your First Pull-Up!"
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
              value={formState.description}
              onChange={(e) => setFormState({ ...formState, description: e.target.value })}
              placeholder="You've been working so hard on this - I know you can do it!"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none resize-none transition-all"
            />
          </div>

          {/* Target */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">
              Target
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs mb-1 block text-gray-600">
                  Metric
                </label>
                <input
                  type="text"
                  value={formState.targetMetric}
                  onChange={(e) => setFormState({ ...formState, targetMetric: e.target.value })}
                  placeholder="pull-ups"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
                  required
                />
              </div>
              <div>
                <label className="text-xs mb-1 block text-gray-600">
                  Goal Value
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formState.targetValue}
                  onChange={(e) => setFormState({ ...formState, targetValue: e.target.value })}
                  placeholder="1"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
                  required
                />
              </div>
            </div>
            <p className="text-xs mt-1 text-gray-500">
              Example: "pushups" with goal "30" = Complete 30 pushups
            </p>
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
                  checked={formState.rewardType === 'message'}
                  onChange={(e) => setFormState({ ...formState, rewardType: e.target.value as RewardType })}
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
                  checked={formState.rewardType === 'activity'}
                  onChange={(e) => setFormState({ ...formState, rewardType: e.target.value as RewardType })}
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
                  checked={formState.rewardType === 'gift'}
                  onChange={(e) => setFormState({ ...formState, rewardType: e.target.value as RewardType })}
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
                  checked={formState.rewardType === 'surprise'}
                  onChange={(e) => setFormState({ ...formState, rewardType: e.target.value as RewardType })}
                  className="w-4 h-4 text-terracotta-400 focus:ring-terracotta-300"
                />
                <span className="text-sm font-medium text-gray-900">
                  ✨ Surprise
                </span>
              </label>
            </div>
          </div>

          {/* Reward Content */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">
              Reward Description
            </label>
            <textarea
              rows={3}
              value={formState.rewardContent}
              onChange={(e) => setFormState({ ...formState, rewardContent: e.target.value })}
              placeholder={getRewardPlaceholder(formState.rewardType)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none resize-none transition-all"
            />
          </div>

          {/* Hide Reward */}
          <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer">
            <input
              type="checkbox"
              checked={formState.hideReward}
              onChange={(e) => setFormState({ ...formState, hideReward: e.target.checked })}
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
              value={formState.expiresAt}
              onChange={(e) => setFormState({ ...formState, expiresAt: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
            />
            <p className="text-xs mt-1 text-gray-500">
              Leave blank for no expiration
            </p>
          </div>
        </>
      )}
    </FormModalV2>
  );
};
