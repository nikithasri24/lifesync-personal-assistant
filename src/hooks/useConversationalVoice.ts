// Conversational Voice Interface using FREE Web Speech API
// Works in Chrome, Safari, Edge (no API keys needed)

import { useState, useCallback, useRef, useEffect } from 'react';
import { logger } from '../services/logger';

import { ConversationEngine } from '../services/conversationEngine';

// TypeScript declarations for Web Speech API
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

// SpeechRecognition types are declared in lib.dom.d.ts
// We just need to use them

export interface ConversationState {
  isListening: boolean;
  isSpeaking: boolean;
  isThinking: boolean;
  transcript: string; // Current partial transcript
  error: string | null;
}

export function useConversationalVoice(userId: string): {
  isListening: boolean;
  isSpeaking: boolean;
  isThinking: boolean;
  transcript: string;
  error: string | null;
  startListening: () => void;
  stopListening: () => void;
  stopSpeaking: () => void;
  sendTextMessage: (text: string) => Promise<{ response: string } | undefined>;
  getMessages: () => Array<unknown>;
  clearHistory: () => void;
  isSupported: boolean;
} {
  const [state, setState] = useState<ConversationState>({
    isListening: false,
    isSpeaking: false,
    isThinking: false,
    transcript: '',
    error: null
  });

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const engineRef = useRef<ConversationEngine | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Initialize conversation engine
  useEffect(() => {
    engineRef.current = new ConversationEngine(userId);
  }, [userId]);

  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition ?? window.webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      setState(prev => ({
        ...prev,
        error: 'Speech recognition not supported in this browser. Try Chrome or Safari.'
      }));
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      // TypeScript doesn't include resultIndex in the type, but it exists in the browser API
      const resultIndex = (event as any).resultIndex || 0;
      for (let i = resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i]?.[0]?.transcript ?? '';
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      // Update UI with interim results
      if (interimTranscript) {
        setState(prev => ({ ...prev, transcript: interimTranscript }));
      }

      // Process final transcript
      if (finalTranscript.trim()) {
        const userMessage = finalTranscript.trim();
        logger.info('UseConversationalVoice', '[Voice] User said', { message: userMessage });

        setState(prev => ({
          ...prev,
          isListening: false,
          isThinking: true,
          transcript: ''
        }));

        recognition.stop();

        // Send to conversation engine
        void (async () => {
          try {
            const result = await engineRef.current?.chat(userMessage);

            if (result) {
              setState(prev => ({
                ...prev,
                isThinking: false,
                isSpeaking: true
              }));

              // Speak response
              await speakText(result.response);

              setState(prev => ({
                ...prev,
                isSpeaking: false
              }));

              // Restart listening after a brief pause
              setTimeout(() => {
                startListening();
              }, 500);
            }
          } catch (error: unknown) {
            logger.error('UseConversationalVoice', 'Voice error', { error: error instanceof Error ? error.message : String(error) });
            setState(prev => ({
              ...prev,
              isThinking: false,
              error: error instanceof Error ? error.message : 'An unknown error occurred'
            }));
          }
        })();
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      logger.error('UseConversationalVoice', 'Recognition error', { error: event.error });

      if (event.error === 'no-speech') {
        // User didn't say anything, just continue listening
        return;
      }

      if (event.error === 'aborted') {
        // Intentional abort, don't show error
        return;
      }

      setState(prev => ({
        ...prev,
        error: `Speech recognition error: ${event.error}`,
        isListening: false
      }));
    };

    recognition.onend = () => {
      setState(prev => ({ ...prev, isListening: false }));
    };

    recognitionRef.current = recognition as unknown as SpeechRecognition;

    return () => {
      recognition.stop();
    };
  }, [userId, engineRef]); // speakText and startListening are stable callbacks, don't need to be in deps

  const startListening = useCallback((): void => {
    if (!recognitionRef.current) {
      setState(prev => ({
        ...prev,
        error: 'Speech recognition not initialized'
      }));
      return;
    }

    try {
      // Stop any ongoing speech
      window.speechSynthesis.cancel();

      setState(prev => ({
        ...prev,
        isListening: true,
        isSpeaking: false,
        error: null,
        transcript: ''
      }));

      recognitionRef.current.start();
    } catch (error: unknown) {
      // Recognition might already be started
      logger.info('UseConversationalVoice', 'Start error (might already be running)', { error: error instanceof Error ? error.message : 'An unknown error occurred' });
    }
  }, []);

  const stopListening = useCallback((): void => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    setState(prev => ({
      ...prev,
      isListening: false,
      transcript: ''
    }));
  }, []);

  const speakText = useCallback((text: string): Promise<void> => {
    return new Promise((resolve) => {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);

      // Use a more natural voice if available
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(voice =>
        voice.name.includes('Samantha') || // macOS
        voice.name.includes('Google US English') || // Chrome
        voice.name.includes('Microsoft Zira') // Windows
      );

      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.rate = 1.1; // Slightly faster for more natural flow
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      utterance.onend = () => {
        logger.info('UseConversationalVoice', '[Voice] Finished speaking');
        resolve();
      };

      utterance.onerror = (event) => {
        logger.error('UseConversationalVoice', 'Speech synthesis error', { error: event.error });
        resolve(); // Resolve anyway to not block
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    });
  }, []);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis.cancel();
    setState(prev => ({ ...prev, isSpeaking: false }));
  }, []);

  const sendTextMessage = useCallback(async (text: string): Promise<{ response: string } | undefined> => {
    setState(prev => ({ ...prev, isThinking: true }));

    try {
      const result = await engineRef.current?.chat(text);

      setState(prev => ({ ...prev, isThinking: false }));

      return result;
    } catch (error: unknown) {
      setState(prev => ({
        ...prev,
        isThinking: false,
        error: error instanceof Error ? error.message : 'An unknown error occurred'
      }));
      throw error;
    }
  }, []);

  const getMessages = useCallback((): Array<unknown> => {
    return engineRef.current?.getHistory() ?? [];
  }, []);

  const clearHistory = useCallback(() => {
    engineRef.current?.clearHistory();
  }, []);

  return {
    ...state,
    startListening,
    stopListening,
    stopSpeaking,
    sendTextMessage,
    getMessages,
    clearHistory,
    isSupported: !!(window.SpeechRecognition ?? window.webkitSpeechRecognition)
  };
}
