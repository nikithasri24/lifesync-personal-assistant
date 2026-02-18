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
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ConversationMessage } from '@/types/infrastructure';
import { logger } from '@/services/logger';
import { FeatureErrorBoundary } from '@/components/FeatureErrorBoundary';

function AssistantContent() {
  const colors = useThemeColors();
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // React Query hooks
  const { data: conversations = [], isLoading: conversationsLoading } = useConversations({ limit: 10 });
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

      // TODO: Replace with actual AI backend integration (OpenAI, Anthropic, etc.)
      // This is a simulated response for demonstration purposes
      setTimeout(async () => {
        const aiMessage: ConversationMessage = {
          role: 'assistant',
          content: 'This is a simulated AI response. Integrate with your AI backend here.',
          timestamp: new Date().toISOString(),
          // Example: contextBadge: 'Task Created',
          // Example: suggestions: ['View all tasks', 'Create another task', 'Set a reminder'],
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
    <div style={{ backgroundColor: colors.bg.primary, minHeight: '100vh' }}>
      {/* Centered container following CLAUDE.md pattern */}
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1.5rem', paddingBottom: '5rem' }}>
        {/* Header */}
        <AssistantHeaderV2 onNewChat={handleNewChat} />

        {/* Messages Area */}
        <div className="mt-4" style={{ minHeight: 'calc(100vh - 180px)' }}>
          {/* Loading State */}
          {conversationsLoading && (
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="p-5 rounded-xl animate-pulse"
                  style={{ backgroundColor: colors.bg.white }}
                >
                  <div className="h-16 bg-gray-200 rounded" />
                </div>
              ))}
            </div>
          )}

          {/* Messages */}
          {!conversationsLoading && (
            <div className="flex flex-col gap-3">
              {/* Empty State - Vertically centered */}
              {messages.length === 0 && !isThinking && (
                <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 250px)' }}>
                  <EmptyConversationStateV2 onSuggestionClick={handleSuggestionClick} />
                </div>
              )}

              {/* Timestamp (show at start if messages exist) */}
              {messages.length > 0 && (
                <div className="text-center text-xs py-2" style={{ color: colors.text.tertiary }}>
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
                  onSuggestionClick={handleSuggestionClick}
                />
              ))}

              {/* Typing Indicator */}
              {isThinking && <TypingIndicatorV2 />}

              {/* Auto-scroll anchor */}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Fixed Input Area */}
      <div className="fixed bottom-16 lg:bottom-4 left-0 right-0 z-10" style={{ paddingLeft: 'calc(max(0px, (100vw - 900px) / 2))', paddingRight: 'calc(max(0px, (100vw - 900px) / 2))' }}>
        <div className="px-6">
          <ConversationInputV2
            onSendMessage={handleSendMessage}
            disabled={isThinking || sendMessage.isPending}
            placeholder="Ask me anything..."
          />
        </div>
      </div>
    </div>
  );
}

// Wrap with error boundary for graceful error handling
export default function AssistantV2() {
  return (
    <FeatureErrorBoundary feature="Assistant">
      <AssistantContent />
    </FeatureErrorBoundary>
  );
}
