/**
 * DropTimePickerModal - Shown when a task is dropped on a month-view date.
 * Lets the user pick a specific time, use smart suggestions, or keep it all-day.
 */

import React, { useEffect } from 'react';
import { format, addMinutes, startOfDay } from 'date-fns';
import { X, Sparkles, Calendar, Zap, Battery, BatteryLow, Clock } from 'lucide-react';
import type { Task } from '../../lib/supabase';
import { useTaskSchedulingSuggestions } from '../../hooks/useSchedulingQuery';
import type { EnergyLevel } from '../../services/scheduling';

interface DropTimePickerModalProps {
  task: Task;
  date: Date;
  onSchedule: (scheduledStart: string, scheduledEnd: string, dueDate: string) => void;
  onAllDay: (dueDate: string) => void;
  onClose: () => void;
}

const QUICK_TIMES = [
  { label: '9 AM', hour: 9 },
  { label: '12 PM', hour: 12 },
  { label: '2 PM', hour: 14 },
  { label: '4 PM', hour: 16 },
];

const energyIcon = (level: EnergyLevel) => {
  if (level === 'peak') return <Zap className="w-3 h-3 text-yellow-500" />;
  if (level === 'moderate') return <Battery className="w-3 h-3 text-[#C18B5E]" />;
  return <BatteryLow className="w-3 h-3 text-gray-400" />;
};

export const DropTimePickerModal: React.FC<DropTimePickerModalProps> = ({
  task,
  date,
  onSchedule,
  onAllDay,
  onClose,
}) => {
  // Normalize to local midnight so setHours() always targets the correct calendar day
  const dayMidnight = startOfDay(date);
  const dueDate = format(dayMidnight, 'yyyy-MM-dd');

  const taskForSuggestions = {
    id: task.id as string,
    title: task.title,
    priority: (task.priority || 'medium') as 'urgent' | 'high' | 'medium' | 'low',
    estimatedMinutes: task.estimated_time || 30,
  };

  const { data: suggestions, isLoading } = useTaskSchedulingSuggestions(taskForSuggestions, date);
  const topSlots = suggestions?.suggestedSlots?.slice(0, 3) ?? [];

  // ESC to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const scheduleAtHour = (hour: number) => {
    const start = new Date(dayMidnight);
    start.setHours(hour, 0, 0, 0);
    const end = addMinutes(start, task.estimated_time || 30);
    onSchedule(start.toISOString(), end.toISOString(), dueDate);
  };

  const scheduleAtSlot = (slotStart: Date) => {
    const end = addMinutes(slotStart, task.estimated_time || 30);
    const slotDate = format(slotStart, 'yyyy-MM-dd');
    onSchedule(slotStart.toISOString(), end.toISOString(), slotDate);
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex-1 min-w-0 mr-3">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">
              Schedule for {format(date, 'EEEE, MMM d')}
            </p>
            <h2 className="text-sm font-bold text-gray-900 truncate" title={task.title}>
              {task.title}
            </h2>
            {task.estimated_time && (
              <p className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                <Clock className="w-3 h-3" />
                {task.estimated_time} min
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
            aria-label="Close"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Quick time buttons */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Quick times
            </p>
            <div className="grid grid-cols-4 gap-2">
              {QUICK_TIMES.map(({ label, hour }) => (
                <button
                  key={hour}
                  onClick={() => scheduleAtHour(hour)}
                  className="py-2 text-xs font-semibold rounded-xl border border-gray-200 hover:border-[#C18B5E] hover:bg-[#FDF7F2] text-gray-700 hover:text-[#C18B5E] transition-all"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Smart suggestions */}
          <div>
            <p className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              <Sparkles className="w-3 h-3 text-purple-500" />
              Smart suggestions
            </p>

            <div className="min-h-[7.5rem]">
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-10 bg-gray-100 animate-pulse rounded-xl" />
                ))}
              </div>
            ) : topSlots.length > 0 ? (
              <div className="space-y-1.5">
                {topSlots.map((slot, i) => (
                  <button
                    key={i}
                    onClick={() => scheduleAtSlot(slot.start)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all text-left"
                  >
                    {energyIcon(slot.energyLevel)}
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-semibold text-gray-800">
                        {format(slot.start, 'h:mm a')}
                      </span>
                      {slot.reasons?.[0] && (
                        <span className="ml-2 text-xs text-gray-400">{slot.reasons[0]}</span>
                      )}
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      slot.score >= 80
                        ? 'bg-green-100 text-green-700'
                        : slot.score >= 60
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {slot.score}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 text-center py-3">
                No open slots found for this day
              </p>
            )}
            </div>
          </div>

          {/* All day / cancel */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => onAllDay(dueDate)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-xs font-semibold text-gray-600 transition-colors"
            >
              <Calendar className="w-3.5 h-3.5" />
              All day
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-semibold text-gray-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
