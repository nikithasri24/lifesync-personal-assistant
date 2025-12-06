/**
 * Status Badge Component
 * Displays project status as a colored badge
 */

import React from 'react';
import { Circle, CheckCircle, Clock } from 'lucide-react';
import type { Project } from '../hooks/useProjectsQuery';
import { STATUS_CONFIG } from '../constants';

interface StatusBadgeProps {
  status: Project['status'];
  withIcon?: boolean;
}

export function StatusBadge({ status, withIcon = false }: StatusBadgeProps): React.JSX.Element {
  const config = STATUS_CONFIG[status];

  const icon = withIcon ? getStatusIcon(status) : null;

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${config.className}`}>
      {icon}
      {config.label}
    </span>
  );
}

function getStatusIcon(status: Project['status']): React.JSX.Element | undefined {
  switch (status) {
    case 'active':
      return <Circle className="h-3 w-3" />;
    case 'completed':
      return <CheckCircle className="h-3 w-3" />;
    case 'on_hold':
      return <Clock className="h-3 w-3" />;
  }
}
