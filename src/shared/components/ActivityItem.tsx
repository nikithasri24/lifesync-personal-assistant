/**
 * Activity Item Component
 * Displays a single activity feed item
 */

import React from 'react';
import { useThemeColors } from '@/hooks/useThemeColors';
import { formatDistanceToNow } from 'date-fns';
import type { ActivityItem as ActivityItemType, ShareableModule } from '../types';

interface ActivityItemProps {
  item: ActivityItemType;
  currentUserId: string;
}

const MODULE_ICONS: Record<ShareableModule, string> = {
  meals: '🍽️',
  shopping: '🛒',
  tasks: '✓',
  finances: '💰',
  habits: '🎯',
  goals: '🏆',
  travel: '✈️',
  journal: '📔',
  notes: '📝',
  calendar: '📅',
};

export function ActivityItem({ item, currentUserId }: ActivityItemProps) {
  const colors = useThemeColors();
  const isCurrentUser = item.user_id === currentUserId;

  return (
    <div
      className="flex items-center gap-3 p-3 rounded-xl mb-2"
      style={{ backgroundColor: colors.bg.secondary }}
    >
      {/* Module Icon */}
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-base flex-shrink-0"
        style={{
          background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)',
        }}
      >
        {MODULE_ICONS[item.module]}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div
          className="text-sm font-semibold mb-0.5"
          style={{ color: colors.text.primary }}
        >
          {item.action}
        </div>
        <div className="text-xs" style={{ color: colors.text.tertiary }}>
          {isCurrentUser ? 'You' : item.user_name} ·{' '}
          {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
        </div>
      </div>
    </div>
  );
}
