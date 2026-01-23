/**
 * Voice-to-Text Hook
 *
 * Provides speech recognition functionality using the Web Speech API.
 * Handles browser compatibility and provides recording state management.
 * Auto-restarts when recognition times out, and listens for stop phrases.
 */

import { useState, useCallback, useRef, useEffect } from 'react';

// Local type definitions to avoid conflicts with global types
interface VoiceSpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface VoiceSpeechRecognitionErrorEvent {
  error: string;
  message?: string;
}

// Use any for the recognition instance to avoid type conflicts with various browser implementations
type RecognitionInstance = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: VoiceSpeechRecognitionEvent) => void) | null;
  onerror: ((event: VoiceSpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
};

// Stop phrases that will end the recording
const STOP_PHRASES = [
  "that's it for today",
  "thats it for today",
  "that's about it for today",
  "thats about it for today",
  "that is it for today",
  "that is about it for today",
  "stop recording",
  "stop here",
  "end recording",
  "finish recording",
  "i'm done",
  "im done",
  "that's all",
  "thats all",
  "that's all for today",
  "thats all for today",
  "done for today",
  "stop dictation",
  "end dictation",
];

// User-friendly error messages
const ERROR_MESSAGES: Record<string, string> = {
  network: 'Network connection lost. Your transcript has been saved.',
  'not-allowed': 'Microphone access denied. Please allow microphone access.',
  'no-speech': 'No speech detected.',
  aborted: '', // Don't show for aborted
  'audio-capture': 'No microphone found. Please connect a microphone.',
  'service-not-allowed': 'Speech recognition service not allowed.',
};

// Debug logging helper
function debugLog(event: string, data?: Record<string, unknown>): void {
  const timestamp = new Date().toISOString();
  console.log(`[VoiceToText] [${timestamp}] ${event}`, data || '');
}

/**
 * Play an error notification sound using Web Audio API
 * Creates a short descending beep to indicate an error/interruption
 */
function playErrorSound(): void {
  debugLog('Playing error sound');
  try {
    const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();

    // Create oscillator for the beep
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Use a descending tone to indicate "stop/error"
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.15);

    // Set volume and fade out
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

    oscillator.type = 'sine';
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);

    // Clean up after sound plays
    oscillator.onended = () => {
      debugLog('Error sound finished playing');
      audioContext.close();
    };
  } catch (err) {
    console.warn('[VoiceToText] Could not play error sound:', err);
  }
}

/**
 * Check if text contains a stop phrase
 */
function containsStopPhrase(text: string): { found: boolean; phrase: string } {
  const lowerText = text.toLowerCase().trim();
  for (const phrase of STOP_PHRASES) {
    if (lowerText.includes(phrase)) {
      return { found: true, phrase };
    }
  }
  return { found: false, phrase: '' };
}

/**
 * Remove stop phrase from text
 */
function removeStopPhrase(text: string, phrase: string): string {
  const regex = new RegExp(phrase, 'gi');
  return text.replace(regex, '').trim();
}

export interface UseVoiceToTextResult {
  /** Whether voice recognition is supported in this browser */
  isSupported: boolean;
  /** Whether currently recording */
  isRecording: boolean;
  /** Current transcript from speech recognition */
  transcript: string;
  /** Error message if any */
  error: string | null;
  /** Start recording */
  startRecording: () => void;
  /** Stop recording */
  stopRecording: () => void;
  /** Clear the current transcript */
  clearTranscript: () => void;
}

/**
 * Hook for voice-to-text functionality using Web Speech API
 * Auto-restarts when the browser times out the recognition.
 * Listens for stop phrases to end recording naturally.
 */
