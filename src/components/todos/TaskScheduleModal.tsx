/**
 * TaskScheduleModal
 * Compact scheduling modal opened directly from a task card.
 * Lets users pick a day this week + a time slot without leaving Todos.
 */

import React, { useEffect, useState } from 'react';
import {
  format, addDays, startOfDay, addMinutes, parseISO,
} from 'date-fns';
import { X, Zap, Battery, BatteryLow, Clock, CalendarX } from 'lucide-react';
import type { TaskData } from '../../services/types';
import { useTaskSchedulingSuggestions } from '../../hooks/useSchedulingQuery';
import { useTasks } from '../../hooks/useTasksQuery';
import type { EnergyLevel } from '../../services/scheduling';

interface TaskScheduleModalProps {
  task: TaskData;
  onSchedule: (start: Date, end: Date) => void;
  onClearSchedule: () => void;
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

const loadBarColor = (minutes: number) => {
  if (minutes === 0) return '#e5e7eb';
  if (minutes < 180) return '#86efac';
  if (minutes < 360) return '#fcd34d';
  return '#f87171';
};

export const TaskScheduleModal: React.FC<TaskScheduleModalProps> = ({
  task,
  onSchedule,
  onClearSchedule,
  onClose,
}) => {
  // Default to today or the task's existing scheduled date
  // Support both TaskData (snake_case string) and Task (camelCase Date) at runtime
  const scheduledStartRaw = task.scheduled_start
    ?? (task as unknown as { scheduledStart?: Date | string }).scheduledStart;
  const existingStart = scheduledStartRaw
    ? (typeof scheduledStartRaw === 'string'
        ? parseISO(scheduledStartRaw)
        : scheduledStartRaw)
    : null;

  const [selectedDate, setSelectedDate] = useState<Date>(
    existingStart ? startOfDay(existingStart) : startOfDay(new Date())
  );

  // Fetch all tasks to compute per-day workload
  const { data: allTasks = [] } = useTasks();

  // Smart suggestions for the selected day
  const taskForSuggestions = {
    id: task.id || '',
    title: task.title,
    priority: (task.priority || 'medium') as 'urgent' | 'high' | 'medium' | 'low',
    estimatedMinutes: task.estimated_time || 30,
  };
  const { data: suggestions, isLoading: suggestionsLoading } = useTaskSchedulingSuggestions(
    taskForSuggestions,
    selectedDate
  );
  const topSlots = suggestions?.suggestedSlots?.slice(0, 3) ?? [];

  // Build 7-day strip starting from today
  const today = startOfDay(new Date());
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(today, i));

  const dayWorkload = (date: Date): number => {
    const key = format(date, 'yyyy-MM-dd');
    return allTasks
      .filter(t => t.due_date === key && t.status !== 'done')
      .reduce((sum, t) => sum + (t.estimated_time ?? 30), 0);
  };

  // ESC to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const scheduleAtHour = (hour: number) => {
    const start = new Date(selectedDate);
    start.setHours(hour, 0, 0, 0);
    const end = addMinutes(start, task.estimated_time || 30);
    onSchedule(start, end);
  };

  const scheduleAtSlot = (slotStart: Date) => {
    const end = addMinutes(slotStart, task.estimated_time || 30);
    onSchedule(slotStart, end);
  };

  const isSelectedDay = (date: Date) =>
    format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');

  const isExistingDay = existingStart
    ? format(startOfDay(existingStart), 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
    : false;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden" data-testid="schedule-modal">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex-1 min-w-0 mr-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">
              Schedule task
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

        <div className="p-4 space-y-4 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 80px)' }}>
          {/* Current schedule badge */}
          {existingStart && (
            <div className="flex items-center justify-between px-3 py-2 bg-green-50 rounded-xl border border-green-200">
              <span className="text-xs font-medium text-green-700">
                📅 {format(existingStart, 'EEE MMM d')} at {format(existingStart, 'h:mm a')}
              </span>
              <button
                onClick={onClearSchedule}
                className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
                aria-label="Clear schedule"
              >
                <CalendarX className="w-3.5 h-3.5" />
                Clear
              </button>
            </div>
          )}

          {/* 7-day strip */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Pick a day
            </p>
            <div className="grid grid-cols-7 gap-1">
              {weekDays.map((date, i) => {
                const load = dayWorkload(date);
                const isSelected = isSelectedDay(date);
                const isToday = i === 0;

                return (
                  <button
                    key={i}
                    onClick={() => setSelectedDate(date)}
                    className={`flex flex-col items-center gap-1 py-2 rounded-xl transition-all text-center ${
                      isSelected
                        ? 'ring-2 ring-[#C18B5E] bg-[#FDF7F2]'
                        : 'hover:bg-gray-50'
                    }`}
                    title={format(date, 'EEEE, MMM d')}
                  >
                    <span className={`text-[9px] font-semibold uppercase ${
                      isSelected ? 'text-[#C18B5E]' : 'text-gray-400'
                    }`}>
                      {isToday ? 'Today' : format(date, 'EEE')}
                    </span>
                    <span className={`text-sm font-bold ${
                      isSelected ? 'text-[#C18B5E]' : 'text-gray-700'
                    }`}>
                      {format(date, 'd')}
                    </span>
                    {/* Load bar */}
                    <div
                      className="w-4 rounded-full"
                      style={{ height: '3px', backgroundColor: loadBarColor(load) }}
                      title={`${Math.round(load / 60 * 10) / 10}h scheduled`}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick times */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              {isExistingDay && existingStart
                ? `Change time on ${format(selectedDate, 'EEE MMM d')}`
                : `Time on ${format(selectedDate, 'EEE MMM d')}`}
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
              <Zap className="w-3 h-3 text-purple-500" />
              Best times
            </p>
            {suggestionsLoading ? (
              <div className="space-y-1.5">
                {[1, 2].map((i) => (
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
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                      slot.score >= 80 ? 'bg-green-100 text-green-700'
                      : slot.score >= 60 ? 'bg-amber-100 text-amber-700'
                      : 'bg-gray-100 text-gray-600'
                    }`}>
                      {slot.score}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 text-center py-2">
                No open slots for this day
              </p>
            )}
          </div>

          {/* Cancel */}
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-semibold text-gray-600 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
