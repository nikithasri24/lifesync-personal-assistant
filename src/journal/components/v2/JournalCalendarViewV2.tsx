/**
 * JournalCalendarViewV2 Component
 * Monthly calendar with entry indicators matching design spec
 * Clean, professional calendar with proper styling
 */

import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useThemeColors } from '@/hooks/useThemeColors';

export interface JournalCalendarViewV2Props {
  entries: Array<{ createdAt: Date | string }>;
  selectedDate: Date | null;
  onSelectDate: (date: Date | null) => void;
}

export const JournalCalendarViewV2: React.FC<JournalCalendarViewV2Props> = ({
  entries,
  selectedDate,
  onSelectDate,
}) => {
  const colors = useThemeColors();
  const [viewMonth, setViewMonth] = useState(new Date());

  const handlePrevMonth = () => {
    const newMonth = new Date(viewMonth);
    newMonth.setMonth(newMonth.getMonth() - 1);
    setViewMonth(newMonth);
  };

  const handleNextMonth = () => {
    const newMonth = new Date(viewMonth);
    newMonth.setMonth(newMonth.getMonth() + 1);
    setViewMonth(newMonth);
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
        const entryDate = new Date(entry.createdAt);
        entryDate.setHours(0, 0, 0, 0);
        return entryDate.getTime() === date.getTime();
      });

      const isToday = date.getTime() === today.getTime();

      days.push({ date, isCurrentMonth: true, hasEntry, isToday });
    }

    // Add next month days to fill grid (always show 6 weeks)
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
      className="rounded-2xl p-4 mb-6"
      style={{
        backgroundColor: colors.bg.white,
        boxShadow: '0 2px 12px rgba(92, 74, 58, 0.08)',
      }}
    >
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={handlePrevMonth}
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-opacity-80"
          style={{
            backgroundColor: 'rgba(212, 165, 116, 0.1)',
          }}
          aria-label="Previous month"
        >
          <ChevronLeft className="w-4 h-4" style={{ color: '#C18B5E' }} />
        </button>

        <h3 className="text-base font-bold" style={{ color: '#5C4A3A' }}>
          {monthLabel}
        </h3>

        <button
          type="button"
          onClick={handleNextMonth}
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-opacity-80"
          style={{
            backgroundColor: 'rgba(212, 165, 116, 0.1)',
          }}
          aria-label="Next month"
        >
          <ChevronRight className="w-4 h-4" style={{ color: '#C18B5E' }} />
        </button>
      </div>

      {/* Day Labels */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '8px' }}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div
            key={day}
            style={{
              textAlign: 'center',
              fontSize: '11px',
              fontWeight: 700,
              padding: '8px 4px',
              color: '#9B8B7A',
            }}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
        {calendarDays.map((day, index) => {
          const isSelected =
            selectedDate &&
            day.date.getTime() === new Date(selectedDate).setHours(0, 0, 0, 0);

          // Determine background color
          let backgroundColor = 'transparent';
          if (day.isToday) {
            backgroundColor = 'linear-gradient(135deg, rgba(212, 165, 116, 0.2) 0%, rgba(193, 139, 94, 0.2) 100%)';
          } else if (day.hasEntry && day.isCurrentMonth) {
            backgroundColor = '#E8DCC8';
          }

          // Determine text color
          let textColor = '#5C4A3A';
          if (day.isToday) {
            textColor = '#C18B5E';
          } else if (!day.isCurrentMonth) {
            textColor = '#D4C5B3';
          }

          return (
            <button
              key={index}
              type="button"
              onClick={() => day.isCurrentMonth && onSelectDate(day.date)}
              style={{
                aspectRatio: '1',
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                fontWeight: 600,
                transition: 'all 0.2s',
                cursor: day.isCurrentMonth ? 'pointer' : 'default',
                background: backgroundColor,
                color: textColor,
                border: isSelected ? '2px solid #C18B5E' : '2px solid transparent',
                opacity: day.isCurrentMonth ? (isSelected ? 1 : 0.9) : 0.4,
              }}
              onMouseEnter={(e) => {
                if (day.isCurrentMonth) {
                  e.currentTarget.style.opacity = '1';
                }
              }}
              onMouseLeave={(e) => {
                if (day.isCurrentMonth && !isSelected) {
                  e.currentTarget.style.opacity = '0.9';
                }
              }}
              disabled={!day.isCurrentMonth}
            >
              <span>{day.date.getDate()}</span>
              {day.hasEntry && day.isCurrentMonth && (
                <div
                  style={{
                    width: '4px',
                    height: '4px',
                    borderRadius: '2px',
                    marginTop: '2px',
                    backgroundColor: '#C18B5E',
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default JournalCalendarViewV2;
