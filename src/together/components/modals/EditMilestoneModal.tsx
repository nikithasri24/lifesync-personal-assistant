/**
 * Edit Milestone Modal
 * Form to edit existing milestones
 */

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useUpdateMilestone, useDeleteMilestone } from '../../hooks';
import type { Milestone, MilestoneType, ForWhom } from '../../types';
import { MILESTONE_TYPE_LABELS } from '../../types';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useToast } from '@/hooks/useToast';

interface EditMilestoneModalProps {
  isOpen: boolean;
  milestone: Milestone;
  onClose: () => void;
}

export const EditMilestoneModal: React.FC<EditMilestoneModalProps> = ({
  isOpen,
  milestone,
  onClose,
}) => {
  const colors = useThemeColors();
  const { toast } = useToast();
  const { mutate: updateMilestone, isPending: isUpdating } = useUpdateMilestone();
  const { mutate: deleteMilestone, isPending: isDeleting } = useDeleteMilestone();

  // Extract date parts from milestone_date (YYYY-MM-DD)
  const dateParts = milestone.milestone_date.split('-');
  const initialYear = dateParts[0];
  const initialMonth = String(parseInt(dateParts[1], 10)); // Remove leading zeros: "02" -> "2"
  const initialDay = String(parseInt(dateParts[2], 10)); // Remove leading zeros: "07" -> "7"

  // Form state
  const [milestoneType, setMilestoneType] = useState<MilestoneType>(milestone.milestone_type);
  const [forWhom, setForWhom] = useState<ForWhom>(milestone.for_whom);
  const [title, setTitle] = useState(milestone.title);
  const [month, setMonth] = useState(initialMonth);
  const [day, setDay] = useState(initialDay);
  const [year, setYear] = useState(initialYear);
  const [recurring, setRecurring] = useState(milestone.recurring);
  const [notes, setNotes] = useState(milestone.notes || '');

  // Reminders
  const [reminder30d, setReminder30d] = useState(milestone.reminder_30d);
  const [reminder7d, setReminder7d] = useState(milestone.reminder_7d);
  const [reminder1d, setReminder1d] = useState(milestone.reminder_1d);
  const [reminderDayOf, setReminderDayOf] = useState(milestone.reminder_day_of);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Build date string
    const dateString = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

    updateMilestone(
      {
        id: milestone.id,
        title: title || MILESTONE_TYPE_LABELS[milestoneType],
        milestone_type: milestoneType,
        milestone_date: dateString,
        recurring,
        for_whom: forWhom,
        description: '',
        notes,
        reminder_30d: reminder30d,
        reminder_7d: reminder7d,
        reminder_1d: reminder1d,
        reminder_day_of: reminderDayOf,
      },
      {
        onSuccess: () => {
          if (toast) {
            toast('Milestone updated successfully!', 'success');
          }
          onClose();
        },
        onError: (error) => {
          if (toast) {
            toast(`Failed to update milestone: ${error.message}`, 'error');
          }
        },
      }
    );
  };

  const handleDelete = () => {
    if (!confirm('Are you sure you want to delete this milestone?')) {
      return;
    }

    deleteMilestone(milestone.id, {
      onSuccess: () => {
        if (toast) {
          toast('Milestone deleted successfully!', 'success');
        }
        onClose();
      },
      onError: (error) => {
        if (toast) {
          toast(`Failed to delete milestone: ${error.message}`, 'error');
        }
      },
    });
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
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
    <div
      className="fixed inset-0 z-50 flex items-end justify-center lg:items-center"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={handleBackdropClick}
    >
      <div
        className="w-full lg:max-w-2xl bg-white lg:rounded-3xl rounded-t-3xl overflow-hidden"
        style={{
          maxHeight: '90vh',
          boxShadow: '0 -4px 24px rgba(0, 0, 0, 0.15)',
        }}
      >
        {/* Drag Handle (mobile) */}
        <div className="lg:hidden pt-2">
          <div
            className="w-9 h-1 rounded-full mx-auto"
            style={{ backgroundColor: colors.border.medium }}
          />
        </div>

        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-5 border-b"
          style={{ borderColor: colors.border.light }}
        >
          <h2
            className="text-2xl font-bold"
            style={{ color: colors.text.primary }}
          >
            Edit Milestone
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" style={{ color: colors.text.tertiary }} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-5" style={{ maxHeight: 'calc(90vh - 140px)' }}>
          {/* Milestone Type */}
          <div>
            <label
              className="block text-sm font-semibold mb-2"
              style={{ color: colors.text.primary }}
            >
              Milestone Type
            </label>
            <select
              value={milestoneType}
              onChange={(e) => setMilestoneType(e.target.value as MilestoneType)}
              className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none"
              style={{ borderColor: colors.border.medium }}
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
            <label
              className="block text-sm font-semibold mb-2"
              style={{ color: colors.text.primary }}
            >
              For Whom?
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 border rounded-xl cursor-pointer hover:bg-gray-50 transition-colors" style={{ borderColor: colors.border.medium }}>
                <input
                  type="radio"
                  name="for-whom"
                  value="partner"
                  checked={forWhom === 'partner'}
                  onChange={(e) => setForWhom(e.target.value as ForWhom)}
                  className="w-5 h-5"
                  style={{ accentColor: '#D4A574' }}
                />
                <span className="font-medium" style={{ color: colors.text.primary }}>
                  Partner
                </span>
              </label>
              <label className="flex items-center gap-3 p-3 border rounded-xl cursor-pointer hover:bg-gray-50 transition-colors" style={{ borderColor: colors.border.medium }}>
                <input
                  type="radio"
                  name="for-whom"
                  value="me"
                  checked={forWhom === 'me'}
                  onChange={(e) => setForWhom(e.target.value as ForWhom)}
                  className="w-5 h-5"
                  style={{ accentColor: '#D4A574' }}
                />
                <span className="font-medium" style={{ color: colors.text.primary }}>
                  Me
                </span>
              </label>
              <label className="flex items-center gap-3 p-3 border rounded-xl cursor-pointer hover:bg-gray-50 transition-colors" style={{ borderColor: colors.border.medium }}>
                <input
                  type="radio"
                  name="for-whom"
                  value="both"
                  checked={forWhom === 'both'}
                  onChange={(e) => setForWhom(e.target.value as ForWhom)}
                  className="w-5 h-5"
                  style={{ accentColor: '#D4A574' }}
                />
                <span className="font-medium" style={{ color: colors.text.primary }}>
                  Both of us
                </span>
              </label>
            </div>
          </div>

          {/* Date */}
          <div>
            <label
              className="block text-sm font-semibold mb-2"
              style={{ color: colors.text.primary }}
            >
              Date
            </label>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <select
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="px-4 py-3 border rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none"
                style={{ borderColor: colors.border.medium }}
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
                value={day}
                onChange={(e) => setDay(e.target.value)}
                placeholder="Day"
                className="px-4 py-3 border rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none"
                style={{ borderColor: colors.border.medium }}
              />
            </div>
            <input
              type="number"
              min="1900"
              max="2100"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="Year"
              className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none"
              style={{ borderColor: colors.border.medium }}
            />
            <p className="text-xs mt-1" style={{ color: colors.text.tertiary }}>
              For birthdays, enter the birth year (e.g., 1991) to show correct age
            </p>
          </div>

          {/* Recurring */}
          <label className="flex items-center gap-3 p-3 rounded-xl cursor-pointer" style={{ backgroundColor: colors.bg.secondary }}>
            <input
              type="checkbox"
              checked={recurring}
              onChange={(e) => setRecurring(e.target.checked)}
              className="w-5 h-5 rounded"
              style={{ accentColor: '#D4A574' }}
            />
            <span className="font-medium" style={{ color: colors.text.primary }}>
              Recurring yearly
            </span>
          </label>

          {/* Title */}
          <div>
            <label
              className="block text-sm font-semibold mb-2"
              style={{ color: colors.text.primary }}
            >
              Title (optional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={MILESTONE_TYPE_LABELS[milestoneType]}
              className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none"
              style={{ borderColor: colors.border.medium }}
            />
          </div>

          {/* Reminders */}
          <div>
            <label
              className="block text-sm font-semibold mb-2"
              style={{ color: colors.text.primary }}
            >
              Reminders
            </label>
            <div className="space-y-2 rounded-xl p-4" style={{ backgroundColor: colors.bg.secondary }}>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={reminder30d}
                  onChange={(e) => setReminder30d(e.target.checked)}
                  className="w-5 h-5 rounded"
                  style={{ accentColor: '#D4A574' }}
                />
                <span style={{ color: colors.text.primary }}>30 days before</span>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={reminder7d}
                  onChange={(e) => setReminder7d(e.target.checked)}
                  className="w-5 h-5 rounded"
                  style={{ accentColor: '#D4A574' }}
                />
                <span style={{ color: colors.text.primary }}>7 days before</span>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={reminder1d}
                  onChange={(e) => setReminder1d(e.target.checked)}
                  className="w-5 h-5 rounded"
                  style={{ accentColor: '#D4A574' }}
                />
                <span style={{ color: colors.text.primary }}>1 day before</span>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={reminderDayOf}
                  onChange={(e) => setReminderDayOf(e.target.checked)}
                  className="w-5 h-5 rounded"
                  style={{ accentColor: '#D4A574' }}
                />
                <span style={{ color: colors.text.primary }}>On the day</span>
              </label>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label
              className="block text-sm font-semibold mb-2"
              style={{ color: colors.text.primary }}
            >
              Notes
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Gift ideas, celebration plans..."
              className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none resize-none"
              style={{ borderColor: colors.border.medium }}
            />
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex gap-3" style={{ borderColor: colors.border.light }}>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold transition-colors disabled:opacity-50"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
          <div className="flex-1" />
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold transition-colors"
            style={{ color: colors.text.primary }}
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isUpdating}
            className="px-4 py-3 rounded-xl font-semibold text-white transition-opacity disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)',
            }}
          >
            {isUpdating ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};
