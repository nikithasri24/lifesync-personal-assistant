/**
 * Activity View Component
 * Displays recent activity feed from shared modules
 */

import React from 'react';
import { useThemeColors } from '@/hooks/useThemeColors';
import { ActivityItem } from '../ActivityItem';
import type { ActivityItem as ActivityItemType } from '../../types';

interface ActivityViewProps {
  activities: ActivityItemType[];
  isLoading: boolean;
  currentUserId: string;
}

export function ActivityView({ activities, isLoading, currentUserId }: ActivityViewProps) {
  const colors = useThemeColors();

  if (isLoading) {
    return (
      <div className="pb-4">
        <div className="text-center py-12" style={{ color: colors.text.tertiary }}>
          Loading activity...
        </div>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="pb-4">
        <div
          className="text-center py-16 px-10 mt-20 rounded-2xl"
          style={{ backgroundColor: colors.bg.white }}
        >
          <div className="text-6xl mb-4 opacity-50">📊</div>
          <div
            className="text-lg font-bold mb-2"
            style={{ color: colors.text.primary }}
          >
            No recent activity
          </div>
          <div
            className="text-sm leading-relaxed"
            style={{ color: colors.text.tertiary }}
          >
            Start collaborating with your partner and activity will appear here
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-4">
      <h2
        className="text-xl font-bold mb-4"
        style={{ color: colors.text.primary }}
      >
        Recent Activity
      </h2>

      {activities.map((activity) => (
        <ActivityItem
          key={activity.id}
          item={activity}
          currentUserId={currentUserId}
        />
      ))}
    </div>
  );
}
