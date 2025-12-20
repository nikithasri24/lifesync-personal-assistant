/**
 * Shared Page - Profile Connections & Collaboration
 * Manage connections with other users and control sharing permissions
 */

import React, { useState } from 'react';
import {
  useConnectionsQuery,
  useInvitationsQuery,
  useAcceptInvitationMutation,
  useRejectInvitationMutation,
  useDeleteConnectionMutation,
} from '@/hooks/useConnectionsQuery';
import { ConnectionsList } from '../shared/components/ConnectionsList';
import NewConnectionForm from '../shared/components/NewConnectionForm';
import { InvitationsPanel } from '../shared/components/InvitationsPanel';
import { SharedLoadingState } from '../shared/components/layout/SharedLoadingState';
import { SharedHeader } from '../shared/components/layout/SharedHeader';
import { ConnectionsStatsGrid } from '../shared/components/layout/ConnectionsStatsGrid';
import { ConnectionsTabs } from '../shared/components/layout/ConnectionsTabs';

type TabView = 'connections' | 'invitations' | 'add';

const Shared: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabView>('connections');

  // React Query hooks
  const { data: connections = [], isLoading: connectionsLoading } = useConnectionsQuery();
  const { data: invitations, isLoading: invitationsLoading } = useInvitationsQuery();
  const { mutate: acceptInvitation } = useAcceptInvitationMutation();
  const { mutate: rejectInvitation } = useRejectInvitationMutation();
  const { mutate: deleteConnection } = useDeleteConnectionMutation();

  const loading = connectionsLoading || invitationsLoading;
  const sentInvitations = invitations?.sent ?? [];
  const receivedInvitations = invitations?.received ?? [];

  const handleConnectionCreated = (): void => {
    setActiveTab('invitations');
    // React Query auto-refetches invitations
  };

  const handleInvitationAccepted = (): void => {
    // NOTE: Once InvitationsPanel is implemented, it should pass invitationId
    // and call: acceptInvitation(invitationId);
    setActiveTab('connections');
  };

  const handleInvitationRejected = (): void => {
    // NOTE: Once InvitationsPanel is implemented, it should pass invitationId
    // and call: rejectInvitation(invitationId);
  };

  const handleConnectionDeleted = (): void => {
    // NOTE: Once ConnectionsList is implemented, it should pass connectionId
    // and call: deleteConnection(connectionId);
  };

  if (loading) {
    return <SharedLoadingState />;
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 p-6">
      <SharedHeader onAddConnectionClick={() => setActiveTab('add')} />

      <ConnectionsStatsGrid
        activeConnectionsCount={connections.length}
        pendingReceivedCount={receivedInvitations.length}
        sentInvitationsCount={sentInvitations.length}
      />

      <ConnectionsTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        connectionsCount={connections.length}
        invitationsCount={receivedInvitations.length + sentInvitations.length}
      />

      {/* Content */}
      <section>
        {activeTab === 'connections' && (
          <ConnectionsList
            connections={connections}
            onConnectionDeleted={handleConnectionDeleted}
          />
        )}

        {activeTab === 'invitations' && (
          <InvitationsPanel
            sentInvitations={sentInvitations}
            receivedInvitations={receivedInvitations}
            onInvitationAccepted={handleInvitationAccepted}
            onInvitationRejected={handleInvitationRejected}
          />
        )}

        {activeTab === 'add' && (
          <NewConnectionForm onConnectionCreated={handleConnectionCreated} />
        )}
      </section>
    </div>
  );
};

export default Shared;
