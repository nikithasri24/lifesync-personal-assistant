/**
 * Mobile Voice Floating Action Button
 *
 * A floating button for voice input that's optimized for mobile:
 * - Positioned in safe area
 * - Haptic feedback on native
 * - Visual feedback during listening
 * - Expandable for quick actions
 */

import React, { useState, useCallback } from 'react';
import { Mic, X, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import { usePlatform } from '@/hooks/usePlatform';
import { useVoice } from '@/hooks/useVoice';

interface MobileVoiceFABProps {
  onTranscript?: (text: string) => void;
  onError?: (error: string) => void;
  className?: string;
  position?: 'bottom-right' | 'bottom-center' | 'bottom-left';
}

export function MobileVoiceFAB({
  onTranscript,
  onError,
  className,
  position = 'bottom-right',
}: MobileVoiceFABProps): React.ReactElement | null {
  const { isNative } = usePlatform();
  const [interimText, setInterimText] = useState('');

  const {
    listening: isListening,
    supported: isSupported,
    start: startListening,
    stop: stopListening,
    transcript,
    error,
  } = useVoice('en-US', {
    onInterim: (text) => setInterimText(text),
  });
  
  const handlePress = useCallback(async () => {
    if (isListening) {
      await stopListening();
      // Use transcript from hook state
      if (transcript && onTranscript) {
        onTranscript(transcript);
      }
      setInterimText('');
    } else {
      setInterimText('');
      await startListening();
    }
  }, [isListening, startListening, stopListening, transcript, onTranscript]);

  const handleCancel = useCallback(() => {
    stopListening();
    setInterimText('');
  }, [stopListening]);
  
  // Report errors
  React.useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);
  
  // Don't render if voice not supported
  if (!isSupported) {
    return null;
  }
  
  const positionClasses = {
    'bottom-right': 'right-4',
    'bottom-center': 'left-1/2 -translate-x-1/2',
    'bottom-left': 'left-4',
  };
  
  return (
    <div
      className={clsx(
        'fixed z-50',
        positionClasses[position],
        // Safe area bottom positioning
        isNative
          ? 'bottom-[max(1.5rem,calc(env(safe-area-inset-bottom)+0.5rem))]'
          : 'bottom-6',
        className
      )}
    >
      {/* Interim text bubble */}
      {isListening && interimText && (
        <div
          className={clsx(
            'absolute bottom-full mb-3 px-4 py-2 rounded-2xl',
            'bg-white dark:bg-slate-800 shadow-lg',
            'max-w-[280px] text-sm text-slate-700 dark:text-slate-200',
            position === 'bottom-right' && 'right-0',
            position === 'bottom-center' && 'left-1/2 -translate-x-1/2',
            position === 'bottom-left' && 'left-0'
          )}
        >
          <p className="line-clamp-3">{interimText}</p>
          <div
            className={clsx(
              'absolute -bottom-2 w-4 h-4 rotate-45',
              'bg-white dark:bg-slate-800',
              position === 'bottom-right' && 'right-6',
              position === 'bottom-center' && 'left-1/2 -translate-x-1/2',
              position === 'bottom-left' && 'left-6'
            )}
          />
        </div>
      )}

      {/* Cancel button (shown when listening) */}
      {isListening && (
        <button
          onClick={handleCancel}
          className={clsx(
            'absolute -top-12 left-1/2 -translate-x-1/2',
            'w-10 h-10 rounded-full',
            'bg-slate-200 dark:bg-slate-700',
            'flex items-center justify-center',
            'shadow-md hover:shadow-lg transition-shadow'
          )}
        >
          <X className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        </button>
      )}

      {/* Main FAB button */}
      <button
        onClick={handlePress}
        className={clsx(
          'w-14 h-14 rounded-full',
          'flex items-center justify-center',
          'shadow-lg hover:shadow-xl transition-all',
          'focus:outline-none focus:ring-2 focus:ring-offset-2',
          isListening
            ? 'bg-red-500 hover:bg-red-600 focus:ring-red-500 animate-pulse'
            : 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500'
        )}
      >
        {isListening ? (
          <div className="relative">
            <Mic className="w-6 h-6 text-white" />
            {/* Listening indicator rings */}
            <span className="absolute inset-0 rounded-full animate-ping bg-white/30" />
          </div>
        ) : (
          <Mic className="w-6 h-6 text-white" />
        )}
      </button>
      
      {/* Listening status text */}
      {isListening && (
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
          <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <Loader2 className="w-3 h-3 animate-spin" />
            Listening...
          </span>
        </div>
      )}
    </div>
  );
}

export default MobileVoiceFAB;

