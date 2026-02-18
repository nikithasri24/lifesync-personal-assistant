/**
 * Add Event Modal
 * Form to create calendar events with all necessary fields
 */

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useCreateCalendarEvent } from '@/hooks/useCalendarQuery';
import { useToast } from '@/hooks/useToast';
import { logger } from '@/services/logger';
import { format } from 'date-fns';
import type { CalendarEvent } from '@/services/types';

interface AddEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDate?: Date;
}

const STORAGE_KEY = 'calendar_add_event_draft';

const EVENT_TYPES: Array<{ value: CalendarEvent['type']; label: string; emoji: string }> = [
  { value: 'event', label: 'Event', emoji: '📅' },
  { value: 'meeting', label: 'Meeting', emoji: '💼' },
  { value: 'reminder', label: 'Reminder', emoji: '⏰' },
  { value: 'birthday', label: 'Birthday', emoji: '🎂' },
  { value: 'holiday', label: 'Holiday', emoji: '🎉' },
];

export const AddEventModal: React.FC<AddEventModalProps> = ({
  isOpen,
  onClose,
  initialDate,
}) => {
  const { showToast } = useToast();
  const { mutate: createEvent, isPending } = useCreateCalendarEvent();

  // Load saved draft from localStorage
  const loadDraft = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      logger.error('Calendar', error as Error, { context: 'Failed to load event draft' });
    }
    return null;
  };

  const savedDraft = loadDraft();
  const defaultDate = initialDate || new Date();
  const defaultDateStr = format(defaultDate, 'yyyy-MM-dd');
  const defaultTimeStr = format(defaultDate, 'HH:mm');

  // Form state - restore from localStorage if available
  const [title, setTitle] = useState(savedDraft?.title || '');
  const [description, setDescription] = useState(savedDraft?.description || '');
  const [startDate, setStartDate] = useState(savedDraft?.startDate || defaultDateStr);
  const [startTime, setStartTime] = useState(savedDraft?.startTime || defaultTimeStr);
  const [endDate, setEndDate] = useState(savedDraft?.endDate || defaultDateStr);
  const [endTime, setEndTime] = useState(savedDraft?.endTime || defaultTimeStr);
  const [allDay, setAllDay] = useState(savedDraft?.allDay ?? false);
  const [eventType, setEventType] = useState<CalendarEvent['type']>(savedDraft?.eventType || 'event');
  const [location, setLocation] = useState(savedDraft?.location || '');

  // Auto-save draft to localStorage whenever form changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      title,
      description,
      startDate,
      startTime,
      endDate,
      endTime,
      allDay,
      eventType,
      location,
    }));
  }, [title, description, startDate, startTime, endDate, endTime, allDay, eventType, location]);

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

    // Validate form
    if (!title.trim()) {
      showToast('Please enter an event title', 'error');
      return;
    }

    if (!startDate) {
      showToast('Please select a start date', 'error');
      return;
    }

    // Build start and end datetime strings
    const startDateTime = allDay
      ? `${startDate}T00:00:00`
      : `${startDate}T${startTime || '00:00'}:00`;

    const endDateTime = allDay
      ? `${endDate || startDate}T23:59:59`
      : `${endDate || startDate}T${endTime || startTime || '00:00'}:00`;

    createEvent(
      {
        title: title.trim(),
        description: description.trim() || null,
        start_date: startDateTime,
        start_time: allDay ? null : (startTime || null),
        end_date: endDateTime,
        end_time: allDay ? null : (endTime || null),
        all_day: allDay,
        location: location.trim() || null,
        type: eventType,
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
          // Clear draft from localStorage
          localStorage.removeItem(STORAGE_KEY);
          onClose();
        },
        onError: (error) => {
          showToast(`Failed to create event: ${error.message}`, 'error');
        },
      }
    );
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
      <div
        className="w-full bg-white lg:rounded-3xl rounded-t-3xl overflow-hidden flex flex-col"
        style={{ maxHeight: '90vh', maxWidth: '600px' }}
      >
        {/* Mobile Drag Handle */}
        <div className="lg:hidden pt-2 flex-shrink-0">
          <div className="w-9 h-1 rounded-full mx-auto bg-gray-300" />
        </div>

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-2xl font-bold text-gray-900">Add Event</h2>
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
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div
            className="overflow-y-auto p-6 space-y-5 flex-1"
            style={{ maxHeight: 'calc(90vh - 140px)' }}
          >
            {/* Event Title */}
            <div>
              <label htmlFor="event-title" className="block text-sm font-semibold text-gray-900 mb-2">
                Event Title <span className="text-red-500">*</span>
              </label>
              <input
                id="event-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
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
                value={eventType}
                onChange={(e) => setEventType(e.target.value as CalendarEvent['type'])}
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
                checked={allDay}
                onChange={(e) => setAllDay(e.target.checked)}
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
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
                  required
                />
              </div>
              {!allDay && (
                <div>
                  <label htmlFor="start-time" className="block text-sm font-semibold text-gray-900 mb-2">
                    Start Time
                  </label>
                  <input
                    id="start-time"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
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
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
                />
              </div>
              {!allDay && (
                <div>
                  <label htmlFor="end-time" className="block text-sm font-semibold text-gray-900 mb-2">
                    End Time
                  </label>
                  <input
                    id="end-time"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
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
                value={location}
                onChange={(e) => setLocation(e.target.value)}
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
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none resize-none transition-all"
                placeholder="Add notes or details about this event..."
              />
            </div>
          </div>

          {/* Modal Footer */}
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
              style={{
                background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)',
              }}
            >
              {isPending ? 'Creating...' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
