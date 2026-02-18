/**
 * TasksHeaderV2 Component
 * Simple page header matching Together tab pattern
 */

import React from 'react';
import { useThemeColors } from '../../../hooks/useThemeColors';

export const TasksHeaderV2: React.FC = () => {
  const colors = useThemeColors();

  return (
    <div className="mb-6">
      <h1 className="text-3xl font-bold flex items-center gap-3 mb-4" style={{ color: colors.text.primary }}>
        <span className="text-4xl">✅</span>
        Tasks
      </h1>
      <p className="text-sm mb-4" style={{ color: colors.text.secondary }}>
        Organize and track your to-dos
      </p>
    </div>
  );
};

export default TasksHeaderV2;
