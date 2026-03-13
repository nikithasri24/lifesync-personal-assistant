/**
 * DayViewV2 Component
 * Terracotta-themed day schedule view with hourly time slots
 * Matches calendar-design-spec.html
 */

import React from 'react';
import { format, parseISO, isToday } from 'date-fns';
import { useThemeColors } from '@/hooks/useThemeColors';
import { EventCardV2 } from './EventCardV2';
import type { Task } from '@/lib/supabase';
import type { CalendarEvent } from '@/services/types';
import type { ScheduleBlock } from '@/services/types';

interface DayViewV2Props {
  date: Date;
  tasks: Task[];
  events: CalendarEvent[];
  scheduleBlocks: ScheduleBlock[];
  currentTime: Date;
  onTaskClick: (task: Task) => void;
  onEventClick: (event: CalendarEvent) => void;
  onScheduleBlockClick: (block: ScheduleBlock) => void;
  onCellClick: (date: Date, hour: number) => void;
  onDragStart: (task: Task, e?: React.DragEvent) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (date: Date, e: React.DragEvent) => void;
  onEventDragStart: (event: CalendarEvent, e: React.DragEvent) => void;
  onEventDragEnd: () => void;
}

export const DayViewV2: React.FC<DayViewV2Props> = ({
  date,
  tasks,
  events,
  scheduleBlocks,
  currentTime,
  onTaskClick,
  onEventClick,
  onScheduleBlockClick,
  onCellClick,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  onEventDragStart,
  onEventDragEnd,
}) => {
  const colors = useThemeColors();

  // Generate hours (6 AM to 11 PM)
  const hours = Array.from({ length: 18 }, (_, i) => i + 6);

  // Get items for this date
  // Use split('T')[0] to handle both plain date strings and timestamptz returns from Supabase
  const dateKey = format(date, 'yyyy-MM-dd');
  // Tasks with scheduled_start on this date → appear in time slots
  const dayTasks = tasks.filter(t => {
    if (!t.scheduled_start) return false;
    // Prefer scheduled_start date for placement
    const taskDateKey = (t.scheduled_start as string)?.split('T')[0] ||
                        (t.due_date as string | null)?.split('T')[0];
    return taskDateKey === dateKey;
  });
  // Tasks with only due_date (no specific time) → appear as all-day items at the top
  const allDayDueTasks = tasks.filter(t => {
    if (t.scheduled_start) return false; // already handled above
    const taskDateKey = (t.due_date as string | null)?.split('T')[0];
    return taskDateKey === dateKey && t.status !== 'done';
  });
  const dayEvents = events.filter(e => {
    const eventDateKey = (e.start_date as string)?.split('T')[0];
    return eventDateKey === dateKey && !e.all_day;
  });
  const dayBlocks = scheduleBlocks.filter(b => b.date === dateKey);

  // Check if we should show current time indicator
  const showCurrentTimeIndicator = isToday(date);

  // Calculate current time position
  const calculateTimePosition = (time: Date) => {
    const hour = time.getHours();
    const minute = time.getMinutes();
    if (hour < 6 || hour >= 24) return -1;
    return ((hour - 6) * 60) + minute; // Total minutes from 6 AM
  };

  const currentTimePosition = showCurrentTimeIndicator ? calculateTimePosition(currentTime) : -1;

  return (
    <div className="flex-1 overflow-auto" style={{ backgroundColor: colors.bg.white }}>
      {/* All-day tasks: tasks with due_date but no specific scheduled time */}
      {allDayDueTasks.length > 0 && (
        <div
          className="flex items-center gap-1 px-3 py-2 border-b"
          style={{ borderColor: colors.border.light, backgroundColor: colors.bg.secondary }}
        >
          <span className="text-xs font-semibold flex-shrink-0" style={{ color: colors.text.tertiary, width: '3rem' }}>
            All day
          </span>
          <div className="flex flex-wrap gap-1">
            {allDayDueTasks.map(task => (
              <div
                key={task.id}
                data-testid="calendar-task-chip"
                data-task-id={task.id}
                onClick={() => onTaskClick(task)}
                className="px-2 py-0.5 rounded text-xs font-medium text-white cursor-pointer hover:opacity-80 transition-opacity"
                style={{ backgroundColor: '#3B82F6' }}
              >
                {task.title}
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="relative">
        {hours.map((hour) => {
          const hourLabel = hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`;

          // Get items for this hour
          const hourTasks = dayTasks.filter(task => {
            if (!task.scheduled_start) return false;
            const taskStart = parseISO(task.scheduled_start);
            return taskStart.getHours() === hour;
          });

          const hourEvents = dayEvents.filter(event => {
            // Use start_time for hour matching — start_date is a date-only field
            if (event.start_time) {
              return parseInt(event.start_time.split(':')[0], 10) === hour;
            }
            // Fallback: parse start_date with time if it includes one
            const eventStart = parseISO(event.start_date);
            return eventStart.getHours() === hour;
          });

          const hourBlocks = dayBlocks.filter(block => {
            const blockHour = parseInt(block.start_time.split(':')[0], 10);
            return blockHour === hour;
          });

          return (
            <div
              key={hour}
              className="flex min-h-[60px]"
              style={{ borderBottom: `1px solid ${colors.border.light}` }}
            >
              {/* Hour label */}
              <div
                className="w-16 flex-shrink-0 px-2 py-2 text-xs"
                style={{
                  color: colors.text.tertiary,
                  borderRight: `1px solid ${colors.border.light}`,
                }}
              >
                {hourLabel}
              </div>

              {/* Hour content */}
              <div
                className="flex-1 relative p-1 cursor-pointer hover:opacity-90 transition-opacity"
                data-date={dateKey}
                data-hour={hour}
                onClick={() => onCellClick(date, hour)}
                onDragOver={onDragOver}
                onDrop={(e) => onDrop(date, e)}
              >
                {/* Schedule blocks */}
                {hourBlocks.map((block) => {
                  const blockStart = parseISO(`${block.date}T${block.start_time}`);
                  const blockEnd = parseISO(`${block.date}T${block.end_time}`);
                  const durationMinutes = Math.round((blockEnd.getTime() - blockStart.getTime()) / 60000);
                  const topOffset = blockStart.getMinutes();
                  const blockHeight = durationMinutes;

                  return (
                    <EventCardV2
                      key={block.id}
                      type="block"
                      item={block}
                      onClick={() => onScheduleBlockClick(block)}
                      style={{
                        position: 'absolute',
                        top: `${topOffset}px`,
                        left: '2px',
                        right: '2px',
                        height: `${blockHeight}px`,
                        zIndex: 0,
                      }}
                    />
                  );
                })}

                {/* Tasks */}
                {hourTasks.map((task) => {
                  const taskStart = parseISO(task.scheduled_start as string);
                  const topOffset = taskStart.getMinutes();
                  const durationMinutes = task.estimated_time || 30;
                  const taskHeight = Math.max(24, durationMinutes);
                  const timeLabel = format(taskStart, 'HH:mm');

                  return (
                    <EventCardV2
                      key={task.id}
                      type="task"
                      item={task}
                      timeLabel={timeLabel}
                      onDragStart={(e) => {
                        e.stopPropagation();
                        onDragStart(task, e);
                      }}
                      onDragEnd={onDragEnd}
                      onClick={() => onTaskClick(task)}
                      style={{
                        position: 'absolute',
                        top: `${topOffset}px`,
                        left: '2px',
                        right: '2px',
                        height: `${taskHeight}px`,
                        zIndex: 10,
                      }}
                    />
                  );
                })}

                {/* Events */}
                {hourEvents.map((event) => {
                  // Use start_time / end_time for positioning (start_date is date-only)
                  const [startHour = hour, startMin = 0] = (event.start_time || `${hour}:00`)
                    .split(':').map(Number);
                  const [endHour = startHour + 1, endMin = 0] = (event.end_time || `${startHour + 1}:00`)
                    .split(':').map(Number);
                  const topOffset = startMin;
                  const durationMinutes = Math.max(30, (endHour - startHour) * 60 + (endMin - startMin));
                  const eventHeight = Math.max(24, durationMinutes);
                  const timeLabel = event.start_time
                    ? event.start_time.slice(0, 5)
                    : format(parseISO(event.start_date), 'HH:mm');

                  return (
                    <EventCardV2
                      key={event.id}
                      type="event"
                      item={event}
                      timeLabel={timeLabel}
                      onDragStart={(e) => {
                        e.stopPropagation();
                        onEventDragStart(event, e);
                      }}
                      onDragEnd={onEventDragEnd}
                      onClick={() => onEventClick(event)}
                      style={{
                        position: 'absolute',
                        top: `${topOffset}px`,
                        left: '2px',
                        right: '2px',
                        height: `${eventHeight}px`,
                        zIndex: 20,
                      }}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Current time indicator - red line */}
        {currentTimePosition >= 0 && (
          <div
            className="absolute left-0 right-0 pointer-events-none z-50"
            style={{ top: `${currentTimePosition}px` }}
          >
            <div
              className="h-0.5"
              style={{ backgroundColor: '#EF4444' }} // Red
            />
            <div
              className="absolute -left-1.5 -top-1.5 w-3 h-3 rounded-full border-2 border-white"
              style={{ backgroundColor: '#EF4444' }}
            />
          </div>
        )}
      </div>
    </div>
  );
};
