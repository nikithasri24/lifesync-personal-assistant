/**
 * Dream Form Modal V2
 * Together-style modal with auto-save for dreams
 */

import React, { useState, useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useToast } from '@/hooks/useToast';
import { logger } from '@/services/logger';
import type { DreamCategory, TrackingMode } from '../../types/lifeGoals';

const STORAGE_KEY = 'dreams_create_draft';

interface DreamFormData {
  title: string;
  description: string;
  category: DreamCategory;
  estimatedCost: string;
  estimatedTimeframe: string;
  isShared: boolean;
  trackingMode: TrackingMode;
}

interface DreamFormModalV2Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: DreamFormData) => Promise<void>;
  onDelete?: () => Promise<void>;
  initialData?: DreamFormData;
  isEditing?: boolean;
  isPending?: boolean;
  isMergedModeAvailable?: boolean;
}

const categoryOptions: { value: DreamCategory; label: string; emoji: string }[] = [
  { value: 'travel', label: 'Travel', emoji: '✈️' },
  { value: 'experiences', label: 'Experiences', emoji: '🎢' },
  { value: 'possessions', label: 'Possessions', emoji: '🛍️' },
  { value: 'achievements', label: 'Achievements', emoji: '🎯' },
  { value: 'relationships', label: 'Relationships', emoji: '💕' },
  { value: 'lifestyle', label: 'Lifestyle', emoji: '🏡' },
];

