import React from 'react';
import { Sparkles, Trash2, Brain, Mic, Volume2 } from 'lucide-react';

interface AssistantHeaderProps {
  isListening: boolean;
  isThinking: boolean;
  isSpeaking: boolean;
  onClearHistory: () => void;
}

/**
 * Header for Assistant page with status indicator - Redesigned
 */
export function AssistantHeader({
  isListening,
  isThinking,
  isSpeaking,
  onClearHistory,
}: AssistantHeaderProps): React.ReactElement {
  const getStatusInfo = (): { text: string; icon: React.ReactNode; color: string } => {
    if (isListening) {
      return {
        text: 'Listening to you...',
        icon: <Mic className="h-4 w-4" />,
        color: 'text-white bg-red-600 border-red-400'
      };
    }
    if (isThinking) {
      return {
        text: 'Thinking...',
        icon: <Brain className="h-4 w-4" />,
        color: 'text-white bg-indigo-600 border-indigo-400'
      };
    }
    if (isSpeaking) {
      return {
        text: 'Speaking...',
        icon: <Volume2 className="h-4 w-4" />,
        color: 'text-white bg-purple-600 border-purple-400'
      };
    }
    return {
      text: 'Ready to assist',
      icon: <Sparkles className="h-4 w-4" />,
      color: 'text-white bg-emerald-600 border-emerald-400'
    };
  };

  const status = getStatusInfo();

  return (
    <div className="sticky top-0 z-20 bg-slate-900/95 backdrop-blur-xl border-b border-slate-700/50 shadow-sm">
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Left: Logo and Title */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl blur-md opacity-75 animate-pulse" />
              <div className="relative p-3 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl shadow-lg">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white" style={{ color: '#ffffff' }}>
                AI Assistant
              </h1>
              <div className={`flex items-center gap-1.5 mt-0.5 px-2 py-0.5 rounded-full border text-xs font-medium ${status.color}`}>
                {status.icon}
                <span style={{ color: '#ffffff' }}>{status.text}</span>
              </div>
            </div>
          </div>

          {/* Right: Clear History Button */}
          <button
            onClick={onClearHistory}
            className="group p-2.5 text-white hover:text-red-400 hover:bg-red-900/30 rounded-xl transition-all duration-200"
            title="Clear conversation history"
          >
            <Trash2 className="h-5 w-5 group-hover:scale-110 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}
