/**
 * HabitsHeaderV2 Component
 * Page header matching habits-design-spec.html exactly
 */

import React from 'react';
import { useThemeColors } from '../../../hooks/useThemeColors';
import type { OwnerFilterValue } from '../../../components/common/OwnerFilter';
import { OwnerFilter } from '../../../components/common/OwnerFilter';
import type { MergedConnectionResult } from '../../../shared/api/SharedDataProvider';

export interface HabitsHeaderV2Props {
  totalHabits: number;
  completionPercentage: number;
  currentStreak: number;
  onAddHabit: () => void;
  onToggleFilter?: () => void;
  mergedConnection?: MergedConnectionResult | null;
  ownerFilter?: OwnerFilterValue;
  onOwnerFilterChange?: (value: OwnerFilterValue) => void;
  partnerName?: string;
  completedToday?: number;
  viewMode?: 'today' | 'weekly';
  onViewModeChange?: (mode: 'today' | 'weekly') => void;
}

export const HabitsHeaderV2: React.FC<HabitsHeaderV2Props> = ({
  totalHabits,
  currentStreak,
  completedToday = 0,
  mergedConnection,
  ownerFilter = 'all',
  onOwnerFilterChange,
  partnerName = 'Partner',
  viewMode = 'today',
  onViewModeChange,
}) => {
  const colors = useThemeColors();

  return (
    <div>
      {/* Page Header */}
      <div
        style={{
          background: 'white',
          padding: '36px 20px 20px',
          marginLeft: '-1.5rem',
          marginRight: '-1.5rem',
          marginTop: '-1.5rem',
          boxShadow: '0 1px 3px rgba(139, 111, 71, 0.08)',
          position: 'relative',
        }}
      >
        <h1
          style={{
            fontSize: '34px',
            fontWeight: 700,
            background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '6px',
          }}
        >
          Habits
        </h1>
        <p style={{ fontSize: '15px', color: '#9B8B7A' }}>
          Build better routines
        </p>
      </div>

      {/* Stats Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(212, 165, 116, 0.15) 0%, rgba(193, 139, 94, 0.15) 100%)',
          borderRadius: '20px',
          padding: '20px',
          margin: '16px 0',
        }}
      >
        <div
          style={{
            fontSize: '14px',
            fontWeight: 600,
            color: '#5C4A3A',
            textAlign: 'center',
            marginBottom: '12px',
          }}
        >
          Today's Progress
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '16px',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                fontSize: '28px',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {totalHabits}
            </div>
            <div
              style={{
                fontSize: '11px',
                color: '#6B5847',
                marginTop: '4px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Total
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                fontSize: '28px',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {completedToday}
            </div>
            <div
              style={{
                fontSize: '11px',
                color: '#6B5847',
                marginTop: '4px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Done
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                fontSize: '28px',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {currentStreak}
            </div>
            <div
              style={{
                fontSize: '11px',
                color: '#6B5847',
                marginTop: '4px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Streak
            </div>
          </div>
        </div>
      </div>

      {/* View Toggle */}
      {onViewModeChange && (
        <div
          style={{
            padding: '4px',
            background: 'rgba(212, 165, 116, 0.1)',
            borderRadius: '12px',
            display: 'flex',
            gap: '4px',
            marginBottom: '16px',
          }}
        >
          <button
            onClick={() => onViewModeChange('today')}
            style={{
              flex: 1,
              padding: '8px 16px',
              borderRadius: '8px',
              background: viewMode === 'today' ? 'white' : 'transparent',
              border: 'none',
              fontSize: '14px',
              fontWeight: 600,
              color: viewMode === 'today' ? '#C18B5E' : '#6B5847',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: viewMode === 'today' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            📅 Today
          </button>
          <button
            onClick={() => onViewModeChange('weekly')}
            style={{
              flex: 1,
              padding: '8px 16px',
              borderRadius: '8px',
              background: viewMode === 'weekly' ? 'white' : 'transparent',
              border: 'none',
              fontSize: '14px',
              fontWeight: 600,
              color: viewMode === 'weekly' ? '#C18B5E' : '#6B5847',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: viewMode === 'weekly' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            📊 Weekly
          </button>
        </div>
      )}

      {/* Date Navigation */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 0',
          background: 'white',
          borderBottom: '1px solid #F5F0EA',
          marginLeft: '-1.5rem',
          marginRight: '-1.5rem',
          paddingLeft: '1.5rem',
          paddingRight: '1.5rem',
        }}
      >
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'rgba(212, 165, 116, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#C18B5E',
            fontSize: '16px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          ‹
        </div>
        <div style={{ fontSize: '16px', fontWeight: 600, color: '#5C4A3A' }}>
          {viewMode === 'today'
            ? `Today, ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
            : `${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${new Date().getFullYear()}`
          }
        </div>
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'rgba(212, 165, 116, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#C18B5E',
            fontSize: '16px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          ›
        </div>
      </div>

      {/* Owner Filter for merged mode */}
      {mergedConnection && onOwnerFilterChange && (
        <div className="mt-4">
          <OwnerFilter
            value={ownerFilter}
            onChange={onOwnerFilterChange}
            partnerName={partnerName}
          />
        </div>
      )}
    </div>
  );
};

export default HabitsHeaderV2;
