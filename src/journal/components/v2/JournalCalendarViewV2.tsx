/**
 * JournalCalendarViewV2 Component
 * Monthly calendar with entry indicators
 * Click day to filter entries
 */

import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useThemeColors } from '@/hooks/useThemeColors';
import { motion } from 'framer-motion';

export interface JournalCalendarViewV2Props {
  entries: Array<{ created_at: string }>;
  selectedDate: Date | null;
  onSelectDate: (date: Date | null) => void;
  currentMonth?: Date;
  onMonthChange?: (month: Date) => void;
}

export const JournalCalendarViewV2: React.FC<JournalCalendarViewV2Props> = ({
  entries,
  selectedDate,
  onSelectDate,
  currentMonth = new Date(),
  onMonthChange,
}) => {
  const colors = useThemeColors();
  const [viewMonth, setViewMonth] = React.useState(currentMonth);

  const handlePrevMonth = () => {
    const newMonth = new Date(viewMonth);
    newMonth.setMonth(newMonth.getMonth() - 1);
    setViewMonth(newMonth);
    if (onMonthChange) onMonthChange(newMonth);
  };

  const handleNextMonth = () => {
    const newMonth = new Date(viewMonth);
    newMonth.setMonth(newMonth.getMonth() + 1);
    setViewMonth(newMonth);
    if (onMonthChange) onMonthChange(newMonth);
  };

  // Get calendar days for the month
  const calendarDays = useMemo(() => {
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay(); // 0 = Sunday

    const days: Array<{ date: Date; isCurrentMonth: boolean; hasEntry: boolean; isToday: boolean }> = [];

    // Add previous month days
    const prevMonthLastDay = new Date(year, month, 0);
    const prevMonthDays = prevMonthLastDay.getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthDays - i);
      days.push({ date, isCurrentMonth: false, hasEntry: false, isToday: false });
    }

    // Add current month days
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      date.setHours(0, 0, 0, 0);

      const hasEntry = entries.some((entry) => {
        const entryDate = new Date(entry.created_at);
        entryDate.setHours(0, 0, 0, 0);
        return entryDate.getTime() === date.getTime();
      });

      const isToday = date.getTime() === today.getTime();

      days.push({ date, isCurrentMonth: true, hasEntry, isToday });
    }

    // Add next month days to fill grid
    const remainingDays = 42 - days.length; // 6 rows * 7 days
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      days.push({ date, isCurrentMonth: false, hasEntry: false, isToday: false });
    }

    return days;
  }, [viewMonth, entries]);

  const monthLabel = viewMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div
      className="rounded-2xl p-4 shadow-sm"
      style={{
        backgroundColor: colors.bg.card,
        boxShadow: '0 2px 12px rgba(92, 74, 58, 0.08)',
      }}
    >
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={handlePrevMonth}
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
          style={{
            backgroundColor: 'rgba(212, 165, 116, 0.1)',
            color: '#C18B5E',
          }}
          aria-label="Previous month"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <h3 className="text-base font-bold" style={{ color: colors.text.primary }}>
          {monthLabel}
        </h3>

        <button
          type="button"
          onClick={handleNextMonth}
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
          style={{
            backgroundColor: 'rgba(212, 165, 116, 0.1)',
            color: '#C18B5E',
          }}
          aria-label="Next month"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Day Labels */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div
            key={day}
            className="text-center text-xs font-bold py-2"
            style={{ color: colors.text.tertiary }}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, index) => {
          const isSelected =
            selectedDate &&
            day.date.getTime() === new Date(selectedDate).setHours(0, 0, 0, 0);

          return (
            <motion.button
              key={index}
              type="button"
              onClick={() => onSelectDate(day.date)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`
                aspect-square rounded-lg
                flex flex-col items-center justify-center
                text-sm font-semibold
                transition-all
                ${!day.isCurrentMonth ? 'opacity-30' : ''}
              `}
              style={{
                backgroundColor: day.isToday
                  ? 'rgba(212, 165, 116, 0.2)'
                  : day.hasEntry
                  ? colors.bg.tertiary
                  : 'transparent',
                color: day.isToday ? '#C18B5E' : colors.text.primary,
                border: isSelected ? '2px solid #C18B5E' : '2px solid transparent',
              }}
            >
              {day.date.getDate()}
              {day.hasEntry && (
                <div
                  className="w-1 h-1 rounded-full mt-0.5"
                  style={{ backgroundColor: '#C18B5E' }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default JournalCalendarViewV2;
