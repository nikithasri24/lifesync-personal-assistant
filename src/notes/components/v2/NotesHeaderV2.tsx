/**
 * NotesHeaderV2 Component
 * Simple header matching Together tab style
 */

import React from 'react';
import { useThemeColors } from '@/hooks/useThemeColors';

export const NotesHeaderV2: React.FC = () => {
  const colors = useThemeColors();

  return (
    <div className="mb-6">
      <h1 className="text-3xl font-bold flex items-center gap-3 mb-4" style={{ color: colors.text.primary }}>
        <span className="text-4xl">📝</span>
        Notes
      </h1>
    </div>
  );
};

export default NotesHeaderV2;
