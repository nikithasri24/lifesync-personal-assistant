/**
 * DayView Component
 * Displays a single day with hourly timeline (6 AM - 11 PM)
 * Supports drag-and-drop for tasks and events
 */

import React, { useRef, useEffect } from 'react';
import { format } from 'date-fns';
import type { Task } from '@/lib/supabase';
import type { CalendarEvent } from '@/services/types';
import { EventCard } from '@/components/calendar/EventCard';

interface DayViewProps {
  date: Date;
  tasks: Task[];
  events: CalendarEvent[];
  currentTime: Date;
  onTaskClick: (task: Task) => void;
  onEventClick: (event: CalendarEvent) => void;
  onCellClick: (date: Date, hour: number) => void;
  onDragStart: (task: Task, e: React.DragEvent) => void;
  onDragEnd: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (date: Date, e: React.DragEvent) => void;
  onEventDragStart: (event: CalendarEvent, e: React.DragEvent) => void;
  onEventDragEnd: (e: React.DragEvent) => void;
}

const HOURS = Array.from({ length: 18 }, (_, i) => i + 6); // 6 AM to 11 PM
const HOUR_HEIGHT = 60; // pixels per hour

export function DayView({
  date,
  tasks,
  events,
  currentTime,
  onTaskClick,
  onEventClick,
  onCellClick,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  onEventDragStart,
  onEventDragEnd,
}: DayViewProps): React.ReactElement {
  const timelineRef = useRef<HTMLDivElement>(null);
  const dateKey = format(date, 'yyyy-MM-dd');
  const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

  // Scroll to current time on mount
  useEffect(() => {
    if (isToday && timelineRef.current) {
      const currentHour = currentTime.getHours();
      const scrollPosition = (currentHour - 6) * HOUR_HEIGHT - 100;
      timelineRef.current.scrollTop = Math.max(0, scrollPosition);
    }
  }, [isToday, currentTime]);

  // Calculate current time indicator position
  const getCurrentTimePosition = () => {
    if (!isToday) return null;
    const hours = currentTime.getHours();
    const minutes = currentTime.getMinutes();
    const totalMinutes = (hours - 6) * 60 + minutes;
    return (totalMinutes / 60) * HOUR_HEIGHT;
  };

  const currentTimePosition = getCurrentTimePosition();

  // Filter events for this day
  const dayEvents = events.filter(e => e.start_date === dateKey && !e.all_day);
  const allDayEvents = events.filter(e => e.start_date === dateKey && e.all_day);

  // Filter tasks for this day
  const dayTasks = tasks.filter(t => t.due_date === dateKey);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* All-day events section */}
      {allDayEvents.length > 0 && (
        <div className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 p-2">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">All day</div>
          <div className="space-y-1">
            {allDayEvents.map(event => (
              <EventCard
                key={event.id}
                event={event}
                isAllDay={true}
                onDragStart={onEventDragStart}
                onDragEnd={onEventDragEnd}
                onClick={onEventClick}
              />
            ))}
          </div>
        </div>
      )}

      {/* Hourly timeline */}
      <div ref={timelineRef} className="flex-1 overflow-auto relative">
        <div className="relative" style={{ height: `${HOURS.length * HOUR_HEIGHT}px` }}>
          {/* Hour rows */}
          {HOURS.map((hour, index) => {
            const hourLabel = format(new Date().setHours(hour, 0, 0, 0), 'h a');
            
            return (
              <div
                key={hour}
                className="absolute w-full border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer"
                style={{
                  top: `${index * HOUR_HEIGHT}px`,
                  height: `${HOUR_HEIGHT}px`,
                }}
                onClick={() => onCellClick(date, hour)}
                onDragOver={onDragOver}
                onDrop={(e) => onDrop(date, e)}
              >
                {/* Hour label */}
                <div className="absolute -top-2 left-2 text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 px-1">
                  {hourLabel}
                </div>

                {/* Events and tasks for this hour */}
                <div className="ml-16 mr-2 mt-2 space-y-1">
                  {/* Events */}
                  {dayEvents
                    .filter(e => {
                      if (!e.start_time) return false;
                      const eventHour = parseInt(e.start_time.split(':')[0]);
                      return eventHour === hour;
                    })
                    .map(event => (
                      <EventCard
                        key={event.id}
                        event={event}
                        timeLabel={event.start_time || undefined}
                        onDragStart={onEventDragStart}
                        onDragEnd={onEventDragEnd}
                        onClick={onEventClick}
                      />
                    ))}

                  {/* Tasks */}
                  {dayTasks
                    .filter(t => {
                      if (!t.scheduled_time) return index === 0; // Show unscheduled tasks at first hour
                      const taskHour = parseInt(t.scheduled_time.split(':')[0]);
                      return taskHour === hour;
                    })
                    .map(task => (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={(e) => { e.stopPropagation(); onDragStart(task, e); }}
                        onDragEnd={onDragEnd}
                        onClick={(e) => { e.stopPropagation(); onTaskClick(task); }}
                        className={`text-xs px-2 py-1 rounded cursor-pointer hover:opacity-90 truncate ${
                          task.priority === 'urgent' ? 'bg-red-500 text-white' :
                          task.priority === 'high' ? 'bg-orange-500 text-white' :
                          task.starred ? 'bg-yellow-500 text-white' : 'bg-indigo-500 text-white'
                        }`}
                        title={task.title}
                      >
                        {task.scheduled_time && <span className="font-medium">{task.scheduled_time}</span>}
                        {' '}{task.title}
                      </div>
                    ))}
                </div>
              </div>
            );
          })}

          {/* Current time indicator */}
          {currentTimePosition !== null && (
            <div
              className="absolute left-0 right-0 z-10 pointer-events-none"
              style={{ top: `${currentTimePosition}px` }}
            >
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-red-500 -ml-1.5" />
                <div className="flex-1 h-0.5 bg-red-500" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

