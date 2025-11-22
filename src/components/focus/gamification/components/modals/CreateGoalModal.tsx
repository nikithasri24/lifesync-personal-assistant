import React from 'react';
import { Goal } from '../../types';

interface CreateGoalModalProps {
  isOpen: boolean;
  newGoal: Partial<Goal>;
  onUpdateGoal: (updates: Partial<Goal>) => void;
  onClose: () => void;
  onCreate: () => void;
}

export const CreateGoalModal: React.FC<CreateGoalModalProps> = ({
  isOpen,
  newGoal,
  onUpdateGoal,
  onClose,
  onCreate
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-2xl border border-white/20 max-w-md w-full mx-4">
        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Create New Goal</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Goal Title
            </label>
            <input
              type="text"
              value={newGoal.title || ''}
              onChange={(e) => onUpdateGoal({ title: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              placeholder="Enter goal title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Type
            </label>
            <select
              value={newGoal.type}
              onChange={(e) => onUpdateGoal({ type: e.target.value as any })}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Target Value
              </label>
              <input
                type="number"
                value={newGoal.target?.value || ''}
                onChange={(e) => onUpdateGoal({
                  target: { ...newGoal.target!, value: parseInt(e.target.value) || 0 }
                })}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                placeholder="120"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Unit
              </label>
              <select
                value={newGoal.target?.unit || 'minutes'}
                onChange={(e) => onUpdateGoal({
                  target: { ...newGoal.target!, unit: e.target.value }
                })}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              >
                <option value="minutes">Minutes</option>
                <option value="sessions">Sessions</option>
                <option value="percentage">Percentage</option>
                <option value="points">Points</option>
              </select>
            </div>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onCreate}
              className="flex-1 px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors"
            >
              Create Goal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
