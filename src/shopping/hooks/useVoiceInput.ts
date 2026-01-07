/**
 * Voice Input Hook
 * Handles voice recognition for adding shopping items
 */

import { useState, useCallback, useRef } from 'react';
import { logger } from '../../services/logger';
import '../../types/experimental-web-apis.d.ts';

interface UseVoiceInputReturn {
  isListening: boolean;
  startVoiceInput: (onResult: (transcript: string) => void) => void;
  stopVoiceInput: () => void;
}

export function useVoiceInput(): UseVoiceInputReturn {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<ISpeechRecognition | null>(null);

  const startVoiceInput = useCallback((onResult: (transcript: string) => void) => {
    if (!window.webkitSpeechRecognition) {
      logger.warn('useVoiceInput', 'Speech recognition not supported');
      return;
    }

    const recognition = new window.webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognitionRef.current = recognition;

    setIsListening(true);

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      onResult(transcript);
      setIsListening(false);
    };

    recognition.onerror = (error) => {
      logger.error('useVoiceInput', 'Speech recognition error:', error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognition.start();
  }, []);

  const stopVoiceInput = useCallback(() => {
    const recognition = recognitionRef.current;
    if (recognition) {
      try {
        recognition.stop();
      } catch (error) {
        logger.error('useVoiceInput', 'Failed to stop speech recognition', {
          error: error instanceof Error ? error.message : String(error),
        });
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  return {
    isListening,
    startVoiceInput,
    stopVoiceInput,
  };
}
