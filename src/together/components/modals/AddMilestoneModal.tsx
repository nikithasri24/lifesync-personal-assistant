/**
 * Add Milestone Modal - MIGRATED to use FormModalV2
 * Form to create birthdays, anniversaries, and special dates
 *
 * MIGRATION COMPLETE:
 * - Reduced from 414 lines to ~305 lines (26% reduction)
 * - Removed all boilerplate (ESC key, backdrop, auto-save, modal structure)
 * - Form state managed by FormModalV2
 */

import React from 'react';
import { useCreateMilestone } from '../../hooks';
import type { PartnerLink, MilestoneType, ForWhom } from '../../types';
import { MILESTONE_TYPE_LABELS } from '../../types';
import { useToast } from '@/hooks/useToast';
import { validateMilestone } from '../../utils/validation';
import { FormModalV2 } from '@/components/v2';

interface AddMilestoneModalProps {
  isOpen: boolean;
  partnerLink: PartnerLink | null | undefined;
  onClose: () => void;
}

interface MilestoneFormData {
  milestoneType: MilestoneType;
  forWhom: ForWhom;
  title: string;
  month: string;
  day: string;
  year: string;
  recurring: boolean;
  notes: string;
  reminder30d: boolean;
  reminder7d: boolean;
  reminder1d: boolean;
  reminderDayOf: boolean;
}

