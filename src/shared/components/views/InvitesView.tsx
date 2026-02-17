/**
 * Invites View Component
 * Displays pending invitations (sent and received)
 */

import React from 'react';
import { useThemeColors } from '@/hooks/useThemeColors';
import { InvitationCard } from '../InvitationCard';
import type { Invitation } from '../../types';

interface InvitesViewProps {
  invitations: Invitation[];
  isLoading: boolean;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
  onCancel: (id: string) => void;
}

export function InvitesView({
  invitations,
  isLoading,
  onAccept,
  onDecline,
  onCancel,
}: InvitesViewProps) {
  const colors = useThemeColors();

  if (isLoading) {
    return (
      <div className="px-5 pb-24">
        <div className="text-center py-12" style={{ color: colors.text.tertiary }}>
          Loading invitations...
        </div>
      </div>
    );
  }

  if (invitations.length === 0) {
    return (
      <div className="px-5 pb-24">
        <div
          className="text-center py-16 px-10 mt-20 rounded-2xl"
          style={{ backgroundColor: colors.bg.white }}
        >
          <div className="text-6xl mb-4 opacity-50">✉️</div>
          <div
            className="text-lg font-bold mb-2"
            style={{ color: colors.text.primary }}
          >
            No pending invitations
          </div>
          <div
            className="text-sm leading-relaxed"
            style={{ color: colors.text.tertiary }}
          >
            Invite a partner or check back later for new requests
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 pb-24">
      <h2
        className="text-xl font-bold mb-4"
        style={{ color: colors.text.primary }}
      >
        Partner Invitations
      </h2>

      {invitations.map((invitation) => (
        <InvitationCard
          key={invitation.id}
          invitation={invitation}
          onAccept={onAccept}
          onDecline={onDecline}
          onCancel={onCancel}
        />
      ))}
    </div>
  );
}
