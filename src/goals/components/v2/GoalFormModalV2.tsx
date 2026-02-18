/**
 * Goal Form Modal V2 - MIGRATED to use FormModalV2
 * Create/Edit modal for life goals
 *
 * MIGRATION COMPLETE:
 * - Reduced from 442 lines to ~270 lines (39% reduction)
 * - Removed all boilerplate (ESC key, backdrop, auto-save, modal structure)
 * - Form state managed by FormModalV2
 * - Conditional fields based on isShared and merged mode availability
 */

import React from 'react';
import { FormModalV2 } from '@/components/v2';
import type { GoalCategory, GoalPriority, TrackingMode } from '../../types/lifeGoals';

export interface GoalFormData {
  title: string;
  description: string;
  category: GoalCategory;
  priority: GoalPriority;
  targetDate: string;
  isShared: boolean;
  trackingMode: TrackingMode;
}

interface GoalFormModalV2Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: GoalFormData) => Promise<void>;
  onDelete?: () => Promise<void>;
  initialData?: GoalFormData;
  isEditing?: boolean;
  isPending?: boolean;
  isMergedModeAvailable?: boolean;
}

const categoryOptions: { value: GoalCategory; label: string; emoji: string }[] = [
  { value: 'personal', label: 'Personal', emoji: '🌟' },
  { value: 'health', label: 'Health', emoji: '💪' },
  { value: 'career', label: 'Career', emoji: '💼' },
  { value: 'financial', label: 'Financial', emoji: '💰' },
  { value: 'fitness', label: 'Fitness', emoji: '🏃' },
];

const priorityOptions: { value: GoalPriority; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: '#10B981' },
  { value: 'medium', label: 'Medium', color: '#F59E0B' },
  { value: 'high', label: 'High', color: '#EF4444' },
  { value: 'critical', label: 'Critical', color: '#DC2626' },
];

export const GoalFormModalV2: React.FC<GoalFormModalV2Props> = ({
  isOpen,
  onClose,
  onSubmit,
  onDelete,
  initialData,
  isEditing = false,
  isPending = false,
  isMergedModeAvailable = false,
}) => {
  const defaultFormData: GoalFormData = {
    title: '',
    description: '',
    category: 'personal',
    priority: 'medium',
    targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    isShared: false,
    trackingMode: 'combined',
  };

  return (
    <FormModalV2<GoalFormData>
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Goal' : 'Create Goal'}
      defaultData={defaultFormData}
      initialData={initialData}
      draftKey={isEditing ? undefined : 'goals_create_draft'}
      isPending={isPending}
      submitText={isEditing ? 'Save Changes' : 'Create Goal'}
      isEditing={isEditing}
      showDelete={isEditing && !!onDelete}
      onDelete={onDelete ? async () => { await onDelete(); } : undefined}
      onSubmit={async (formData) => {
        await onSubmit({
          title: formData.title.trim(),
          description: formData.description.trim(),
          category: formData.category,
          priority: formData.priority,
          targetDate: formData.targetDate,
          isShared: isMergedModeAvailable ? formData.isShared : false,
          trackingMode: formData.isShared ? formData.trackingMode : 'combined',
        });
      }}
      validate={(formData) => {
        if (!formData.title.trim()) return 'Please enter a goal title';
        return null;
      }}
    >
      {(formState, setFormState) => (
        <>
          {/* Title */}
          <div>
            <label htmlFor="goal-title" className="block text-sm font-semibold text-gray-700 mb-2">
              Goal Title *
            </label>
            <input
              id="goal-title"
              type="text"
              value={formState.title}
              onChange={(e) => setFormState({ ...formState, title: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
              placeholder="Run a marathon"
              autoFocus
              required
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="goal-description" className="block text-sm font-semibold text-gray-700 mb-2">
              Description
            </label>
            <textarea
              id="goal-description"
              rows={3}
              value={formState.description}
              onChange={(e) => setFormState({ ...formState, description: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none resize-none transition-all"
              placeholder="Complete a full marathon by the end of the year..."
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

          {/* Priority */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Priority
            </label>
            <div className="grid grid-cols-2 gap-2">
              {priorityOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFormState({ ...formState, priority: option.value })}
                  className={`p-3 rounded-xl border-2 font-medium text-sm transition-all ${
                    formState.priority === option.value
                      ? 'border-terracotta-400'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  style={{
                    background: formState.priority === option.value
                      ? 'linear-gradient(135deg, rgba(212, 165, 116, 0.1) 0%, rgba(193, 139, 94, 0.1) 100%)'
                      : 'white',
                  }}
                >
                  <span
                    className="inline-block w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: option.color }}
                  />
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Target Date */}
          <div>
            <label htmlFor="goal-target-date" className="block text-sm font-semibold text-gray-700 mb-2">
              Target Date
            </label>
            <input
              id="goal-target-date"
              type="date"
              value={formState.targetDate}
              onChange={(e) => setFormState({ ...formState, targetDate: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
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
