import React from 'react';
import { Plus } from 'lucide-react';

interface AssistantHeaderProps {
  isListening: boolean;
  isThinking: boolean;
  isSpeaking: boolean;
  onClearHistory: () => void;
}

/**
 * Header for Assistant page - Clean terracotta design
 */
export function AssistantHeader({
  onClearHistory,
}: AssistantHeaderProps): React.ReactElement {
  return (
    <div className="bg-gradient-to-br from-[#D4A574] to-[#C18B5E] px-5 py-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          🤖 AI Assistant
        </h1>
        <button
          onClick={onClearHistory}
          className="w-9 h-9 rounded-lg bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-all"
          aria-label="Start new chat"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
