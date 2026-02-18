/**
 * AssistantHeaderV2 Component
 * Header for AI Assistant page matching app theme
 */

import React from 'react';
import { Plus } from 'lucide-react';

interface AssistantHeaderV2Props {
  onNewChat: () => void;
}

export const AssistantHeaderV2: React.FC<AssistantHeaderV2Props> = ({ onNewChat }) => {
  return (
    <div
      className="sticky top-0 z-10 px-5 py-4"
      style={{
        background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)',
      }}
    >
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          🤖 AI Assistant
        </h1>
        <button
          onClick={onNewChat}
          className="w-9 h-9 rounded-lg flex items-center justify-center transition-all"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            color: 'white',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
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
