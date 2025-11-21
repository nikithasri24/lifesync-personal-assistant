/**
 * Invitations Panel Component
 * Shows sent and received connection invitations
 */

import React, { useState } from 'react';
import { Check, X, Send, Inbox } from 'lucide-react';
import { acceptConnection, rejectConnection } from '../api/connectionsAPI';
import type { PendingInvitation } from '../types/connections';
import { RELATIONSHIP_INFO } from '../types/connections';
import { logger } from '../../services/logger';

interface InvitationsPanelProps {
  sentInvitations: PendingInvitation[];
  receivedInvitations: PendingInvitation[];
  onInvitationAccepted: () => void;
  onInvitationRejected: () => void;
}

const InvitationsPanel: React.FC<InvitationsPanelProps> = ({
  sentInvitations,
  receivedInvitations,
  onInvitationAccepted,
  onInvitationRejected,
}) => {
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleAccept = async (connectionId: string) => {
    try {
      setProcessingId(connectionId);
      await acceptConnection({ connectionId });
      onInvitationAccepted();
    } catch (error) {
      logger.error('Error accepting invitation:', { error });
      alert('Failed to accept invitation');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (connectionId: string) => {
    if (!confirm('Are you sure you want to reject this invitation?')) return;

    try {
      setProcessingId(connectionId);
      await rejectConnection(connectionId);
      onInvitationRejected();
    } catch (error) {
      logger.error('Error rejecting invitation:', { error });
      alert('Failed to reject invitation');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Received Invitations */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Inbox className="h-5 w-5 text-orange-600" />
          <h3 className="text-lg font-semibold text-slate-900">
            Received Invitations ({receivedInvitations.length})
          </h3>
        </div>

        {receivedInvitations.length === 0 ? (
          <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-sm">No pending invitations</p>
          </div>
        ) : (
          <div className="space-y-3">
            {receivedInvitations.map((inv) => {
              const relationshipInfo = RELATIONSHIP_INFO[inv.connection.relationship];
              const isProcessing = processingId === inv.connection.id;

              return (
                <div
                  key={inv.connection.id}
                  className="bg-white border border-orange-200 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-slate-900">
                          {inv.fromUser.fullName || inv.fromUser.email}
                        </h4>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium bg-${relationshipInfo.color}-100 text-${relationshipInfo.color}-700`}>
                          {relationshipInfo.label}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600">{inv.fromUser.email}</p>
                      {inv.invitation.message && (
                        <p className="text-sm text-slate-700 mt-2 p-2 bg-slate-50 rounded border border-slate-200 italic">
                          "{inv.invitation.message}"
                        </p>
                      )}
                      <p className="text-xs text-slate-500 mt-2">
                        Sent {new Date(inv.invitation.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAccept(inv.connection.id)}
                        disabled={isProcessing}
                        className="p-2 rounded-lg bg-green-50 hover:bg-green-100 transition-colors disabled:opacity-50"
                        title="Accept"
                      >
                        <Check className="h-5 w-5 text-green-600" />
                      </button>
                      <button
                        onClick={() => handleReject(inv.connection.id)}
                        disabled={isProcessing}
                        className="p-2 rounded-lg bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-50"
                        title="Reject"
                      >
                        <X className="h-5 w-5 text-red-600" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Sent Invitations */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Send className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-slate-900">
            Sent Invitations ({sentInvitations.length})
          </h3>
        </div>

        {sentInvitations.length === 0 ? (
          <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-sm">No pending sent invitations</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sentInvitations.map((inv) => {
              const relationshipInfo = RELATIONSHIP_INFO[inv.connection.relationship];

              return (
                <div
                  key={inv.connection.id}
                  className="bg-white border border-blue-200 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-slate-900">
                          {inv.fromUser.fullName || inv.fromUser.email}
                        </h4>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium bg-${relationshipInfo.color}-100 text-${relationshipInfo.color}-700`}>
                          {relationshipInfo.label}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                          Pending
                        </span>
                      </div>
                      <p className="text-sm text-slate-600">{inv.fromUser.email}</p>
                      <p className="text-xs text-slate-500 mt-2">
                        Sent {new Date(inv.invitation.createdAt).toLocaleDateString()} •
                        Expires {new Date(inv.invitation.expiresAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default InvitationsPanel;
