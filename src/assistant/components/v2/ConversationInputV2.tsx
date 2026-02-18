/**
 * ConversationInputV2 Component
 * Input area with send button and voice input
 */

import React, { useState, KeyboardEvent } from 'react';

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
        backgroundColor: 'white',
        borderColor: '#E5E7EB',
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
            backgroundColor: '#F3F4F6',
            border: '1px solid #E5E7EB',
            color: '#1F2937',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#D4A574';
            e.target.style.backgroundColor = 'white';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#E5E7EB';
            e.target.style.backgroundColor = '#F3F4F6';
          }}
        />

        {/* Action Buttons */}
        <div className="flex gap-2">
          {/* Voice Input Button */}
          <button
            onClick={onVoiceInput}
            disabled={disabled}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all text-lg"
            style={{
              backgroundColor: '#F3F4F6',
              color: '#6B7280',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#E5E7EB';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#F3F4F6';
            }}
            aria-label="Voice input"
          >
            🎤
          </button>

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={disabled || !input.trim()}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed text-lg"
            style={{
              backgroundColor: input.trim() && !disabled ? '#D4A574' : '#E5E7EB',
              color: input.trim() && !disabled ? 'white' : '#9CA3AF',
            }}
            onMouseEnter={(e) => {
              if (input.trim() && !disabled) {
                e.currentTarget.style.backgroundColor = '#C18B5E';
              }
            }}
            onMouseLeave={(e) => {
              if (input.trim() && !disabled) {
                e.currentTarget.style.backgroundColor = '#D4A574';
              }
            }}
            aria-label="Send message"
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConversationInputV2;
