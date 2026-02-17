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
  FocusHeaderV2,
  CircularTimerV2,
  PresetGridV2,
  TimerControlsV2,
  type TimerPreset,
} from '../focus/components/v2';
import { useThemeColors } from '../hooks/useThemeColors';

type TimerState = 'ready' | 'active' | 'paused' | 'complete';

const Focus: React.FC = () => {
  const colors = useThemeColors();

  const [seconds, setSeconds] = useState(25 * 60);
  const [totalSeconds, setTotalSeconds] = useState(25 * 60);
  const [timerState, setTimerState] = useState<TimerState>('ready');
  const [activePreset, setActivePreset] = useState<string | null>('pomodoro');
  const sessionIdRef = useRef<string | null>(null);
  const startTimeRef = useRef<Date | null>(null);

  const { activeSession: _activeSession } = useActiveFocusSession();
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
    <div
      className="min-h-screen pb-24"
      style={{ backgroundColor: colors.bg.primary }}
    >
      {/* Header */}
      <FocusHeaderV2 subtitle={getSubtitle()} />

      {/* Main Content */}
      <div className="max-w-md mx-auto px-6">
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
          presets={[
            { id: 'pomodoro', name: 'Pomodoro', emoji: '🍅', minutes: 25 },
            { id: 'short-break', name: 'Short Break', emoji: '☕', minutes: 5 },
            { id: 'deep-work', name: 'Deep Work', emoji: '🧠', minutes: 90 },
            { id: 'long-break', name: 'Long Break', emoji: '🌟', minutes: 15 },
          ]}
        />
      </div>
    </div>
  );
};

export default Focus;
