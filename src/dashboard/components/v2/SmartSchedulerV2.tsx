/**
 * SmartSchedulerV2 Component
 * Smart scheduling with V2 design
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { format, addDays } from 'date-fns';
import {
  Clock, Zap, Battery, BatteryLow, Calendar, ChevronLeft, ChevronRight,
  Sparkles
} from 'lucide-react';
import { useDaySchedule, useScheduleFreeSlots } from '../../../hooks/useSchedulingQuery';
import type { ScoredTimeSlot, EnergyLevel } from '../../../services/scheduling';

export interface SmartSchedulerV2Props {
  className?: string;
}

const energyIcons: Record<EnergyLevel, React.ReactNode> = {
  peak: <Zap className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />,
  moderate: <Battery className="w-4 h-4 text-blue-600 dark:text-blue-400" />,
  low: <BatteryLow className="w-4 h-4 text-gray-500 dark:text-gray-400" />,
};

export const SmartSchedulerV2: React.FC<SmartSchedulerV2Props> = ({ className = '' }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());

  const { data: daySchedule, isLoading: scheduleLoading } = useDaySchedule(selectedDate);
  const { data: freeSlots = [] } = useScheduleFreeSlots(selectedDate, 15);

  const handlePrevDay = () => setSelectedDate(d => addDays(d, -1));
  const handleNextDay = () => setSelectedDate(d => addDays(d, 1));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`
        bg-white dark:bg-gray-800
        rounded-2xl p-6
        border border-gray-200 dark:border-gray-700
        shadow-sm
        ${className}
      `}
    >
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-[var(--color-secondary-500)]/10 dark:bg-[var(--color-secondary-500)]/20">
              <Sparkles className="w-5 h-5 text-[var(--color-secondary-600)] dark:text-[var(--color-secondary-400)]" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Smart Scheduler
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevDay}
              className="
                p-1.5 rounded-lg
                hover:bg-gray-100 dark:hover:bg-gray-700
                transition-colors
              "
            >
              <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <span className="text-sm font-medium text-gray-900 dark:text-white min-w-[120px] text-center">
              {format(selectedDate, 'EEE, MMM d')}
            </span>
            <button
              onClick={handleNextDay}
              className="
                p-1.5 rounded-lg
                hover:bg-gray-100 dark:hover:bg-gray-700
                transition-colors
              "
            >
              <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Day Overview */}
        {daySchedule && (
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
              <Calendar className="w-4 h-4" />
              <span>{daySchedule.events.length} events</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
              <Clock className="w-4 h-4" />
              <span>
                {Math.floor(daySchedule.totalFreeMinutes / 60)}h{' '}
                {daySchedule.totalFreeMinutes % 60}m free
              </span>
            </div>
            <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${daySchedule.busyPercentage}%` }}
                transition={{ duration: 0.5 }}
                className="h-full bg-[var(--color-primary-500)] rounded-full"
              />
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {daySchedule.busyPercentage}% busy
            </span>
          </div>
        )}
      </div>

      {/* Available Slots */}
      <div>
        {scheduleLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin w-6 h-6 border-2 border-[var(--color-secondary-500)] border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              Available Slots
            </h4>
            {freeSlots.length === 0 ? (
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center py-4">
                No free slots available
              </p>
            ) : (
              freeSlots.slice(0, 5).map((slot, i) => (
                <TimeSlotCard key={i} slot={slot} index={i} />
              ))
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

interface TimeSlotCardProps {
  slot: { start: Date; end: Date; durationMinutes: number };
  index: number;
}

const TimeSlotCard: React.FC<TimeSlotCardProps> = ({ slot, index }) => {
  const hour = slot.start.getHours();
  const energyLevel: EnergyLevel = hour >= 9 && hour < 12 ? 'peak' : hour >= 14 && hour < 15 ? 'low' : 'moderate';

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      whileHover={{ y: -2 }}
      className="
        p-3 rounded-xl
        bg-gray-50 dark:bg-gray-700/50
        border border-gray-200 dark:border-gray-600
        hover:shadow-md
        transition-all duration-200
      "
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-base font-semibold text-gray-900 dark:text-white">
            {format(slot.start, 'h:mm a')}
          </div>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            - {format(slot.end, 'h:mm a')}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {energyIcons[energyLevel]}
          <span className="text-xs text-gray-600 dark:text-gray-400">
            {slot.durationMinutes}m
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default SmartSchedulerV2;

