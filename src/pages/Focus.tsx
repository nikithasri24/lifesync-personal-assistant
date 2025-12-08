import { useEffect, useState, useRef } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { logger } from '../services/logger';
import {
  useActiveFocusSession,
  useCreateFocusSession,
  useUpdateFocusSession,
} from '../hooks/useFocusQuery';

const Focus: React.FC = () => {
  const [seconds, setSeconds] = useState(25 * 60);
  const [active, setActive] = useState(false);
  const sessionIdRef = useRef<string | null>(null);
  const startTimeRef = useRef<Date | null>(null);

  const { _activeSession } = useActiveFocusSession();
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

  const minutesDisplay = String(Math.floor(seconds / 60)).padStart(2, '0');
  const secondsDisplay = String(seconds % 60).padStart(2, '0');

  const handlePlayPause = async (): Promise<void> => {
    if (!active) {
      // Starting a new session
      setActive(true);
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
        logger.error('Failed to create focus session:', { error });
      }
    } else {
      // Pausing the session
      setActive(false);

      if (sessionIdRef.current) {
        try {
          await updateSession.mutateAsync({
            id: sessionIdRef.current,
            updates: {
              status: 'in-progress',
            },
          });
        } catch (error) {
          logger.error('Failed to pause focus session:', { error });
        }
      }
    }
  };

  const handleReset = async (): Promise<void> => {
    setActive(false);
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
        logger.error('Failed to cancel focus session:', { error });
      }

      sessionIdRef.current = null;
      startTimeRef.current = null;
    }
  };

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6 p-6 text-center">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-slate-900">Focus timer</h1>
        <p className="text-sm text-slate-600">
          A lightweight Pomodoro timer to help you carve out distraction-free sessions. Hit start and stay in flow.
        </p>
      </header>

      <div className="flex flex-col items-center gap-6 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-10 shadow-sm">
        <div className="font-mono text-5xl font-bold text-indigo-700">
          {minutesDisplay}:{secondsDisplay}
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => void handlePlayPause()}
            className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
          >
            {active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {active ? 'Pause' : 'Start'}
          </button>
          <button
            type="button"
            onClick={() => void handleReset()}
            className="inline-flex items-center gap-2 rounded-full border border-indigo-200 px-4 py-2 text-sm font-medium text-indigo-600 transition hover:bg-white"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};

export default Focus;
