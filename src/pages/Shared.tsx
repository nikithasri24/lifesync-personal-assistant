/**
 * Shared Page
 * Partner connections, invitations, and activity feed
 */

import React, { useMemo } from 'react';
import { Users, Plus } from 'lucide-react';
import { useThemeColors } from '@/hooks/useThemeColors';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { useSharedState } from '@/shared/hooks/useSharedState';
import {
  usePartnerConnections,
  usePartnerInvitations,
  useSharedActivity,
  useSharedStats,
} from '@/shared/hooks/useSharedQueries';
import {
  useAcceptInvitationMutation,
  useRejectInvitationMutation,
} from '@/hooks/useConnectionsQuery';
import { StatsGrid } from '@/shared/components/StatsGrid';
import { PartnerView, InvitesView, ActivityView } from '@/shared/components/views';

export const Shared: React.FC = () => {
  const colors = useThemeColors();
  const { activeTab, setActiveTab } = useSharedState();

  // Real data from React Query hooks
  const { data: connections = [], isLoading: connectionsLoading } = usePartnerConnections();
  const { data: invitations = [], isLoading: invitationsLoading } = usePartnerInvitations();
  const { data: activities = [], isLoading: activitiesLoading } = useSharedActivity();
  const stats = useSharedStats();

  // Mutations
  const acceptMutation = useAcceptInvitationMutation();
  const rejectMutation = useRejectInvitationMutation();

  // Get current user ID from first connection if available
  const currentUserId = connections[0]?.partner_id || 'current-user';

  // Count pending received invitations for badge
  const pendingInvitesCount = invitations.filter(
    (inv) => inv.direction === 'received' && inv.status === 'pending'
  ).length;

  const handleAcceptInvite = (id: string) => {
    acceptMutation.mutate({
      connectionId: id,
    });
  };

  const handleDeclineInvite = (id: string) => {
    rejectMutation.mutate(id);
  };

  const handleCancelInvite = (id: string) => {
    // Cancel is same as reject for sent invitations
    rejectMutation.mutate(id);
  };

  const handleInvitePartner = () => {
    // TODO: Open invite modal
    console.log('Invite partner clicked');
  };

  return (
    <div style={{ backgroundColor: colors.bg.primary, minHeight: '100vh' }} data-testid="shared-container">
      {/* Header */}
      <div className="sticky top-0 z-10" style={{ backgroundColor: colors.bg.primary }}>
        <div
          className="px-6 pt-4 pb-3"
          style={{
            background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)',
          }}
        >
          <div className="flex items-center gap-2 mb-2 text-white">
            <Users size={28} />
            <h1 className="text-3xl font-extrabold">Shared</h1>
          </div>
          <div className="text-sm opacity-90 text-white">
            Collaborate with family & friends
          </div>
        </div>

        {/* Stats Grid */}
        <div className="mt-0">
          <StatsGrid stats={stats} />
        </div>

        {/* Tab Navigation */}
        <div className="px-5">
          <SegmentedControl
            segments={[
              { value: 'partner', label: 'Partner' },
              {
                value: 'invites',
                label: 'Invites',
                badge: pendingInvitesCount > 0 ? pendingInvitesCount : undefined,
              },
              { value: 'activity', label: 'Activity' },
            ]}
            value={activeTab}
            onChange={(value) => setActiveTab(value as 'partner' | 'invites' | 'activity')}
          />
        </div>
      </div>

      {/* Tab Content */}
      <div className="pt-5">
        {activeTab === 'partner' && (
          <PartnerView connections={connections} isLoading={connectionsLoading} />
        )}

        {activeTab === 'invites' && (
          <InvitesView
            invitations={invitations}
            isLoading={invitationsLoading}
            onAccept={handleAcceptInvite}
            onDecline={handleDeclineInvite}
            onCancel={handleCancelInvite}
          />
        )}

        {activeTab === 'activity' && (
          <ActivityView
            activities={activities}
            isLoading={activitiesLoading}
            currentUserId={currentUserId}
          />
        )}
      </div>

      {/* FAB - Only show on empty states or invites tab */}
      {(connections.length === 0 || activeTab === 'invites') && (
        <button
          type="button"
          onClick={handleInvitePartner}
          className="fixed z-50 rounded-full flex items-center justify-center text-white shadow-lg hover:scale-105 active:scale-95 transition-transform"
          style={{
            bottom: '80px',
            right: '24px',
            width: '60px',
            height: '60px',
            background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)',
            boxShadow: '0 4px 16px rgba(193, 139, 94, 0.4)',
          }}
          aria-label="Invite partner"
        >
          <Plus className="w-8 h-8" strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
};

export default Shared;
