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
  ChevronUp,
  Calendar as CalendarIcon,
  CheckCircle2,
  Target,
  GripVertical,
  Inbox,
} from 'lucide-react';
import { useTasks, useUpdateTask } from '../hooks/useTasksQuery';
import { useHabits, useHabitEntries } from '../hooks/useHabitsQuery';
import type { Task } from '../lib/supabase';
import type { Habit } from '../types';
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
  const [showUnscheduledPanel, setShowUnscheduledPanel] = useState(true);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);

  // Fetch data
  const { data: tasks = [], isLoading: tasksLoading } = useTasks();
  const { data: habits = [], isLoading: habitsLoading } = useHabits({ isActive: true });
  const { data: habitEntries = [], isLoading: entriesLoading } = useHabitEntries();
  const updateTaskMutation = useUpdateTask();

  const isLoading = tasksLoading || habitsLoading || entriesLoading;

  // Get unscheduled tasks (no due_date or deleted)
  const unscheduledTasks = useMemo(() => {
    return tasks.filter(task => !task.due_date && task.status !== 'done' && !task.deleted);
  }, [tasks]);

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

  // Generate month view days
  const monthGridDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calendarEnd = addDays(calendarStart, 41); // 6 weeks

    const days = [];
    let day = calendarStart;

    while (day <= calendarEnd) {
      days.push({
        date: day,
        isCurrentMonth: isSameMonth(day, currentDate),
        isToday: isToday(day),
      });
      day = addDays(day, 1);
    }

    return days;
  }, [currentDate]);

  // Navigation
  const goToPreviousWeek = () => setCurrentDate(subWeeks(currentDate, 1));
  const goToNextWeek = () => setCurrentDate(addWeeks(currentDate, 1));
  const goToPreviousMonth = () => setCurrentDate(prev => addWeeks(prev, -4));
  const goToNextMonth = () => setCurrentDate(prev => addWeeks(prev, 4));
  const goToPreviousDay = () => setCurrentDate(prev => addDays(prev, -1));
  const goToNextDay = () => setCurrentDate(prev => addDays(prev, 1));
  const goToToday = () => setCurrentDate(new Date());
  const goToPreviousMonthMini = () => setMiniCalendarDate(prev => addWeeks(prev, -4));
  const goToNextMonthMini = () => setMiniCalendarDate(prev => addWeeks(prev, 4));

  // Helper to check if a task is multi-day (estimated time >= 1 day or 480 minutes = 8 hours)
  const isMultiDayTask = (task: Task): boolean => {
    return task.estimated_time >= 480; // 8+ hours = multi-day
  };

  // Helper to get the number of days a task spans
  const getTaskSpanDays = (task: Task): number => {
    if (!isMultiDayTask(task)) return 1;
    // Each day = 480 minutes (8 working hours)
    return Math.ceil(task.estimated_time / 480);
  };

  // Helper to check if a task should appear on a specific date
  const taskAppearsOnDate = (task: Task, date: Date): boolean => {
    if (!task.due_date) return false;
    const taskDate = typeof task.due_date === 'string' ? parseISO(task.due_date) : task.due_date;

    if (isMultiDayTask(task)) {
      const spanDays = getTaskSpanDays(task);
      // Task appears on due date and the previous (spanDays - 1) days
      for (let i = 0; i < spanDays; i++) {
        const spanDate = addDays(taskDate, -i);
        if (isSameDay(spanDate, date)) {
          return true;
        }
      }
      return false;
    }

    return isSameDay(taskDate, date);
  };

  // Helper to get task position in multi-day span (0 = first day, -1 = not multi-day)
  const getTaskSpanPosition = (task: Task, date: Date): { position: number; totalDays: number; isFirst: boolean; isLast: boolean } => {
    if (!task.due_date) return { position: -1, totalDays: 1, isFirst: true, isLast: true };
    const taskDate = typeof task.due_date === 'string' ? parseISO(task.due_date) : task.due_date;

    if (!isMultiDayTask(task)) {
      return { position: -1, totalDays: 1, isFirst: true, isLast: true };
    }

    const spanDays = getTaskSpanDays(task);

    // Find which day of the span this is
    for (let i = 0; i < spanDays; i++) {
      const spanDate = addDays(taskDate, -i);
      if (isSameDay(spanDate, date)) {
        return {
          position: spanDays - i - 1, // 0 = first day, spanDays-1 = last day
          totalDays: spanDays,
          isFirst: i === spanDays - 1,
          isLast: i === 0,
        };
      }
    }

    return { position: -1, totalDays: spanDays, isFirst: false, isLast: false };
  };

  // Get events for a specific day
  const getEventsForDay = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');

    // Tasks (including multi-day tasks that span this date)
    const dayTasks = tasks.filter(task => taskAppearsOnDate(task, date));

    // Separate all-day tasks (high priority or starred tasks are treated as all-day)
    const allDayTasks = dayTasks.filter(task =>
      task.priority === 'urgent' || task.starred || task.estimated_time >= 240 // 4+ hours
    );
    const timedTasks = dayTasks.filter(task =>
      !(task.priority === 'urgent' || task.starred || task.estimated_time >= 240)
    );

    // Habits
    const dayHabitCompletions = habitEntries.filter(entry => entry.date === dateKey);
    const completedHabits = habits.filter(habit =>
      dayHabitCompletions.some(entry => entry.habit_id === habit.id)
    );

    return {
      tasks: timedTasks,
      allDayTasks,
      habits: completedHabits,
    };
  };

  // Drag and drop handlers
  const handleDragStart = (task: Task) => {
    setDraggedTask(task);
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
  };

  const handleDrop = (date: Date) => {
    if (!draggedTask) return;

    const dateString = format(date, 'yyyy-MM-dd');
    updateTaskMutation.mutate({
      id: draggedTask.id,
      updates: { due_date: dateString }
    });

    setDraggedTask(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Allow drop
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
      <div className="w-64 border-r border-slate-200 dark:border-slate-700 p-4 overflow-y-auto bg-white dark:bg-slate-900">
        {/* Mini Calendar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {format(miniCalendarDate, 'MMMM yyyy')}
            </h3>
            <div className="flex gap-1">
              <button
                onClick={goToPreviousMonthMini}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
              >
                <ChevronLeft className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              </button>
              <button
                onClick={goToNextMonthMini}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
              >
                <ChevronRight className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              </button>
            </div>
          </div>

          {/* Mini calendar grid */}
          <div>
            {/* Day headers */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }} className="text-center mb-3">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                <div key={i} className="text-slate-400 dark:text-slate-500 font-medium text-xs">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar days */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
              {miniCalendarDays.map((day, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentDate(day.date)}
                  style={{ height: '32px' }}
                  className={`
                    flex items-center justify-center text-sm font-normal transition-all rounded-full
                    ${!day.isCurrentMonth ? 'text-slate-400 dark:text-slate-600' : 'text-slate-900 dark:text-slate-100'}
                    ${day.isToday ? 'bg-blue-500 text-white font-medium' : ''}
                    ${day.isSelected && !day.isToday ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300' : ''}
                    ${!day.isToday && !day.isSelected ? 'hover:bg-slate-100 dark:hover:bg-slate-700' : ''}
                  `}
                >
                  {format(day.date, 'd')}
                </button>
              ))}
            </div>
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
                onClick={view === 'week' ? goToPreviousWeek : view === 'month' ? goToPreviousMonth : goToPreviousDay}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              </button>
              <button
                onClick={view === 'week' ? goToNextWeek : view === 'month' ? goToNextMonth : goToNextDay}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              </button>
            </div>

            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              {view === 'day' ? format(currentDate, 'EEEE, MMMM d, yyyy') : format(view === 'week' ? weekDays[0].date : currentDate, 'MMMM yyyy')}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {/* View selector */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
              <button
                onClick={() => setView('day')}
                className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                  view === 'day'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                Day
              </button>
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
        {view === 'week' && (
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

            {/* All-day events section */}
            <div className="flex border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
              <div className="w-20 border-r border-slate-200 dark:border-slate-700 flex-shrink-0 px-2 py-2">
                <span className="text-xs text-slate-500 dark:text-slate-400">All day</span>
              </div>
              {weekDays.map((day, dayIndex) => {
                const events = getEventsForDay(day.date);
                const hasAllDayEvents = events.allDayTasks.length > 0;

                return (
                  <div
                    key={dayIndex}
                    className={`
                      flex-1 min-w-[140px] border-r border-slate-200 dark:border-slate-700 last:border-r-0 p-1
                      ${day.isToday ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}
                    `}
                  >
                    {hasAllDayEvents && (
                      <div className="space-y-1">
                        {events.allDayTasks.map((task) => {
                          const spanInfo = getTaskSpanPosition(task, day.date);
                          const isMultiDay = isMultiDayTask(task);

                          return (
                            <div
                              key={task.id}
                              className={`
                                text-xs px-2 py-1 truncate flex items-center gap-1
                                ${task.status === 'done'
                                  ? 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 line-through'
                                  : 'bg-red-500 dark:bg-red-600 text-white font-medium'
                                }
                                ${spanInfo.isFirst ? 'rounded-l' : ''}
                                ${spanInfo.isLast ? 'rounded-r' : ''}
                                ${!spanInfo.isFirst && !spanInfo.isLast ? '' : ''}
                              `}
                              title={isMultiDay ? `${task.title} (Day ${spanInfo.position + 1}/${spanInfo.totalDays})` : task.title}
                            >
                              {!spanInfo.isFirst && <span className="text-xs">←</span>}
                              <span className="truncate">{task.title}</span>
                              {!spanInfo.isLast && <span className="text-xs">→</span>}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
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
                    const allEvents = [
                      ...events.tasks.map((t, idx) => ({ type: 'task', data: t, slot: 8 + (idx % 6) })),
                      ...events.habits.map((h, idx) => ({ type: 'habit', data: h, slot: 7 + idx })),
                    ];

                    const eventsForThisSlot = allEvents.filter(e => e.slot === slot.hour);

                    return (
                      <div
                        key={dayIndex}
                        onDragOver={handleDragOver}
                        onDrop={() => handleDrop(day.date)}
                        className={`
                          flex-1 min-w-[140px] min-h-[60px] border-r border-b border-slate-200 dark:border-slate-700 last:border-r-0 p-1
                          ${day.isToday ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}
                          ${draggedTask ? 'hover:bg-blue-100 dark:hover:bg-blue-900/20 transition-colors' : ''}
                        `}
                      >
                        {/* Show events assigned to this time slot */}
                        {eventsForThisSlot.length > 0 && (
                          <div className="space-y-1">
                            {eventsForThisSlot.map((event, idx) => {
                              if (event.type === 'task') {
                                const task = event.data as Task;
                                return (
                                  <div
                                    key={`task-${task.id}`}
                                    className={`
                                      text-xs px-2 py-1 rounded border-l-2 truncate
                                      ${task.status === 'done'
                                        ? 'bg-slate-100 dark:bg-slate-800 border-slate-400 text-slate-600 dark:text-slate-400'
                                        : 'bg-blue-500 dark:bg-blue-600 border-blue-600 text-white'
                                      }
                                    `}
                                    title={`${slot.label} - ${task.title}`}
                                  >
                                    <div className="flex items-center gap-1">
                                      <span className="font-medium">{slot.label.replace(' ', '')}</span>
                                      <span className="truncate">{task.title}</span>
                                    </div>
                                  </div>
                                );
                              }

                              if (event.type === 'habit') {
                                const habit = event.data as Habit;
                                return (
                                  <div
                                    key={`habit-${habit.id}`}
                                    className="text-xs px-2 py-1 rounded border-l-2 border-green-600 bg-green-500 dark:bg-green-600 text-white truncate"
                                    title={`${slot.label} - ${habit.name}`}
                                  >
                                    <div className="flex items-center gap-1">
                                      <span className="font-medium">{slot.label.replace(' ', '')}</span>
                                      <span className="truncate">✓ {habit.name}</span>
                                    </div>
                                  </div>
                                );
                              }

                              return null;
                            })}
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
        )}

        {/* Month View */}
        {view === 'month' && (
        <div className="flex-1 overflow-auto">
          <div className="h-full">
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-0 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
              {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((day) => (
                <div
                  key={day}
                  className="py-2 text-center text-xs font-medium text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-slate-700 last:border-r-0"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Month grid */}
            <div className="grid grid-cols-7 gap-0" style={{ gridAutoRows: 'minmax(120px, 1fr)' }}>
              {monthGridDays.map((dayData, index) => {
                const events = getEventsForDay(dayData.date);
                const allEvents = [
                  ...events.allDayTasks.map(t => ({ type: 'allday', data: t })),
                  ...events.tasks.map(t => ({ type: 'task', data: t })),
                  ...events.habits.map(h => ({ type: 'habit', data: h })),
                ];

                return (
                  <div
                    key={index}
                    onDragOver={handleDragOver}
                    onDrop={() => handleDrop(dayData.date)}
                    className={`
                      border-r border-b border-slate-200 dark:border-slate-700 p-1.5 overflow-hidden
                      ${!dayData.isCurrentMonth ? 'bg-slate-50/50 dark:bg-slate-900/50' : 'bg-white dark:bg-slate-900'}
                      hover:bg-slate-50 dark:hover:bg-slate-800/50
                      transition-colors cursor-pointer
                      ${draggedTask ? 'hover:ring-2 hover:ring-blue-400 dark:hover:ring-blue-600' : ''}
                    `}
                  >
                    {/* Date number */}
                    <div className="mb-1">
                      <span className={`
                        inline-flex items-center justify-center text-xs font-medium
                        ${dayData.isToday
                          ? 'bg-blue-600 text-white rounded-full w-6 h-6'
                          : !dayData.isCurrentMonth
                          ? 'text-slate-400 dark:text-slate-600'
                          : 'text-slate-900 dark:text-slate-100'
                        }
                      `}>
                        {format(dayData.date, 'd')}
                      </span>
                    </div>

                    {/* Events list */}
                    <div className="space-y-0.5">
                      {/* Show first 3-4 events depending on space */}
                      {allEvents.slice(0, 4).map((event, idx) => {
                        if (event.type === 'allday') {
                          const task = event.data as Task;
                          const spanInfo = getTaskSpanPosition(task, dayData.date);
                          const isMultiDay = isMultiDayTask(task);

                          return (
                            <div
                              key={`allday-${task.id}`}
                              className={`
                                flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded truncate
                                ${task.status === 'done'
                                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                  : 'bg-red-500 dark:bg-red-600 text-white'
                                }
                              `}
                              title={isMultiDay ? `All-day: ${task.title} (${spanInfo.position + 1}/${spanInfo.totalDays})` : `All-day: ${task.title}`}
                            >
                              {isMultiDay && !spanInfo.isFirst && <span className="text-[8px]">←</span>}
                              <span className={`flex-shrink-0 w-1 h-1 rounded-full ${task.status === 'done' ? 'bg-slate-400' : 'bg-white'}`} />
                              <span className="truncate font-medium">{task.title}</span>
                              {isMultiDay && !spanInfo.isLast && <span className="text-[8px]">→</span>}
                            </div>
                          );
                        }

                        if (event.type === 'task') {
                          const task = event.data as Task;
                          const spanInfo = getTaskSpanPosition(task, dayData.date);
                          const isMultiDay = isMultiDayTask(task);

                          return (
                            <div
                              key={`task-${task.id}`}
                              className={`
                                flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded truncate
                                ${task.status === 'done'
                                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                  : 'bg-blue-500 dark:bg-blue-600 text-white'
                                }
                              `}
                              title={isMultiDay ? `${task.title} (${spanInfo.position + 1}/${spanInfo.totalDays})` : task.title}
                            >
                              {isMultiDay && !spanInfo.isFirst && <span className="text-[8px]">←</span>}
                              <span className={`flex-shrink-0 w-1 h-1 rounded-full ${task.status === 'done' ? 'bg-slate-400' : 'bg-white'}`} />
                              <span className="truncate font-medium">{task.title}</span>
                              {isMultiDay && !spanInfo.isLast && <span className="text-[8px]">→</span>}
                            </div>
                          );
                        }

                        if (event.type === 'habit') {
                          const habit = event.data as Habit;
                          return (
                            <div
                              key={`habit-${habit.id}`}
                              className="flex items-center gap-1 text-xs px-1.5 py-0.5 rounded truncate bg-green-500 dark:bg-green-600 text-white"
                              title={habit.name}
                            >
                              <span className="flex-shrink-0 w-1 h-1 rounded-full bg-white" />
                              <span className="truncate font-medium">✓ {habit.name}</span>
                            </div>
                          );
                        }

                        return null;
                      })}

                      {/* More indicator */}
                      {allEvents.length > 4 && (
                        <button className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 px-1.5 font-medium">
                          +{allEvents.length - 4} more
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        )}

        {/* Day View */}
        {view === 'day' && (
        <div className="flex-1 overflow-auto">
          <div className="min-w-max">
            {/* Day header */}
            <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
              <div className="flex">
                {/* Time column header */}
                <div className="w-20 border-r border-slate-200 dark:border-slate-700 flex-shrink-0" />

                {/* Single day header */}
                <div className="flex-1 min-w-[600px] text-center py-3">
                  <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                    {format(currentDate, 'EEEE').toUpperCase()}
                  </div>
                  <div
                    className={`
                      text-2xl font-semibold mx-auto w-12 h-12 flex items-center justify-center rounded-full
                      ${isToday(currentDate) ? 'bg-blue-500 text-white' : 'text-slate-900 dark:text-slate-100'}
                    `}
                  >
                    {format(currentDate, 'd')}
                  </div>
                </div>
              </div>
            </div>

            {/* All-day events section */}
            {(() => {
              const events = getEventsForDay(currentDate);
              return events.allDayTasks.length > 0 ? (
                <div className="flex border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                  <div className="w-20 border-r border-slate-200 dark:border-slate-700 flex-shrink-0 px-2 py-2">
                    <span className="text-xs text-slate-500 dark:text-slate-400">All day</span>
                  </div>
                  <div className={`flex-1 min-w-[600px] p-3 ${isToday(currentDate) ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}`}>
                    <div className="space-y-2">
                      {events.allDayTasks.map((task) => (
                        <div
                          key={task.id}
                          className={`
                            flex items-start gap-3 p-3 rounded-lg border-l-4
                            ${task.status === 'done'
                              ? 'bg-slate-100 dark:bg-slate-800 border-slate-400 text-slate-600 dark:text-slate-400'
                              : 'bg-red-50 dark:bg-red-900/20 border-red-500'
                            }
                          `}
                        >
                          <div className="flex-1">
                            <h4 className={`font-semibold text-sm ${
                              task.status === 'done'
                                ? 'text-slate-700 dark:text-slate-300 line-through'
                                : 'text-red-700 dark:text-red-300'
                            }`}>
                              {task.title}
                            </h4>
                            {task.description && (
                              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                                {task.description}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
                                All-day event
                              </span>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                task.priority === 'urgent' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' :
                                task.priority === 'high' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300' :
                                task.priority === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' :
                                'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                              }`}>
                                {task.priority || 'low'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null;
            })()}

            {/* Time slots and events */}
            <div className="relative">
              {timeSlots.map((slot, slotIndex) => {
                const events = getEventsForDay(currentDate);

                // Distribute events across time slots (same as week view)
                const allEvents = [
                  ...events.tasks.map((t, idx) => ({ type: 'task', data: t, slot: 8 + (idx % 6) })),
                  ...events.habits.map((h, idx) => ({ type: 'habit', data: h, slot: 7 + idx })),
                ];

                const eventsForThisSlot = allEvents.filter(e => e.slot === slot.hour);

                return (
                  <div key={slot.hour} className="flex">
                    {/* Time label */}
                    <div className="w-20 border-r border-slate-200 dark:border-slate-700 flex-shrink-0 px-2 py-2">
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {slot.label}
                      </span>
                    </div>

                    {/* Day column */}
                    <div
                      className={`
                        flex-1 min-w-[600px] min-h-[60px] border-b border-slate-200 dark:border-slate-700 p-3
                        ${isToday(currentDate) ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}
                      `}
                    >
                      {/* Show events assigned to this time slot */}
                      {eventsForThisSlot.length > 0 && (
                        <div className="space-y-2">
                          {eventsForThisSlot.map((event, idx) => {
                            if (event.type === 'task') {
                              const task = event.data as Task;
                              return (
                                <div
                                  key={task.id}
                                  className={`
                                    flex items-start gap-3 p-3 rounded-lg border-l-4
                                    ${task.status === 'done'
                                      ? 'bg-green-50 dark:bg-green-900/20 border-green-500'
                                      : 'bg-blue-50 dark:bg-blue-900/20 border-blue-500'
                                    }
                                  `}
                                >
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                                        {slot.label}
                                      </span>
                                    </div>
                                    <h4 className={`font-semibold text-sm ${
                                      task.status === 'done'
                                        ? 'text-green-700 dark:text-green-300 line-through'
                                        : 'text-blue-700 dark:text-blue-300'
                                    }`}>
                                      {task.title}
                                    </h4>
                                    {task.description && (
                                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                                        {task.description}
                                      </p>
                                    )}
                                    <div className="flex items-center gap-2 mt-2">
                                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                                        task.priority === 'urgent' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' :
                                        task.priority === 'high' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300' :
                                        task.priority === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' :
                                        'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                      }`}>
                                        {task.priority || 'low'}
                                      </span>
                                      {task.status === 'done' && (
                                        <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            }

                            if (event.type === 'habit') {
                              const habit = event.data as Habit;
                              return (
                                <div
                                  key={habit.id}
                                  className="flex items-center gap-3 p-3 rounded-lg border-l-4 border-green-500 bg-green-50 dark:bg-green-900/20"
                                >
                                  <div
                                    className="w-4 h-4 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: habit.color }}
                                  />
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-xs font-semibold text-green-600 dark:text-green-400">
                                        {slot.label}
                                      </span>
                                    </div>
                                    <h4 className="font-semibold text-sm text-green-700 dark:text-green-300">
                                      {habit.name}
                                    </h4>
                                    {habit.description && (
                                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                                        {habit.description}
                                      </p>
                                    )}
                                  </div>
                                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                                </div>
                              );
                            }

                            return null;
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        )}
      </div>

      {/* Unscheduled Tasks Panel - Bottom Drawer */}
      {unscheduledTasks.length > 0 && (
        <div className="border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
          <button
            onClick={() => setShowUnscheduledPanel(!showUnscheduledPanel)}
            className="w-full flex items-center justify-between px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Inbox className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Unscheduled Tasks ({unscheduledTasks.length})
              </span>
            </div>
            {showUnscheduledPanel ? (
              <ChevronDown className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            ) : (
              <ChevronUp className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            )}
          </button>

          {showUnscheduledPanel && (
            <div className="p-4 max-h-48 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {unscheduledTasks.map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={() => handleDragStart(task)}
                    onDragEnd={handleDragEnd}
                    className={`
                      flex items-center gap-2 p-2 rounded-lg border cursor-move
                      transition-all hover:shadow-md
                      ${draggedTask?.id === task.id
                        ? 'opacity-50 border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 hover:border-blue-300 dark:hover:border-blue-600'
                      }
                    `}
                  >
                    <GripVertical className="w-4 h-4 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                        {task.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                          task.priority === 'urgent' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' :
                          task.priority === 'high' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300' :
                          task.priority === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' :
                          'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                        }`}>
                          {task.priority || 'low'}
                        </span>
                        {task.estimated_time > 0 && (
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {Math.floor(task.estimated_time / 60)}h {task.estimated_time % 60}m
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 text-center">
                Drag tasks to the calendar to schedule them
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Calendar;
