import React from 'react';
import { Mic, Send } from 'lucide-react';

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
 * Input area with text input, voice button, and send button - Clean design
 */
export function ConversationInput({
  textInput,
  isListening,
  isThinking = false,
  onTextChange,
  onTextSubmit,
  onVoiceToggle,
}: ConversationInputProps): React.ReactElement {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onTextSubmit();
    }
  };

  return (
    <div className="bg-white border-t border-gray-200 px-4 py-3">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onTextSubmit();
        }}
        className="flex gap-2 items-end"
      >
        {/* Text Input */}
        <textarea
          value={textInput}
          onChange={(e) => onTextChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask me anything..."
          disabled={isThinking || isListening}
          className="flex-1 px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-[20px] text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:border-[#D4A574] focus:bg-white resize-none transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          rows={1}
          style={{
            minHeight: '40px',
            maxHeight: '100px',
          }}
        />

        {/* Action Buttons */}
        <div className="flex gap-2">
          {/* Voice Button */}
          <button
            type="button"
            onClick={onVoiceToggle}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
              isListening
                ? 'bg-red-500 text-white animate-pulse'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            aria-label="Voice input"
          >
            🎤
          </button>

          {/* Send Button */}
          <button
            type="submit"
            disabled={!textInput.trim() || isThinking}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
              textInput.trim() && !isThinking
                ? 'bg-[#D4A574] text-white hover:bg-[#C18B5E]'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
            aria-label="Send message"
          >
            →
          </button>
        </div>
      </form>
    </div>
  );
}
