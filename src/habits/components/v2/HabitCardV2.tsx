/**
 * HabitCardV2 Component
 * Individual habit card matching design spec with completion toggle
 */

import React from 'react';
import { motion } from 'framer-motion';
import { useThemeColors } from '../../../hooks/useThemeColors';
import type { HabitData, HabitEntryData } from '../../../services/types';
import type { MergedConnectionResult } from '../../../shared/api/SharedDataProvider';

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
    if (habit.frequency === 'daily') return '📅 Daily';
    if (habit.frequency === 'weekly') return '📆 Weekly';
    if (habit.frequency === 'monthly') return '🗓️ Monthly';
    return '⚙️ Custom';
  };

  // Calculate progress percentage for multi-target habits
  const progressPercentage = targetCount > 1 ? Math.round((todayCompletions / targetCount) * 100) : 100;

  // Determine owner for badge
  const isOwner = habit.user_id === currentUserId;
  const ownerName = isOwner ? 'You' : partnerName;

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.15 }}
      className="relative cursor-pointer mb-3"
      style={{
        backgroundColor: 'white',
        borderLeft: `4px solid ${hasReachedTarget ? '#22c55e' : '#D4A574'}`,
        borderRadius: '12px',
        padding: '16px',
        boxShadow: '0 2px 12px rgba(92, 74, 58, 0.08)',
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

      {/* Top section: Icon, Name, Checkbox */}
      <div className="flex items-center gap-3 mb-3">
        {/* Emoji icon */}
        <span className="text-3xl">{habit.category === 'Health' ? '🧘' :
                                     habit.category === 'Fitness' ? '💪' :
                                     habit.category === 'Learning' ? '📚' :
                                     habit.category === 'Personal' ? '✍️' :
                                     habit.category === 'Productivity' ? '💼' :
                                     habit.category === 'Social' ? '🤝' : '🎯'}</span>

        {/* Name and frequency */}
        <div className="flex-1" onClick={onEdit}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#5C4A3A' }}>
            {habit.name}
          </h3>
          <p style={{ fontSize: '12px', color: '#9B8B7A' }}>
            {getFrequencyText()}
          </p>
        </div>

        {/* Completion checkbox */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onComplete();
          }}
          className="flex-shrink-0"
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            border: `2px solid ${hasReachedTarget ? '#22c55e' : '#C18B5E'}`,
            background: hasReachedTarget ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' : 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          aria-label={hasReachedTarget ? 'Mark incomplete' : 'Mark complete'}
        >
          {hasReachedTarget && <span style={{ color: 'white', fontSize: '16px' }}>✓</span>}
        </button>
      </div>

      {/* Description (if exists) */}
      {habit.description && (
        <p style={{ fontSize: '13px', color: '#6B5847', marginBottom: '8px' }}>
          {habit.description}
        </p>
      )}

      {/* Streak indicator */}
      {currentStreak > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
          <span style={{ fontSize: '14px' }}>🔥</span>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#ea580c' }}>
            {currentStreak} day streak!
          </span>
        </div>
      )}

      {/* Progress bar (if has multi-target) */}
      {targetCount > 1 && (
        <div style={{ marginTop: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: '11px', color: '#6B5847' }}>
              {habit.frequency === 'weekly' ? 'Weekly' : habit.frequency === 'monthly' ? 'Monthly' : 'Daily'} Progress
            </span>
            <span style={{ fontSize: '11px', color: '#6B5847', fontWeight: 600 }}>
              {todayCompletions}/{targetCount}
            </span>
          </div>
          <div
            style={{
              width: '100%',
              height: '6px',
              backgroundColor: '#E8DCC8',
              borderRadius: '3px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${progressPercentage}%`,
                height: '100%',
                background: hasReachedTarget
                  ? 'linear-gradient(90deg, #22c55e 0%, #16a34a 100%)'
                  : 'linear-gradient(90deg, #D4A574 0%, #C18B5E 100%)',
                transition: 'width 0.3s',
              }}
            />
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default HabitCardV2;
