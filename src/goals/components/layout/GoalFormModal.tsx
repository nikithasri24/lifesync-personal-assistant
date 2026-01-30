import React, { type FormEvent, useEffect } from 'react';
import { Target, X, Users, User, Check } from 'lucide-react';
import type { GoalCategory, GoalPriority, TrackingMode } from '../../types/lifeGoals';

const GOAL_CATEGORIES: GoalCategory[] = ['personal', 'health', 'career', 'financial', 'fitness'];
const GOAL_PRIORITIES: GoalPriority[] = ['low', 'medium', 'high', 'critical'];

export type GoalDraft = {
  title: string;
  description: string;
  category: GoalCategory;
  priority: GoalPriority;
  targetDate: string;
  streakEnabled: boolean;
  streakFrequency: 'daily' | 'weekly' | 'monthly';
  streakTarget: string;
  // Sharing options
  isShared: boolean;
  trackingMode: TrackingMode;
};

interface GoalFormModalProps {
  isOpen: boolean;
  goalDraft: GoalDraft;
  onDraftChange: (draft: GoalDraft) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
  /** Whether merged mode is available (user has a connected partner with merged permissions) */
  isMergedModeAvailable?: boolean;
  /** Whether we're editing an existing goal (changes title and button text) */
  isEditMode?: boolean;
}

/**
 * Modal form for creating or editing a goal
 */
