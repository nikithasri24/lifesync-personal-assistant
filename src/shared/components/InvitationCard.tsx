/**
 * Invitation Card Component
 * Displays invitation with accept/decline actions
 */

import React from 'react';
import { useThemeColors } from '@/hooks/useThemeColors';
import { PermissionBadge } from './PermissionBadge';
import type { Invitation, RelationshipType } from '../types';

interface InvitationCardProps {
  invitation: Invitation;
  onAccept?: (id: string) => void;
  onDecline?: (id: string) => void;
  onCancel?: (id: string) => void;
}

const RELATIONSHIP_STYLES: Record<RelationshipType, { bg: string; text: string }> = {
  spouse: { bg: '#FEE2E2', text: '#DC2626' },
  partner: { bg: '#FCE7F3', text: '#DB2777' },
  friend: { bg: '#DBEAFE', text: '#2563EB' },
  family: { bg: '#D1FAE5', text: '#059669' },
  roommate: { bg: '#E9D5FF', text: '#9333EA' },
  colleague: { bg: '#FED7AA', text: '#EA580C' },
};

const RELATIONSHIP_LABELS: Record<RelationshipType, string> = {
  spouse: 'Spouse',
  partner: 'Partner',
  friend: 'Friend',
  family: 'Family',
  roommate: 'Roommate',
  colleague: 'Colleague',
};

export function InvitationCard({
  invitation,
  onAccept,
  onDecline,
  onCancel,
}: InvitationCardProps) {
  const colors = useThemeColors();
  const relationshipStyle = RELATIONSHIP_STYLES[invitation.relationship];
  const avatarLetter = invitation.from_name.charAt(0).toUpperCase();

  return (
    <div
      className="rounded-2xl p-4 mb-3"
      style={{
        backgroundColor: colors.bg.white,
        boxShadow: '0 2px 12px rgba(92, 74, 58, 0.08)',
        borderLeft: `4px solid ${colors.accent.end}`,
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        {/* Avatar */}
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold"
          style={{
            background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)',
          }}
        >
          {avatarLetter}
        </div>

        {/* Info */}
        <div className="flex-1">
          <div
            className="text-base font-bold mb-0.5"
            style={{ color: colors.text.primary }}
          >
            {invitation.from_name}
          </div>
          <div className="text-sm" style={{ color: colors.text.tertiary }}>
            {invitation.from_email}
          </div>
        </div>

        {/* Direction Badge */}
        <div
          className={`px-2 py-1 rounded-lg text-xs font-bold uppercase ${
            invitation.direction === 'received'
              ? 'bg-green-100 text-green-700'
              : 'bg-blue-100 text-blue-700'
          }`}
        >
          {invitation.direction === 'received' ? 'Received' : 'Sent'}
        </div>
      </div>

      {/* Relationship Badge */}
      <div
        className="inline-block px-2.5 py-1 rounded-xl text-xs font-bold uppercase mb-3"
        style={{
          backgroundColor: relationshipStyle.bg,
          color: relationshipStyle.text,
          letterSpacing: '0.3px',
        }}
      >
        {RELATIONSHIP_LABELS[invitation.relationship]}
      </div>

      {/* Message */}
      {invitation.message && (
        <div
          className="text-sm italic p-3 rounded-lg mb-3"
          style={{
            color: colors.text.secondary,
            backgroundColor: colors.bg.secondary,
          }}
        >
          "{invitation.message}"
        </div>
      )}

      {/* Permissions */}
      <div className="flex flex-wrap gap-2 mb-3">
        {invitation.permissions.map((perm) => (
          <PermissionBadge
            key={perm.module}
            module={perm.module}
            permission={perm.permission}
          />
        ))}
      </div>

      {/* Actions */}
      {invitation.direction === 'received' && invitation.status === 'pending' && (
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onAccept?.(invitation.id)}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{
              background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)',
            }}
          >
            Accept
          </button>
          <button
            onClick={() => onDecline?.(invitation.id)}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold"
            style={{
              backgroundColor: colors.bg.secondary,
              color: colors.text.primary,
            }}
          >
            Decline
          </button>
        </div>
      )}

      {invitation.direction === 'sent' && invitation.status === 'pending' && (
        <button
          onClick={() => onCancel?.(invitation.id)}
          className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold bg-red-50 text-red-600"
        >
          Cancel Invitation
        </button>
      )}
    </div>
  );
}
