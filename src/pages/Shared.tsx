/**
 * Shared Page - Profile Connections & Collaboration
 * Manage connections with other users and control sharing permissions
 */

import React, { useState } from 'react';
import { LayoutDashboard, Users, Mail, UserPlus } from 'lucide-react';
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
import { SharedDashboard } from '../shared/components/SharedDashboard';
import { SharedLoadingState } from '../shared/components/layout/SharedLoadingState';
import { SharedHeader } from '../shared/components/layout/SharedHeader';
import { ConnectionsStatsGrid } from '../shared/components/layout/ConnectionsStatsGrid';

type TabView = 'dashboard' | 'connections' | 'invitations' | 'add';

const Shared: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabView>('dashboard');

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

  const handleInvitationAccepted = (connectionId: string): void => {
    acceptInvitation({ connectionId });
    setActiveTab('connections');
  };

  const handleInvitationRejected = (connectionId: string): void => {
    rejectInvitation(connectionId);
  };

  const handleConnectionDeleted = (connectionId: string): void => {
    deleteConnection(connectionId);
  };

  if (loading) {
    return <SharedLoadingState />;
  }

  const tabs: { key: TabView; label: string; icon: React.ReactNode; count?: number }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { key: 'connections', label: 'Connections', icon: <Users className="w-4 h-4" />, count: connections.length },
    { key: 'invitations', label: 'Invitations', icon: <Mail className="w-4 h-4" />, count: receivedInvitations.length + sentInvitations.length },
    { key: 'add', label: 'Add', icon: <UserPlus className="w-4 h-4" /> },
  ];

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 p-6">
      <SharedHeader onAddConnectionClick={() => setActiveTab('add')} />

      <ConnectionsStatsGrid
        activeConnectionsCount={connections.length}
        pendingReceivedCount={receivedInvitations.length}
        sentInvitationsCount={sentInvitations.length}
      />

      {/* Custom Tabs with Dashboard */}
      <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
            {tab.count !== undefined && tab.count > 0 && (
              <span className="text-xs px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 rounded-full">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <section>
        {activeTab === 'dashboard' && (
          <SharedDashboard connections={connections} />
        )}

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
