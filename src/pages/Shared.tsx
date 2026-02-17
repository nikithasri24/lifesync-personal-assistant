/**
 * Shared Page
 * Partner connections, invitations, and activity feed
 */

import React, { useMemo } from 'react';
import { Users, Plus } from 'lucide-react';
import { useThemeColors } from '@/hooks/useThemeColors';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { useSharedState } from '@/shared/hooks/useSharedState';
import { StatsGrid } from '@/shared/components/StatsGrid';
import { PartnerView, InvitesView, ActivityView } from '@/shared/components/views';
import type { PartnerConnection, Invitation, ActivityItem, SharedStats } from '@/shared/types';

// Mock data for now - will be replaced with React Query hooks
const MOCK_CONNECTIONS: PartnerConnection[] = [
  {
    id: '1',
    partner_id: 'partner-123',
    partner_name: 'Sarah Johnson',
    partner_email: 'sarah@example.com',
    relationship: 'spouse',
    permissions: [
      { module: 'meals', permission: 'merged' },
      { module: 'shopping', permission: 'merged' },
      { module: 'finances', permission: 'merged' },
      { module: 'travel', permission: 'merged' },
      { module: 'goals', permission: 'merged' },
      { module: 'habits', permission: 'view' },
    ],
    connected_at: new Date().toISOString(),
    status: 'active',
  },
];

const MOCK_INVITATIONS: Invitation[] = [];

const MOCK_ACTIVITIES: ActivityItem[] = [
  {
    id: '1',
    user_id: 'partner-123',
    user_name: 'Sarah',
    module: 'meals',
    action: 'Added Pasta Carbonara to meal plan',
    item_type: 'recipe',
    item_id: 'recipe-1',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: '2',
    user_id: 'current-user',
    user_name: 'You',
    module: 'tasks',
    action: 'Completed task: Buy groceries',
    item_type: 'task',
    item_id: 'task-1',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: '3',
    user_id: 'partner-123',
    user_name: 'Sarah',
    module: 'shopping',
    action: 'Added Milk to shopping list',
    item_type: 'shopping_item',
    item_id: 'item-1',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
  },
];

export const Shared: React.FC = () => {
  const colors = useThemeColors();
  const { activeTab, setActiveTab } = useSharedState();

  // Mock current user ID
  const currentUserId = 'current-user';

  // Calculate stats
  const stats: SharedStats = useMemo(() => {
    const partnerCount = MOCK_CONNECTIONS.length;
    const sharedModulesCount = MOCK_CONNECTIONS.reduce(
      (acc, conn) => acc + conn.permissions.filter((p) => p.permission !== 'off').length,
      0
    );
    const sharedItemsCount = 12; // Mock count

    return {
      partner_count: partnerCount,
      shared_modules_count: sharedModulesCount,
      shared_items_count: sharedItemsCount,
    };
  }, []);

  // Count pending received invitations for badge
  const pendingInvitesCount = MOCK_INVITATIONS.filter(
    (inv) => inv.direction === 'received' && inv.status === 'pending'
  ).length;

  const handleAcceptInvite = (id: string) => {
    console.log('Accept invite:', id);
    // TODO: Implement with mutation
  };

  const handleDeclineInvite = (id: string) => {
    console.log('Decline invite:', id);
    // TODO: Implement with mutation
  };

  const handleCancelInvite = (id: string) => {
    console.log('Cancel invite:', id);
    // TODO: Implement with mutation
  };

  const handleInvitePartner = () => {
    console.log('Invite partner clicked');
    // TODO: Open invite modal
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
          <PartnerView connections={MOCK_CONNECTIONS} isLoading={false} />
        )}

        {activeTab === 'invites' && (
          <InvitesView
            invitations={MOCK_INVITATIONS}
            isLoading={false}
            onAccept={handleAcceptInvite}
            onDecline={handleDeclineInvite}
            onCancel={handleCancelInvite}
          />
        )}

        {activeTab === 'activity' && (
          <ActivityView
            activities={MOCK_ACTIVITIES}
            isLoading={false}
            currentUserId={currentUserId}
          />
        )}
      </div>

      {/* FAB - Only show on empty states or invites tab */}
      {(MOCK_CONNECTIONS.length === 0 || activeTab === 'invites') && (
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
