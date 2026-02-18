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
      className="cursor-pointer transition-transform hover:scale-[1.01] active:scale-[0.98]"
      style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 2px 12px rgba(92, 74, 58, 0.08)',
        marginBottom: '16px',
        position: 'relative',
      }}
    >
      {/* Cover Image / Placeholder */}
      <div
        style={{
          height: '140px',
          background: coverPhoto
            ? `url(${coverPhoto}) center/cover`
            : 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '48px',
        }}
      >
        {!coverPhoto && '✈️'}
      </div>

      {/* Owner Badge */}
      {showOwnerBadge && owner && (
        <div
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            padding: '4px 10px',
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '12px',
            fontSize: '10px',
            fontWeight: 700,
            color: '#C18B5E',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
          }}
        >
          {owner.displayName}
        </div>
      )}

      {/* Content */}
      <div style={{ padding: '16px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#5C4A3A', flex: 1 }}>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#6B5847', marginBottom: '12px' }}>
          <span>📅</span>
          <span>{formatDateRange(startDate, endDate)}</span>
        </div>

        {/* Description */}
        {description && (
          <p
            style={{
              fontSize: '13px',
              color: '#6B5847',
              lineHeight: 1.4,
              marginBottom: '12px',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {description}
          </p>
        )}

        {/* Meta */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            paddingTop: '12px',
            borderTop: '1px solid #E8DCC8',
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
