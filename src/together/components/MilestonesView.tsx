/**
 * Milestones View Component
 * Shows upcoming and past milestones (birthdays, anniversaries, etc.)
 */

import React from 'react';
import { Plus } from 'lucide-react';
import { useMilestones, useUpcomingMilestones } from '../hooks';
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

  // Fetch milestones
  const { data: upcomingMilestones = [], isLoading: upcomingLoading } =
    useUpcomingMilestones();
  const { data: allMilestones = [], isLoading: allLoading } = useMilestones();

  // Split into upcoming and past
  const pastMilestones = allMilestones.filter((m) => {
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
          <button
            onClick={() => modals.open('addMilestone')}
            className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
            style={{
              color: '#D4A574',
              backgroundColor: colors.bg.secondary,
            }}
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
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
        ) : upcomingMilestones.length === 0 ? (
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
            >
              Add Your First Milestone
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingMilestones.map((milestone) => (
              <MilestoneCard
                key={milestone.id}
                milestone={milestone}
                onEdit={() => modals.set('editingMilestone', milestone.id)}
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
          milestone={allMilestones.find(m => m.id === modals.state.editingMilestone)!}
          onClose={() => modals.set('editingMilestone', null)}
        />
      )}
    </div>
  );
};
