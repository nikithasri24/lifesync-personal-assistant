/**
 * Voice Input Hook
 * Handles voice recognition for adding shopping items
 */

import { useState, useCallback } from 'react';
import { logger } from '../../services/logger';

interface UseVoiceInputReturn {
  isListening: boolean;
  startVoiceInput: (onResult: (transcript: string) => void) => void;
  stopVoiceInput: () => void;
}

export function useVoiceInput(): UseVoiceInputReturn {
  const [isListening, setIsListening] = useState(false);

  const startVoiceInput = useCallback((onResult: (transcript: string) => void) => {
    if (!('webkitSpeechRecognition' in window)) {
      logger.warn('useVoiceInput', 'Speech recognition not supported');
      return;
    }

    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    setIsListening(true);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onResult(transcript);
      setIsListening(false);
    };

    recognition.onerror = (error: any) => {
      logger.error('useVoiceInput', 'Speech recognition error:', error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  }, []);

  const stopVoiceInput = useCallback(() => {
    setIsListening(false);
  }, []);

  return {
    isListening,
    startVoiceInput,
    stopVoiceInput,
  };
}
