// Conversational AI Assistant Page - ChatGPT-style Interface
// Mobile-first design with voice and text input

import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Send, Sparkles, Trash2, Volume2, VolumeX } from 'lucide-react';
import { useConversationalVoice } from '../hooks/useConversationalVoice';
import { useAuth } from '../hooks/useAuth';
import type { ConversationMessage } from '../services/conversationEngine';

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
  } = useConversationalVoice(user?.id || 'demo-user');

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
      setMessages(getMessages());
    }, 500);

    return () => clearInterval(interval);
  }, [getMessages]);

  const handleTextSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!textInput.trim()) return;

    const message = textInput.trim();
    setTextInput('');

    try {
      await sendTextMessage(message);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleVoiceToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleClearHistory = () => {
    if (window.confirm('Clear conversation history?')) {
      clearHistory();
      setMessages([]);
    }
  };

  if (!isSupported) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-md p-8 text-center bg-white rounded-2xl shadow-lg">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Browser Not Supported</h2>
          <p className="text-slate-600">
            Voice conversations require Chrome, Safari, or Edge browser.
            Please switch to a supported browser to use this feature.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-slate-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 py-3">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-orange-500 to-pink-500 rounded-xl">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-900">AI Assistant</h1>
              <p className="text-xs text-slate-500">
                {isListening && '🎤 Listening...'}
                {isThinking && '🧠 Thinking...'}
                {isSpeaking && '🔊 Speaking...'}
                {!isListening && !isThinking && !isSpeaking && 'Ready to help'}
              </p>
            </div>
          </div>

          <button
            onClick={handleClearHistory}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition"
            title="Clear history"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 pb-32">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.length === 0 && !isThinking && (
            <div className="text-center mt-20 space-y-6">
              <div className="inline-block p-4 bg-gradient-to-br from-orange-500 to-pink-500 rounded-full">
                <Sparkles className="h-12 w-12 text-white" />
              </div>

              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">
                  How can I help you today?
                </h2>
                <p className="text-slate-600">
                  Talk to me naturally - I can manage your life
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-3 max-w-2xl mx-auto mt-8">
                {[
                  { text: "I spent $45 at Whole Foods", icon: "💰" },
                  { text: "I want to save $10k for Japan", icon: "✈️" },
                  { text: "What's my week look like?", icon: "📅" },
                  { text: "Remind me to call mom tomorrow", icon: "✅" }
                ].map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setTextInput(suggestion.text);
                      setTimeout(() => handleTextSubmit(), 100);
                    }}
                    className="p-4 text-left bg-white hover:bg-slate-50 rounded-xl border border-slate-200 transition shadow-sm hover:shadow"
                  >
                    <span className="text-2xl mb-2 block">{suggestion.icon}</span>
                    <span className="text-sm text-slate-700">{suggestion.text}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-br from-orange-500 to-pink-500 text-white'
                    : 'bg-white border border-slate-200 text-slate-900'
                }`}
              >
                <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap">
                  {msg.content}
                </p>

                {msg.functionCalls && msg.functionCalls.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-200/50 space-y-1">
                    {msg.functionCalls.map((fc, j) => (
                      <div key={j} className="text-xs opacity-75">
                        ✓ {fc.name.replace(/_/g, ' ')}
                      </div>
                    ))}
                  </div>
                )}

                <div className="text-xs opacity-50 mt-2">
                  {msg.timestamp?.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            </div>
          ))}

          {isThinking && (
            <div className="flex justify-start">
              <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3">
                <div className="flex gap-1">
                  <div
                    className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                    style={{ animationDelay: '0ms' }}
                  />
                  <div
                    className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                    style={{ animationDelay: '150ms' }}
                  />
                  <div
                    className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                    style={{ animationDelay: '300ms' }}
                  />
                </div>
              </div>
            </div>
          )}

          {transcript && (
            <div className="flex justify-end">
              <div className="max-w-[85%] rounded-2xl px-4 py-3 bg-orange-100 border border-orange-200 text-orange-900">
                <p className="text-sm italic">{transcript}...</p>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-20 max-w-md mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-900">
            {error}
          </div>
        </div>
      )}

      {/* Input Area - Fixed at Bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-slate-200 p-4 safe-bottom">
        <form
          onSubmit={handleTextSubmit}
          className="max-w-4xl mx-auto flex gap-2 items-end"
        >
          {/* Text Input */}
          <div className="flex-1 relative">
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleTextSubmit();
                }
              }}
              placeholder="Type a message or tap the mic..."
              className="w-full px-4 py-3 pr-12 rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
              rows={1}
              style={{
                minHeight: '48px',
                maxHeight: '120px'
              }}
            />

            {/* Send Button (inside textarea) */}
            {textInput.trim() && (
              <button
                type="submit"
                className="absolute right-2 bottom-2 p-2 bg-gradient-to-br from-orange-500 to-pink-500 text-white rounded-xl hover:shadow-lg transition"
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
                onClick={stopSpeaking}
                className="p-4 bg-slate-200 text-slate-700 rounded-2xl hover:bg-slate-300 transition"
              >
                <VolumeX className="h-6 w-6" />
              </button>
            )}

            <button
              type="button"
              onClick={handleVoiceToggle}
              className={`p-4 rounded-2xl transition-all ${
                isListening
                  ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/50'
                  : 'bg-gradient-to-br from-orange-500 to-pink-500 text-white hover:shadow-lg'
              }`}
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
      </div>

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
