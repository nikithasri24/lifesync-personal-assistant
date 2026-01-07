// Conversational AI Assistant Page - Modern Redesigned Interface
// Beautiful, engaging design with voice and text input

import React, { useState, useRef, useEffect } from 'react';
import { useConversationalVoice } from '../hooks/useConversationalVoice';
import { useAuth } from '../hooks/useAuth';
import { logger } from '../services/logger';
import { UnsupportedBrowserScreen } from '../assistant/components/UnsupportedBrowserScreen';
import { AssistantHeader } from '../assistant/components/AssistantHeader';
import { EmptyConversationState } from '../assistant/components/EmptyConversationState';
import { MessagesList } from '../assistant/components/MessagesList';
import { ErrorBanner } from '../assistant/components/ErrorBanner';
import { ConversationInput } from '../assistant/components/ConversationInput';

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  functionCalls?: Array<{ name: string; [key: string]: unknown }>;
  timestamp?: Date;
}

export default function Assistant() {
  const { user } = useAuth();
  const {
    isListening,
    isSpeaking,
    isThinking,
    transcript,
    error,
    startListening,
    stopListening,
    stopSpeaking,
    sendTextMessage,
    getMessages,
    clearHistory,
    isSupported
  } = useConversationalVoice(user?.id ?? 'demo-user');

  const [textInput, setTextInput] = useState('');
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  // Update messages from conversation history
  useEffect(() => {
    const interval = setInterval(() => {
      setMessages(getMessages() as ConversationMessage[]);
    }, 500);

    return () => clearInterval(interval);
  }, [getMessages]);

  const handleTextSubmit = async (): Promise<void> => {
    if (!textInput.trim()) return;

    const message = textInput.trim();
    setTextInput('');

    try {
      await sendTextMessage(message);
    } catch (error) {
      logger.error('Assistant', error as Error, { context: 'send message failed' });
    }
  };

  const handleVoiceToggle = (): void => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleClearHistory = (): void => {
    // eslint-disable-next-line no-alert
    if (window.confirm('Clear conversation history?')) {
      clearHistory();
      setMessages([]);
    }
  };

  const handleSuggestionClick = (text: string): void => {
    setTextInput(text);
    setTimeout(() => {
      void handleTextSubmit();
    }, 100);
  };

  if (!isSupported) {
    return <UnsupportedBrowserScreen />;
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-indigo-200/30 to-purple-200/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-br from-pink-200/30 to-orange-200/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 flex flex-col h-full">
        <AssistantHeader
          isListening={isListening}
          isThinking={isThinking}
          isSpeaking={isSpeaking}
          onClearHistory={handleClearHistory}
        />

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {messages.length === 0 && !isThinking && (
              <EmptyConversationState onSuggestionClick={handleSuggestionClick} />
            )}

            <MessagesList
              messages={messages}
              isThinking={isThinking}
              transcript={transcript}
            />

            <div ref={messagesEndRef} />
          </div>
        </div>

        <ErrorBanner error={error} />

        <ConversationInput
          textInput={textInput}
          isListening={isListening}
          isSpeaking={isSpeaking}
          onTextChange={setTextInput}
          onTextSubmit={handleTextSubmit}
          onVoiceToggle={handleVoiceToggle}
          onStopSpeaking={stopSpeaking}
        />
      </div>
    </div>
  );
}
