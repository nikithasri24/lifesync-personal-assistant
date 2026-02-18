/**
 * Milestones View Component
 * Shows upcoming and past milestones (birthdays, anniversaries, etc.)
 */

import React, { useState, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { useMilestones, useUpcomingMilestones } from '../hooks';
import { useMergedMilestonesConnection } from '../hooks/useTogetherMergedMode';
import { useCurrentUserId } from '@/hooks/useOwnerInfo';
import { OwnerFilter, type OwnerFilterValue } from '@/components/common/OwnerFilter';
import type { PartnerLink } from '../types';
import { MilestoneCard } from './MilestoneCard';
import { AddMilestoneModal } from './modals/AddMilestoneModal';
import { EditMilestoneModal } from './modals/EditMilestoneModal';
import { useModalState } from '@/hooks/useModalState';
import { useThemeColors } from '@/hooks/useThemeColors';

interface MilestonesViewProps {
  partnerLink: PartnerLink | null | undefined;
}

export const MilestonesView: React.FC<MilestonesViewProps> = ({ partnerLink }) => {
  const colors = useThemeColors();

  // Modal state management
  const modals = useModalState({
    addMilestone: false,
    editingMilestone: null as string | null,
  });

  // Owner filter state (for merged mode) - default to both selected
  const [ownerFilter, setOwnerFilter] = useState<OwnerFilterValue>(['mine', 'partner']);

  // Merged mode support
  const { data: mergedConnection } = useMergedMilestonesConnection();
  const { data: currentUserId } = useCurrentUserId();

  // Fetch milestones (API automatically handles merged mode)
  const { data: upcomingMilestones = [], isLoading: upcomingLoading } =
    useUpcomingMilestones();
  const { data: allMilestones = [], isLoading: allLoading } = useMilestones();

  // Get partner name for display
  const partnerName = mergedConnection?.partnerName ?? 'Partner';

  // Filter milestones by owner if in merged mode
  const filteredUpcomingMilestones = useMemo(() => {
    if (!mergedConnection || !currentUserId) {
      return upcomingMilestones;
    }

    // If both selected, show all
    const showMine = ownerFilter.includes('mine');
    const showPartner = ownerFilter.includes('partner');

    if (showMine && showPartner) {
      return upcomingMilestones;
    }
    if (showMine) {
      return upcomingMilestones.filter(m => m.user_id === currentUserId);
    }
    if (showPartner) {
      return upcomingMilestones.filter(m => m.user_id === mergedConnection.partnerId);
    }
    return upcomingMilestones;
  }, [upcomingMilestones, ownerFilter, currentUserId, mergedConnection]);

  const filteredAllMilestones = useMemo(() => {
    if (!mergedConnection || !currentUserId) {
      return allMilestones;
    }

    // If both selected, show all
    const showMine = ownerFilter.includes('mine');
    const showPartner = ownerFilter.includes('partner');

    if (showMine && showPartner) {
      return allMilestones;
    }
    if (showMine) {
      return allMilestones.filter(m => m.user_id === currentUserId);
    }
    if (showPartner) {
      return allMilestones.filter(m => m.user_id === mergedConnection.partnerId);
    }
    return allMilestones;
  }, [allMilestones, ownerFilter, currentUserId, mergedConnection]);

  // Split into upcoming and past
  const pastMilestones = filteredAllMilestones.filter((m) => {
    const date = new Date(m.milestone_date);
    return date < new Date() && !m.recurring;
  });

  const isLoading = upcomingLoading || allLoading;

  return (
    <div className="space-y-6">
      {/* Upcoming Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold" style={{ color: colors.text.primary }}>
            Upcoming
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
              onClick={() => modals.open('addMilestone')}
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
              style={{
                color: '#D4A574',
                backgroundColor: colors.bg.secondary,
              }}
              aria-label="Add milestone"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>
        </div>

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
                <div className="h-20 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : filteredUpcomingMilestones.length === 0 ? (
          <div
            className="p-8 rounded-xl border-2 border-dashed text-center"
            style={{ borderColor: colors.border.medium }}
          >
            <div className="text-4xl mb-3">📅</div>
            <p className="font-medium mb-2" style={{ color: colors.text.primary }}>
              No upcoming milestones
            </p>
            <p className="text-sm mb-4" style={{ color: colors.text.secondary }}>
              Add birthdays, anniversaries, and special dates
            </p>
            <button
              onClick={() => modals.open('addMilestone')}
              className="px-4 py-2 rounded-lg font-semibold transition-colors text-white"
              style={{
                background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)',
              }}
              aria-label="Add your first milestone"
            >
              Add Your First Milestone
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredUpcomingMilestones.map((milestone) => (
              <MilestoneCard
                key={milestone.id}
                milestone={milestone}
                onEdit={() => modals.set('editingMilestone', milestone.id)}
                showOwner={!!mergedConnection}
                currentUserId={currentUserId ?? undefined}
                partnerName={partnerName}
              />
            ))}
          </div>
        )}
      </div>

      {/* Past Milestones */}
      {pastMilestones.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-4" style={{ color: colors.text.primary }}>
            Past Milestones
          </h2>
          <div className="space-y-3">
            {pastMilestones.slice(0, 5).map((milestone) => (
              <MilestoneCard
                key={milestone.id}
                milestone={milestone}
                isPast
                onEdit={() => modals.set('editingMilestone', milestone.id)}
                showOwner={!!mergedConnection}
                currentUserId={currentUserId ?? undefined}
                partnerName={partnerName}
              />
            ))}
          </div>
        </div>
      )}

      {/* Add Milestone Modal */}
      {modals.state.addMilestone && (
        <AddMilestoneModal
          isOpen={modals.state.addMilestone}
          partnerLink={partnerLink}
          onClose={() => modals.close('addMilestone')}
        />
      )}

      {/* Edit Milestone Modal */}
      {modals.state.editingMilestone && (
        <EditMilestoneModal
          isOpen={!!modals.state.editingMilestone}
          milestone={filteredAllMilestones.find(m => m.id === modals.state.editingMilestone)!}
          onClose={() => modals.set('editingMilestone', null)}
        />
      )}
    </div>
  );
};
