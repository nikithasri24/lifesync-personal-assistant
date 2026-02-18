/**
 * AssistantHeaderV2 Component
 * Header for AI Assistant page matching app theme
 */

import React from 'react';
import { Plus } from 'lucide-react';
import { useThemeColors } from '@/hooks/useThemeColors';

interface AssistantHeaderV2Props {
  onNewChat: () => void;
}

export const AssistantHeaderV2: React.FC<AssistantHeaderV2Props> = ({ onNewChat }) => {
  const colors = useThemeColors();

  return (
    <div
      className="sticky top-0 z-10 px-5 py-4 border-b"
      style={{
        backgroundColor: colors.bg.card,
        borderColor: colors.border.light,
      }}
    >
      <div className="flex items-center justify-between">
        <h1
          className="text-2xl font-bold flex items-center gap-2"
          style={{ color: colors.text.primary }}
        >
          🤖 AI Assistant
        </h1>
        <button
          onClick={onNewChat}
          className="w-9 h-9 rounded-lg flex items-center justify-center transition-all"
          style={{
            backgroundColor: colors.bg.secondary,
            color: colors.text.secondary,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = colors.bg.tertiary;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = colors.bg.secondary;
          }}
          aria-label="Start new chat"
        >
          <Plus className="w-5 h-5" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
};

export default AssistantHeaderV2;
