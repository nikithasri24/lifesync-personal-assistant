/**
 * PriorityBadgeV2 Component
 * Priority badge with terracotta theme
 * Variants: urgent (red), high (orange), medium (yellow), low (green)
 */

import React from 'react';
import { BadgeV2 } from '../../../components/v2/BadgeV2';
import type { TaskPriority } from '../../../types/task';

export interface PriorityBadgeV2Props {
  priority: TaskPriority;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const priorityConfig: Record<TaskPriority, { variant: 'danger' | 'warning' | 'default' | 'success'; label: string }> = {
  urgent: { variant: 'danger', label: 'Urgent' },
  high: { variant: 'warning', label: 'High' },
  medium: { variant: 'default', label: 'Medium' },
  low: { variant: 'success', label: 'Low' },
};

export const PriorityBadgeV2: React.FC<PriorityBadgeV2Props> = ({
  priority,
  size = 'sm',
  className = '',
}) => {
  const config = priorityConfig[priority];

  return (
    <BadgeV2
      variant={config.variant}
      size={size}
      className={className}
    >
      {config.label}
    </BadgeV2>
  );
};

export default PriorityBadgeV2;
