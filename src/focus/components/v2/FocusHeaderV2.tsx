/**
 * FocusHeaderV2 Component
 * Simple terracotta header with "🎯 Focus" title
 * Matches focus-design-spec.html
 */

import React from 'react';
import { gradients } from '@/styles/colors';

export interface FocusHeaderV2Props {
  subtitle?: string;
}

export const FocusHeaderV2: React.FC<FocusHeaderV2Props> = ({
  subtitle = 'Choose a duration to begin',
}) => {
  return (
    <div
      className="px-5 py-5 text-white text-center"
      style={{
        background: gradients.primary,
      }}
    >
      <h1 className="text-3xl font-bold mb-2">⏱️ Focus</h1>
      <p className="text-sm opacity-90">{subtitle}</p>
    </div>
  );
};

export default FocusHeaderV2;
