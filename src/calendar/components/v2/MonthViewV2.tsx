/**
 * MonthViewV2 Component
 * Terracotta-themed month calendar grid with event dots
 * Matches calendar-design-spec.html
 */

import React from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isToday as isTodayFn } from 'date-fns';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { Task } from '@/lib/supabase';
import type { CalendarEvent } from '@/services/types';

interface MonthViewV2Props {
  currentDate: Date;
  tasks: Task[];
  events: CalendarEvent[];
  onDateClick: (date: Date) => void;
  onTaskClick: (task: Task) => void;
  onEventClick: (event: CalendarEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (date: Date, e: React.DragEvent) => void;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const MonthViewV2: React.FC<MonthViewV2Props> = ({
  currentDate,
  tasks,
  events,
  onDateClick,
  onDragOver,
  onDrop,
}) => {
  const colors = useThemeColors();

  // Calculate calendar grid
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const days: Date[] = [];
  let day = calendarStart;
  while (day <= calendarEnd) {
    days.push(day);
    day = addDays(day, 1);
  }

  // Get events and tasks for a specific date
  const getItemsForDate = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const dayEvents = events.filter(e => e.start_date === dateKey);
    const dayTasks = tasks.filter(t => t.due_date && (t.due_date as string).split('T')[0] === dateKey && t.status !== 'done');
    return { events: dayEvents, tasks: dayTasks };
  };

  // Compute workload heat level for a day (total estimated minutes of scheduled tasks)
  const getWorkloadLevel = (date: Date): 'none' | 'light' | 'moderate' | 'heavy' => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const totalMinutes = tasks
      .filter(t => t.due_date === dateKey && t.status !== 'done')
      .reduce((sum, t) => sum + (t.estimated_time ?? 30), 0);
    if (totalMinutes === 0) return 'none';
    if (totalMinutes < 180) return 'light';
    if (totalMinutes < 360) return 'moderate';
    return 'heavy';
  };

  const workloadBarColor: Record<string, string> = {
    light: '#86efac',   // green-300
    moderate: '#fcd34d', // amber-300
    heavy: '#f87171',    // red-400
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Weekday headers — inline grid to guarantee 7-column layout */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          flexShrink: 0,
          borderBottom: `1px solid ${colors.border.light}`,
        }}
      >
        {WEEKDAYS.map(day => (
          <div
            key={day}
            className="py-3 text-center text-xs font-semibold uppercase"
            style={{ color: colors.text.tertiary }}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid — inline grid guarantees 7-column layout */}
      <div style={{ flex: 1, minHeight: 0, overflow: 'auto', backgroundColor: colors.border.light }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '1px',
          minHeight: '100%',
          backgroundColor: colors.border.light,
        }}
      >
        {days.map((day, index) => {
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isToday = isTodayFn(day);
          const { events: dayEvents, tasks: dayTasks } = getItemsForDate(day);
          const workload = getWorkloadLevel(day);
          const taskCount = dayTasks.length;
          const eventCount = dayEvents.length;

          return (
            <div
              key={index}
              data-testid="month-day-cell"
              data-date={format(day, 'yyyy-MM-dd')}
              className="min-h-[70px] p-1 cursor-pointer hover:opacity-90 transition-opacity relative flex flex-col"
              style={{
                backgroundColor: isToday
                  ? '#FEF3E8' // Terracotta tint for today
                  : isCurrentMonth
                  ? colors.bg.white
                  : colors.bg.secondary,
                opacity: isCurrentMonth ? 1 : 0.5,
              }}
              onClick={() => onDateClick(day)}
              onDragOver={onDragOver}
              onDrop={(e) => onDrop(day, e)}
            >
              {/* Date number */}
              <div className="flex justify-center mb-1">
                {isToday ? (
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold text-white"
                    style={{ backgroundColor: colors.accent.start }}
                  >
                    {format(day, 'd')}
                  </div>
                ) : (
                  <span
                    className="text-xs font-semibold"
                    style={{ color: isCurrentMonth ? colors.text.primary : colors.text.tertiary }}
                  >
                    {format(day, 'd')}
                  </span>
                )}
              </div>

              {/* Event dots */}
              <div className="flex flex-wrap gap-0.5 justify-center">
                {/* Events - Terracotta */}
                {dayEvents.slice(0, 3).map((event, idx) => (
                  <div
                    key={`event-${idx}`}
                    className="rounded-full"
                    style={{ backgroundColor: '#D4A574', width: '4px', height: '4px' }}
                    title={event.title}
                  />
                ))}

                {/* Tasks - Blue */}
                {dayTasks.slice(0, 3).map((task, idx) => (
                  <div
                    key={`task-${idx}`}
                    className="rounded-full"
                    style={{ backgroundColor: '#3B82F6', width: '4px', height: '4px' }}
                    title={task.title}
                  />
                ))}
              </div>

              {/* Item count label */}
              {(taskCount > 0 || eventCount > 0) && (
                <div className="mt-auto flex justify-center gap-1 pt-1">
                  {taskCount > 0 && (
                    <span className="text-[9px] text-blue-500 font-semibold">
                      {taskCount}t
                    </span>
                  )}
                  {eventCount > 0 && (
                    <span className="text-[9px] font-semibold" style={{ color: '#D4A574' }}>
                      {eventCount}e
                    </span>
                  )}
                </div>
              )}

              {/* Workload heat bar */}
              {workload !== 'none' && isCurrentMonth && (
                <div
                  className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b"
                  style={{ backgroundColor: workloadBarColor[workload] }}
                  title={`${workload} workload`}
                />
              )}
            </div>
          );
        })}
      </div>
      </div>
    </div>
  );
};
