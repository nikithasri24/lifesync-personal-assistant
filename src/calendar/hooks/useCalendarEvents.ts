/**
 * useCalendarEvents - Filters and organizes calendar events for a specific day
 */

import { useMemo } from 'react';
import { format, isSameDay, parseISO } from 'date-fns';
import type { Task } from '../../lib/supabase';
import type { Habit } from '../../types';
import type { CalendarEvent, HabitEntryData } from '../../services/types';
import { taskAppearsOnDate } from '../utils/taskHelpers';

export interface DayEvents {
  tasks: Task[];
  allDayTasks: Task[];
  events: CalendarEvent[];
  allDayEvents: CalendarEvent[];
  habits: Habit[];
}

export const useCalendarEventsForDay = (
  date: Date,
  tasks: Task[],
  habits: Habit[],
  habitEntries: HabitEntryData[],
  calendarEvents: CalendarEvent[]
): DayEvents => {
  return useMemo(() => {
    const dateKey = format(date, 'yyyy-MM-dd');

    // Tasks (including multi-day tasks that span this date)
    const dayTasks = tasks.filter(task => taskAppearsOnDate(task, date));

    // Separate all-day tasks (high priority or starred tasks are treated as all-day)
    const allDayTasks = dayTasks.filter(task =>
      task.priority === 'urgent' || task.starred || (task.estimated_time != null && task.estimated_time >= 240) // 4+ hours
    );
    const timedTasks = dayTasks.filter(task =>
      !(task.priority === 'urgent' || task.starred || (task.estimated_time != null && task.estimated_time >= 240))
    );

    // Calendar Events
    const dayEvents = calendarEvents.filter(event => {
      // Check if event occurs on this date
      const eventStart = parseISO(event.start_date);
      const eventEnd = parseISO(event.end_date);
      return isSameDay(date, eventStart) || isSameDay(date, eventEnd) ||
             (date >= eventStart && date <= eventEnd);
    });

    // Separate all-day events and timed events
    const allDayEvents = dayEvents.filter(event => event.all_day);
    const timedEvents = dayEvents.filter(event => !event.all_day);

    // Habits
    const dayHabitCompletions = habitEntries.filter(entry => entry.date === dateKey);
    const completedHabits = habits.filter(habit =>
      dayHabitCompletions.some(entry => entry.habit_id === habit.id)
    );

    return {
      tasks: timedTasks,
      allDayTasks,
      events: timedEvents,
      allDayEvents,
      habits: completedHabits,
    };
  }, [date, tasks, habits, habitEntries, calendarEvents]);
};

