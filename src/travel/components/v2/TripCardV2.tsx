/**
 * TripCardV2 Component
 * Display trip cards with cover images, status badges, and metadata
 * Supports owner badges for merged mode
 */

import React from 'react';
import { useThemeColors } from '@/hooks/useThemeColors';

type TripStatus = 'planning' | 'upcoming' | 'in_progress' | 'completed' | 'cancelled';

interface TripCardV2Props {
  id: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  status: TripStatus;
  budget?: number;
  currency?: string;
  tags?: string[];
  coverPhoto?: string;
  onClick: () => void;
  showOwnerBadge?: boolean;
  owner?: {
    isOwner: boolean;
    displayName: string;
  };
}

export const TripCardV2: React.FC<TripCardV2Props> = ({
  id,
  name,
  description,
  startDate,
  endDate,
  status,
  budget,
  currency = 'USD',
  tags,
  coverPhoto,
  onClick,
  showOwnerBadge = false,
  owner,
}) => {
  const colors = useThemeColors();

  const statusColors: Record<TripStatus, { bg: string; text: string }> = {
    planning: { bg: '#E8DCC8', text: '#6B5847' },
    upcoming: { bg: '#D4E8FF', text: '#0066CC' },
    in_progress: { bg: '#D4F4DD', text: '#16A34A' },
    completed: { bg: '#E8D4FF', text: '#9333EA' },
    cancelled: { bg: '#FEE2E2', text: '#DC2626' },
  };

  const statusColor = statusColors[status];

  const formatDateRange = (start: string, end: string): string => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const startMonth = startDate.toLocaleDateString('en-US', { month: 'short' });
    const endMonth = endDate.toLocaleDateString('en-US', { month: 'short' });
    const startDay = startDate.getDate();
    const endDay = endDate.getDate();

    if (startMonth === endMonth) {
      return `${startMonth} ${startDay}-${endDay}`;
    }
    return `${startMonth} ${startDay} - ${endMonth} ${endDay}`;
  };

  return (
    <div
      onClick={onClick}
      className="cursor-pointer transition-transform hover:scale-[1.01] active:scale-[0.98] rounded-2xl overflow-hidden shadow-sm mb-4 relative"
      style={{
        backgroundColor: colors.bg.white,
      }}
    >
      {/* Cover Image / Placeholder */}
      <div
        className="h-36 flex items-center justify-center text-5xl"
        style={{
          background: coverPhoto
            ? `url(${coverPhoto}) center/cover`
            : 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)',
        }}
      >
        {!coverPhoto && '✈️'}
      </div>

      {/* Owner Badge */}
      {showOwnerBadge && owner && (
        <div
          className="absolute top-3 right-3 px-2.5 py-1 rounded-xl text-xs font-bold shadow-md"
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            color: colors.accent.end,
          }}
        >
          {owner.displayName}
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        {/* Header */}
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-bold flex-1" style={{ color: colors.text.primary }}>
            {name}
          </h3>
          <div
            style={{
              padding: '4px 10px',
              borderRadius: '12px',
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.3px',
              backgroundColor: statusColor.bg,
              color: statusColor.text,
              whiteSpace: 'nowrap',
              marginLeft: '8px',
            }}
          >
            {status === 'in_progress' ? 'In Progress' : status}
          </div>
        </div>

        {/* Dates */}
        <div className="flex items-center gap-1.5 text-sm mb-3" style={{ color: colors.text.secondary }}>
          <span>📅</span>
          <span>{formatDateRange(startDate, endDate)}</span>
        </div>

        {/* Description */}
        {description && (
          <p
            className="text-sm mb-3 line-clamp-2"
            style={{
              color: colors.text.secondary,
              lineHeight: 1.4,
            }}
          >
            {description}
          </p>
        )}

        {/* Meta */}
        <div
          className="flex gap-3 pt-3 border-t"
          style={{
            borderColor: colors.border.light,
          }}
        >
          {budget && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#9B8B7A' }}>
              <span>💰</span>
              <span>{budget} {currency}</span>
            </div>
          )}
          {tags && tags.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#9B8B7A' }}>
              <span>🏷️</span>
              <span>{tags[0]}</span>
              {tags.length > 1 && <span>+{tags.length - 1}</span>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
