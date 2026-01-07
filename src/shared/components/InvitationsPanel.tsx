import React from 'react';
import type { PendingInvitation } from '../types/connections';

interface InvitationsPanelProps {
  sentInvitations: PendingInvitation[];
  receivedInvitations: PendingInvitation[];
  onInvitationAccepted?: (connectionId: string) => void;
  onInvitationRejected?: (connectionId: string) => void;
}

export function InvitationsPanel({
  sentInvitations,
  receivedInvitations,
  onInvitationAccepted,
  onInvitationRejected
}: InvitationsPanelProps): React.ReactElement {
  const hasInvitations = sentInvitations.length > 0 || receivedInvitations.length > 0;

  return (
    <div className="space-y-6">
      {!hasInvitations && (
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
          No invitations yet.
        </div>
      )}

      {receivedInvitations.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-600">Received</h3>
          {receivedInvitations.map((inv) => (
            <div
              key={inv.invitation.id}
              className="rounded-lg border border-slate-200 bg-white p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium text-slate-900">
                    {inv.fromUser.fullName || inv.fromUser.email}
                  </p>
                  <p className="text-xs text-slate-500">{inv.fromUser.email}</p>
                  <p className="mt-2 text-sm text-slate-600">
                    Relationship: {inv.connection.relationship}
                  </p>
                  {inv.invitation.message && (
                    <p className="mt-2 text-sm text-slate-500 italic">
                      “{inv.invitation.message}”
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => onInvitationAccepted?.(inv.connection.id)}
                    className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => onInvitationRejected?.(inv.connection.id)}
                    className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                  >
                    Decline
                  </button>
                </div>
              </div>
            </div>
          ))}
        </section>
      )}

      {sentInvitations.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-600">Sent</h3>
          {sentInvitations.map((inv) => (
            <div
              key={inv.invitation.id}
              className="rounded-lg border border-slate-200 bg-white p-4"
            >
              <p className="font-medium text-slate-900">
                {inv.connection.connectedUserName || inv.connection.connectedUserEmail}
              </p>
              <p className="text-xs text-slate-500">
                {inv.connection.connectedUserEmail}
              </p>
              <p className="mt-2 text-sm text-slate-600">
                Relationship: {inv.connection.relationship}
              </p>
              <p className="mt-2 text-xs text-slate-400">Pending acceptance</p>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}

export default InvitationsPanel;
