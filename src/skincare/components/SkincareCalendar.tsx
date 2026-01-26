/**
 * SkincareCalendar - Monthly calendar view showing routine completion
 */

import React from 'react';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import type { SkincareLog } from '../types';

type SkincareCalendarProps = {
  logs: SkincareLog[];
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
  onDayClick: (date: string) => void;
};

const SkincareCalendar: React.FC<SkincareCalendarProps> = ({
  logs,
  currentMonth,
  onMonthChange,
  onDayClick,
}) => {
  // Get calendar data
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

  // Get first day of month and total days
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday

  // Build calendar grid
  const calendarDays: (number | null)[] = [];

  // Add empty cells for days before month starts
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null);
  }

  // Add days of month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  // Create a map of logs by date for quick lookup
  const logsByDate = new Map<string, { am: boolean; pm: boolean }>();
  logs.forEach(log => {
    const existing = logsByDate.get(log.date) ?? { am: false, pm: false };
    if (log.routineType === 'AM') existing.am = log.completed;
    if (log.routineType === 'PM') existing.pm = log.completed;
    logsByDate.set(log.date, existing);
  });

  const handlePrevMonth = (): void => {
    const newDate = new Date(year, month - 1, 1);
    onMonthChange(newDate);
  };

  const handleNextMonth = (): void => {
    const newDate = new Date(year, month + 1, 1);
    onMonthChange(newDate);
  };

  const getDateString = (day: number): string => {
    return new Date(year, month, day).toISOString().split('T')[0];
  };

  const isToday = (day: number): boolean => {
    const today = new Date();
    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    );
  };

  const isFutureDate = (day: number): boolean => {
    const date = new Date(year, month, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date > today;
  };

  return (
    <div className="rounded-2xl bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{monthName}</h3>
        <div className="flex items-center gap-1">
          <button
            onClick={handlePrevMonth}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors"
            title="Previous month"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={handleNextMonth}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors"
            title="Next month"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center">
            <Check className="h-3 w-3 text-white" />
          </div>
          <span className="text-xs text-gray-600 dark:text-gray-400">AM</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center">
            <Check className="h-3 w-3 text-white" />
          </div>
          <span className="text-xs text-gray-600 dark:text-gray-400">PM</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
            <Check className="h-3 w-3 text-white" />
          </div>
          <span className="text-xs text-gray-600 dark:text-gray-400">Both</span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}>
        {/* Day headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div
            key={day}
            className="text-center text-sm font-semibold text-gray-700 dark:text-gray-300 pb-2"
          >
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {calendarDays.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} className="aspect-square" />;
          }

          const dateString = getDateString(day);
          const completion = logsByDate.get(dateString);
          const bothComplete = completion?.am && completion?.pm;
          const amOnly = completion?.am && !completion?.pm;
          const pmOnly = !completion?.am && completion?.pm;
          const today = isToday(day);
          const future = isFutureDate(day);

          return (
            <button
              key={day}
              onClick={() => onDayClick(dateString)}
              disabled={future}
              className={`aspect-square rounded-xl flex flex-col items-center justify-center p-2 border-2 transition-all ${
                future
                  ? 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-300 dark:text-gray-600 cursor-not-allowed'
                  : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 hover:shadow-sm cursor-pointer'
              } ${today ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/30' : ''}`}
            >
              <span className={`text-base font-semibold mb-1 ${
                today ? 'text-blue-600 dark:text-blue-400' : future ? 'text-gray-300 dark:text-gray-600' : 'text-gray-900 dark:text-gray-100'
              }`}>
                {day}
              </span>

              {!future && (
                <div className="flex items-center gap-1">
                  {bothComplete ? (
                    <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                  ) : (
                    <>
                      {amOnly && (
                        <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      )}
                      {pmOnly && (
                        <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      )}
                      {!completion && (
                        <div className="w-5 h-5 rounded-full border-2 border-gray-300 dark:border-gray-500" />
                      )}
                    </>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Stats */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {Array.from(logsByDate.values()).filter(d => d.am && d.pm).length}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Perfect Days</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {Array.from(logsByDate.values()).filter(d => d.am).length}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">AM Completed</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              {Array.from(logsByDate.values()).filter(d => d.pm).length}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">PM Completed</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkincareCalendar;
