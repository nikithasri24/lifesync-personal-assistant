/**
 * SmartSchedulePopover - Reusable popover for smart task scheduling
 * Shows energy-based time suggestions for a selected task
 * Used by both Calendar sidebar and Tasks page
 */

import React, { useState, useRef, useEffect } from 'react';
import { format, addMinutes } from 'date-fns';
import { Zap, Battery, BatteryLow, X, ChevronLeft, ChevronRight, CalendarClock } from 'lucide-react';
import { useTaskSchedulingSuggestions } from '../../hooks/useSchedulingQuery';
import type { ScoredTimeSlot, EnergyLevel } from '../../services/scheduling';

interface SmartSchedulePopoverProps {
  task: {
    id: string;
    title: string;
    priority: 'urgent' | 'high' | 'medium' | 'low';
    estimatedMinutes?: number;
  };
  onSchedule: (taskId: string, start: Date, end: Date) => void;
  onClose: () => void;
  /** Position relative to trigger element */
  position?: 'left' | 'right' | 'bottom';
}

const energyIcons: Record<EnergyLevel, React.ReactNode> = {
  peak: <Zap className="w-3 h-3 text-yellow-500" />,
  moderate: <Battery className="w-3 h-3 text-blue-500" />,
  low: <BatteryLow className="w-3 h-3 text-slate-400" />,
};

export function SmartSchedulePopover({
  task,
  onSchedule,
  onClose,
  position = 'bottom',
}: SmartSchedulePopoverProps): React.ReactElement {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const popoverRef = useRef<HTMLDivElement>(null);

  // Build task object for the hook
  const taskForSuggestions = {
    id: task.id,
    title: task.title,
    priority: task.priority,
    estimatedMinutes: task.estimatedMinutes || 30,
  };

  const { data: suggestions, isLoading } = useTaskSchedulingSuggestions(
    taskForSuggestions,
    selectedDate
  );

  const suggestedSlots = suggestions?.suggestedSlots || [];

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Close on Escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleScheduleSlot = (slot: ScoredTimeSlot) => {
    const endTime = addMinutes(slot.start, task.estimatedMinutes || 30);
    onSchedule(task.id, slot.start, endTime);
    onClose();
  };

  const goToPreviousDay = () => {
    setSelectedDate(prev => new Date(prev.getTime() - 24 * 60 * 60 * 1000));
  };

  const goToNextDay = () => {
    setSelectedDate(prev => new Date(prev.getTime() + 24 * 60 * 60 * 1000));
  };

  const positionClasses = {
    left: 'right-full mr-2',
    right: 'left-full ml-2',
    bottom: 'top-full mt-2',
  };

  return (
    <div
      ref={popoverRef}
      className={`absolute z-50 ${positionClasses[position]} w-64 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-purple-50 dark:bg-purple-900/30 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <CalendarClock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
            Schedule Task
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-purple-100 dark:hover:bg-purple-800 rounded transition-colors"
        >
          <X className="w-4 h-4 text-purple-600 dark:text-purple-400" />
        </button>
      </div>

      {/* Date Navigation */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 dark:border-slate-700">
        <button
          onClick={goToPreviousDay}
          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
        >
          <ChevronLeft className="w-4 h-4 text-slate-600 dark:text-slate-400" />
        </button>
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {format(selectedDate, 'EEE, MMM d')}
        </span>
        <button
          onClick={goToNextDay}
          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
        >
          <ChevronRight className="w-4 h-4 text-slate-600 dark:text-slate-400" />
        </button>
      </div>

      {/* Suggestions */}
      <div className="p-2 max-h-48 overflow-y-auto">
        {isLoading ? (
          <div className="text-center py-4 text-sm text-slate-500">Loading suggestions...</div>
        ) : suggestedSlots.length > 0 ? (
          <div className="space-y-1">
            {suggestedSlots.slice(0, 5).map((slot, i) => (
              <button
                key={i}
                onClick={() => handleScheduleSlot(slot)}
                className="w-full flex items-center gap-2 p-2 rounded-md border border-slate-200 dark:border-slate-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:border-purple-300 dark:hover:border-purple-600 transition-colors text-left"
              >
                {energyIcons[slot.energyLevel]}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-800 dark:text-slate-200">
                    {format(slot.start, 'h:mm a')}
                  </div>
                  <div className="text-xs text-slate-500 truncate">
                    {slot.reasons?.[0] || `${slot.energyLevel} energy`}
                  </div>
                </div>
                <div className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                  slot.score >= 80 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                  slot.score >= 60 ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                  'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                }`}>
                  {slot.score}
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-sm text-slate-500">
            No available slots for this day
          </div>
        )}
      </div>
    </div>
  );
}