export function useVoiceToText(): UseVoiceToTextResult {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<RecognitionInstance | null>(null);
  // Track if we should auto-restart (vs manual stop)
  const shouldRestartRef = useRef(false);
  // Track the last interim transcript in case it never gets finalized
  const lastInterimRef = useRef<string>('');
  // Track which interim transcripts have been finalized (to avoid duplicates)
  const lastFinalizedTextRef = useRef<string>('');

  // Check browser support
  const isSupported = typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      shouldRestartRef.current = false;
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const startRecording = useCallback(() => {
    debugLog('startRecording called', { isSupported });

    if (!isSupported) {
      setError('Voice recognition is not supported in this browser');
      return;
    }

    // Clear error but KEEP existing transcript
    setError(null);
    // Only clear transcript if it's a fresh start (no existing content)
    // This preserves transcript when restarting after an error
    shouldRestartRef.current = true;
    // Reset interim tracking for fresh start
    lastInterimRef.current = '';
    lastFinalizedTextRef.current = '';
    debugLog('Starting recognition, shouldRestart set to true');

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognitionClass) {
        setError('Voice recognition is not available');
        return;
      }

      const recognition = new SpeechRecognitionClass() as RecognitionInstance;
      recognitionRef.current = recognition;
      debugLog('Recognition instance created');

      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        debugLog('Recognition started');
        setIsRecording(true);
      };

      recognition.onresult = (event: VoiceSpeechRecognitionEvent) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
          } else {
            interimTranscript += result[0].transcript;
          }
        }

        // Track interim results so we can recover them if they never get finalized
        if (interimTranscript) {
          debugLog('Interim transcript', { text: interimTranscript });
          lastInterimRef.current = interimTranscript;
        }

        if (finalTranscript) {
          debugLog('Final transcript received', {
            text: finalTranscript,
            length: finalTranscript.length
          });

          // Clear interim since we got a final result
          lastInterimRef.current = '';
          // Track what was finalized to avoid duplicates
          lastFinalizedTextRef.current = finalTranscript;

          // Check for stop phrases in the new transcript
          const stopCheck = containsStopPhrase(finalTranscript);

          if (stopCheck.found) {
            debugLog('Stop phrase detected', { phrase: stopCheck.phrase });
            // Remove the stop phrase from the transcript
            const cleanedTranscript = removeStopPhrase(finalTranscript, stopCheck.phrase);
            if (cleanedTranscript) {
              setTranscript((prev) => prev + cleanedTranscript);
            }
            // Stop recording - user said a stop phrase
            shouldRestartRef.current = false;
            recognition.stop();
            return;
          }

          // Add to transcript
          setTranscript((prev) => prev + finalTranscript);
        }
      };

      recognition.onerror = (event: VoiceSpeechRecognitionErrorEvent) => {
        debugLog('Recognition error', {
          error: event.error,
          message: event.message,
          shouldRestart: shouldRestartRef.current
        });

        // Don't show error for 'aborted' as it's expected
        if (event.error === 'aborted') {
          debugLog('Error ignored (aborted)');
          return;
        }

        // For no-speech, let it continue (will restart in onend)
        if (event.error === 'no-speech') {
          debugLog('No speech detected, will attempt restart in onend');
          return;
        }

        // Play error notification sound to alert the user
        debugLog('Playing error sound for error:', { error: event.error });
        playErrorSound();

        // Get user-friendly error message
        const friendlyMessage = ERROR_MESSAGES[event.error] || `Recognition error: ${event.error}`;
        if (friendlyMessage) {
          setError(friendlyMessage);
        }

        // Stop trying to restart on actual errors
        shouldRestartRef.current = false;
        setIsRecording(false);
        // NOTE: Transcript is preserved - not cleared on error
        debugLog('Recording stopped due to error, transcript preserved');
      };

      recognition.onend = () => {
        debugLog('Recognition ended', {
          shouldRestart: shouldRestartRef.current,
          hasRecognition: !!recognitionRef.current,
          pendingInterim: lastInterimRef.current || '(none)'
        });

        // IMPORTANT: Recover any unfinalied interim text before it's lost
        if (lastInterimRef.current) {
          debugLog('Recovering unfinalied interim transcript', {
            text: lastInterimRef.current
          });
          // Add the interim text that was never finalized
          setTranscript((prev) => prev + lastInterimRef.current);
          // Clear it so we don't add it again
          lastInterimRef.current = '';
        }

        // Auto-restart if we should continue (browser timed out)
        if (shouldRestartRef.current) {
          debugLog('Attempting auto-restart in 100ms...');
          try {
            // Small delay before restarting to prevent rapid restarts
            setTimeout(() => {
              if (shouldRestartRef.current && recognitionRef.current) {
                try {
                  debugLog('Auto-restarting recognition now');
                  recognitionRef.current.start();
                } catch (restartErr) {
                  // If restart fails, just end
                  debugLog('Auto-restart failed', { error: restartErr });
                  playErrorSound();
                  setError('Recording interrupted. Your transcript has been saved.');
                  setIsRecording(false);
                  shouldRestartRef.current = false;
                }
              } else {
                debugLog('Auto-restart cancelled', {
                  shouldRestart: shouldRestartRef.current,
                  hasRecognition: !!recognitionRef.current
                });
              }
            }, 100);
          } catch (err) {
            // If restart fails, just end
            debugLog('Auto-restart scheduling failed', { error: err });
            playErrorSound();
            setError('Recording interrupted. Your transcript has been saved.');
            setIsRecording(false);
            shouldRestartRef.current = false;
          }
        } else {
          debugLog('Recognition ended normally (no restart needed)');
          setIsRecording(false);
        }
      };

      recognition.start();
    } catch (err) {
      setError(`Failed to start recording: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setIsRecording(false);
      shouldRestartRef.current = false;
    }
  }, [isSupported]);

  const stopRecording = useCallback(() => {
    debugLog('stopRecording called (manual stop)');
    shouldRestartRef.current = false;
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  const clearTranscript = useCallback(() => {
    debugLog('clearTranscript called');
    setTranscript('');
    setError(null);
  }, []);

  return {
    isSupported,
    isRecording,
    transcript,
    error,
    startRecording,
    stopRecording,
    clearTranscript,
  };
}

export default useVoiceToText;

