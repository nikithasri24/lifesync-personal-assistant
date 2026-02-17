import React, { type FormEvent, useEffect } from 'react';
import { Sparkles, X, Users, User, Check } from 'lucide-react';
import type { DreamCategory, TrackingMode } from '../../types/lifeGoals';

const DREAM_CATEGORIES: DreamCategory[] = ['travel', 'experiences', 'possessions', 'achievements', 'relationships', 'lifestyle'];

export type DreamDraft = {
  title: string;
  description: string;
  category: DreamCategory;
  estimatedCost: string;
  estimatedTimeframe: string;
  // Sharing options
  isShared: boolean;
  trackingMode: TrackingMode;
};

interface DreamFormModalProps {
  isOpen: boolean;
  dreamDraft: DreamDraft;
  onDraftChange: (draft: DreamDraft) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
  /** Whether merged mode is available (user has a connected partner with merged permissions) */
  isMergedModeAvailable?: boolean;
  /** Whether we're editing an existing dream (changes title and button text) */
  isEditMode?: boolean;
}

/**
 * Modal form for capturing or editing a dream
 */
export function DreamFormModal({
  isOpen,
  dreamDraft,
  onDraftChange,
  onSubmit,
  onClose,
  isMergedModeAvailable = false,
  isEditMode = false,
}: DreamFormModalProps): React.ReactElement | null {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <form
        onSubmit={onSubmit}
        className="relative w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-800"
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300"
        >
          <X className="h-5 w-5" />
        </button>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{isEditMode ? 'Edit dream' : 'Capture a dream'}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700 dark:text-slate-300">Title</span>
            <input
              required
              value={dreamDraft.title}
              onChange={(event) => onDraftChange({ ...dreamDraft, title: event.target.value })}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm placeholder-slate-400 focus:border-[#C18B5E] focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder-slate-400"
              style={{ color: '#1e293b' }}
              placeholder="Backpack through Europe"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700 dark:text-slate-300">Category</span>
            <select
              value={dreamDraft.category}
              onChange={(event) => onDraftChange({ ...dreamDraft, category: event.target.value as DreamCategory })}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-[#C18B5E] focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              style={{ color: '#1e293b' }}
            >
              {DREAM_CATEGORIES.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            <span className="font-medium text-slate-700 dark:text-slate-300">Description</span>
            <textarea
              value={dreamDraft.description}
              onChange={(event) => onDraftChange({ ...dreamDraft, description: event.target.value })}
              className="h-24 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm placeholder-slate-400 focus:border-[#C18B5E] focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder-slate-400"
              style={{ color: '#1e293b' }}
              placeholder="Why this dream is meaningful and what it looks like"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700 dark:text-slate-300">Estimated cost (optional)</span>
            <input
              type="number"
              min="0"
              value={dreamDraft.estimatedCost}
              onChange={(event) => onDraftChange({ ...dreamDraft, estimatedCost: event.target.value })}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm placeholder-slate-400 focus:border-[#C18B5E] focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder-slate-400"
              style={{ color: '#1e293b' }}
              placeholder="5000"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700 dark:text-slate-300">Timeframe (optional)</span>
            <input
              value={dreamDraft.estimatedTimeframe}
              onChange={(event) => onDraftChange({ ...dreamDraft, estimatedTimeframe: event.target.value })}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm placeholder-slate-400 focus:border-[#C18B5E] focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder-slate-400"
              style={{ color: '#1e293b' }}
              placeholder="Within 5 years"
            />
          </label>

          {/* Sharing options - only show if merged mode is available */}
          {isMergedModeAvailable && (
            <div className="sm:col-span-2 border-t border-slate-200 dark:border-slate-600 pt-4">
              <span className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">This dream is for</span>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => onDraftChange({ ...dreamDraft, isShared: false, trackingMode: 'combined' })}
                  className="flex-1 flex items-center justify-center gap-2 rounded-lg border-2 px-4 py-3 text-sm font-medium transition"
                  style={{
                    backgroundColor: !dreamDraft.isShared ? '#6366f1' : 'white',
                    borderColor: !dreamDraft.isShared ? '#6366f1' : '#e2e8f0',
                    color: !dreamDraft.isShared ? 'white' : '#475569',
                  }}
                >
                  {!dreamDraft.isShared ? <Check className="h-4 w-4" /> : <User className="h-4 w-4" />}
                  Me only
                </button>
                <button
                  type="button"
                  onClick={() => onDraftChange({ ...dreamDraft, isShared: true })}
                  className="flex-1 flex items-center justify-center gap-2 rounded-lg border-2 px-4 py-3 text-sm font-medium transition"
                  style={{
                    backgroundColor: dreamDraft.isShared ? '#6366f1' : 'white',
                    borderColor: dreamDraft.isShared ? '#6366f1' : '#e2e8f0',
                    color: dreamDraft.isShared ? 'white' : '#475569',
                  }}
                >
                  {dreamDraft.isShared ? <Check className="h-4 w-4" /> : <Users className="h-4 w-4" />}
                  Us (shared)
                </button>
              </div>

              {/* Tracking mode - only show when shared */}
              {dreamDraft.isShared && (
                <div className="mt-4">
                  <span className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">How do we track progress?</span>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => onDraftChange({ ...dreamDraft, trackingMode: 'combined' })}
                      className="flex-1 rounded-lg border-2 px-4 py-3 text-sm transition"
                      style={{
                        backgroundColor: dreamDraft.trackingMode === 'combined' ? '#6366f1' : 'white',
                        borderColor: dreamDraft.trackingMode === 'combined' ? '#6366f1' : '#e2e8f0',
                        color: dreamDraft.trackingMode === 'combined' ? 'white' : '#475569',
                      }}
                    >
                      <div className="font-medium flex items-center justify-center gap-2">
                        {dreamDraft.trackingMode === 'combined' && <Check className="h-4 w-4" />}
                        Together
                      </div>
                      <div className="text-xs mt-1" style={{ color: dreamDraft.trackingMode === 'combined' ? '#c7d2fe' : '#64748b' }}>
                        One shared progress (e.g., Save for trip)
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => onDraftChange({ ...dreamDraft, trackingMode: 'individual' })}
                      className="flex-1 rounded-lg border-2 px-4 py-3 text-sm transition"
                      style={{
                        backgroundColor: dreamDraft.trackingMode === 'individual' ? '#6366f1' : 'white',
                        borderColor: dreamDraft.trackingMode === 'individual' ? '#6366f1' : '#e2e8f0',
                        color: dreamDraft.trackingMode === 'individual' ? 'white' : '#475569',
                      }}
                    >
                      <div className="font-medium flex items-center justify-center gap-2">
                        {dreamDraft.trackingMode === 'individual' && <Check className="h-4 w-4" />}
                        Separately
                      </div>
                      <div className="text-xs mt-1" style={{ color: dreamDraft.trackingMode === 'individual' ? '#c7d2fe' : '#64748b' }}>
                        Each tracks their own (e.g., Learn to cook)
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-full bg-[#C18B5E] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#B5795A]"
          >
            <Sparkles className="h-4 w-4" />
            {isEditMode ? 'Update dream' : 'Save dream'}
          </button>
        </div>
      </form>
    </div>
  );
}
