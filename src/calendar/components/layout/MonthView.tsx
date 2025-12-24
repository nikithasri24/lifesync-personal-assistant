/**
 * MonthView Component
 * Displays a monthly calendar grid with event indicators
 */

import React from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, isToday as isTodayFn } from 'date-fns';
import type { Task } from '@/lib/supabase';
import type { CalendarEvent } from '@/services/types';

interface MonthViewProps {
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

export function MonthView({
  currentDate,
  tasks,
  events,
  onDateClick,
  onTaskClick,
  onEventClick,
  onDragOver,
  onDrop,
}: MonthViewProps): React.ReactElement {
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
    const dayTasks = tasks.filter(t => t.due_date === dateKey && t.status !== 'done');
    return { events: dayEvents, tasks: dayTasks };
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden p-4">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-px bg-slate-200 dark:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-t-lg overflow-hidden">
        {WEEKDAYS.map(day => (
          <div
            key={day}
            className="bg-white dark:bg-slate-900 py-2 text-center text-sm font-semibold text-slate-700 dark:text-slate-300"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="flex-1 grid grid-cols-7 gap-px bg-slate-200 dark:bg-slate-700 border-x border-b border-slate-200 dark:border-slate-700 rounded-b-lg overflow-hidden">
        {days.map((day, index) => {
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isToday = isTodayFn(day);
          const { events: dayEvents, tasks: dayTasks } = getItemsForDate(day);
          const totalItems = dayEvents.length + dayTasks.length;

          return (
            <div
              key={index}
              className={`bg-white dark:bg-slate-900 p-2 min-h-[100px] cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                !isCurrentMonth ? 'opacity-40' : ''
              }`}
              onClick={() => onDateClick(day)}
              onDragOver={onDragOver}
              onDrop={(e) => onDrop(day, e)}
            >
              {/* Date number */}
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-sm font-medium ${
                    isToday
                      ? 'bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center'
                      : isCurrentMonth
                      ? 'text-slate-900 dark:text-slate-100'
                      : 'text-slate-400 dark:text-slate-600'
                  }`}
                >
                  {format(day, 'd')}
                </span>
                {totalItems > 0 && (
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {totalItems}
                  </span>
                )}
              </div>

              {/* Event and task indicators */}
              <div className="space-y-1">
                {/* Show first 3 events */}
                {dayEvents.slice(0, 3).map(event => (
                  <div
                    key={event.id}
                    onClick={(e) => { e.stopPropagation(); onEventClick(event); }}
                    className={`text-[10px] px-1.5 py-0.5 rounded truncate cursor-pointer hover:opacity-80 ${
                      event.type === 'meeting' ? 'bg-purple-500 text-white' :
                      event.type === 'event' ? 'bg-teal-500 text-white' :
                      event.type === 'reminder' ? 'bg-amber-500 text-white' :
                      event.type === 'birthday' ? 'bg-pink-500 text-white' :
                      event.type === 'holiday' ? 'bg-emerald-500 text-white' :
                      'bg-indigo-500 text-white'
                    }`}
                    title={event.title}
                  >
                    {event.start_time && <span className="font-medium">{event.start_time.slice(0, 5)}</span>}
                    {' '}{event.title}
                  </div>
                ))}

                {/* Show first 3 tasks */}
                {dayTasks.slice(0, 3 - dayEvents.length).map(task => (
                  <div
                    key={task.id}
                    onClick={(e) => { e.stopPropagation(); onTaskClick(task); }}
                    className={`text-[10px] px-1.5 py-0.5 rounded truncate cursor-pointer hover:opacity-80 ${
                      task.priority === 'urgent' ? 'bg-red-500 text-white' :
                      task.priority === 'high' ? 'bg-orange-500 text-white' :
                      task.starred ? 'bg-yellow-500 text-white' :
                      'bg-slate-500 text-white'
                    }`}
                    title={task.title}
                  >
                    {task.title}
                  </div>
                ))}

                {/* Show "X more" if there are more items */}
                {totalItems > 3 && (
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 px-1.5">
                    +{totalItems - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

