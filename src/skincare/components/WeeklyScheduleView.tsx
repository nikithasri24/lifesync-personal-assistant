/**
 * WeeklyScheduleView - Shows a week-at-a-glance view of skincare routines
 * Displays AM/PM routines for each day of the week
 */

import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import TimeSlotCard from './TimeSlotCard';
import RoutineCompletionModal from './RoutineCompletionModal';
import {
  useSkincareProducts,
  useSkincareRoutines,
  useSkincareLogs,
} from '../../hooks/useSkincareQuery';
import type { SkincareRoutine, SkincareLog } from '../types';

interface WeeklyScheduleViewProps {
  className?: string;
}

const WeeklyScheduleView: React.FC<WeeklyScheduleViewProps> = ({ className = '' }) => {
  // State for week navigation
  const [weekOffset, setWeekOffset] = useState(0); // 0 = current week, -1 = last week, 1 = next week

  // State for completion modal
  const [selectedRoutine, setSelectedRoutine] = useState<{
    routine: SkincareRoutine;
    date: string;
    timeSlot: 'AM' | 'PM';
  } | null>(null);

  // Fetch data
  const { data: products = [] } = useSkincareProducts();
  const { data: routines = [] } = useSkincareRoutines({ isActive: true });
  const { data: logs = [] } = useSkincareLogs();

  // Calculate week dates
  const weekDates = useMemo(() => {
    const today = new Date();
    today.setDate(today.getDate() + weekOffset * 7);

    // Get Monday of the current week
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust for Sunday
    const monday = new Date(today.setDate(diff));

    // Generate 7 days starting from Monday
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      return date;
    });
  }, [weekOffset]);

  // Get routines for a specific day and time
  const getRoutinesForDayAndTime = (dayOfWeek: number, timeSlot: 'AM' | 'PM') => {
    return routines.filter((routine) => {
      if (routine.routineType !== timeSlot) return false;
      if (!routine.daysOfWeek || routine.daysOfWeek.length === 0) return true; // All days
      return routine.daysOfWeek.includes(dayOfWeek);
    });
  };

  // Get log for a specific date and time slot
  const getLogForDate = (date: string, timeSlot: 'AM' | 'PM'): SkincareLog | undefined => {
    return logs.find((log) => log.date === date && log.routineType === timeSlot);
  };

  // Get products for a routine
  const getRoutineProducts = (routine: SkincareRoutine) => {
    return routine.productIds
      .map((id) => products.find((p) => p.id === id))
      .filter(Boolean);
  };

  // Handle card click
  const handleCardClick = (routine: SkincareRoutine, date: string, timeSlot: 'AM' | 'PM') => {
    setSelectedRoutine({ routine, date, timeSlot });
  };

  // Week navigation
  const goToPreviousWeek = () => setWeekOffset((prev) => prev - 1);
  const goToNextWeek = () => setWeekOffset((prev) => prev + 1);
  const goToCurrentWeek = () => setWeekOffset(0);

  return (
    <div className={`bg-white rounded-xl border border-gray-200 ${className}`}>
      {/* Header with week navigation */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Weekly Schedule</h3>

          <div className="flex items-center gap-2">
            <button
              onClick={goToPreviousWeek}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title="Previous week"
            >
              <ChevronLeft className="h-4 w-4 text-gray-600" />
            </button>

            {weekOffset !== 0 && (
              <button
                onClick={goToCurrentWeek}
                className="px-3 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                Today
              </button>
            )}

            <button
              onClick={goToNextWeek}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title="Next week"
            >
              <ChevronRight className="h-4 w-4 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Week date range */}
        <p className="text-sm text-gray-600 mt-1">
          {weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} -{' '}
          {weekDates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </p>
      </div>

      {/* Week grid */}
      <div className="p-4">
        <div className="grid grid-cols-7 gap-3">
          {weekDates.map((date, index) => {
            const dayOfWeek = date.getDay(); // 0=Sunday, 1=Monday, etc.
            const dateStr = date.toISOString().split('T')[0];
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
            const dayNum = date.getDate();
            const isToday = dateStr === new Date().toISOString().split('T')[0];

            // Get routines for this day
            const amRoutines = getRoutinesForDayAndTime(dayOfWeek, 'AM');
            const pmRoutines = getRoutinesForDayAndTime(dayOfWeek, 'PM');

            // For simplicity, show the first routine if multiple exist
            const amRoutine = amRoutines[0];
            const pmRoutine = pmRoutines[0];

            const amLog = getLogForDate(dateStr, 'AM');
            const pmLog = getLogForDate(dateStr, 'PM');

            return (
              <div key={dateStr} className="space-y-2">
                {/* Day header */}
                <div className="text-center">
                  <p className="text-xs font-medium text-gray-600">{dayName}</p>
                  <div
                    className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-medium ${
                      isToday
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700'
                    }`}
                  >
                    {dayNum}
                  </div>
                </div>

                {/* AM slot */}
                <TimeSlotCard
                  timeSlot="AM"
                  routine={amRoutine}
                  products={amRoutine ? getRoutineProducts(amRoutine) : []}
                  log={amLog}
                  date={dateStr}
                  onClick={() => {
                    if (amRoutine) handleCardClick(amRoutine, dateStr, 'AM');
                  }}
                />

                {/* PM slot */}
                <TimeSlotCard
                  timeSlot="PM"
                  routine={pmRoutine}
                  products={pmRoutine ? getRoutineProducts(pmRoutine) : []}
                  log={pmLog}
                  date={dateStr}
                  onClick={() => {
                    if (pmRoutine) handleCardClick(pmRoutine, dateStr, 'PM');
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Completion Modal */}
      {selectedRoutine && (
        <RoutineCompletionModal
          routine={selectedRoutine.routine}
          date={selectedRoutine.date}
          timeSlot={selectedRoutine.timeSlot}
          products={getRoutineProducts(selectedRoutine.routine)}
          onClose={() => setSelectedRoutine(null)}
        />
      )}
    </div>
  );
};

export default WeeklyScheduleView;
