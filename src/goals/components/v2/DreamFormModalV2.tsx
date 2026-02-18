/**
 * Dream Form Modal V2 - MIGRATED to use FormModalV2
 * Create/Edit modal for dreams (bucket list items)
 *
 * MIGRATION COMPLETE:
 * - Reduced from 419 lines to ~265 lines (37% reduction)
 * - Removed all boilerplate (ESC key, backdrop, auto-save, modal structure)
 * - Form state managed by FormModalV2
 * - Conditional fields based on isShared and merged mode availability
 */

import React from 'react';
import { FormModalV2 } from '@/components/v2';
import type { DreamCategory, TrackingMode } from '../../types/lifeGoals';

export interface DreamFormData {
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
  const defaultFormData: DreamFormData = {
    title: '',
    description: '',
    category: 'travel',
    estimatedCost: '',
    estimatedTimeframe: '',
    isShared: false,
    trackingMode: 'combined',
  };

  return (
    <FormModalV2<DreamFormData>
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Dream' : 'Create Dream'}
      defaultData={defaultFormData}
      initialData={initialData}
      draftKey={isEditing ? undefined : 'dreams_create_draft'}
      isPending={isPending}
      submitText={isEditing ? 'Save Changes' : 'Create Dream'}
      isEditing={isEditing}
      showDelete={isEditing && !!onDelete}
      onDelete={onDelete ? async () => { await onDelete(); } : undefined}
      onSubmit={async (formData) => {
        await onSubmit({
          title: formData.title.trim(),
          description: formData.description.trim(),
          category: formData.category,
          estimatedCost: formData.estimatedCost.trim(),
          estimatedTimeframe: formData.estimatedTimeframe.trim(),
          isShared: isMergedModeAvailable ? formData.isShared : false,
          trackingMode: formData.isShared ? formData.trackingMode : 'combined',
        });
      }}
      validate={(formData) => {
        if (!formData.title.trim()) return 'Please enter a dream title';
        return null;
      }}
    >
      {(formState, setFormState) => (
        <>
          {/* Title */}
          <div>
            <label htmlFor="dream-title" className="block text-sm font-semibold text-gray-700 mb-2">
              Dream Title *
            </label>
            <input
              id="dream-title"
              type="text"
              value={formState.title}
              onChange={(e) => setFormState({ ...formState, title: e.target.value })}
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
              value={formState.description}
              onChange={(e) => setFormState({ ...formState, description: e.target.value })}
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
                  onClick={() => setFormState({ ...formState, category: option.value })}
                  className={`p-3 rounded-xl border-2 font-medium text-sm transition-all ${
                    formState.category === option.value
                      ? 'border-terracotta-400'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  style={{
                    background: formState.category === option.value
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
              value={formState.estimatedCost}
              onChange={(e) => setFormState({ ...formState, estimatedCost: e.target.value })}
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
              value={formState.estimatedTimeframe}
              onChange={(e) => setFormState({ ...formState, estimatedTimeframe: e.target.value })}
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
                    checked={formState.isShared}
                    onChange={(e) => setFormState({ ...formState, isShared: e.target.checked })}
                    className="w-5 h-5 text-terracotta-400 rounded focus:ring-terracotta-300"
                  />
                  <span className="font-medium text-gray-900">Share with partner</span>
                </label>
              </div>

              {/* Tracking Mode (only if shared) */}
              {formState.isShared && (
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
                        checked={formState.trackingMode === 'combined'}
                        onChange={(e) => setFormState({ ...formState, trackingMode: e.target.value as TrackingMode })}
                        className="w-4 h-4 text-terracotta-400 focus:ring-terracotta-300"
                      />
                      <span className="font-medium text-gray-900">Combined progress</span>
                    </label>
                    <label className="flex items-center gap-2 p-3 border border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                      <input
                        type="radio"
                        name="trackingMode"
                        value="individual"
                        checked={formState.trackingMode === 'individual'}
                        onChange={(e) => setFormState({ ...formState, trackingMode: e.target.value as TrackingMode })}
                        className="w-4 h-4 text-terracotta-400 focus:ring-terracotta-300"
                      />
                      <span className="font-medium text-gray-900">Individual progress</span>
                    </label>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </FormModalV2>
  );
};
