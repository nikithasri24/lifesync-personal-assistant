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
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition"
            aria-label="Previous month"
            data-testid="calendar-prev-month"
          >
            <ChevronLeft className="h-5 w-5 text-slate-600 dark:text-slate-400" />
          </button>
          <button
            type="button"
            onClick={() => setCurrentMonth(new Date())}
            className="px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
            data-testid="calendar-today"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition"
            aria-label="Next month"
            data-testid="calendar-next-month"
          >
            <ChevronRight className="h-5 w-5 text-slate-600 dark:text-slate-400" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
        {/* Week day headers */}
        <div
          className="border-b border-slate-200 dark:border-slate-700"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}
        >
          {weekDays.map((day) => (
            <div
              key={day}
              className="py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50"
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

            // Determine background and text styles based on state
            const getCellStyles = (): string => {
              if (!isCurrentMonth) {
                return 'text-slate-300 dark:text-slate-600 bg-slate-50 dark:bg-slate-900/50';
              }
              if (isSelected) {
                return 'bg-indigo-100 dark:bg-indigo-900/40 ring-2 ring-inset ring-indigo-500';
              }
              if (hasEntries) {
                return 'bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30';
              }
              return 'hover:bg-slate-50 dark:hover:bg-slate-700/50';
            };

            const getDateStyles = (): string => {
              if (isToday(day)) {
                return 'bg-indigo-600 text-white font-bold';
              }
              if (isSelected && !isToday(day)) {
                return 'bg-indigo-200 dark:bg-indigo-700 text-indigo-800 dark:text-indigo-100 font-semibold';
              }
              if (hasEntries && isCurrentMonth) {
                return 'text-emerald-700 dark:text-emerald-400 font-semibold';
              }
              if (isCurrentMonth) {
                return 'text-slate-700 dark:text-slate-300';
              }
              return '';
            };

            return (
              <button
                key={day.toISOString()}
                type="button"
                onClick={() => onSelectDate(isSelected ? null : day)}
                className={`
                  relative aspect-square p-2 text-sm border-b border-r border-slate-100 dark:border-slate-700
                  transition-colors flex flex-col items-center justify-start
                  ${getCellStyles()}
                `}
                data-testid={`calendar-day-${format(day, 'yyyy-MM-dd')}`}
              >
                <span
                  className={`
                    inline-flex items-center justify-center w-8 h-8 rounded-full text-sm
                    ${getDateStyles()}
                  `}
                >
                  {format(day, 'd')}
                </span>

                {/* Entry count badge for days with entries */}
                {hasEntries && isCurrentMonth && (
                  <span className="mt-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                    {dayEntries.length} {dayEntries.length === 1 ? 'entry' : 'entries'}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Entries */}
      {selectedDate && (
        <div className="space-y-3" data-testid="selected-day-entries">
          <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {format(selectedDate, 'EEEE, MMMM d, yyyy')}
          </h3>

          {selectedDayEntries.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 italic">
              No entries for this day
            </p>
          ) : (
            <div className="space-y-2">
              {selectedDayEntries.map((entry) => (
                <Link
                  key={entry.id}
                  to={`/journal/${entry.id}`}
                  className="block rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 hover:border-slate-300 dark:hover:border-slate-600 transition-colors no-underline"
                  data-testid={`calendar-entry-${entry.id}`}
                >
                  <h4 className="font-medium text-slate-900 dark:text-white">
                    {entry.title || 'Untitled'}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {format(new Date(entry.createdAt), 'h:mm a')}
                  </p>
                  {entry.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {entry.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
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

