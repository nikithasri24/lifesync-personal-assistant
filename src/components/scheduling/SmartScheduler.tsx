/**
 * Smart Scheduler Component
 * Shows optimal time slots and allows scheduling tasks
 */

import React, { useState } from 'react';
import { format, addDays } from 'date-fns';
import {
  Clock, Zap, Battery, BatteryLow, Calendar, ChevronLeft, ChevronRight,
  Sparkles, CheckCircle, AlertCircle
} from 'lucide-react';
import { useDaySchedule, useTaskSchedulingSuggestions, useFreeSlots } from '../../hooks/useSchedulingQuery';
import type { ScoredTimeSlot, EnergyLevel } from '../../services/scheduling';

interface SmartSchedulerProps {
  task?: {
    id: string;
    title: string;
    priority: 'urgent' | 'high' | 'medium' | 'low';
    estimatedMinutes: number;
  };
  onSchedule?: (taskId: string, start: Date, end: Date) => void;
  className?: string;
}

const energyIcons: Record<EnergyLevel, React.ReactNode> = {
  peak: <Zap className="w-4 h-4 text-yellow-500" />,
  moderate: <Battery className="w-4 h-4 text-blue-500" />,
  low: <BatteryLow className="w-4 h-4 text-gray-400" />,
};

const energyLabels: Record<EnergyLevel, string> = {
  peak: 'Peak Energy',
  moderate: 'Moderate',
  low: 'Low Energy',
};

export function SmartScheduler({ task, onSchedule, className = '' }: SmartSchedulerProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedSlot, setSelectedSlot] = useState<ScoredTimeSlot | null>(null);

  const { data: daySchedule, isLoading: scheduleLoading } = useDaySchedule(selectedDate);
  const { data: suggestions, isLoading: suggestionsLoading } = useTaskSchedulingSuggestions(
    task || null,
    selectedDate
  );
  const { data: freeSlots = [] } = useFreeSlots(selectedDate, task?.estimatedMinutes || 15);

  const handlePrevDay = () => setSelectedDate(d => addDays(d, -1));
  const handleNextDay = () => setSelectedDate(d => addDays(d, 1));

  const handleSelectSlot = (slot: ScoredTimeSlot) => {
    setSelectedSlot(slot);
  };

  const handleConfirmSchedule = () => {
    if (task && selectedSlot && onSchedule) {
      const end = new Date(selectedSlot.start.getTime() + task.estimatedMinutes * 60000);
      onSchedule(task.id, selectedSlot.start, end);
      setSelectedSlot(null);
    }
  };

  const isLoading = scheduleLoading || suggestionsLoading;

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Smart Scheduler</h3>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handlePrevDay} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
              <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[120px] text-center">
              {format(selectedDate, 'EEE, MMM d')}
            </span>
            <button onClick={handleNextDay} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
              <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Day Overview */}
        {daySchedule && (
          <div className="mt-3 flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
              <Calendar className="w-4 h-4" />
              <span>{daySchedule.events.length} events</span>
            </div>
            <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
              <Clock className="w-4 h-4" />
              <span>{Math.floor(daySchedule.totalFreeMinutes / 60)}h {daySchedule.totalFreeMinutes % 60}m free</span>
            </div>
            <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all"
                style={{ width: `${daySchedule.busyPercentage}%` }}
              />
            </div>
            <span className="text-xs text-gray-500">{daySchedule.busyPercentage}% busy</span>
          </div>
        )}
      </div>

      {/* Task being scheduled */}
      {task && (
        <div className="px-4 py-3 bg-purple-50 dark:bg-purple-900/20 border-b border-purple-100 dark:border-purple-800">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
              Scheduling: {task.title}
            </span>
            <span className="text-xs text-purple-500 dark:text-purple-400">
              ({task.estimatedMinutes} min)
            </span>
          </div>
        </div>
      )}

      {/* Suggestions */}
      <div className="p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full" />
          </div>
        ) : suggestions?.unschedulable ? (
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 py-4">
            <AlertCircle className="w-5 h-5" />
            <span>{suggestions.unschedulableReason}</span>
          </div>
        ) : (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              {task ? 'Suggested Times' : 'Available Slots'}
            </h4>
            {(task ? suggestions?.suggestedSlots : freeSlots.map(s => ({ ...s, score: 50, reasons: [], energyLevel: 'moderate' as EnergyLevel, conflicts: [] })))?.map((slot, i) => (
              <TimeSlotCard
                key={i}
                slot={slot as ScoredTimeSlot}
                isSelected={selectedSlot === slot}
                onSelect={() => handleSelectSlot(slot as ScoredTimeSlot)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Confirm Button */}
      {task && selectedSlot && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleConfirmSchedule}
            className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            <CheckCircle className="w-4 h-4" />
            Schedule at {format(selectedSlot.start, 'h:mm a')}
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Individual time slot card
 */
function TimeSlotCard({
  slot,
  isSelected,
  onSelect
}: {
  slot: ScoredTimeSlot;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
        isSelected
          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30'
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-lg font-semibold text-gray-900 dark:text-white">
            {format(slot.start, 'h:mm a')}
          </div>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            - {format(slot.end, 'h:mm a')}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {energyIcons[slot.energyLevel]}
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {energyLabels[slot.energyLevel]}
          </span>
        </div>
      </div>

      {slot.reasons.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {slot.reasons.map((reason, i) => (
            <span
              key={i}
              className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full"
            >
              {reason}
            </span>
          ))}
        </div>
      )}

      {/* Score indicator */}
      <div className="mt-2 flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${
              slot.score >= 70 ? 'bg-green-500' :
              slot.score >= 50 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${slot.score}%` }}
          />
        </div>
        <span className="text-xs text-gray-500">{slot.score}%</span>
      </div>
    </button>
  );
}

export default SmartScheduler;
