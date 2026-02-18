/**
 * Challenges View Component
 * Shows active challenges and completed rewards
 */

import React, { useState, useMemo } from 'react';
import { useAchievementRewards } from '../hooks';
import { useMergedChallengesConnection } from '../hooks/useTogetherMergedMode';
import { useCurrentUserId } from '@/hooks/useOwnerInfo';
import { OwnerFilter, type OwnerFilterValue } from '@/components/common/OwnerFilter';
import type { PartnerLink, AchievementReward } from '../types';
import { ChallengeCard } from './ChallengeCard';
import { CreateChallengeModal } from './modals/CreateChallengeModal';
import { ChallengeDetailModal } from './modals/ChallengeDetailModal';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useModalState } from '@/hooks/useModalState';

interface ChallengesViewProps {
  partnerLink: PartnerLink | null | undefined;
}

export const ChallengesView: React.FC<ChallengesViewProps> = ({ partnerLink }) => {
  const colors = useThemeColors();

  // Owner filter state (for merged mode) - default to both selected
  const [ownerFilter, setOwnerFilter] = useState<OwnerFilterValue>(['mine', 'partner']);

  // Merged mode support
  const { data: mergedConnection } = useMergedChallengesConnection();
  const { data: currentUserId } = useCurrentUserId();

  // Modal state management
  const modals = useModalState({
    create: false,
    viewingChallenge: null as AchievementReward | null,
  });

  const { data: allChallenges = [], isLoading } = useAchievementRewards(partnerLink?.id);

  // Get partner name for display
  const partnerName = mergedConnection?.partnerName ?? 'Partner';

  // Filter challenges by creator if in merged mode
  const challenges = useMemo(() => {
    if (!mergedConnection || !currentUserId) {
      return allChallenges;
    }

    // If both selected, show all
    const showMine = ownerFilter.includes('mine');
    const showPartner = ownerFilter.includes('partner');

    if (showMine && showPartner) {
      return allChallenges;
    }
    if (showMine) {
      return allChallenges.filter(c => c.creator_id === currentUserId);
    }
    if (showPartner) {
      return allChallenges.filter(c => c.creator_id === mergedConnection.partnerId);
    }
    return allChallenges;
  }, [allChallenges, ownerFilter, currentUserId, mergedConnection]);

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
  const completed = challenges.filter(c => c.status === 'completed');
  const expired = challenges.filter(c => c.status === 'expired');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold" style={{ color: colors.text.primary }}>
          Create Challenge for Partner
        </h2>
        <div className="flex items-center gap-3">
          {/* Owner filter (only show in merged mode) */}
          {mergedConnection && (
            <OwnerFilter
              value={ownerFilter}
              onChange={setOwnerFilter}
              partnerName={partnerName}
            />
          )}
          <button
            onClick={() => modals.open('create')}
            className="px-4 py-2 rounded-lg font-semibold transition-colors text-white hover:opacity-90"
            style={{
              background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)',
            }}
            aria-label="Create challenge"
          >
            Create
          </button>
        </div>
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
            onClick={() => modals.open('create')}
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
                    onClick={() => modals.set('viewingChallenge', challenge)}
                    showOwner={!!mergedConnection}
                    currentUserId={currentUserId ?? undefined}
                    partnerName={partnerName}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Completed Challenges */}
          {completed.length > 0 && (
            <div>
              <h3 className="text-lg font-bold mb-3" style={{ color: colors.text.primary }}>
                Completed Challenges
              </h3>
              <div className="space-y-3">
                {completed.map((challenge) => (
                  <ChallengeCard
                    key={challenge.id}
                    challenge={challenge}
                    onClick={() => modals.set('viewingChallenge', challenge)}
                    showOwner={!!mergedConnection}
                    currentUserId={currentUserId ?? undefined}
                    partnerName={partnerName}
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
                    onClick={() => modals.set('viewingChallenge', challenge)}
                    showOwner={!!mergedConnection}
                    currentUserId={currentUserId ?? undefined}
                    partnerName={partnerName}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Create Modal */}
      {modals.state.create && (
        <CreateChallengeModal
          isOpen={modals.state.create}
          partnerLink={partnerLink}
          onClose={() => modals.close('create')}
        />
      )}

      {/* Challenge Detail/Edit Modal */}
      {modals.state.viewingChallenge && (
        <ChallengeDetailModal
          isOpen={!!modals.state.viewingChallenge}
          challenge={modals.state.viewingChallenge}
          onClose={() => modals.set('viewingChallenge', null)}
        />
      )}
    </div>
  );
};
