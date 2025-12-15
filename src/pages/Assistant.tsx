// Conversational AI Assistant Page - ChatGPT-style Interface
// Mobile-first design with voice and text input

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
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-slate-50">
      <AssistantHeader
        isListening={isListening}
        isThinking={isThinking}
        isSpeaking={isSpeaking}
        onClearHistory={handleClearHistory}
      />

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4 h-full">
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
  );
}
