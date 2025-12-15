import React from 'react';
import { Users, Bell, Settings } from 'lucide-react';

interface ConnectionsStatsGridProps {
  activeConnectionsCount: number;
  pendingReceivedCount: number;
  sentInvitationsCount: number;
}

/**
 * Stats grid for connections page
 */
export function ConnectionsStatsGrid({
  activeConnectionsCount,
  pendingReceivedCount,
  sentInvitationsCount,
}: ConnectionsStatsGridProps): React.ReactElement {
  return (
    <section className="grid gap-4 sm:grid-cols-3">
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <Users className="h-4 w-4 text-indigo-600" />
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Active Connections
          </p>
        </div>
        <p className="text-2xl font-semibold text-slate-900">{activeConnectionsCount}</p>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <Bell className="h-4 w-4 text-orange-600" />
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Pending Received
          </p>
        </div>
        <p className="text-2xl font-semibold text-slate-900">{pendingReceivedCount}</p>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <Settings className="h-4 w-4 text-blue-600" />
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Sent Invitations
          </p>
        </div>
        <p className="text-2xl font-semibold text-slate-900">{sentInvitationsCount}</p>
      </div>
    </section>
  );
}
