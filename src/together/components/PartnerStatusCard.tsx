/**
 * Partner Status Card Component
 * Shows partner connection status and days together counter
 */

import React from 'react';
import { Users } from 'lucide-react';
import type { PartnerLink } from '../types';
import { calculateDaysTogether, formatDateLong } from '../utils/dateHelpers';
import { useThemeColors } from '@/hooks/useThemeColors';

interface PartnerStatusCardProps {
  partnerLink: PartnerLink | null | undefined;
  isLoading: boolean;
  onLinkPartner: () => void;
}

export const PartnerStatusCard: React.FC<PartnerStatusCardProps> = ({
  partnerLink,
  isLoading,
  onLinkPartner,
}) => {
  const colors = useThemeColors();

  if (isLoading) {
    return (
      <div
        className="p-6 rounded-2xl shadow-sm border animate-pulse"
        style={{
          backgroundColor: colors.bg.white,
          borderColor: colors.border.light,
        }}
      >
        <div className="h-20 bg-gray-200 rounded"></div>
      </div>
    );
  }

  // No partner linked yet
  if (!partnerLink) {
    return (
      <div
        className="p-6 rounded-2xl shadow-sm border"
        style={{
          backgroundColor: colors.bg.white,
          borderColor: colors.border.light,
        }}
      >
        <div className="flex items-center gap-4">
          <div className="text-5xl">💝</div>
          <div className="flex-1">
            <h2
              className="text-xl font-bold mb-1"
              style={{ color: colors.text.primary }}
            >
              Connect with Your Partner
            </h2>
            <p className="text-sm mb-3" style={{ color: colors.text.secondary }}>
              Link your LifeSync account with your partner to share milestones,
              messages, and memories.
            </p>
            <p className="text-sm mb-3 font-medium" style={{ color: '#D4A574' }}>
              → Go to the <a href="/shared" className="underline hover:opacity-80">Shared</a> page to send a connection request to your partner first.
            </p>
            <p className="text-xs" style={{ color: colors.text.tertiary }}>
              Once your connection is accepted, your partner will appear here automatically.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Partner linked!
  const daysTogether = partnerLink.relationship_start_date
    ? calculateDaysTogether(partnerLink.relationship_start_date)
    : null;

  const partnerEmail = partnerLink.partner_email || partnerLink.requester_email || 'Your Partner';

  return (
    <div
      className="p-6 rounded-2xl shadow-sm border"
      style={{
        backgroundColor: colors.bg.white,
        borderColor: colors.border.light,
      }}
    >
      <div className="flex items-center gap-4">
        <div className="text-5xl">💑</div>
        <div className="flex-1">
          <h2
            className="text-xl font-bold mb-1"
            style={{ color: colors.text.primary }}
          >
            Partner Connection
          </h2>
          <p className="mb-2" style={{ color: colors.text.secondary }}>
            Connected with:{' '}
            <span className="font-semibold" style={{ color: '#D4A574' }}>
              {partnerEmail}
            </span>
          </p>
          {partnerLink.relationship_start_date && (
            <p className="text-sm" style={{ color: colors.text.tertiary }}>
              Since: {formatDateLong(partnerLink.relationship_start_date)}
              {daysTogether !== null && (
                <span className="font-semibold ml-1">
                  • {daysTogether} days together
                </span>
              )}
            </p>
          )}
        </div>
        <button
          className="px-4 py-2 rounded-lg transition-colors"
          style={{
            color: '#D4A574',
            backgroundColor: 'transparent',
          }}
        >
          View Settings
        </button>
      </div>
    </div>
  );
};
