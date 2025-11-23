import React from 'react';
import { Square } from 'lucide-react';
import { type BreathingExercise } from './types';

interface Props {
  exercise: BreathingExercise;
  breathingTimer: number;
  breathingPhase: number;
  onStop: () => void;
}

export const ActiveBreathingExercise: React.FC<Props> = ({
  exercise,
  breathingTimer,
  breathingPhase,
  onStop
}) => {
  const currentPattern = exercise.pattern[breathingPhase % exercise.pattern.length];

  return (
    <div className="bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-500 text-white rounded-2xl p-8 text-center">
      <h3 className="text-2xl font-bold mb-2">{exercise.name}</h3>
      <p className="text-purple-100 mb-8">{exercise.description}</p>

      <div className="relative w-48 h-48 mx-auto mb-8">
        <div className="absolute inset-0 rounded-full border-4 border-white/30"></div>
        <div
          className="absolute inset-4 rounded-full bg-white/20 transition-all duration-1000 flex items-center justify-center"
          style={{
            transform: currentPattern.phase === 'inhale' ? 'scale(1.2)' :
                       currentPattern.phase === 'exhale' ? 'scale(0.8)' : 'scale(1)'
          }}
        >
          <div className="text-center">
            <div className="text-3xl font-bold mb-2">{currentPattern.duration - breathingTimer}</div>
            <div className="text-sm capitalize">{currentPattern.phase}</div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center space-x-4">
        <button
          onClick={onStop}
          className="flex items-center space-x-2 px-6 py-3 bg-white/20 hover:bg-white/30 rounded-xl transition-all"
        >
          <Square size={20} />
          <span>Stop</span>
        </button>
      </div>
    </div>
  );
};
