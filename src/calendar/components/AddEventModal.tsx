/**
 * AddEventModal Component - MIGRATED to use FormModalV2
 * Create calendar events with Together pattern
 *
 * MIGRATION COMPLETE:
 * - Reduced from 363 lines to ~250 lines (31% reduction)
 * - Removed all boilerplate (ESC key, backdrop, auto-save, modal structure)
 * - Form state managed by FormModalV2
 * - 9 form fields with conditional time fields (hidden when all-day is checked)
 * - 5 event types with emoji icons
 */

import React from 'react';
import { FormModalV2 } from '@/components/v2';
import { useCreateCalendarEvent } from '@/hooks/useCalendarQuery';
import { useToast } from '@/hooks/useToast';
import { format } from 'date-fns';
import type { CalendarEvent } from '@/services/types';

interface AddEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDate?: Date;
}

const EVENT_TYPES: Array<{ value: CalendarEvent['type']; label: string; emoji: string }> = [
  { value: 'event', label: 'Event', emoji: '📅' },
  { value: 'meeting', label: 'Meeting', emoji: '💼' },
  { value: 'reminder', label: 'Reminder', emoji: '⏰' },
  { value: 'birthday', label: 'Birthday', emoji: '🎂' },
  { value: 'holiday', label: 'Holiday', emoji: '🎉' },
];

interface EventFormState {
  title: string;
  description: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  allDay: boolean;
  eventType: CalendarEvent['type'];
  location: string;
}

export const AddEventModal: React.FC<AddEventModalProps> = ({
  isOpen,
  onClose,
  initialDate,
}) => {
  const { showToast } = useToast();
  const { mutate: createEvent, isPending } = useCreateCalendarEvent();

  const defaultDate = initialDate || new Date();
  const defaultDateStr = format(defaultDate, 'yyyy-MM-dd');
  const defaultTimeStr = format(defaultDate, 'HH:mm');

  const defaultFormData: EventFormState = {
    title: '',
    description: '',
    startDate: defaultDateStr,
    startTime: defaultTimeStr,
    endDate: defaultDateStr,
    endTime: defaultTimeStr,
    allDay: false,
    eventType: 'event',
    location: '',
  };

  return (
    <FormModalV2<EventFormState>
      isOpen={isOpen}
      onClose={onClose}
      title="Add Event"
      defaultData={defaultFormData}
      draftKey="calendar_add_event_modal_draft"
      isPending={isPending}
      submitText="Create Event"
      isEditing={false}
      onSubmit={async (formData) => {
        // Build start and end datetime strings
        const startDateTime = formData.allDay
          ? `${formData.startDate}T00:00:00`
          : `${formData.startDate}T${formData.startTime || '00:00'}:00`;

        const endDateTime = formData.allDay
          ? `${formData.endDate || formData.startDate}T23:59:59`
          : `${formData.endDate || formData.startDate}T${formData.endTime || formData.startTime || '00:00'}:00`;

        return new Promise((resolve, reject) => {
          createEvent(
            {
              title: formData.title.trim(),
              description: formData.description.trim() || null,
              start_date: startDateTime,
              start_time: formData.allDay ? null : (formData.startTime || null),
              end_date: endDateTime,
              end_time: formData.allDay ? null : (formData.endTime || null),
              all_day: formData.allDay,
              location: formData.location.trim() || null,
              type: formData.eventType,
              color: null,
              is_recurring: false,
              recurrence_rule: null,
              reminder_minutes: null,
              attendees: null,
              task_id: null,
              project_id: null,
            },
            {
              onSuccess: () => {
                showToast('Event created successfully! 🎉', 'success');
                resolve();
              },
              onError: (error) => {
                showToast(`Failed to create event: ${error.message}`, 'error');
                reject(error);
              },
            }
          );
        });
      }}
      validate={(formData) => {
        if (!formData.title.trim()) return 'Please enter an event title';
        if (!formData.startDate) return 'Please select a start date';
        return null;
      }}
    >
      {(formState, setFormState) => (
        <>
          {/* Event Title */}
          <div>
            <label htmlFor="event-title" className="block text-sm font-semibold text-gray-900 mb-2">
              Event Title <span className="text-red-500">*</span>
            </label>
            <input
              id="event-title"
              type="text"
              value={formState.title}
              onChange={(e) => setFormState({ ...formState, title: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
              placeholder="e.g., Team Meeting, Birthday Party"
              required
            />
          </div>

          {/* Event Type */}
          <div>
            <label htmlFor="event-type" className="block text-sm font-semibold text-gray-900 mb-2">
              Event Type
            </label>
            <select
              id="event-type"
              value={formState.eventType}
              onChange={(e) => setFormState({ ...formState, eventType: e.target.value as CalendarEvent['type'] })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
            >
              {EVENT_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.emoji} {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* All-Day Toggle */}
          <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer">
            <input
              type="checkbox"
              checked={formState.allDay}
              onChange={(e) => setFormState({ ...formState, allDay: e.target.checked })}
              className="w-5 h-5 text-terracotta-400 rounded focus:ring-terracotta-300"
            />
            <span className="font-medium text-gray-900">All-day event</span>
          </label>

          {/* Start Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="start-date" className="block text-sm font-semibold text-gray-900 mb-2">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                id="start-date"
                type="date"
                value={formState.startDate}
                onChange={(e) => setFormState({ ...formState, startDate: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
                required
              />
            </div>
            {!formState.allDay && (
              <div>
                <label htmlFor="start-time" className="block text-sm font-semibold text-gray-900 mb-2">
                  Start Time
                </label>
                <input
                  id="start-time"
                  type="time"
                  value={formState.startTime}
                  onChange={(e) => setFormState({ ...formState, startTime: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
                />
              </div>
            )}
          </div>

          {/* End Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="end-date" className="block text-sm font-semibold text-gray-900 mb-2">
                End Date
              </label>
              <input
                id="end-date"
                type="date"
                value={formState.endDate}
                onChange={(e) => setFormState({ ...formState, endDate: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
              />
            </div>
            {!formState.allDay && (
              <div>
                <label htmlFor="end-time" className="block text-sm font-semibold text-gray-900 mb-2">
                  End Time
                </label>
                <input
                  id="end-time"
                  type="time"
                  value={formState.endTime}
                  onChange={(e) => setFormState({ ...formState, endTime: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
                />
              </div>
            )}
          </div>

          {/* Location */}
          <div>
            <label htmlFor="location" className="block text-sm font-semibold text-gray-900 mb-2">
              Location
            </label>
            <input
              id="location"
              type="text"
              value={formState.location}
              onChange={(e) => setFormState({ ...formState, location: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
              placeholder="e.g., Conference Room A, Central Park"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-semibold text-gray-900 mb-2">
              Description
            </label>
            <textarea
              id="description"
              rows={3}
              value={formState.description}
              onChange={(e) => setFormState({ ...formState, description: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none resize-none transition-all"
              placeholder="Add notes or details about this event..."
            />
          </div>
        </>
      )}
    </FormModalV2>
  );
};
