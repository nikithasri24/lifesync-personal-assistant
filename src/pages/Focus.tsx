import { useEffect, useState } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';

const Focus: React.FC = () => {
  const [seconds, setSeconds] = useState(25 * 60);
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => setSeconds((value) => Math.max(0, value - 1)), 1000);
    return () => clearInterval(timer);
  }, [active]);

  useEffect(() => {
    if (seconds === 0) {
      setActive(false);
    }
  }, [seconds]);

  const minutesDisplay = String(Math.floor(seconds / 60)).padStart(2, '0');
  const secondsDisplay = String(seconds % 60).padStart(2, '0');

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
            onClick={() => setActive((value) => !value)}
            className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
          >
            {active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {active ? 'Pause' : 'Start'}
          </button>
          <button
            type="button"
            onClick={() => {
              setActive(false);
              setSeconds(25 * 60);
            }}
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