export const AddMilestoneModal: React.FC<AddMilestoneModalProps> = ({
  isOpen,
  partnerLink,
  onClose,
}) => {
  const { showToast } = useToast();
  const { mutate: createMilestone, isPending } = useCreateMilestone();

  // Default form data
  const defaultFormData: MilestoneFormData = {
    milestoneType: 'birthday',
    forWhom: 'partner',
    title: '',
    month: '1',
    day: '1',
    year: '',
    recurring: true,
    notes: '',
    reminder30d: true,
    reminder7d: true,
    reminder1d: true,
    reminderDayOf: true,
  };

  const months = [
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ];

  return (
    <FormModalV2<MilestoneFormData>
      isOpen={isOpen}
      onClose={onClose}
      title="Add Milestone"
      defaultData={defaultFormData}
      draftKey="together_add_milestone_draft"
      isPending={isPending}
      submitText="Add Milestone"
      onSubmit={async (formData) => {
        // Build date string
        const dateString = `${formData.year || new Date().getFullYear()}-${formData.month.padStart(2, '0')}-${formData.day.padStart(2, '0')}`;
        const milestoneTitle = formData.title.trim() || MILESTONE_TYPE_LABELS[formData.milestoneType];

        // Validate form data
        const validation = validateMilestone({
          title: milestoneTitle,
          milestone_type: formData.milestoneType,
          milestone_date: dateString,
          for_whom: formData.forWhom,
        });

        if (!validation.valid) {
          const errorMessage = Object.values(validation.errors)[0] || 'Please check your input';
          showToast?.(errorMessage, 'error');
          throw new Error(errorMessage);
        }

        return new Promise<void>((resolve, reject) => {
          createMilestone(
            {
              title: milestoneTitle,
              milestone_type: formData.milestoneType,
              milestone_date: dateString,
              recurring: formData.recurring,
              for_whom: formData.forWhom,
              description: '',
              notes: formData.notes.trim(),
              photo_urls: [],
              reminder_30d: formData.reminder30d,
              reminder_7d: formData.reminder7d,
              reminder_1d: formData.reminder1d,
              reminder_day_of: formData.reminderDayOf,
              connection_id: partnerLink?.id,
              partner_id: partnerLink?.partner_id || partnerLink?.requester_id,
            },
            {
              onSuccess: () => {
                showToast?.('Milestone created successfully!', 'success');
                resolve();
              },
              onError: (error) => {
                showToast?.(`Failed to create milestone: ${error.message}`, 'error');
                reject(error);
              },
            }
          );
        });
      }}
      validate={(formData) => {
        if (!formData.day || parseInt(formData.day) < 1 || parseInt(formData.day) > 31) {
          return 'Please enter a valid day (1-31)';
        }
        return null;
      }}
    >
      {(formState, setFormState) => (
        <>
          {/* Milestone Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Milestone Type
            </label>
            <select
              value={formState.milestoneType}
              onChange={(e) => setFormState({ ...formState, milestoneType: e.target.value as MilestoneType })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
            >
              <option value="birthday">🎂 Birthday</option>
              <option value="anniversary">💕 Anniversary</option>
              <option value="first_date">💑 First Date</option>
              <option value="move_in">🏠 Move-in Anniversary</option>
              <option value="engagement">💍 Engagement</option>
              <option value="wedding">👰 Wedding Anniversary</option>
              <option value="custom">⭐ Custom</option>
            </select>
          </div>

          {/* For Whom */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              For Whom?
            </label>
            <div className="grid grid-cols-3 gap-2">
              <label className="flex items-center gap-2 p-3 border border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="for-whom"
                  value="partner"
                  checked={formState.forWhom === 'partner'}
                  onChange={(e) => setFormState({ ...formState, forWhom: e.target.value as ForWhom })}
                  className="w-4 h-4 text-terracotta-400 focus:ring-terracotta-300"
                />
                <span className="font-medium text-gray-900 text-sm">Partner</span>
              </label>
              <label className="flex items-center gap-2 p-3 border border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="for-whom"
                  value="me"
                  checked={formState.forWhom === 'me'}
                  onChange={(e) => setFormState({ ...formState, forWhom: e.target.value as ForWhom })}
                  className="w-4 h-4 text-terracotta-400 focus:ring-terracotta-300"
                />
                <span className="font-medium text-gray-900 text-sm">Me</span>
              </label>
              <label className="flex items-center gap-2 p-3 border border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="for-whom"
                  value="both"
                  checked={formState.forWhom === 'both'}
                  onChange={(e) => setFormState({ ...formState, forWhom: e.target.value as ForWhom })}
                  className="w-4 h-4 text-terracotta-400 focus:ring-terracotta-300"
                />
                <span className="font-medium text-gray-900 text-sm">Both</span>
              </label>
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Date</label>
            <div className="grid grid-cols-3 gap-3">
              <select
                value={formState.month}
                onChange={(e) => setFormState({ ...formState, month: e.target.value })}
                className="px-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none text-sm"
              >
                {months.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min="1"
                max="31"
                value={formState.day}
                onChange={(e) => setFormState({ ...formState, day: e.target.value })}
                placeholder="Day"
                className="px-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none text-sm"
              />
              <input
                type="number"
                min="1900"
                max="2100"
                value={formState.year}
                onChange={(e) => setFormState({ ...formState, year: e.target.value })}
                placeholder="Year"
                className="px-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none text-sm"
              />
            </div>
          </div>

          {/* Recurring */}
          <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer">
            <input
              type="checkbox"
              checked={formState.recurring}
              onChange={(e) => setFormState({ ...formState, recurring: e.target.checked })}
              className="w-5 h-5 text-terracotta-400 rounded focus:ring-terracotta-300"
            />
            <span className="font-medium text-gray-900">Recurring yearly</span>
          </label>

          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Title (optional)
            </label>
            <input
              type="text"
              value={formState.title}
              onChange={(e) => setFormState({ ...formState, title: e.target.value })}
              placeholder={MILESTONE_TYPE_LABELS[formState.milestoneType]}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none"
            />
          </div>

          {/* Reminders */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Reminders</label>
            <div className="space-y-2 bg-gray-50 rounded-xl p-4">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formState.reminder30d}
                  onChange={(e) => setFormState({ ...formState, reminder30d: e.target.checked })}
                  className="w-5 h-5 text-terracotta-400 rounded"
                />
                <span className="text-gray-900">30 days before</span>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formState.reminder7d}
                  onChange={(e) => setFormState({ ...formState, reminder7d: e.target.checked })}
                  className="w-5 h-5 text-terracotta-400 rounded"
                />
                <span className="text-gray-900">7 days before</span>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formState.reminder1d}
                  onChange={(e) => setFormState({ ...formState, reminder1d: e.target.checked })}
                  className="w-5 h-5 text-terracotta-400 rounded"
                />
                <span className="text-gray-900">1 day before</span>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formState.reminderDayOf}
                  onChange={(e) => setFormState({ ...formState, reminderDayOf: e.target.checked })}
                  className="w-5 h-5 text-terracotta-400 rounded"
                />
                <span className="text-gray-900">On the day</span>
              </label>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Notes</label>
            <textarea
              rows={3}
              value={formState.notes}
              onChange={(e) => setFormState({ ...formState, notes: e.target.value })}
              placeholder="Gift ideas, celebration plans..."
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none resize-none"
            />
          </div>
        </>
      )}
    </FormModalV2>
  );
};
