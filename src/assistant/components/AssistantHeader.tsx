import React from 'react';
import { Sparkles, Trash2 } from 'lucide-react';

interface AssistantHeaderProps {
  isListening: boolean;
  isThinking: boolean;
  isSpeaking: boolean;
  onClearHistory: () => void;
}

/**
 * Header for Assistant page with status indicator
 */
export function AssistantHeader({
  isListening,
  isThinking,
  isSpeaking,
  onClearHistory,
}: AssistantHeaderProps): React.ReactElement {
  const getStatusText = (): string => {
    if (isListening) return '🎤 Listening...';
    if (isThinking) return '🧠 Thinking...';
    if (isSpeaking) return '🔊 Speaking...';
    return 'Ready to help';
  };

  return (
    <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 py-3">
      <div className="flex items-center justify-between max-w-4xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-orange-500 to-pink-500 rounded-xl">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-900">AI Assistant</h1>
            <p className="text-xs text-slate-500">{getStatusText()}</p>
          </div>
        </div>

        <button
          onClick={onClearHistory}
          className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition"
          title="Clear history"
        >
          <Trash2 className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
