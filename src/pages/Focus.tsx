/**
 * Focus Page
 *
 * Updated with V2 components to match focus-design-spec.html
 * Pomodoro timer with presets and session tracking
 */

import { useEffect, useState, useRef } from 'react';
import { logger } from '../services/logger';
import {
  useActiveFocusSession,
  useCreateFocusSession,
  useUpdateFocusSession,
} from '../hooks/useFocusQuery';
import {
  CircularTimerV2,
  PresetGridV2,
  TimerControlsV2,
  type TimerPreset,
} from '../focus/components/v2';
import { useThemeColors } from '../hooks/useThemeColors';
import { FeatureErrorBoundary } from '@/components/FeatureErrorBoundary';

type TimerState = 'ready' | 'active' | 'paused' | 'complete';

const PRESETS: TimerPreset[] = [
  { id: 'pomodoro', name: 'Pomodoro', emoji: '🍅', minutes: 25 },
  { id: 'short-break', name: 'Short Break', emoji: '☕', minutes: 5 },
  { id: 'deep-work', name: 'Deep Work', emoji: '🧠', minutes: 90 },
  { id: 'long-break', name: 'Long Break', emoji: '🌟', minutes: 15 },
];

const FocusContent: React.FC = () => {
  const colors = useThemeColors();

  const [seconds, setSeconds] = useState(25 * 60);
  const [totalSeconds, setTotalSeconds] = useState(25 * 60);
  const [timerState, setTimerState] = useState<TimerState>('ready');
  const [activePreset, setActivePreset] = useState<string | null>('pomodoro');
  const sessionIdRef = useRef<string | null>(null);
  const startTimeRef = useRef<Date | null>(null);

  const { activeSession: _activeSession, isLoading } = useActiveFocusSession();
  const createSession = useCreateFocusSession();
  const updateSession = useUpdateFocusSession();

  // Timer countdown
  useEffect(() => {
    if (timerState === 'active') {
      const timer = setInterval(() => {
        setSeconds((value) => {
          if (value <= 1) {
            return 0;
          }
          return value - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timerState]);

  // Auto-complete when timer reaches zero
  useEffect(() => {
    if (seconds === 0 && timerState === 'active') {
      setTimerState('complete');

      // Complete the session
      if (sessionIdRef.current && startTimeRef.current) {
        const actualDurationSeconds = Math.floor((Date.now() - startTimeRef.current.getTime()) / 1000);
        updateSession.mutate({
          id: sessionIdRef.current,
          updates: {
            status: 'completed',
            completed_at: new Date().toISOString(),
            actual_duration_seconds: actualDurationSeconds,
          },
        });
        sessionIdRef.current = null;
        startTimeRef.current = null;
      }
    }
  }, [seconds, timerState, updateSession]);

  const handlePlayPause = async (): Promise<void> => {
    if (timerState === 'ready' || timerState === 'paused' || timerState === 'complete') {
      // Starting or resuming a session
      setTimerState('active');

      // Only create a new session if we don't have one (first start)
      if (!sessionIdRef.current) {
        startTimeRef.current = new Date();
        try {
          const newSession = await createSession.mutateAsync({
            type: 'pomodoro',
            duration_minutes: Math.floor(totalSeconds / 60),
            started_at: new Date().toISOString(),
            status: 'in-progress',
          });
          sessionIdRef.current = newSession.id ?? null;
        } catch (error) {
          logger.error('Focus', error as Error, { context: 'create session failed' });
        }
      }
    } else if (timerState === 'active') {
      // Pausing the session
      setTimerState('paused');

      if (sessionIdRef.current) {
        try {
          await updateSession.mutateAsync({
            id: sessionIdRef.current,
            updates: {
              status: 'in-progress',
            },
          });
        } catch (error) {
          logger.error('Focus', error as Error, { context: 'pause session failed' });
        }
      }
    }
  };

  const handleReset = async (): Promise<void> => {
    setTimerState('ready');
    setSeconds(totalSeconds);

    // Cancel the current session if exists
    if (sessionIdRef.current) {
      try {
        await updateSession.mutateAsync({
          id: sessionIdRef.current,
          updates: {
            status: 'abandoned',
            completed_at: new Date().toISOString(),
          },
        });
      } catch (error) {
        logger.error('Focus', error as Error, { context: 'cancel session failed' });
      }

      sessionIdRef.current = null;
      startTimeRef.current = null;
    }
  };

  const handleSelectPreset = (preset: TimerPreset) => {
    // Only allow changing preset when timer is not active
    if (timerState === 'active') return;

    const newSeconds = preset.minutes * 60;
    setSeconds(newSeconds);
    setTotalSeconds(newSeconds);
    setActivePreset(preset.id);
    setTimerState('ready');
  };

  // Determine subtitle based on state
  const getSubtitle = () => {
    switch (timerState) {
      case 'ready':
        return 'Choose a duration to begin';
      case 'active':
        return 'Stay focused';
      case 'paused':
        return 'Paused';
      case 'complete':
        return 'Great work!';
      default:
        return 'Choose a duration to begin';
    }
  };

  return (
    <div style={{ backgroundColor: colors.bg.primary, minHeight: '100vh' }}>
      {/* All content centered with max width - CLAUDE.md pattern */}
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1.5rem', paddingBottom: '5rem' }}>
        {/* Header with Terracotta Gradient */}
        <div
          style={{
            background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)',
            padding: '60px 1.5rem 20px',
            color: 'white',
            marginLeft: '-1.5rem',
            marginRight: '-1.5rem',
            marginTop: '-1.5rem',
            marginBottom: '16px',
            borderRadius: '0 0 16px 16px',
            textAlign: 'center',
          }}
        >
          <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '8px' }}>
            ⏱️
          </h1>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>
            {getSubtitle()}
          </div>
        </div>

        {/* Loading Skeleton */}
        {isLoading ? (
          <div className="animate-pulse">
            {/* Timer Skeleton */}
            <div className="flex justify-center items-center py-8">
              <div
                className="rounded-full flex items-center justify-center"
                style={{
                  width: 240,
                  height: 240,
                  backgroundColor: colors.border.medium,
                }}
              />
            </div>

            {/* Controls Skeleton */}
            <div className="flex items-center justify-center gap-4 mt-8">
              <div
                className="w-16 h-16 rounded-full"
                style={{ backgroundColor: colors.border.medium }}
              />
              <div
                className="w-20 h-20 rounded-full"
                style={{ backgroundColor: colors.border.medium }}
              />
              <div
                className="w-16 h-16 rounded-full"
                style={{ backgroundColor: colors.border.medium }}
              />
            </div>

            {/* Presets Skeleton */}
            <div className="mt-8">
              <div
                className="h-4 w-24 mx-auto rounded mb-3"
                style={{ backgroundColor: colors.border.medium }}
              />
              <div className="grid grid-cols-2 gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl"
                    style={{
                      backgroundColor: colors.border.medium,
                      height: '100px',
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Circular Timer */}
            <CircularTimerV2
              seconds={seconds}
              totalSeconds={totalSeconds}
              state={timerState}
              size={240}
            />

            {/* Timer Controls */}
            <TimerControlsV2
              isActive={timerState === 'active'}
              isPaused={timerState === 'paused'}
              onPlayPause={() => void handlePlayPause()}
              onReset={() => void handleReset()}
              disabled={createSession.isPending || updateSession.isPending}
            />

            {/* Preset Grid */}
            <PresetGridV2
              activePresetId={activePreset}
              onSelectPreset={handleSelectPreset}
              presets={PRESETS}
            />
          </>
        )}
      </div>
    </div>
  );
};

// Wrap with error boundary for graceful error handling
const Focus: React.FC = () => {
  return (
    <FeatureErrorBoundary feature="Focus">
      <FocusContent />
    </FeatureErrorBoundary>
  );
};

export default Focus;
