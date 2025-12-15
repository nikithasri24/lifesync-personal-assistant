import React from 'react';
import { Mic, MicOff, Send, VolumeX } from 'lucide-react';

interface ConversationInputProps {
  textInput: string;
  isListening: boolean;
  isSpeaking: boolean;
  onTextChange: (text: string) => void;
  onTextSubmit: () => void;
  onVoiceToggle: () => void;
  onStopSpeaking: () => void;
}

/**
 * Input area with text input, voice button, and send button
 */
export function ConversationInput({
  textInput,
  isListening,
  isSpeaking,
  onTextChange,
  onTextSubmit,
  onVoiceToggle,
  onStopSpeaking,
}: ConversationInputProps): React.ReactElement {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-primary/95 backdrop-blur-xl border-t border-primary/10 p-4 sm:p-6 safe-bottom shadow-xl">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onTextSubmit();
        }}
        className="max-w-4xl mx-auto flex gap-3 items-end"
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
            placeholder="Type a message or tap the mic..."
            className="w-full px-5 py-4 pr-14 rounded-2xl border-2 border-primary/20 bg-white text-primary placeholder-tertiary focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-accent-primary resize-none transition-all duration-200 shadow-sm"
            rows={1}
            style={{
              minHeight: '56px',
              maxHeight: '140px',
              fontSize: '16px'
            }}
          />

          {/* Send Button (inside textarea) */}
          {textInput.trim() && (
            <button
              type="submit"
              className="absolute right-3 bottom-3 p-2.5 bg-accent-gradient text-white rounded-xl hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-200"
              aria-label="Send message"
            >
              <Send className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Voice Button */}
        <div className="flex gap-2">
          {isSpeaking && (
            <button
              type="button"
              onClick={onStopSpeaking}
              className="p-4 bg-tertiary/50 text-secondary rounded-2xl hover:bg-tertiary hover:scale-105 active:scale-95 transition-all duration-200 shadow-sm"
              aria-label="Stop speaking"
            >
              <VolumeX className="h-6 w-6" />
            </button>
          )}

          <button
            type="button"
            onClick={onVoiceToggle}
            className={`p-4 rounded-2xl transition-all duration-200 shadow-sm ${
              isListening
                ? 'bg-error text-white animate-pulse shadow-lg shadow-error/30'
                : 'bg-accent-gradient text-white hover:shadow-lg hover:scale-105 active:scale-95'
            }`}
            aria-label={isListening ? 'Stop listening' : 'Start listening'}
          >
            {isListening ? (
              <MicOff className="h-6 w-6" />
            ) : (
              <Mic className="h-6 w-6" />
            )}
          </button>
        </div>
      </form>

      {/* Voice Status Indicator */}
      {isListening && (
        <div className="max-w-4xl mx-auto mt-2 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-full">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-sm text-red-900 font-medium">Listening...</span>
          </div>
        </div>
      )}

      {/* Safe area for mobile devices */}
      <style>{`
        @supports (padding: max(0px)) {
          .safe-bottom {
            padding-bottom: max(1rem, env(safe-area-inset-bottom));
          }
        }
      `}</style>
    </div>
  );
}
