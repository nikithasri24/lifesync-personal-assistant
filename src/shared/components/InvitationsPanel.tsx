import React from 'react';
import type { PendingInvitation } from '../types/connections';

interface InvitationsPanelProps {
  sentInvitations: PendingInvitation[];
  receivedInvitations: PendingInvitation[];
  onInvitationAccepted?: () => void;
  onInvitationRejected?: () => void;
}

export function InvitationsPanel({
  sentInvitations: _sentInvitations,
  receivedInvitations: _receivedInvitations,
  onInvitationAccepted: _onInvitationAccepted,
  onInvitationRejected: _onInvitationRejected
}: InvitationsPanelProps): React.ReactElement {
  return (
    <div className="p-4">
      <p className="text-sm text-gray-500">Invitations panel feature not yet implemented</p>
    </div>
  );
}

export default InvitationsPanel;
