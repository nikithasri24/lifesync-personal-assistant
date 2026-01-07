import { useEffect, useState, useRef } from 'react';
import { logger } from '../services/logger';
import {
  useActiveFocusSession,
  useCreateFocusSession,
  useUpdateFocusSession,
} from '../hooks/useFocusQuery';
import { FocusHeader } from '../focus/components/layout/FocusHeader';
import { FocusTimerDisplay } from '../focus/components/layout/FocusTimerDisplay';

const Focus: React.FC = () => {
  const [seconds, setSeconds] = useState(25 * 60);
  const [active, setActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const sessionIdRef = useRef<string | null>(null);
  const startTimeRef = useRef<Date | null>(null);

  const { activeSession: _activeSession } = useActiveFocusSession();
  const createSession = useCreateFocusSession();
  const updateSession = useUpdateFocusSession();

  // Timer countdown
  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => setSeconds((value) => Math.max(0, value - 1)), 1000);
    return () => clearInterval(timer);
  }, [active]);

  // Auto-stop when timer reaches zero
  useEffect(() => {
    if (seconds === 0 && active) {
      setActive(false);
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
  }, [seconds, active, updateSession]);

  const handlePlayPause = async (): Promise<void> => {
    if (!active) {
      // Starting or resuming a session
      setActive(true);
      setIsPaused(false);

      // Only create a new session if we don't have one (first start)
      if (!sessionIdRef.current) {
        startTimeRef.current = new Date();
        try {
          const newSession = await createSession.mutateAsync({
            type: 'pomodoro',
            duration_minutes: Math.floor(seconds / 60),
            started_at: new Date().toISOString(),
            status: 'in-progress',
          });
          sessionIdRef.current = newSession.id ?? null;
        } catch (error) {
          logger.error('Focus', error as Error, { context: 'create session failed' });
        }
      }
    } else {
      // Pausing the session
      setActive(false);
      setIsPaused(true);

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
    setActive(false);
    setIsPaused(false);
    setSeconds(25 * 60);

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

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6 p-6 text-center">
      <FocusHeader />
      <FocusTimerDisplay
        seconds={seconds}
        active={active}
        isPaused={isPaused}
        onPlayPause={() => void handlePlayPause()}
        onReset={() => void handleReset()}
      />
    </div>
  );
};

export default Focus;
