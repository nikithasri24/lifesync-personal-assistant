import React from 'react';
import { Sparkles } from 'lucide-react';
import { type BreathingExercise } from './types';

interface Props {
  exercise: BreathingExercise;
  onStart: (exercise: BreathingExercise) => void;
}

export const BreathingExerciseCard: React.FC<Props> = ({ exercise, onStart }) => {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
      <div className="text-center mb-4">
        <div className="text-4xl mb-3">{exercise.icon}</div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
          {exercise.name}
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
          {exercise.description}
        </p>
        <div className="text-xs text-slate-500 dark:text-slate-400">
          {Math.floor(exercise.totalDuration / 60)} minutes
        </div>
      </div>

      <div className="space-y-3 mb-6">
        <h4 className="text-sm font-medium text-slate-900 dark:text-white">Benefits:</h4>
        <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
          {exercise.benefits.map((benefit, index) => (
            <li key={index} className="flex items-center space-x-2">
              <Sparkles className="w-3 h-3 text-purple-500" />
              <span>{benefit}</span>
            </li>
          ))}
        </ul>
      </div>

      <button
        onClick={() => onStart(exercise)}
        className="w-full px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-lg transition-all"
      >
        Start Exercise
      </button>
    </div>
  );
};
