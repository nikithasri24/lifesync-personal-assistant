/**
 * Connection Card Component
 * Displays partner connection information with permissions
 */

import React from 'react';
import { useThemeColors } from '@/hooks/useThemeColors';
import { PermissionBadge } from './PermissionBadge';
import type { PartnerConnection, RelationshipType } from '../types';

interface ConnectionCardProps {
  connection: PartnerConnection;
}

const RELATIONSHIP_STYLES: Record<string, { bg: string; text: string }> = {
  spouse:    { bg: '#FEE2E2', text: '#DC2626' },
  partner:   { bg: '#FCE7F3', text: '#DB2777' },
  friend:    { bg: '#DBEAFE', text: '#2563EB' },
  family:    { bg: '#D1FAE5', text: '#059669' },
  roommate:  { bg: '#E9D5FF', text: '#9333EA' },
  colleague: { bg: '#FED7AA', text: '#EA580C' },
  other:     { bg: '#F3F4F6', text: '#6B7280' },
};

const FALLBACK_STYLE = { bg: '#F3F4F6', text: '#6B7280' };

const RELATIONSHIP_LABELS: Record<string, string> = {
  spouse:    'Spouse',
  partner:   'Partner',
  friend:    'Friend',
  family:    'Family',
  roommate:  'Roommate',
  colleague: 'Colleague',
  other:     'Other',
};

export function ConnectionCard({ connection }: ConnectionCardProps) {
  const colors = useThemeColors();
  const relationshipStyle = RELATIONSHIP_STYLES[connection.relationship] ?? FALLBACK_STYLE;

  // Get first letter of partner name for avatar
  const avatarLetter = connection.partner_name.charAt(0).toUpperCase();

  return (
    <div
      className="rounded-2xl p-4 mb-3"
      style={{
        backgroundColor: colors.bg.white,
        boxShadow: '0 2px 12px rgba(92, 74, 58, 0.08)',
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
            {connection.partner_name}
          </div>
          <div className="text-sm" style={{ color: colors.text.tertiary }}>
            {connection.partner_email}
          </div>
        </div>

        {/* Relationship Badge */}
        <div
          className="px-2.5 py-1 rounded-xl text-xs font-bold uppercase"
          style={{
            backgroundColor: relationshipStyle.bg,
            color: relationshipStyle.text,
            letterSpacing: '0.3px',
          }}
        >
          {RELATIONSHIP_LABELS[connection.relationship]}
        </div>
      </div>

      {/* Permissions */}
      <div className="flex flex-wrap gap-2 mt-3">
        {connection.permissions.map((perm) => (
          <PermissionBadge
            key={perm.module}
            module={perm.module}
            permission={perm.permission}
          />
        ))}
      </div>
    </div>
  );
}
