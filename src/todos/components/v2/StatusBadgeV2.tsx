/**
 * StatusBadgeV2 Component
 * Badge for displaying task status
 */

import React from 'react';
import type { TaskData } from '../../../services/types';

export interface StatusBadgeV2Props {
  status: TaskData['status'];
  size?: 'sm' | 'md';
}

const statusConfig: Record<NonNullable<TaskData['status']>, { label: string; color: string; bg: string }> = {
  todo: { label: 'To Do', color: '#6B7280', bg: '#F3F4F6' },
  in_progress: { label: 'In Progress', color: '#3B82F6', bg: '#EFF6FF' },
  waiting: { label: 'Waiting', color: '#F59E0B', bg: '#FEF3C7' },
  scheduled: { label: 'Scheduled', color: '#8B5CF6', bg: '#F3E8FF' },
  done: { label: 'Done', color: '#10B981', bg: '#D1FAE5' },
};

export const StatusBadgeV2: React.FC<StatusBadgeV2Props> = ({
  status,
  size = 'md',
}) => {
  if (!status) return null;

  const config = statusConfig[status];
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span
      className={`${sizeClasses} rounded-lg font-semibold inline-block`}
      style={{
        backgroundColor: config.bg,
        color: config.color,
      }}
    >
      {config.label}
    </span>
  );
};

export default StatusBadgeV2;