export const DreamFormModalV2: React.FC<DreamFormModalV2Props> = ({
  isOpen,
  onClose,
  onSubmit,
  onDelete,
  initialData,
  isEditing = false,
  isPending = false,
  isMergedModeAvailable = false,
}) => {
  const colors = useThemeColors();
  const { showToast } = useToast();

  // Load draft from localStorage
  const loadDraft = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      logger.error('Goals', error as Error, { context: 'Failed to load dream draft' });
    }
    return null;
  };

  // Load draft only when NOT editing
  const savedDraft = !initialData ? loadDraft() : null;

  // Form state - restore from initialData, then localStorage, then defaults
  const [title, setTitle] = useState(initialData?.title || savedDraft?.title || '');
  const [description, setDescription] = useState(initialData?.description || savedDraft?.description || '');
  const [category, setCategory] = useState<DreamCategory>(
    initialData?.category || savedDraft?.category || 'travel'
  );
  const [estimatedCost, setEstimatedCost] = useState(
    initialData?.estimatedCost || savedDraft?.estimatedCost || ''
  );
  const [estimatedTimeframe, setEstimatedTimeframe] = useState(
    initialData?.estimatedTimeframe || savedDraft?.estimatedTimeframe || ''
  );
  const [isShared, setIsShared] = useState(initialData?.isShared || savedDraft?.isShared || false);
  const [trackingMode, setTrackingMode] = useState<TrackingMode>(
    initialData?.trackingMode || savedDraft?.trackingMode || 'combined'
  );

  // Update form when initialData changes
  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setDescription(initialData.description);
      setCategory(initialData.category);
      setEstimatedCost(initialData.estimatedCost);
      setEstimatedTimeframe(initialData.estimatedTimeframe);
      setIsShared(initialData.isShared);
      setTrackingMode(initialData.trackingMode);
    }
  }, [initialData]);

  // Auto-save draft to localStorage whenever form changes (only when not editing)
  useEffect(() => {
    if (!isEditing && title) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        title,
        description,
        category,
        estimatedCost,
        estimatedTimeframe,
        isShared,
        trackingMode,
      }));
    }
  }, [title, description, category, estimatedCost, estimatedTimeframe, isShared, trackingMode, isEditing]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      if (showToast) {
        showToast('Please enter a dream title', 'error');
      }
      return;
    }

    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        category,
        estimatedCost: estimatedCost.trim(),
        estimatedTimeframe: estimatedTimeframe.trim(),
        isShared: isMergedModeAvailable ? isShared : false,
        trackingMode: isShared ? trackingMode : 'combined',
      });

      // Clear draft on success
      localStorage.removeItem(STORAGE_KEY);

      if (showToast) {
        showToast(isEditing ? 'Dream updated! ✨' : 'Dream created! 🎉', 'success');
      }

      onClose();
    } catch (error) {
      logger.error('Goals', error as Error, { context: 'Failed to submit dream' });
      if (showToast) {
        showToast('Failed to save dream', 'error');
      }
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;

    if (window.confirm('Are you sure you want to delete this dream?')) {
      try {
        await onDelete();
        if (showToast) {
          showToast('Dream deleted! 🗑️', 'success');
        }
        onClose();
      } catch (error) {
        logger.error('Goals', error as Error, { context: 'Failed to delete dream' });
        if (showToast) {
          showToast('Failed to delete dream', 'error');
        }
      }
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

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
      onClick={handleBackdropClick}
    >
      {/* Modal Content */}
      <div
        className="w-full bg-white lg:rounded-3xl rounded-t-3xl overflow-hidden flex flex-col"
        style={{ maxHeight: '90vh', maxWidth: '600px' }}
      >
        {/* Mobile Drag Handle */}
        <div className="lg:hidden pt-2 flex-shrink-0">
          <div className="w-9 h-1 rounded-full mx-auto bg-gray-300" />
        </div>

        {/* Fixed Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Edit Dream' : 'Create Dream'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Scrollable Content */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1">
          <div
            className="overflow-y-auto p-6 space-y-5 flex-1"
            style={{ maxHeight: 'calc(90vh - 140px)' }}
          >
            {/* Title */}
            <div>
              <label htmlFor="dream-title" className="block text-sm font-semibold text-gray-700 mb-2">
                Dream Title *
              </label>
              <input
                id="dream-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
                placeholder="Visit Paris & See the Eiffel Tower"
                autoFocus
                required
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="dream-description" className="block text-sm font-semibold text-gray-700 mb-2">
                Description
              </label>
              <textarea
                id="dream-description"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none resize-none transition-all"
                placeholder="Experience the city of lights, visit museums, taste authentic French cuisine..."
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Category
              </label>
              <div className="grid grid-cols-2 gap-2">
                {categoryOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setCategory(option.value)}
                    className={`p-3 rounded-xl border-2 font-medium text-sm transition-all ${
                      category === option.value
                        ? 'border-terracotta-400'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    style={{
                      background: category === option.value
                        ? 'linear-gradient(135deg, rgba(212, 165, 116, 0.1) 0%, rgba(193, 139, 94, 0.1) 100%)'
                        : 'white',
                    }}
                  >
                    <span className="text-xl mr-2">{option.emoji}</span>
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Estimated Cost */}
            <div>
              <label htmlFor="dream-cost" className="block text-sm font-semibold text-gray-700 mb-2">
                Estimated Cost
              </label>
              <input
                id="dream-cost"
                type="text"
                value={estimatedCost}
                onChange={(e) => setEstimatedCost(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
                placeholder="$5,000"
              />
            </div>

            {/* Estimated Timeframe */}
            <div>
              <label htmlFor="dream-timeframe" className="block text-sm font-semibold text-gray-700 mb-2">
                Estimated Timeframe
              </label>
              <input
                id="dream-timeframe"
                type="text"
                value={estimatedTimeframe}
                onChange={(e) => setEstimatedTimeframe(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
                placeholder="2027 or 2-3 years"
              />
            </div>

            {/* Share with Partner (only if merged mode available) */}
            {isMergedModeAvailable && (
              <>
                <div>
                  <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isShared}
                      onChange={(e) => setIsShared(e.target.checked)}
                      className="w-5 h-5 text-terracotta-400 rounded focus:ring-terracotta-300"
                    />
                    <span className="font-medium text-gray-900">Share with partner</span>
                  </label>
                </div>

                {/* Tracking Mode (only if shared) */}
                {isShared && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Tracking Mode
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 p-3 border border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                        <input
                          type="radio"
                          name="trackingMode"
                          value="combined"
                          checked={trackingMode === 'combined'}
                          onChange={(e) => setTrackingMode(e.target.value as TrackingMode)}
                          className="w-4 h-4 text-terracotta-400 focus:ring-terracotta-300"
                        />
                        <span className="font-medium text-gray-900">Combined progress</span>
                      </label>
                      <label className="flex items-center gap-2 p-3 border border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                        <input
                          type="radio"
                          name="trackingMode"
                          value="individual"
                          checked={trackingMode === 'individual'}
                          onChange={(e) => setTrackingMode(e.target.value as TrackingMode)}
                          className="w-4 h-4 text-terracotta-400 focus:ring-terracotta-300"
                        />
                        <span className="font-medium text-gray-900">Individual progress</span>
                      </label>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Fixed Footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex gap-3 flex-shrink-0 bg-white">
            {isEditing && onDelete && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                className="px-4 py-3 bg-red-100 hover:bg-red-200 rounded-xl font-semibold text-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                aria-label="Delete dream"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            )}
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
              style={{
                background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)',
              }}
            >
              {isPending ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Dream'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
