/**
 * ChatMessageV2 Component
 * Message bubble for user and AI messages matching app theme
 */

import React from 'react';
import type { ConversationMessage } from '@/types/infrastructure';

interface ChatMessageV2Props {
  message: ConversationMessage;
  showAvatar?: boolean;
}

export const ChatMessageV2: React.FC<ChatMessageV2Props> = ({
  message,
  showAvatar = true,
}) => {
  const isUser = message.role === 'user';
  const userInitials = 'S'; // Would come from auth in real app

  return (
    <div
      className={`flex gap-2 max-w-[85%] ${
        isUser ? 'self-end flex-row-reverse' : 'self-start'
      }`}
    >
      {/* Avatar */}
      {showAvatar && (
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
          style={{
            backgroundColor: isUser ? '#D4A574' : '#E5E7EB',
            color: isUser ? 'white' : '#6B7280',
            fontSize: isUser ? '0.875rem' : '1rem',
            fontWeight: isUser ? 600 : 400,
          }}
        >
          {isUser ? userInitials : '🤖'}
        </div>
      )}

      {/* Message Bubble */}
      <div
        className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
          isUser ? 'rounded-br-sm' : 'rounded-bl-sm'
        }`}
        style={{
          backgroundColor: isUser ? '#D4A574' : 'white',
          color: isUser ? 'white' : '#1F2937',
          boxShadow: isUser ? 'none' : '0 1px 3px rgba(0,0,0,0.1)',
        }}
      >
        {message.content}
      </div>
    </div>
  );
};

export default ChatMessageV2;