export function GoalFormModal({
  isOpen,
  goalDraft,
  onDraftChange,
  onSubmit,
  onClose,
  isMergedModeAvailable = false,
  isEditMode = false,
}: GoalFormModalProps): React.ReactElement | null {
  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <form onSubmit={onSubmit} className="rounded-lg border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{isEditMode ? 'Edit goal' : 'Create a goal'}</h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-slate-700 dark:text-slate-300">Title</span>
              <input
                required
                value={goalDraft.title}
                onChange={(event) => onDraftChange({ ...goalDraft, title: event.target.value })}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm placeholder-slate-400 focus:border-indigo-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder-slate-400"
                style={{ color: '#1e293b' }}
                placeholder="Launch new product"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-slate-700 dark:text-slate-300">Category</span>
              <select
                value={goalDraft.category}
                onChange={(event) => onDraftChange({ ...goalDraft, category: event.target.value as GoalCategory })}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                style={{ color: '#1e293b' }}
              >
                {GOAL_CATEGORIES.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm sm:col-span-2">
              <span className="font-medium text-slate-700 dark:text-slate-300">Description</span>
              <textarea
                value={goalDraft.description}
                onChange={(event) => onDraftChange({ ...goalDraft, description: event.target.value })}
                className="h-24 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm placeholder-slate-400 focus:border-indigo-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder-slate-400"
                style={{ color: '#1e293b' }}
                placeholder="Why this goal matters and how you will tackle it"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-slate-700 dark:text-slate-300">Priority</span>
              <select
                value={goalDraft.priority}
                onChange={(event) => onDraftChange({ ...goalDraft, priority: event.target.value as GoalPriority })}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                style={{ color: '#1e293b' }}
              >
                {GOAL_PRIORITIES.map((priority) => (
                  <option key={priority} value={priority}>{priority}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-slate-700 dark:text-slate-300">Target date</span>
              <input
                type="date"
                value={goalDraft.targetDate}
                onChange={(event) => onDraftChange({ ...goalDraft, targetDate: event.target.value })}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                style={{ color: '#1e293b' }}
              />
            </label>

          {/* Sharing options - only show if merged mode is available */}
          {isMergedModeAvailable && (
            <div className="sm:col-span-2 border-t border-slate-200 dark:border-slate-600 pt-4">
              <span className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">This goal is for</span>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => onDraftChange({ ...goalDraft, isShared: false, trackingMode: 'combined' })}
                  className="flex-1 flex items-center justify-center gap-2 rounded-lg border-2 px-4 py-3 text-sm font-medium transition"
                  style={{
                    backgroundColor: !goalDraft.isShared ? '#6366f1' : 'white',
                    borderColor: !goalDraft.isShared ? '#6366f1' : '#e2e8f0',
                    color: !goalDraft.isShared ? 'white' : '#475569',
                  }}
                >
                  {!goalDraft.isShared ? <Check className="h-4 w-4" /> : <User className="h-4 w-4" />}
                  Me only
                </button>
                <button
                  type="button"
                  onClick={() => onDraftChange({ ...goalDraft, isShared: true })}
                  className="flex-1 flex items-center justify-center gap-2 rounded-lg border-2 px-4 py-3 text-sm font-medium transition"
                  style={{
                    backgroundColor: goalDraft.isShared ? '#6366f1' : 'white',
                    borderColor: goalDraft.isShared ? '#6366f1' : '#e2e8f0',
                    color: goalDraft.isShared ? 'white' : '#475569',
                  }}
                >
                  {goalDraft.isShared ? <Check className="h-4 w-4" /> : <Users className="h-4 w-4" />}
                  Us (shared)
                </button>
              </div>

              {/* Tracking mode - only show when shared */}
              {goalDraft.isShared && (
                <div className="mt-4">
                  <span className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">How do we track progress?</span>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => onDraftChange({ ...goalDraft, trackingMode: 'combined' })}
                      className="flex-1 rounded-lg border-2 px-4 py-3 text-sm transition"
                      style={{
                        backgroundColor: goalDraft.trackingMode === 'combined' ? '#6366f1' : 'white',
                        borderColor: goalDraft.trackingMode === 'combined' ? '#6366f1' : '#e2e8f0',
                        color: goalDraft.trackingMode === 'combined' ? 'white' : '#475569',
                      }}
                    >
                      <div className="font-medium flex items-center justify-center gap-2">
                        {goalDraft.trackingMode === 'combined' && <Check className="h-4 w-4" />}
                        Together
                      </div>
                      <div className="text-xs mt-1" style={{ color: goalDraft.trackingMode === 'combined' ? '#c7d2fe' : '#64748b' }}>
                        One shared progress (e.g., Save $50k)
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => onDraftChange({ ...goalDraft, trackingMode: 'individual' })}
                      className="flex-1 rounded-lg border-2 px-4 py-3 text-sm transition"
                      style={{
                        backgroundColor: goalDraft.trackingMode === 'individual' ? '#6366f1' : 'white',
                        borderColor: goalDraft.trackingMode === 'individual' ? '#6366f1' : '#e2e8f0',
                        color: goalDraft.trackingMode === 'individual' ? 'white' : '#475569',
                      }}
                    >
                      <div className="font-medium flex items-center justify-center gap-2">
                        {goalDraft.trackingMode === 'individual' && <Check className="h-4 w-4" />}
                        Separately
                      </div>
                      <div className="text-xs mt-1" style={{ color: goalDraft.trackingMode === 'individual' ? '#c7d2fe' : '#64748b' }}>
                        Each tracks their own (e.g., Exercise 3x/week)
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Streak tracking options */}
          <div className="sm:col-span-2 border-t border-slate-200 dark:border-slate-600 pt-4">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={goalDraft.streakEnabled}
                onChange={(e) => onDraftChange({ ...goalDraft, streakEnabled: e.target.checked })}
                className="rounded border-slate-300 dark:border-slate-600"
              />
              <span className="font-medium text-slate-700 dark:text-slate-300">Enable streak tracking</span>
            </label>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 ml-6">Track progress with check-ins and earn XP for consistency</p>

            {goalDraft.streakEnabled && (
              <div className="mt-3 ml-6 grid gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-medium text-slate-700 dark:text-slate-300">Frequency</span>
                  <select
                    value={goalDraft.streakFrequency}
                    onChange={(e) => onDraftChange({ ...goalDraft, streakFrequency: e.target.value as 'daily' | 'weekly' | 'monthly' })}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                    style={{ color: '#1e293b' }}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-medium text-slate-700 dark:text-slate-300">Target streak (days)</span>
                  <input
                    type="number"
                    min="1"
                    value={goalDraft.streakTarget}
                    onChange={(e) => onDraftChange({ ...goalDraft, streakTarget: e.target.value })}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm placeholder-slate-400 focus:border-indigo-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                    style={{ color: '#1e293b' }}
                    placeholder="e.g., 30"
                  />
                </label>
              </div>
            )}
          </div>
        </div>
        <div className="mt-6 flex gap-2 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
          >
            <Target className="h-4 w-4" />
            {isEditMode ? 'Update goal' : 'Save goal'}
          </button>
        </div>
        </form>
      </div>
    </div>
  );
}
