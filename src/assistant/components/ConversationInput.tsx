import React from 'react';
import { Mic, MicOff, Send, VolumeX, Sparkles } from 'lucide-react';

interface ConversationInputProps {
  textInput: string;
  isListening: boolean;
  isSpeaking: boolean;
  isThinking?: boolean;
  onTextChange: (text: string) => void;
  onTextSubmit: () => void;
  onVoiceToggle: () => void;
  onStopSpeaking: () => void;
}

/**
 * Input area with text input, voice button, and send button - Redesigned
 */
export function ConversationInput({
  textInput,
  isListening,
  isSpeaking,
  isThinking = false,
  onTextChange,
  onTextSubmit,
  onVoiceToggle,
  onStopSpeaking,
}: ConversationInputProps): React.ReactElement {
  return (
    <div className="sticky bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-xl border-t border-slate-700/50 shadow-2xl safe-bottom">
      <div className="max-w-4xl mx-auto px-4 py-4 sm:py-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onTextSubmit();
          }}
          className="flex gap-3 items-end"
        >
          {/* Text Input */}
          <div className="flex-1 relative">
            <textarea
              value={textInput}
              onChange={(e) => onTextChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  onTextSubmit();
                }
              }}
              placeholder={isThinking ? "AI is thinking..." : "Ask me anything... 💬"}
              disabled={isThinking || isListening}
              className="w-full px-5 py-4 pr-14 rounded-2xl border-2 border-slate-200 bg-slate-800 text-white placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none transition-all duration-200 shadow-sm hover:border-slate-300 disabled:opacity-60 disabled:cursor-not-allowed"
              rows={1}
              style={{
                minHeight: '56px',
                maxHeight: '140px',
                fontSize: '16px',
                color: '#ffffff'
              }}
            />

            {/* Send Button (inside textarea) */}
            {textInput.trim() && (
              <button
                type="submit"
                className="absolute right-3 bottom-3 p-2.5 bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg hover:scale-110 active:scale-95 transition-all duration-200"
                aria-label="Send message"
              >
                <Send className="h-5 w-5" />
              </button>
            )}

            {/* AI Sparkle indicator when empty */}
            {!textInput.trim() && (
              <div className="absolute right-3 bottom-3 p-2.5 text-slate-300 pointer-events-none">
                <Sparkles className="h-5 w-5" />
              </div>
            )}
          </div>

          {/* Voice Controls */}
          <div className="flex gap-2">
            {/* Stop Speaking Button */}
            {isSpeaking && (
              <button
                type="button"
                onClick={onStopSpeaking}
                className="p-4 bg-purple-100 text-purple-600 rounded-2xl hover:bg-purple-200 hover:scale-105 active:scale-95 transition-all duration-200 shadow-sm"
                aria-label="Stop speaking"
              >
                <VolumeX className="h-6 w-6" />
              </button>
            )}

            {/* Voice Toggle Button */}
            <button
              type="button"
              onClick={onVoiceToggle}
              className={`relative p-4 rounded-2xl transition-all duration-200 shadow-lg ${
                isListening
                  ? 'bg-gradient-to-br from-red-500 to-pink-500 text-white animate-pulse shadow-red-500/50'
                  : 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white hover:shadow-xl hover:scale-105 active:scale-95'
              }`}
              aria-label={isListening ? 'Stop listening' : 'Start listening'}
            >
              {isListening ? (
                <>
                  <MicOff className="h-6 w-6" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-400 rounded-full animate-ping" />
                </>
              ) : (
                <Mic className="h-6 w-6" />
              )}
            </button>
          </div>
        </form>

        {/* Voice Status Indicator */}
        {isListening && (
          <div className="mt-3 text-center animate-fadeIn">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 border-2 border-red-400 rounded-full shadow-sm">
              <div className="relative">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                <div className="absolute inset-0 w-2 h-2 bg-white rounded-full animate-ping" />
              </div>
              <span className="text-sm text-white font-semibold" style={{ color: '#ffffff' }}>Listening to you...</span>
            </div>
          </div>
        )}

        {/* Thinking Status Indicator */}
        {isThinking && (
          <div className="mt-3 text-center animate-fadeIn">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 border-2 border-indigo-400 rounded-full shadow-sm">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-sm text-white font-semibold" style={{ color: '#ffffff' }}>AI is thinking...</span>
            </div>
          </div>
        )}

        {/* Keyboard Shortcut Hint */}
        {!isListening && !textInput && (
          <div className="mt-2 text-center">
            <p className="text-xs text-white" style={{ color: '#ffffff', opacity: 0.6 }}>
              Press <kbd className="px-1.5 py-0.5 bg-slate-700 border border-slate-500 rounded text-white font-mono">Enter</kbd> to send •
              <kbd className="ml-1 px-1.5 py-0.5 bg-slate-700 border border-slate-500 rounded text-white font-mono">Shift + Enter</kbd> for new line
            </p>
          </div>
        )}
      </div>

      {/* Safe area for mobile devices */}
      <style>{`
        @supports (padding: max(0px)) {
          .safe-bottom {
            padding-bottom: max(1rem, env(safe-area-inset-bottom));
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
