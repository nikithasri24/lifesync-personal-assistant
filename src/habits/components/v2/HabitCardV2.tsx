/**
 * HabitCardV2 Component
 * Habit card matching habits-design-spec.html exactly
 */

import React from 'react';
import type { HabitData, HabitEntryData } from '../../../services/types';
import type { MergedConnectionResult } from '../../../shared/api/SharedDataProvider';
import { useThemeColors } from '../../../hooks/useThemeColors';

export interface HabitCardV2Props {
  habit: HabitData;
  habitEntries: HabitEntryData[];
  todayCompletions: number;
  targetCount: number;
  hasReachedTarget: boolean;
  currentStreak: number;
  bestStreak?: number;
  isCompleting?: boolean;
  onComplete: () => void;
  onEdit: () => void;
  onDelete: () => void;
  mergedConnection?: MergedConnectionResult | null;
  currentUserId?: string | null;
  partnerName?: string;
}

export const HabitCardV2: React.FC<HabitCardV2Props> = ({
  habit,
  todayCompletions,
  targetCount,
  hasReachedTarget,
  currentStreak,
  onComplete,
  onEdit,
  mergedConnection,
  currentUserId,
  partnerName = 'Partner',
}) => {
  const colors = useThemeColors();

  // Get frequency display text
  const getFrequencyText = () => {
    if (habit.frequency === 'daily') return 'Daily';
    if (habit.frequency === 'weekly') return `${targetCount}x per week`;
    if (habit.frequency === 'monthly') return `${targetCount}x per month`;
    return 'Custom';
  };

  // Get category emoji
  const getCategoryEmoji = () => {
    if (habit.category === 'Health') return '🧘';
    if (habit.category === 'Fitness') return '💪';
    if (habit.category === 'Learning') return '📚';
    if (habit.category === 'Personal') return '✍️';
    if (habit.category === 'Productivity') return '💼';
    if (habit.category === 'Social') return '🤝';
    return '🎯';
  };

  // Calculate progress percentage for multi-target habits
  const progressPercentage = targetCount > 1 ? Math.round((todayCompletions / targetCount) * 100) : 100;

  // Determine owner for badge
  const isOwner = habit.user_id === currentUserId;
  const ownerName = isOwner ? 'You' : partnerName;

  return (
    <div
      className="relative mb-3 transition-all duration-200 animate-fadeInUp"
      style={{
        background: hasReachedTarget
          ? 'linear-gradient(135deg, rgba(76, 175, 80, 0.03) 0%, rgba(56, 142, 60, 0.03) 100%)'
          : 'white',
        borderLeft: `4px solid ${hasReachedTarget ? '#4CAF50' : '#D4A574'}`,
        borderRadius: '16px',
        padding: '16px',
        boxShadow: '0 2px 8px rgba(139, 111, 71, 0.08)',
      }}
    >
      {/* Owner badge (top-right, only in merged mode) */}
      {mergedConnection && currentUserId && (
        <div
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            padding: '4px 8px',
            background: 'linear-gradient(135deg, rgba(212, 165, 116, 0.3) 0%, rgba(193, 139, 94, 0.3) 100%)',
            borderRadius: '8px',
            fontSize: '10px',
            fontWeight: 700,
            color: '#C18B5E',
          }}
        >
          {ownerName}
        </div>
      )}

      {/* Header: Name/Category and Check Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div style={{ flex: 1 }} onClick={onEdit}>
          <div style={{ fontSize: '16px', fontWeight: 600, color: colors.text.primary, marginBottom: '4px' }}>
            {habit.name}
          </div>
          <div style={{ fontSize: '12px', color: colors.text.secondary }}>
            {getCategoryEmoji()} {habit.category} • {getFrequencyText()}
          </div>
        </div>

        {/* Large Circular Check Button - 56px */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onComplete();
          }}
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: hasReachedTarget
              ? 'linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)'
              : 'white',
            border: `3px solid ${hasReachedTarget ? colors.success : colors.border.light}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '28px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            flexShrink: 0,
            color: hasReachedTarget ? 'white' : colors.border.light,
          }}
          aria-label={hasReachedTarget ? 'Mark incomplete' : 'Mark complete'}
        >
          {hasReachedTarget ? '✓' : '○'}
        </button>
      </div>

      {/* Progress Section (for multi-target habits) */}
      {targetCount > 1 && (
        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: `1px solid ${colors.border.light}` }}>
          <div style={{ fontSize: '12px', color: colors.text.tertiary, marginBottom: '6px', display: 'flex', justifyContent: 'space-between' }}>
            <span>
              {habit.frequency === 'weekly' ? 'Weekly' : habit.frequency === 'monthly' ? 'Monthly' : 'Today\'s'} Progress
            </span>
            <span>{todayCompletions} / {targetCount}</span>
          </div>
          <div
            style={{
              background: colors.border.light,
              height: '8px',
              borderRadius: '4px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${progressPercentage}%`,
                height: '100%',
                background: hasReachedTarget
                  ? 'linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)'
                  : 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>
      )}

      {/* Streak Badge */}
      {currentStreak > 0 && (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            background: 'linear-gradient(135deg, rgba(255, 152, 0, 0.15) 0%, rgba(245, 124, 0, 0.15) 100%)',
            color: colors.warning,
            padding: '4px 10px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: 700,
            marginTop: '8px',
          }}
        >
          🔥 {currentStreak} day streak
        </div>
      )}
    </div>
  );
};

export default HabitCardV2;
