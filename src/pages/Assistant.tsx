/**
 * Assistant Page V2
 * AI conversational assistant
 * Uses React Query for data management
 */

import React, { useState, useRef, useEffect } from 'react';
import { useConversations, useCreateConversation, useSendMessage } from '@/hooks/useConversationsQuery';
import { AssistantHeaderV2 } from '@/assistant/components/v2/AssistantHeaderV2';
import { ChatMessageV2 } from '@/assistant/components/v2/ChatMessageV2';
import { TypingIndicatorV2 } from '@/assistant/components/v2/TypingIndicatorV2';
import { EmptyConversationStateV2 } from '@/assistant/components/v2/EmptyConversationStateV2';
import { ConversationInputV2 } from '@/assistant/components/v2/ConversationInputV2';
import type { ConversationMessage } from '@/types/infrastructure';
import { logger } from '@/services/logger';

export default function AssistantV2() {
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // React Query hooks
  const { data: conversations = [] } = useConversations({ limit: 10 });
  const createConversation = useCreateConversation();
  const sendMessage = useSendMessage();

  // Get active conversation
  const activeConversation = conversations.find((c) => c.id === activeConversationId);
  const messages = activeConversation?.messages || [];

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  // Load most recent conversation on mount
  useEffect(() => {
    if (conversations.length > 0 && !activeConversationId) {
      setActiveConversationId(conversations[0].id);
    }
  }, [conversations, activeConversationId]);

  const handleNewChat = async () => {
    try {
      const newConv = await createConversation.mutateAsync({
        title: 'New Conversation',
        messages: [],
      });
      setActiveConversationId(newConv.id);
    } catch (error) {
      logger.error('Assistant', error as Error, { context: 'Failed to create conversation' });
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    try {
      // Create conversation if none exists
      let conversationId = activeConversationId;
      if (!conversationId) {
        const newConv = await createConversation.mutateAsync({
          title: content.slice(0, 50),
          messages: [],
        });
        conversationId = newConv.id;
        setActiveConversationId(conversationId);
      }

      // Add user message
      const userMessage: ConversationMessage = {
        role: 'user',
        content,
        timestamp: new Date().toISOString(),
      };

      await sendMessage.mutateAsync({
        conversationId: conversationId!,
        message: userMessage,
      });

      // Simulate AI thinking
      setIsThinking(true);

      // Simulate AI response (replace with actual AI call)
      setTimeout(async () => {
        const aiMessage: ConversationMessage = {
          role: 'assistant',
          content: 'This is a simulated AI response. Integrate with your AI backend here.',
          timestamp: new Date().toISOString(),
        };

        await sendMessage.mutateAsync({
          conversationId: conversationId!,
          message: aiMessage,
        });

        setIsThinking(false);
      }, 2000);
    } catch (error) {
      logger.error('Assistant', error as Error, { context: 'Failed to send message' });
      setIsThinking(false);
    }
  };

  const handleSuggestionClick = (text: string) => {
    void handleSendMessage(text);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <AssistantHeaderV2 onNewChat={handleNewChat} />

      {/* Messages Area - Full width with specific background */}
      <div
        className="flex-1 overflow-y-auto px-4 py-4 pb-32"
        style={{ backgroundColor: '#F9FAFB' }}
      >
        <div className="flex flex-col gap-3">
          {/* Empty State */}
          {messages.length === 0 && !isThinking && (
            <EmptyConversationStateV2 onSuggestionClick={handleSuggestionClick} />
          )}

          {/* Timestamp (show at start if messages exist) */}
          {messages.length > 0 && (
            <div className="text-center text-xs text-gray-400 py-2">
              {new Date(messages[0].timestamp).toLocaleString('en-US', {
                weekday: 'long',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
              })}
            </div>
          )}

          {/* Message List */}
          {messages.map((message, index) => (
            <ChatMessageV2
              key={index}
              message={message}
              showAvatar
            />
          ))}

          {/* Typing Indicator */}
          {isThinking && <TypingIndicatorV2 />}

          {/* Auto-scroll anchor */}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Fixed Input Area - positioned above tab bar on mobile, accounts for sidebar on desktop */}
      <div className="fixed bottom-16 lg:bottom-0 left-0 lg:left-80 right-0 z-10">
        <ConversationInputV2
          onSendMessage={handleSendMessage}
          disabled={isThinking || sendMessage.isPending}
          placeholder="Ask me anything..."
        />
      </div>
    </div>
  );
}
