/**
 * Shared Page - Profile Connections & Collaboration
 * Manage connections with other users and control sharing permissions
 */

import React, { useState, useEffect } from 'react';
import { Users, Plus, UserPlus, Bell, Settings } from 'lucide-react';
import {
  getUserConnections,
  getPendingInvitations,
} from '../shared/api/connectionsAPI';
import type { ConnectionWithUser, PendingInvitation } from '../shared/types/connections';
import ConnectionsList from '../shared/components/ConnectionsList';
import NewConnectionForm from '../shared/components/NewConnectionForm';
import InvitationsPanel from '../shared/components/InvitationsPanel';
import { logger } from '../services/logger';

type TabView = 'connections' | 'invitations' | 'add';

const Shared: React.FC = () => {
  const [connections, setConnections] = useState<ConnectionWithUser[]>([]);
  const [sentInvitations, setSentInvitations] = useState<PendingInvitation[]>([]);
  const [receivedInvitations, setReceivedInvitations] = useState<PendingInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabView>('connections');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [connectionsData, invitationsData] = await Promise.all([
        getUserConnections(),
        getPendingInvitations(),
      ]);
      setConnections(connectionsData);
      setSentInvitations(invitationsData.sent);
      setReceivedInvitations(invitationsData.received);
    } catch (error) {
      logger.error('Error loading connections:', { error });
    } finally {
      setLoading(false);
    }
  };

  const handleConnectionCreated = () => {
    loadData();
    setActiveTab('invitations');
  };

  const handleInvitationAccepted = () => {
    loadData();
    setActiveTab('connections');
  };

  const handleInvitationRejected = () => {
    loadData();
  };

  const handleConnectionDeleted = () => {
    loadData();
  };

  if (loading) {
    return (
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-center gap-4 p-6 min-h-[400px]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
        <p className="text-sm text-slate-600">Loading connections...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 p-6">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 flex items-center gap-2">
            <Users className="h-6 w-6 text-indigo-600" />
            Connections & Sharing
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Connect with others and share your data with granular permissions
          </p>
        </div>
        <button
          type="button"
          onClick={() => setActiveTab('add')}
          className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
        >
          <UserPlus className="h-4 w-4" />
          Add Connection
        </button>
      </header>

      {/* Stats */}
      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-indigo-600" />
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Active Connections
            </p>
          </div>
          <p className="text-2xl font-semibold text-slate-900">{connections.length}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Bell className="h-4 w-4 text-orange-600" />
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Pending Received
            </p>
          </div>
          <p className="text-2xl font-semibold text-slate-900">{receivedInvitations.length}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Settings className="h-4 w-4 text-blue-600" />
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Sent Invitations
            </p>
          </div>
          <p className="text-2xl font-semibold text-slate-900">{sentInvitations.length}</p>
        </div>
      </section>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('connections')}
          className={`px-4 py-2 text-sm font-medium transition border-b-2 ${
            activeTab === 'connections'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          Connections ({connections.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('invitations')}
          className={`px-4 py-2 text-sm font-medium transition border-b-2 relative ${
            activeTab === 'invitations'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          Invitations
          {(receivedInvitations.length > 0 || sentInvitations.length > 0) && (
            <span className="absolute -top-1 -right-1 h-4 w-4 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center">
              {receivedInvitations.length + sentInvitations.length}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('add')}
          className={`px-4 py-2 text-sm font-medium transition border-b-2 ${
            activeTab === 'add'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          Add New
        </button>
      </div>

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
