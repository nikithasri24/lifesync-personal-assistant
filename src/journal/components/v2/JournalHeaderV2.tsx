/**
 * JournalHeaderV2 Component
 * Simple header matching Together tab pattern
 * Clean emoji + title design without gradient
 */

import React from 'react';
import { Plus } from 'lucide-react';
import { useThemeColors } from '@/hooks/useThemeColors';

interface JournalHeaderV2Props {
  onNewEntry?: () => void;
}

export const JournalHeaderV2: React.FC<JournalHeaderV2Props> = ({ onNewEntry }) => {
  const colors = useThemeColors();

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-bold flex items-center gap-3" style={{ color: colors.text.primary }}>
          <span className="text-4xl">📔</span>
          Journal
        </h1>
        {onNewEntry && (
          <button
            onClick={onNewEntry}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-white transition-opacity"
            style={{ background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)' }}
            aria-label="Create new journal entry"
          >
            <Plus className="w-4 h-4" />
            New Entry
          </button>
        )}
      </div>
    </div>
  );
};

export default JournalHeaderV2;
