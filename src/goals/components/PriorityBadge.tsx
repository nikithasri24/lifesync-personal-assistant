import React from 'react';
import type { GoalPriority } from '../types/lifeGoals';

interface PriorityBadgeProps {
  priority: GoalPriority;
}

/**
 * Color-coded priority badge for goals
 */
export function PriorityBadge({ priority }: PriorityBadgeProps): React.ReactElement {
  const styles: Record<GoalPriority, { bg: string; color: string }> = {
    critical: { bg: 'rgba(244, 67, 54, 0.15)', color: '#D32F2F' },
    high: { bg: 'rgba(255, 152, 0, 0.15)', color: '#F57C00' },
    medium: { bg: 'rgba(25, 118, 210, 0.15)', color: '#1976D2' },
    low: { bg: 'rgba(76, 175, 80, 0.15)', color: '#388E3C' },
  };

  const style = styles[priority];

  return (
    <span
      className="priority-badge px-2.5 py-1 rounded-xl text-xs font-bold uppercase tracking-wide"
      style={{ background: style.bg, color: style.color }}
    >
      {priority}
    </span>
  );
}
