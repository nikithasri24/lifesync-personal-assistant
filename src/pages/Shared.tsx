/**
 * Shared Page
 * Partner connections, invitations, and activity feed
 */

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
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
import { InvitePartnerModalV2 } from '@/shared/components/v2';

export const Shared: React.FC = () => {
  const colors = useThemeColors();
  const { activeTab, setActiveTab } = useSharedState();
  const [showInviteModal, setShowInviteModal] = useState(false);

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
    setShowInviteModal(true);
  };

  return (
    <div style={{ backgroundColor: colors.bg.primary, minHeight: '100vh' }} data-testid="shared-container">
      <div style={{ maxWidth: '900px', margin: '0 auto', paddingBottom: '5rem' }}>
        {/* Header with Gradient */}
        <div
          className="px-5 py-6 mb-4"
          style={{
            background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)',
            color: 'white',
          }}
        >
          <h1 className="text-3xl font-bold mb-2">👥 Shared</h1>
          <p className="text-sm opacity-90">Collaborate with family & friends</p>
        </div>

        {/* Stats Grid */}
        <div className="px-0">
          <StatsGrid stats={stats} />
        </div>

        {/* Tab Navigation */}
        <div className="px-5 mb-4">
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

        {/* Tab Content */}
        <div>
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

      {/* Invite Partner Modal */}
      <InvitePartnerModalV2 isOpen={showInviteModal} onClose={() => setShowInviteModal(false)} />
    </div>
  );
};

export default Shared;
