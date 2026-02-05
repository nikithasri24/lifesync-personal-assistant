import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getVoiceProvider, type VoiceProvider, type VoiceRecognitionResult } from '../lib/voice'
import { logger } from '@/services/logger'

export type VoiceState = {
  supported: boolean
  listening: boolean
  transcript: string
  lang: string
  error?: string
}

export type UseVoice = VoiceState & {
  start: () => void
  stop: () => void
  toggle: () => void
  clear: () => void
  clearError: () => void
  setLang: (lang: string) => void
  speak: (text: string, opts?: { rate?: number; pitch?: number; lang?: string }) => Promise<void>
  requestPermission: () => Promise<boolean>
}

type Options = {
  onFinal?: (text: string) => void
  onInterim?: (text: string) => void
}

/**
 * Cross-platform voice hook using VoiceProvider abstraction
 *
 * Works on:
 * - Web browsers (Web Speech API)
 * - iOS/Android (Capacitor speech plugins)
 */
export function useVoice(initialLang = 'en-US', options?: Options): UseVoice {
  const providerRef = useRef<VoiceProvider | null>(null);
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [lang, setLang] = useState(initialLang);
  const [error, setError] = useState<string | undefined>(undefined);

  // Initialize provider
  useEffect(() => {
    const provider = getVoiceProvider();
    providerRef.current = provider;
    setSupported(provider.isSupported());

    return () => {
      // Note: We don't dispose the provider since it's cached/shared
    };
  }, []);

  // Handle result callback
  const handleResult = useCallback((result: VoiceRecognitionResult) => {
    if (result.isFinal) {
      setTranscript(prev => prev ? `${prev} ${result.transcript}` : result.transcript);
      options?.onFinal?.(result.transcript);
    } else {
      // Show interim results
      options?.onInterim?.(result.transcript);
      setTranscript(prev => {
        const base = prev.replace(/\s+$/, '');
        return base ? `${base} ${result.transcript}` : result.transcript;
      });
    }
  }, [options]);

  const start = useCallback((): void => {
    const provider = providerRef.current;
    if (!provider || !provider.isSupported()) {
      logger.error('Hooks', 'Cannot start voice - provider not available or not supported');
      setError('Voice recognition not supported');
      return;
    }

    logger.debug('Hooks', 'Starting voice recognition...');
    // Clear any previous errors
    setError(undefined);

    // Start listening asynchronously
    provider.startListening({
      lang,
      continuous: true,
      interimResults: true,
      onResult: handleResult,
      onStart: () => {
        logger.debug('Hooks', 'Voice recognition started');
        setListening(true);
      },
      onEnd: () => {
        logger.debug('Hooks', 'Voice recognition ended');
        setListening(false);
      },
      onError: (err) => {
        logger.error('Hooks', 'Voice recognition error', { error: err });
        setError(err);
        setListening(false);
      },
    }).catch((e: unknown) => {
      const err = e as Error;
      logger.error('Hooks', 'Failed to start voice recognition', { error: err.message });
      setError(err.message || 'speech_start_failed');
      setListening(false);
    });
  }, [lang, handleResult]);

  const stop = useCallback((): void => {
    const provider = providerRef.current;
    if (!provider) return;

    provider.stopListening().catch(() => {
      // Ignore stop errors
    });
    setListening(false);
  }, []);

  const toggle = useCallback((): void => {
    if (listening) {
      stop();
    } else {
      start();
    }
  }, [listening, start, stop]);

  const clear = useCallback((): void => setTranscript(''), []);

  const clearError = useCallback((): void => {
    logger.debug('Hooks', 'Clearing voice error state');
    setError(undefined);
  }, []);

  const speak = useCallback(async (
    text: string,
    opts?: { rate?: number; pitch?: number; lang?: string }
  ): Promise<void> => {
    const provider = providerRef.current;
    if (!provider || !provider.isSpeechSupported()) return;

    await provider.speak(text, {
      lang: opts?.lang ?? lang,
      rate: opts?.rate ?? 1,
      pitch: opts?.pitch ?? 1,
    });
  }, [lang]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    const provider = providerRef.current;
    if (!provider) return false;
    return provider.requestPermission();
  }, []);

  return useMemo(
    () => ({
      supported,
      listening,
      transcript,
      lang,
      error,
      start,
      stop,
      toggle,
      clear,
      clearError,
      setLang,
      speak,
      requestPermission
    }),
    [supported, listening, transcript, lang, error, start, stop, toggle, clear, clearError, setLang, speak, requestPermission]
  );
}

export default useVoice
