import React from 'react';
import { Brain, Coffee, Pause, Play, Square, SkipForward } from 'lucide-react';
import type { TimerState } from '../types';
import { formatTime, getProgress, getTemplateProgress } from '../utils/timerHelpers';

interface TimerDisplayProps {
  timerState: TimerState;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onSkipToNext: () => void;
  onStartFocus: () => void;
  onShowTemplates: () => void;
}

export const TimerDisplay: React.FC<TimerDisplayProps> = ({
  timerState,
  onPause,
  onResume,
  onStop,
  onSkipToNext,
  onStartFocus,
  onShowTemplates
}) => {
  const progress = getProgress(timerState.currentSession, timerState.timeRemaining);
  const templateProgress = getTemplateProgress(timerState.template, timerState.sessionIndex);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-xl border border-slate-200 dark:border-slate-700">
      <div className="text-center">
        {timerState.currentSession && (
          <div className="mb-6">
            <div className="flex items-center justify-center space-x-3 mb-2">
              {timerState.currentSession.type === 'focus' ? (
                <Brain className="w-6 h-6 text-[#C18B5E]" />
              ) : (
                <Coffee className="w-6 h-6 text-orange-500" />
              )}
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                {timerState.currentSession.name ??
                 (timerState.currentSession.type === 'focus' ? 'Focus Session' :
                  timerState.currentSession.type === 'long-break' ? 'Long Break' : 'Break')}
              </h3>
            </div>

            {timerState.template && (
              <div className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                {timerState.template.name} - Session {timerState.sessionIndex + 1} of {timerState.template.sessions.length}
              </div>
            )}
          </div>
        )}

        <div className={`text-8xl font-black font-mono mb-6 tracking-wider ${
          timerState.currentSession?.type === 'focus' ? 'text-[#8B6F47]' : 'text-orange-500'
        }`}>
          {formatTime(timerState.timeRemaining)}
        </div>

        {timerState.currentSession && (
          <div className="relative w-32 h-32 mx-auto mb-6">
            <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r="50"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-slate-200 dark:text-slate-700"
              />
              <circle
                cx="60"
                cy="60"
                r="50"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeLinecap="round"
                className={timerState.currentSession.type === 'focus' ? 'text-[#C18B5E]' : 'text-orange-500'}
                strokeDasharray={`${2 * Math.PI * 50}`}
                strokeDashoffset={`${2 * Math.PI * 50 * (1 - progress / 100)}`}
                style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                {Math.round(progress)}%
              </span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-center space-x-4">
          {timerState.currentSession ? (
            <>
              <button
                onClick={timerState.isRunning ? onPause : onResume}
                disabled={timerState.strictMode && timerState.isRunning}
                className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-bold transition-all shadow-lg ${
                  timerState.isRunning
                    ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                    : 'bg-green-500 hover:bg-green-600 text-white'
                } ${timerState.strictMode && timerState.isRunning ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
              >
                {timerState.isRunning ? <Pause size={20} /> : <Play size={20} />}
                <span>{timerState.isRunning ? 'Pause' : timerState.isPaused ? 'Resume' : 'Start'}</span>
              </button>

              <button
                onClick={onStop}
                disabled={timerState.strictMode && timerState.isRunning}
                className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-bold transition-all shadow-lg ${
                  timerState.strictMode && timerState.isRunning
                    ? 'opacity-50 cursor-not-allowed bg-gray-400'
                    : 'bg-red-500 hover:bg-red-600 hover:scale-105'
                } text-white`}
              >
                <Square size={20} />
                <span>Stop</span>
              </button>

              {timerState.template && timerState.sessionIndex < timerState.template.sessions.length - 1 && (
                <button
                  onClick={onSkipToNext}
                  className="flex items-center space-x-2 px-6 py-3 bg-[#C18B5E] hover:bg-[#B5795A] text-white rounded-xl font-bold transition-all shadow-lg hover:scale-105"
                >
                  <SkipForward size={20} />
                  <span>Skip</span>
                </button>
              )}
            </>
          ) : (
            <div className="flex items-center space-x-4">
              <button
                onClick={onStartFocus}
                className="flex items-center space-x-2 px-6 py-3 bg-[#C18B5E] hover:bg-[#B5795A] text-white rounded-xl font-bold transition-all shadow-lg hover:scale-105"
              >
                <Brain size={20} />
                <span>Quick Focus</span>
              </button>

              <button
                onClick={onShowTemplates}
                className="flex items-center space-x-2 px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-bold transition-all shadow-lg hover:scale-105"
              >
                <span>Templates</span>
              </button>
            </div>
          )}
        </div>

        {timerState.template && (
          <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
            <div className="flex justify-between text-sm text-slate-600 dark:text-slate-300 mb-2">
              <span>Template Progress</span>
              <span>{timerState.sessionIndex + 1}/{timerState.template.sessions.length}</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${templateProgress}%` }}
              ></div>
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-slate-500 dark:text-slate-400">
              <span>Remaining: {Math.ceil((timerState.template.totalDuration - (timerState.totalElapsed / 60)))} min</span>
              <span>Total: {timerState.template.totalDuration} min</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
