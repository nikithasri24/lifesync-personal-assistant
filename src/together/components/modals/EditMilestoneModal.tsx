/**
 * Edit Milestone Modal - MIGRATED to use FormModalV2
 * Form to edit existing milestones
 *
 * MIGRATION COMPLETE:
 * - Reduced from 394 lines to ~305 lines (23% reduction)
 * - Removed all boilerplate (ESC key, backdrop, modal structure)
 * - Form state managed by FormModalV2
 * - Delete button integrated with FormModalV2
 */

import React from 'react';
import { useUpdateMilestone, useDeleteMilestone } from '../../hooks';
import type { Milestone, MilestoneType, ForWhom } from '../../types';
import { MILESTONE_TYPE_LABELS } from '../../types';
import { useToast } from '@/hooks/useToast';
import { FormModalV2 } from '@/components/v2';

interface EditMilestoneModalProps {
  isOpen: boolean;
  milestone: Milestone;
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

export const EditMilestoneModal: React.FC<EditMilestoneModalProps> = ({
  isOpen,
  milestone,
  onClose,
}) => {
  const { showToast } = useToast();
  const { mutate: updateMilestone, isPending: isUpdating } = useUpdateMilestone();
  const { mutate: deleteMilestone, isPending: isDeleting } = useDeleteMilestone();

  // Extract date parts from milestone_date (YYYY-MM-DD)
  const dateParts = milestone.milestone_date.split('-');
  const initialYear = dateParts[0];
  const initialMonth = String(parseInt(dateParts[1], 10));
  const initialDay = String(parseInt(dateParts[2], 10));

  // Initial form data from milestone
  const initialFormData: MilestoneFormData = {
    milestoneType: milestone.milestone_type,
    forWhom: milestone.for_whom,
    title: milestone.title,
    month: initialMonth,
    day: initialDay,
    year: initialYear,
    recurring: milestone.recurring,
    notes: milestone.notes || '',
    reminder30d: milestone.reminder_30d,
    reminder7d: milestone.reminder_7d,
    reminder1d: milestone.reminder_1d,
    reminderDayOf: milestone.reminder_day_of,
  };

  // Not used for edit mode, but required by FormModalV2
  const defaultFormData: MilestoneFormData = initialFormData;

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
      title="Edit Milestone"
      defaultData={defaultFormData}
      initialData={initialFormData}
      isPending={isUpdating || isDeleting}
      submitText="Save Changes"
      isEditing={true}
      showDelete={true}
      onDelete={() => {
        return new Promise<void>((resolve, reject) => {
          deleteMilestone(milestone.id, {
            onSuccess: () => {
              showToast?.('Milestone deleted successfully!', 'success');
              resolve();
            },
            onError: (error) => {
              showToast?.(`Failed to delete milestone: ${error.message}`, 'error');
              reject(error);
            },
          });
        });
      }}
      onSubmit={async (formData) => {
        const dateString = `${formData.year}-${formData.month.padStart(2, '0')}-${formData.day.padStart(2, '0')}`;

        return new Promise<void>((resolve, reject) => {
          updateMilestone(
            {
              id: milestone.id,
              title: formData.title || MILESTONE_TYPE_LABELS[formData.milestoneType],
              milestone_type: formData.milestoneType,
              milestone_date: dateString,
              recurring: formData.recurring,
              for_whom: formData.forWhom,
              description: '',
              notes: formData.notes,
              reminder_30d: formData.reminder30d,
              reminder_7d: formData.reminder7d,
              reminder_1d: formData.reminder1d,
              reminder_day_of: formData.reminderDayOf,
            },
            {
              onSuccess: () => {
                showToast?.('Milestone updated successfully!', 'success');
                resolve();
              },
              onError: (error) => {
                showToast?.(`Failed to update milestone: ${error.message}`, 'error');
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
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 border border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="for-whom"
                  value="partner"
                  checked={formState.forWhom === 'partner'}
                  onChange={(e) => setFormState({ ...formState, forWhom: e.target.value as ForWhom })}
                  className="w-5 h-5 text-terracotta-400 focus:ring-terracotta-300"
                />
                <span className="font-medium text-gray-900">Partner</span>
              </label>
              <label className="flex items-center gap-3 p-3 border border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="for-whom"
                  value="me"
                  checked={formState.forWhom === 'me'}
                  onChange={(e) => setFormState({ ...formState, forWhom: e.target.value as ForWhom })}
                  className="w-5 h-5 text-terracotta-400 focus:ring-terracotta-300"
                />
                <span className="font-medium text-gray-900">Me</span>
              </label>
              <label className="flex items-center gap-3 p-3 border border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="for-whom"
                  value="both"
                  checked={formState.forWhom === 'both'}
                  onChange={(e) => setFormState({ ...formState, forWhom: e.target.value as ForWhom })}
                  className="w-5 h-5 text-terracotta-400 focus:ring-terracotta-300"
                />
                <span className="font-medium text-gray-900">Both of us</span>
              </label>
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Date</label>
            <div className="grid grid-cols-2 gap-3">
              <select
                value={formState.month}
                onChange={(e) => setFormState({ ...formState, month: e.target.value })}
                className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none"
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
                className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none"
              />
            </div>
            <input
              type="number"
              min="1900"
              max="2100"
              value={formState.year}
              onChange={(e) => setFormState({ ...formState, year: e.target.value })}
              placeholder="Year"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none mt-3"
            />
            <p className="text-xs text-gray-500 mt-1">
              For birthdays, enter the birth year (e.g., 1991) to show correct age
            </p>
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
