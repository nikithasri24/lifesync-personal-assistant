import React from 'react';
import { Frown, Meh, Smile, Zap } from 'lucide-react';

interface Props {
  currentMood: number;
  currentEnergy: number;
  onMoodChange: (mood: number) => void;
  onEnergyChange: (energy: number) => void;
  onSave: () => void;
  onCancel: () => void;
}

export const MoodLoggerModal: React.FC<Props> = ({
  currentMood,
  currentEnergy,
  onMoodChange,
  onEnergyChange,
  onSave,
  onCancel
}) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-2xl border border-white/20 max-w-md w-full mx-4">
        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 text-center">
          How are you feeling?
        </h3>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
              Mood
            </label>
            <div className="flex justify-between items-center">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  onClick={() => onMoodChange(value)}
                  className={`p-3 rounded-full transition-all ${
                    currentMood === value
                      ? 'bg-blue-500 text-white scale-110'
                      : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                >
                  {value <= 2 ? <Frown size={24} /> : value <= 3 ? <Meh size={24} /> : <Smile size={24} />}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-2">
              <span>Very Bad</span>
              <span>Great</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
              Energy Level
            </label>
            <div className="flex justify-between items-center">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  onClick={() => onEnergyChange(value)}
                  className={`p-3 rounded-full transition-all ${
                    currentEnergy === value
                      ? 'bg-orange-500 text-white scale-110'
                      : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                >
                  <Zap size={24} />
                </button>
              ))}
            </div>
            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-2">
              <span>Exhausted</span>
              <span>Energized</span>
            </div>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={onCancel}
              className="flex-1 px-6 py-3 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              className="flex-1 px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors"
            >
              Log Entry
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
