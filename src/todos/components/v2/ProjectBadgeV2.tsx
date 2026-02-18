/**
 * ProjectBadgeV2 Component
 * Badge for displaying task project
 */

import React from 'react';
import { useThemeColors } from '../../../hooks/useThemeColors';

export interface ProjectBadgeV2Props {
  projectName: string;
  projectColor?: string;
  size?: 'sm' | 'md';
}

export const ProjectBadgeV2: React.FC<ProjectBadgeV2Props> = ({
  projectName,
  projectColor,
  size = 'md',
}) => {
  const colors = useThemeColors();
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';
  const dotSize = size === 'sm' ? 'w-2 h-2' : 'w-2.5 h-2.5';

  return (
    <span
      className={`${sizeClasses} rounded-lg font-semibold inline-flex items-center gap-1.5`}
      style={{
        backgroundColor: colors.badge.bg,
        color: colors.badge.text,
      }}
    >
      <span
        className={`${dotSize} rounded-full flex-shrink-0`}
        style={{ backgroundColor: projectColor || '#6B7280' }}
      />
      {projectName}
    </span>
  );
};

export default ProjectBadgeV2;
