/**
 * Calendar Component - Google Calendar Style Week View
 * Displays tasks, habits, and journal entries in a professional week layout
 */

import React, { useState, useMemo } from 'react';
import {
  format,
  startOfWeek,
  addDays,
  addWeeks,
  subWeeks,
  isSameDay,
  isToday,
  parseISO,
  startOfMonth,
  endOfMonth,
  isSameMonth,
  getDay,
} from 'date-fns';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Calendar as CalendarIcon,
  CheckCircle2,
  Target,
  BookOpen,
} from 'lucide-react';
import { useTasks } from '../hooks/useTasksQuery';
import { useHabits, useHabitEntries } from '../hooks/useHabitsQuery';
import { useJournalEntries } from '../hooks/useJournalQuery';
import type { Task } from '../lib/supabase';
import type { Habit, JournalEntry } from '../types';
import { SkeletonCard } from '../components/LoadingSpinner';

type CalendarView = 'week' | 'month' | 'day';

interface TimeSlot {
  hour: number;
  label: string;
}

interface WeekDay {
  date: Date;
  dayName: string;
  dayNumber: string;
  isToday: boolean;
}

const Calendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>('week');
  const [miniCalendarDate, setMiniCalendarDate] = useState(new Date());

  // Fetch data
  const { data: tasks = [], isLoading: tasksLoading } = useTasks();
  const { data: habits = [], isLoading: habitsLoading } = useHabits({ isActive: true });
  const { data: habitEntries = [], isLoading: entriesLoading } = useHabitEntries();
  const { data: journalEntries = [], isLoading: journalLoading } = useJournalEntries();

  const isLoading = tasksLoading || habitsLoading || entriesLoading || journalLoading;

  // Time slots (7 AM to 9 PM)
  const timeSlots: TimeSlot[] = useMemo(() => {
    const slots: TimeSlot[] = [];
    for (let hour = 7; hour <= 21; hour++) {
      const period = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour > 12 ? hour - 12 : hour;
      slots.push({
        hour,
        label: `${displayHour} ${period}`,
      });
    }
    return slots;
  }, []);

  // Generate week days
  const weekDays: WeekDay[] = useMemo(() => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(weekStart, i);
      return {
        date,
        dayName: format(date, 'EEE').toUpperCase(),
        dayNumber: format(date, 'd'),
        isToday: isToday(date),
      };
    });
  }, [currentDate]);

  // Generate mini calendar days
  const miniCalendarDays = useMemo(() => {
    const monthStart = startOfMonth(miniCalendarDate);
    const monthEnd = endOfMonth(miniCalendarDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calendarEnd = addDays(calendarStart, 41); // 6 weeks

    const days = [];
    let day = calendarStart;

    while (day <= calendarEnd) {
      days.push({
        date: day,
        isCurrentMonth: isSameMonth(day, miniCalendarDate),
        isToday: isToday(day),
        isSelected: isSameDay(day, currentDate),
      });
      day = addDays(day, 1);
    }

    return days;
  }, [miniCalendarDate, currentDate]);

  // Navigation
  const goToPreviousWeek = () => setCurrentDate(subWeeks(currentDate, 1));
  const goToNextWeek = () => setCurrentDate(addWeeks(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());
  const goToPreviousMonth = () => setMiniCalendarDate(prev => addWeeks(prev, -4));
  const goToNextMonth = () => setMiniCalendarDate(prev => addWeeks(prev, 4));

  // Get events for a specific day
  const getEventsForDay = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');

    // Tasks
    const dayTasks = tasks.filter(task => {
      if (!task.due_date) return false;
      const taskDate = typeof task.due_date === 'string' ? parseISO(task.due_date) : task.due_date;
      return isSameDay(taskDate, date);
    });

    // Habits
    const dayHabitCompletions = habitEntries.filter(entry => entry.date === dateKey);
    const completedHabits = habits.filter(habit =>
      dayHabitCompletions.some(entry => entry.habit_id === habit.id)
    );

    // Journal entries
    const dayJournalEntries = journalEntries.filter(entry => {
      const entryDate = typeof entry.createdAt === 'string' ? parseISO(entry.createdAt) : entry.createdAt;
      return isSameDay(entryDate, date);
    });

    return {
      tasks: dayTasks,
      habits: completedHabits,
      journalEntries: dayJournalEntries,
    };
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-screen bg-white dark:bg-slate-900">
        <div className="flex-1 p-6">
          <SkeletonCard className="h-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-white dark:bg-slate-900">
      {/* Sidebar */}
      <div className="w-64 border-r border-slate-200 dark:border-slate-700 p-4 overflow-y-auto">
        {/* Mini Calendar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {format(miniCalendarDate, 'MMMM yyyy')}
            </h3>
            <div className="flex gap-1">
              <button
                onClick={goToPreviousMonth}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
              >
                <ChevronLeft className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              </button>
              <button
                onClick={goToNextMonth}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
              >
                <ChevronRight className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              </button>
            </div>
          </div>

          {/* Mini calendar grid */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
              <div key={i} className="text-slate-500 dark:text-slate-400 font-medium py-1">
                {day}
              </div>
            ))}
            {miniCalendarDays.map((day, i) => (
              <button
                key={i}
                onClick={() => setCurrentDate(day.date)}
                className={`
                  py-1 rounded text-xs font-medium transition-colors
                  ${!day.isCurrentMonth ? 'text-slate-300 dark:text-slate-700' : 'text-slate-700 dark:text-slate-300'}
                  ${day.isToday ? 'bg-blue-500 text-white' : ''}
                  ${day.isSelected && !day.isToday ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300' : ''}
                  ${!day.isToday && !day.isSelected ? 'hover:bg-slate-100 dark:hover:bg-slate-800' : ''}
                `}
              >
                {format(day.date, 'd')}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="space-y-3">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-semibold text-blue-900 dark:text-blue-100">Tasks</span>
            </div>
            <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
              {tasks.filter(t => t.status !== 'done' && !t.deleted).length}
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300">pending</p>
          </div>

          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-4 h-4 text-green-600 dark:text-green-400" />
              <span className="text-xs font-semibold text-green-900 dark:text-green-100">Habits</span>
            </div>
            <p className="text-xl font-bold text-green-600 dark:text-green-400">
              {habits.length}
            </p>
            <p className="text-xs text-green-700 dark:text-green-300">active</p>
          </div>

          <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span className="text-xs font-semibold text-purple-900 dark:text-purple-100">Journal</span>
            </div>
            <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
              {journalEntries.length}
            </p>
            <p className="text-xs text-purple-700 dark:text-purple-300">entries</p>
          </div>
        </div>
      </div>

      {/* Main Calendar Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-4">
            <button
              onClick={goToToday}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Today
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={goToPreviousWeek}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              </button>
              <button
                onClick={goToNextWeek}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              </button>
            </div>

            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              {format(weekDays[0].date, 'MMMM yyyy')}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {/* View selector */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
              <button
                onClick={() => setView('week')}
                className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                  view === 'week'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setView('month')}
                className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                  view === 'month'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                Month
              </button>
            </div>
          </div>
        </div>

        {/* Week View */}
        <div className="flex-1 overflow-auto">
          <div className="min-w-max">
            {/* Day headers */}
            <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
              <div className="flex">
                {/* Time column header */}
                <div className="w-20 border-r border-slate-200 dark:border-slate-700 flex-shrink-0" />

                {/* Day headers */}
                {weekDays.map((day, i) => (
                  <div
                    key={i}
                    className="flex-1 min-w-[140px] text-center py-3 border-r border-slate-200 dark:border-slate-700 last:border-r-0"
                  >
                    <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                      {day.dayName}
                    </div>
                    <div
                      className={`
                        text-2xl font-semibold mx-auto w-12 h-12 flex items-center justify-center rounded-full
                        ${day.isToday ? 'bg-blue-500 text-white' : 'text-slate-900 dark:text-slate-100'}
                      `}
                    >
                      {day.dayNumber}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Time slots and events */}
            <div className="relative">
              {timeSlots.map((slot, slotIndex) => (
                <div key={slot.hour} className="flex">
                  {/* Time label */}
                  <div className="w-20 border-r border-slate-200 dark:border-slate-700 flex-shrink-0 px-2 py-2">
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {slot.label}
                    </span>
                  </div>

                  {/* Day columns */}
                  {weekDays.map((day, dayIndex) => {
                    const events = getEventsForDay(day.date);
                    const hasEvents = events.tasks.length > 0 || events.habits.length > 0 || events.journalEntries.length > 0;

                    return (
                      <div
                        key={dayIndex}
                        className={`
                          flex-1 min-w-[140px] min-h-[60px] border-r border-b border-slate-200 dark:border-slate-700 last:border-r-0 p-1
                          ${day.isToday ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}
                        `}
                      >
                        {/* Show events in the 9 AM slot */}
                        {slot.hour === 9 && hasEvents && (
                          <div className="space-y-1">
                            {/* Tasks */}
                            {events.tasks.slice(0, 2).map((task, i) => (
                              <div
                                key={task.id}
                                className={`
                                  text-xs px-2 py-1 rounded border-l-2 truncate
                                  ${task.status === 'done'
                                    ? 'bg-green-50 dark:bg-green-900/20 border-green-500 text-green-700 dark:text-green-300'
                                    : 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-700 dark:text-blue-300'
                                  }
                                `}
                                title={task.title}
                              >
                                {task.title}
                              </div>
                            ))}

                            {/* Habits indicator */}
                            {events.habits.length > 0 && (
                              <div className="text-xs px-2 py-1 rounded border-l-2 border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 truncate">
                                ✓ {events.habits.length} habit{events.habits.length > 1 ? 's' : ''}
                              </div>
                            )}

                            {/* Journal indicator */}
                            {events.journalEntries.length > 0 && (
                              <div className="text-xs px-2 py-1 rounded border-l-2 border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 truncate">
                                📝 Journal entry
                              </div>
                            )}

                            {/* More indicator */}
                            {events.tasks.length > 2 && (
                              <div className="text-xs text-slate-500 dark:text-slate-400 px-2">
                                +{events.tasks.length - 2} more
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calendar;
