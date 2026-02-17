import React from 'react';
import type { DreamStatus } from '../types/lifeGoals';

interface StatusBadgeProps {
  status: DreamStatus;
  className?: string;
}

/**
 * Color-coded status badge for dreams
 */
export function StatusBadge({ status, className = '' }: StatusBadgeProps): React.ReactElement {
  const styles: Record<DreamStatus, { bg: string; color: string; label: string }> = {
    'dreaming': { bg: 'rgba(123, 31, 162, 0.15)', color: '#7B1FA2', label: 'DREAMING' },
    'planning': { bg: 'rgba(25, 118, 210, 0.15)', color: '#1976D2', label: 'PLANNING' },
    'in-progress': { bg: 'rgba(245, 124, 0, 0.15)', color: '#F57C00', label: 'IN PROGRESS' },
    'achieved': { bg: 'rgba(56, 142, 60, 0.15)', color: '#388E3C', label: 'ACHIEVED' },
    'no-longer-interested': { bg: 'rgba(97, 97, 97, 0.15)', color: '#616161', label: 'NOT INTERESTED' },
  };

  const style = styles[status];

  return (
    <span
      className={`status-badge px-2.5 py-1 rounded-xl text-xs font-bold uppercase tracking-wide ${className}`}
      style={{ background: style.bg, color: style.color }}
    >
      {style.label}
    </span>
  );
}
