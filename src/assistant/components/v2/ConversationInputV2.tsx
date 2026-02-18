/**
 * ConversationInputV2 Component
 * Input area with send button and voice input
 */

import React, { useState, KeyboardEvent } from 'react';
import { Send, Mic } from 'lucide-react';
import { useThemeColors } from '@/hooks/useThemeColors';

interface ConversationInputV2Props {
  onSendMessage: (message: string) => void;
  onVoiceInput?: () => void;
  disabled?: boolean;
  placeholder?: string;
}

export const ConversationInputV2: React.FC<ConversationInputV2Props> = ({
  onSendMessage,
  onVoiceInput,
  disabled = false,
  placeholder = 'Ask me anything...',
}) => {
  const colors = useThemeColors();
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (input.trim() && !disabled) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      className="flex-shrink-0 px-4 py-3 border-t"
      style={{
        backgroundColor: colors.bg.card,
        borderColor: colors.border.light,
      }}
    >
      <div className="flex gap-2 items-end">
        {/* Text Input */}
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className="flex-1 px-4 py-2.5 rounded-[20px] text-sm resize-none max-h-24 overflow-y-auto focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed transition-all"
          style={{
            backgroundColor: colors.bg.secondary,
            border: `1px solid ${colors.border.light}`,
            color: colors.text.primary,
          }}
          onFocus={(e) => {
            e.target.style.borderColor = colors.accent.primary;
            e.target.style.backgroundColor = colors.bg.primary;
          }}
          onBlur={(e) => {
            e.target.style.borderColor = colors.border.light;
            e.target.style.backgroundColor = colors.bg.secondary;
          }}
        />

        {/* Action Buttons */}
        <div className="flex gap-2">
          {/* Voice Input Button */}
          {onVoiceInput && (
            <button
              onClick={onVoiceInput}
              disabled={disabled}
              className="w-9 h-9 rounded-full flex items-center justify-center transition-all"
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
              aria-label="Voice input"
            >
              <Mic className="w-4 h-4" />
            </button>
          )}

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={disabled || !input.trim()}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: input.trim() && !disabled ? colors.accent.primary : colors.bg.secondary,
              color: input.trim() && !disabled ? 'white' : colors.text.tertiary,
            }}
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConversationInputV2;
