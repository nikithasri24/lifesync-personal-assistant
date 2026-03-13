/**
 * GoalCheckinModal
 * Lightweight modal for logging incremental progress toward a goal.
 * Wires up the fully-built useCreateCheckinMutation hook that had no UI.
 */

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useCreateCheckinMutation } from '@/goals/hooks/useGoalCheckinsQuery';
import { useUpdateLifeGoalMutation } from '@/goals/hooks/useLifeGoalsQuery';
import type { LifeGoal, CreateCheckinInput } from '@/goals/types/lifeGoals';
import { logger } from '@/services/logger';

interface GoalCheckinModalProps {
  isOpen: boolean;
  goal: LifeGoal;
  onClose: () => void;
  onSuccess: (newProgress: number) => void;
}

export const GoalCheckinModal: React.FC<GoalCheckinModalProps> = ({
  isOpen,
  goal,
  onClose,
  onSuccess,
}) => {
  const [notes, setNotes] = useState('');
  const [progressUpdate, setProgressUpdate] = useState<string>(String(goal.progress));
  const [wins, setWins] = useState('');
  const [blockers, setBlockers] = useState('');
  const [error, setError] = useState('');

  const createCheckin = useCreateCheckinMutation();
  const updateGoal = useUpdateLifeGoalMutation();

  useEffect(() => {
    if (isOpen) {
      setNotes('');
      setProgressUpdate(String(goal.progress));
      setWins('');
      setBlockers('');
      setError('');
    }
  }, [isOpen, goal.progress]);

  useEffect(() => {
    const handle = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notes.trim()) { setError('Notes are required'); return; }

    const parsedProgress = parseInt(progressUpdate, 10);
    const newProgress = !isNaN(parsedProgress) ? Math.min(100, Math.max(0, parsedProgress)) : undefined;

    try {
      const input: CreateCheckinInput = {
        goalId: goal.id,
        progressUpdate: newProgress,
        notes: notes.trim(),
        wins: wins.trim() || undefined,
        blockers: blockers.trim() || undefined,
      };
      await createCheckin.mutateAsync(input);

      // If progress changed, update goal record too
      if (newProgress !== undefined && newProgress !== goal.progress) {
        const updates: Record<string, unknown> = { progress: newProgress };
        if (newProgress >= 100) {
          updates.status = 'completed';
          updates.completedDate = new Date().toISOString();
        }
        await updateGoal.mutateAsync({ goalId: goal.id, updates: updates as any });
      }

      onSuccess(newProgress ?? goal.progress);
      onClose();
    } catch (err) {
      logger.error('Goals', err as Error, { context: 'GoalCheckinModal submit' });
      setError('Failed to save check-in. Please try again.');
    }
  };

  const isPending = createCheckin.isPending || updateGoal.isPending;

  return (
    <div
      className="fixed top-0 left-0 right-0 bottom-0 z-[60] flex items-end justify-center lg:items-center"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(4px)',
        marginTop: 'calc(-1 * env(safe-area-inset-top, 0px))',
        paddingTop: 'env(safe-area-inset-top, 0px)',
        height: 'calc(100vh + env(safe-area-inset-top, 0px) + env(safe-area-inset-bottom, 0px))',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full bg-white lg:rounded-3xl rounded-t-3xl overflow-hidden flex flex-col"
        style={{ maxHeight: '90vh', maxWidth: '600px' }}
      >
        {/* Drag handle */}
        <div className="lg:hidden pt-2 flex-shrink-0">
          <div className="w-9 h-1 rounded-full mx-auto bg-gray-300" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 flex-shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Log Progress</h2>
            <p className="text-sm text-gray-500 mt-0.5 truncate max-w-xs">{goal.title}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={(e) => { void handleSubmit(e); }} className="flex flex-col flex-1 min-h-0">
          <div className="overflow-y-auto p-6 space-y-5 flex-1" style={{ maxHeight: 'calc(90vh - 160px)' }}>

            {/* Progress */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Current Progress (%)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={progressUpdate}
                  onChange={(e) => setProgressUpdate(e.target.value)}
                  className="flex-1"
                  style={{ accentColor: '#C18B5E' }}
                />
                <span
                  className="text-lg font-bold w-12 text-right"
                  style={{ color: '#C18B5E' }}
                >
                  {progressUpdate}%
                </span>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                What happened? <span className="text-red-500">*</span>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g., Ran 3km today, completed chapter 5..."
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none resize-none transition-all"
                autoFocus
              />
            </div>

            {/* Wins */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Win (optional)
              </label>
              <input
                type="text"
                value={wins}
                onChange={(e) => setWins(e.target.value)}
                placeholder="e.g., Beat my personal record!"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
              />
            </div>

            {/* Blockers */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Blocker (optional)
              </label>
              <input
                type="text"
                value={blockers}
                onChange={(e) => setBlockers(e.target.value)}
                placeholder="e.g., Knee pain slowing me down"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
              />
            </div>

            {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex gap-3 flex-shrink-0 bg-white">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold text-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 px-4 py-3 rounded-xl font-semibold text-white transition-opacity disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)' }}
            >
              {isPending ? 'Saving...' : 'Log Progress'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GoalCheckinModal;
