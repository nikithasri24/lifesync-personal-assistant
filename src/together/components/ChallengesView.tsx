/**
 * Challenges View Component
 * Shows active challenges and completed rewards
 */

import React, { useState } from 'react';
import { useAchievementRewards } from '../hooks';
import type { PartnerLink, AchievementReward } from '../types';
import { ChallengeCard } from './ChallengeCard';
import { CreateChallengeModal } from './modals/CreateChallengeModal';
import { ChallengeDetailModal } from './modals/ChallengeDetailModal';
import { useThemeColors } from '@/hooks/useThemeColors';

interface ChallengesViewProps {
  partnerLink: PartnerLink | null | undefined;
}

export const ChallengesView: React.FC<ChallengesViewProps> = ({ partnerLink }) => {
  const colors = useThemeColors();

  const [createOpen, setCreateOpen] = useState(false);
  const [viewingChallenge, setViewingChallenge] = useState<AchievementReward | null>(null);

  const { data: challenges = [], isLoading } = useAchievementRewards(partnerLink?.id);

  const hasPartner = partnerLink?.status === 'accepted';

  if (!hasPartner) {
    return (
      <div
        className="p-8 rounded-xl border-2 border-dashed text-center"
        style={{ borderColor: colors.border.medium }}
      >
        <div className="text-4xl mb-3">💪</div>
        <p className="font-medium mb-2" style={{ color: colors.text.primary }}>
          Link with your partner to create challenges
        </p>
        <p className="text-sm" style={{ color: colors.text.secondary }}>
          Go to <a href="/shared" className="underline hover:opacity-80" style={{ color: '#D4A574' }}>Shared</a> to connect with your partner first
        </p>
      </div>
    );
  }

  // Categorize challenges
  const active = challenges.filter(c => c.status === 'active');
  const unlocked = challenges.filter(c => c.status === 'unlocked');
  const expired = challenges.filter(c => c.status === 'expired');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold" style={{ color: colors.text.primary }}>
          Create Challenge for Partner
        </h2>
        <button
          onClick={() => setCreateOpen(true)}
          className="px-4 py-2 rounded-lg font-semibold transition-colors text-white hover:opacity-90"
          style={{
            background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)',
          }}
        >
          Create
        </button>
      </div>

      <hr style={{ borderColor: colors.border.light }} />

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="p-5 rounded-xl border animate-pulse"
              style={{
                backgroundColor: colors.bg.white,
                borderColor: colors.border.light,
              }}
            >
              <div className="h-24 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      ) : challenges.length === 0 ? (
        <div
          className="p-8 rounded-xl border-2 border-dashed text-center"
          style={{ borderColor: colors.border.medium }}
        >
          <div className="text-4xl mb-3">🎯</div>
          <p className="font-medium mb-2" style={{ color: colors.text.primary }}>
            No challenges yet
          </p>
          <p className="text-sm mb-4" style={{ color: colors.text.secondary }}>
            Create habit-based challenges with unlockable rewards for your partner
          </p>
          <button
            onClick={() => setCreateOpen(true)}
            className="px-4 py-2 rounded-lg font-semibold transition-colors text-white"
            style={{
              background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)',
            }}
          >
            Create Your First Challenge
          </button>
        </div>
      ) : (
        <>
          {/* Active Challenges */}
          {active.length > 0 && (
            <div>
              <h3 className="text-lg font-bold mb-3" style={{ color: colors.text.primary }}>
                Active Challenges
              </h3>
              <div className="space-y-3">
                {active.map((challenge) => (
                  <ChallengeCard
                    key={challenge.id}
                    challenge={challenge}
                    onClick={() => setViewingChallenge(challenge)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Unlocked Rewards */}
          {unlocked.length > 0 && (
            <div>
              <h3 className="text-lg font-bold mb-3" style={{ color: colors.text.primary }}>
                Unlocked Rewards
              </h3>
              <div className="space-y-3">
                {unlocked.map((challenge) => (
                  <ChallengeCard
                    key={challenge.id}
                    challenge={challenge}
                    onClick={() => setViewingChallenge(challenge)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Expired Challenges */}
          {expired.length > 0 && (
            <div>
              <h3 className="text-lg font-bold mb-3" style={{ color: colors.text.primary }}>
                Expired Challenges
              </h3>
              <div className="space-y-3">
                {expired.map((challenge) => (
                  <ChallengeCard
                    key={challenge.id}
                    challenge={challenge}
                    onClick={() => setViewingChallenge(challenge)}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Create Modal */}
      {createOpen && (
        <CreateChallengeModal
          isOpen={createOpen}
          partnerLink={partnerLink}
          onClose={() => setCreateOpen(false)}
        />
      )}

      {/* Challenge Detail/Edit Modal */}
      {viewingChallenge && (
        <ChallengeDetailModal
          isOpen={!!viewingChallenge}
          challenge={viewingChallenge}
          onClose={() => setViewingChallenge(null)}
        />
      )}
    </div>
  );
};
