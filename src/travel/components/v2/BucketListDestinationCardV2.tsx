/**
 * BucketListDestinationCardV2 - Card component for bucket list destinations
 * Following Together pattern with terracotta theme
 */

import React from 'react';
import { MapPin, Calendar, DollarSign, CheckCircle, Circle } from 'lucide-react';
import type { BucketListPriority, BucketListCategory } from '../../types';

export interface BucketListDestinationCardV2Props {
  id: string;
  name: string;
  description?: string;
  countryName?: string;
  cityName?: string;
  priority: BucketListPriority;
  category: BucketListCategory;
  estimatedBudget?: number;
  currency?: string;
  targetYear?: number;
  targetSeason?: string;
  isVisited: boolean;
  mustDo?: string[];
  onClick: () => void;
  showOwnerBadge?: boolean;
  owner?: {
    isOwner: boolean;
    displayName: string;
  };
}

const PRIORITY_COLORS = {
  urgent: { bg: '#FEE2E2', text: '#991B1B', border: '#FCA5A5' },
  high: { bg: '#FED7AA', text: '#9A3412', border: '#FB923C' },
  medium: { bg: '#FEF3C7', text: '#92400E', border: '#FCD34D' },
  low: { bg: '#DBEAFE', text: '#1E40AF', border: '#93C5FD' },
};

const PRIORITY_LABELS = {
  urgent: '🔥 Urgent',
  high: '⭐ High',
  medium: '📌 Medium',
  low: '💭 Someday',
};

const CATEGORY_EMOJI = {
  beach: '🏖️',
  mountain: '⛰️',
  city: '🏙️',
  cultural: '🏛️',
  adventure: '🎒',
  relaxation: '🧘',
  food: '🍽️',
  wildlife: '🦁',
  other: '🌍',
};

export const BucketListDestinationCardV2: React.FC<BucketListDestinationCardV2Props> = ({
  id,
  name,
  description,
  countryName,
  cityName,
  priority,
  category,
  estimatedBudget,
  currency = 'USD',
  targetYear,
  targetSeason,
  isVisited,
  mustDo = [],
  onClick,
  showOwnerBadge = false,
  owner,
}) => {
  const priorityStyle = PRIORITY_COLORS[priority];
  const location = [cityName, countryName].filter(Boolean).join(', ');

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer transition-all hover:shadow-lg"
      style={{
        background: 'white',
        borderRadius: '16px',
        padding: '20px',
        border: '1px solid #E5E7EB',
        position: 'relative',
        opacity: isVisited ? 0.7 : 1,
      }}
    >
      {/* Visited checkmark overlay */}
      {isVisited && (
        <div
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
            borderRadius: '50%',
            padding: '6px',
            boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
          }}
        >
          <CheckCircle size={16} color="white" />
        </div>
      )}

      {/* Owner badge */}
      {showOwnerBadge && owner && (
        <div
          style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            padding: '4px 10px',
            background: owner.isOwner ? 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)' : '#F3F4F6',
            borderRadius: '12px',
            fontSize: '11px',
            fontWeight: '700',
            color: owner.isOwner ? 'white' : '#6B7280',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          {owner.displayName}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: '12px', marginTop: showOwnerBadge ? '16px' : '0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <span style={{ fontSize: '24px' }}>{CATEGORY_EMOJI[category]}</span>
          <h3
            style={{
              fontSize: '18px',
              fontWeight: '700',
              color: '#1F2937',
              margin: 0,
              flex: 1,
              textDecoration: isVisited ? 'line-through' : 'none',
            }}
          >
            {name}
          </h3>
        </div>

        {location && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
            <MapPin size={14} color="#9CA3AF" />
            <span style={{ fontSize: '13px', color: '#6B7280' }}>{location}</span>
          </div>
        )}
      </div>

      {/* Description */}
      {description && (
        <p
          style={{
            fontSize: '14px',
            color: '#4B5563',
            marginBottom: '12px',
            lineHeight: '1.5',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {description}
        </p>
      )}

      {/* Must-do items preview */}
      {mustDo.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '12px', fontWeight: '600', color: '#6B7280', marginBottom: '4px' }}>
            Must Do:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {mustDo.slice(0, 2).map((item, idx) => (
              <span
                key={idx}
                style={{
                  fontSize: '12px',
                  padding: '2px 8px',
                  background: '#F3F4F6',
                  borderRadius: '6px',
                  color: '#4B5563',
                }}
              >
                {item}
              </span>
            ))}
            {mustDo.length > 2 && (
              <span
                style={{
                  fontSize: '12px',
                  padding: '2px 8px',
                  background: '#F3F4F6',
                  borderRadius: '6px',
                  color: '#6B7280',
                }}
              >
                +{mustDo.length - 2} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Footer with metadata */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        {/* Priority badge */}
        <div
          style={{
            padding: '4px 10px',
            background: priorityStyle.bg,
            border: `1px solid ${priorityStyle.border}`,
            borderRadius: '8px',
            fontSize: '11px',
            fontWeight: '700',
            color: priorityStyle.text,
          }}
        >
          {PRIORITY_LABELS[priority]}
        </div>

        {/* Right side info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', color: '#6B7280' }}>
          {estimatedBudget && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <DollarSign size={14} />
              <span>
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: currency,
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                }).format(estimatedBudget)}
              </span>
            </div>
          )}

          {(targetYear || targetSeason) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Calendar size={14} />
              <span>
                {targetSeason ? `${targetSeason.charAt(0).toUpperCase() + targetSeason.slice(1)} ` : ''}
                {targetYear || ''}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
