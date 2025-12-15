import React from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';

interface FocusTimerDisplayProps {
  seconds: number;
  active: boolean;
  onPlayPause: () => void;
  onReset: () => void;
}

/**
 * Timer display with controls for Focus page
 */
export function FocusTimerDisplay({
  seconds,
  active,
  onPlayPause,
  onReset,
}: FocusTimerDisplayProps): React.ReactElement {
  const minutesDisplay = String(Math.floor(seconds / 60)).padStart(2, '0');
  const secondsDisplay = String(seconds % 60).padStart(2, '0');

  return (
    <div className="flex flex-col items-center gap-6 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-10 shadow-sm">
      <div className="font-mono text-5xl font-bold text-indigo-700">
        {minutesDisplay}:{secondsDisplay}
      </div>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onPlayPause}
          className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
        >
          {active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {active ? 'Pause' : 'Start'}
        </button>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-2 rounded-full border border-indigo-200 px-4 py-2 text-sm font-medium text-indigo-600 transition hover:bg-white"
        >
          <RotateCcw className="h-4 w-4" />
          Reset
        </button>
      </div>
    </div>
  );
}
