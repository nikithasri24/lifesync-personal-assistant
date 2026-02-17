/**
 * Journal Calendar View
 *
 * Displays journal entries in a calendar format.
 * Shows entry indicators on each day and allows navigation between months.
 */

import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
} from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import type { JournalEntry } from '@/types';
import { useThemeColors } from '@/hooks/useThemeColors';

interface JournalCalendarViewProps {
  entries: JournalEntry[];
  selectedDate: Date | null;
  onSelectDate: (date: Date | null) => void;
}

export function JournalCalendarView({
  entries,
  selectedDate,
  onSelectDate,
}: JournalCalendarViewProps): React.ReactElement {
  const colors = useThemeColors();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Group entries by date (YYYY-MM-DD)
  const entriesByDate = useMemo(() => {
    const map = new Map<string, JournalEntry[]>();
    entries.forEach((entry) => {
      const dateKey = format(new Date(entry.createdAt), 'yyyy-MM-dd');
      const existing = map.get(dateKey) || [];
      map.set(dateKey, [...existing, entry]);
    });
    return map;
  }, [entries]);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentMonth]);

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getEntriesForDay = (day: Date): JournalEntry[] => {
    const dateKey = format(day, 'yyyy-MM-dd');
    return entriesByDate.get(dateKey) || [];
  };

  const selectedDayEntries = selectedDate ? getEntriesForDay(selectedDate) : [];

  return (
    <div className="space-y-4" data-testid="journal-calendar-view">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold" style={{ color: colors.text.primary }}>
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="w-8 h-8 rounded-lg transition hover:opacity-70"
            style={{
              backgroundColor: 'rgba(212, 165, 116, 0.1)',
              color: '#C18B5E',
            }}
            aria-label="Previous month"
            data-testid="calendar-prev-month"
          >
            <ChevronLeft className="h-5 w-5 mx-auto" />
          </button>
          <button
            type="button"
            onClick={() => setCurrentMonth(new Date())}
            className="px-3 py-1.5 text-sm font-medium rounded-lg transition hover:opacity-70"
            style={{
              color: colors.text.primary,
              backgroundColor: colors.bg.tertiary,
            }}
            aria-label="Go to today"
            data-testid="calendar-today"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="w-8 h-8 rounded-lg transition hover:opacity-70"
            style={{
              backgroundColor: 'rgba(212, 165, 116, 0.1)',
              color: '#C18B5E',
            }}
            aria-label="Next month"
            data-testid="calendar-next-month"
          >
            <ChevronRight className="h-5 w-5 mx-auto" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          backgroundColor: colors.bg.white,
          boxShadow: '0 2px 12px rgba(92, 74, 58, 0.08)',
        }}
      >
        {/* Week day headers */}
        <div
          className="border-b"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            borderColor: colors.border.light,
          }}
        >
          {weekDays.map((day) => (
            <div
              key={day}
              className="py-3 text-center text-xs font-semibold uppercase tracking-wider"
              style={{
                color: colors.text.tertiary,
                backgroundColor: colors.bg.secondary,
              }}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {calendarDays.map((day) => {
            const dayEntries = getEntriesForDay(day);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const hasEntries = dayEntries.length > 0;

            // Determine background based on state
            const getCellBg = (): string => {
              if (isToday(day)) {
                return 'linear-gradient(135deg, rgba(212, 165, 116, 0.2), rgba(193, 139, 94, 0.2))';
              }
              if (hasEntries) {
                return colors.border.light;
              }
              return 'transparent';
            };

            const getTextColor = (): string => {
              if (!isCurrentMonth) return colors.text.tertiary;
              return colors.text.primary;
            };

            return (
              <button
                key={day.toISOString()}
                type="button"
                onClick={() => onSelectDate(isSelected ? null : day)}
                className="relative aspect-square p-2 text-sm border-b border-r transition-colors flex flex-col items-center justify-start hover:opacity-70"
                style={{
                  background: getCellBg(),
                  borderColor: colors.border.light,
                  color: getTextColor(),
                }}
                aria-label={`${format(day, 'EEEE, MMMM d')}${hasEntries ? `, ${dayEntries.length} entry` : ''}`}
                data-testid={`calendar-day-${format(day, 'yyyy-MM-dd')}`}
              >
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium">
                  {format(day, 'd')}
                </span>

                {/* Small dot indicator for days with entries */}
                {hasEntries && isCurrentMonth && (
                  <span
                    className="w-1 h-1 rounded-full absolute bottom-2"
                    style={{ backgroundColor: '#C18B5E' }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Entries */}
      {selectedDate && (
        <div className="space-y-3" data-testid="selected-day-entries">
          <h3 className="text-sm font-medium flex items-center gap-2" style={{ color: colors.text.primary }}>
            <Calendar className="h-4 w-4" />
            {format(selectedDate, 'EEEE, MMMM d, yyyy')}
          </h3>

          {selectedDayEntries.length === 0 ? (
            <p className="text-sm italic" style={{ color: colors.text.tertiary }}>
              No entries for this day
            </p>
          ) : (
            <div className="space-y-2">
              {selectedDayEntries.map((entry) => (
                <Link
                  key={entry.id}
                  to={`/journal/${entry.id}`}
                  className="block rounded-xl p-4 transition-colors hover:opacity-70 no-underline"
                  style={{
                    border: `2px solid ${colors.border.light}`,
                    backgroundColor: colors.bg.white,
                  }}
                  data-testid={`calendar-entry-${entry.id}`}
                >
                  <h4 className="font-medium" style={{ color: colors.text.primary }}>
                    {entry.title || 'Untitled'}
                  </h4>
                  <p className="text-xs mt-1" style={{ color: colors.text.tertiary }}>
                    {format(new Date(entry.createdAt), 'h:mm a')}
                  </p>
                  {entry.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {entry.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: colors.border.light,
                            color: colors.text.secondary,
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default JournalCalendarView;

