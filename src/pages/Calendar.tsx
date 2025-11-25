/**
 * Calendar Component
 * Comprehensive calendar view showing tasks, habits, and journal entries
 */

import React, { useState, useMemo } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO,
} from 'date-fns';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  CheckCircle2,
  Target,
  BookOpen,
  Plus,
} from 'lucide-react';
import { useTasks } from '../hooks/useTasksQuery';
import { useHabits, useHabitEntries } from '../hooks/useHabitsQuery';
import { useJournalEntries } from '../hooks/useJournalQuery';
import type { Task } from '../lib/supabase';
import type { Habit, JournalEntry } from '../types';
import { SkeletonCard } from '../components/LoadingSpinner';

type CalendarView = 'month' | 'week' | 'day';

interface DayData {
  date: Date;
  tasks: Task[];
  habits: Array<{ habit: Habit; completed: boolean }>;
  journalEntries: JournalEntry[];
  isCurrentMonth: boolean;
  isToday: boolean;
}

const Calendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>('month');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Fetch data
  const { data: tasks = [], isLoading: tasksLoading } = useTasks();
  const { data: habits = [], isLoading: habitsLoading } = useHabits({ isActive: true });
  const { data: habitEntries = [], isLoading: entriesLoading } = useHabitEntries();
  const { data: journalEntries = [], isLoading: journalLoading } = useJournalEntries();

  const isLoading = tasksLoading || habitsLoading || entriesLoading || journalLoading;

  // Navigation handlers
  const goToPreviousMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  // Generate calendar days
  const calendarDays = useMemo((): DayData[] => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

    const days: DayData[] = [];
    let day = calendarStart;

    while (day <= calendarEnd) {
      const dateKey = format(day, 'yyyy-MM-dd');

      // Filter tasks for this day
      const dayTasks = tasks.filter(task => {
        if (!task.due_date) return false;
        const taskDate = typeof task.due_date === 'string' ? parseISO(task.due_date) : task.due_date;
        return isSameDay(taskDate, day);
      });

      // Filter habits completed on this day
      const dayHabitCompletions = habitEntries.filter(entry => entry.date === dateKey);
      const dayHabits = habits.map(habit => ({
        habit,
        completed: dayHabitCompletions.some(entry => entry.habit_id === habit.id),
      }));

      // Filter journal entries for this day
      const dayJournalEntries = journalEntries.filter(entry => {
        const entryDate = typeof entry.createdAt === 'string' ? parseISO(entry.createdAt) : entry.createdAt;
        return isSameDay(entryDate, day);
      });

      days.push({
        date: day,
        tasks: dayTasks,
        habits: dayHabits,
        journalEntries: dayJournalEntries,
        isCurrentMonth: isSameMonth(day, currentDate),
        isToday: isToday(day),
      });

      day = addDays(day, 1);
    }

    return days;
  }, [currentDate, tasks, habits, habitEntries, journalEntries]);

  // Day cell component
  const DayCell: React.FC<{ dayData: DayData }> = ({ dayData }) => {
    const { date, tasks: dayTasks, habits: dayHabits, journalEntries: dayJournalEntries, isCurrentMonth, isToday: isDayToday } = dayData;

    const completedTasksCount = dayTasks.filter(t => t.status === 'done').length;
    const totalTasksCount = dayTasks.length;
    const completedHabitsCount = dayHabits.filter(h => h.completed).length;
    const totalHabitsCount = dayHabits.length;
    const hasJournalEntry = dayJournalEntries.length > 0;

    const hasActivity = totalTasksCount > 0 || completedHabitsCount > 0 || hasJournalEntry;

    return (
      <div
        onClick={() => setSelectedDate(date)}
        className={`
          min-h-[100px] sm:min-h-[120px] border-r border-b border-slate-200 dark:border-slate-600 p-2 cursor-pointer transition-all duration-200
          ${!isCurrentMonth ? 'bg-slate-50 dark:bg-slate-900 text-slate-400 dark:text-slate-600' : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100'}
          ${isDayToday ? 'ring-2 ring-blue-500 ring-inset' : ''}
          ${selectedDate && isSameDay(selectedDate, date) ? 'bg-blue-50 dark:bg-blue-900/30' : ''}
          hover:bg-slate-50 dark:hover:bg-slate-700
        `}
      >
        {/* Date number */}
        <div className="flex items-center justify-between mb-1">
          <span className={`
            text-sm font-medium
            ${isDayToday ? 'bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs' : ''}
          `}>
            {format(date, 'd')}
          </span>

          {/* Activity indicators */}
          {hasActivity && (
            <div className="flex gap-1">
              {totalTasksCount > 0 && (
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" title={`${completedTasksCount}/${totalTasksCount} tasks`} />
              )}
              {completedHabitsCount > 0 && (
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" title={`${completedHabitsCount} habits completed`} />
              )}
              {hasJournalEntry && (
                <div className="w-1.5 h-1.5 rounded-full bg-purple-500" title="Journal entry" />
              )}
            </div>
          )}
        </div>

        {/* Task preview */}
        <div className="space-y-1">
          {dayTasks.slice(0, 2).map(task => (
            <div
              key={task.id}
              className={`
                text-xs px-1.5 py-0.5 rounded truncate
                ${task.status === 'done' ? 'bg-green-50 text-green-700 line-through' : 'bg-blue-50 text-blue-700'}
              `}
              title={task.title}
            >
              {task.title}
            </div>
          ))}
          {dayTasks.length > 2 && (
            <div className="text-xs text-slate-500 px-1.5">
              +{dayTasks.length - 2} more
            </div>
          )}
        </div>
      </div>
    );
  };

  // Selected date detail panel
  const SelectedDatePanel: React.FC<{ date: Date }> = ({ date }) => {
    const dayData = calendarDays.find(d => isSameDay(d.date, date));
    if (!dayData) return null;

    const { tasks: dayTasks, habits: dayHabits, journalEntries: dayJournalEntries } = dayData;

    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            {format(date, 'EEEE, MMMM d, yyyy')}
          </h3>
          <button
            onClick={() => setSelectedDate(null)}
            className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Tasks Section */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h4 className="font-semibold text-slate-900 dark:text-slate-100">Tasks ({dayTasks.length})</h4>
          </div>
          {dayTasks.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 pl-7">No tasks scheduled</p>
          ) : (
            <div className="space-y-2 pl-7">
              {dayTasks.map(task => (
                <div
                  key={task.id}
                  className={`
                    flex items-start justify-between p-3 rounded-lg border
                    ${task.status === 'done' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600'}
                  `}
                >
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${task.status === 'done' ? 'line-through text-slate-500 dark:text-slate-400' : 'text-slate-900 dark:text-slate-100'}`}>
                      {task.title}
                    </p>
                    {task.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{task.description}</p>
                    )}
                  </div>
                  {task.status === 'done' && (
                    <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 ml-2 flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Habits Section */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-5 h-5 text-green-600 dark:text-green-400" />
            <h4 className="font-semibold text-slate-900 dark:text-slate-100">
              Habits ({dayHabits.filter(h => h.completed).length}/{dayHabits.length})
            </h4>
          </div>
          {dayHabits.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 pl-7">No habits tracked</p>
          ) : (
            <div className="space-y-2 pl-7">
              {dayHabits.map(({ habit, completed }) => (
                <div
                  key={habit.id}
                  className={`
                    flex items-center gap-3 p-3 rounded-lg border
                    ${completed ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600'}
                  `}
                >
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: habit.color }}
                  />
                  <span className={`text-sm font-medium flex-1 ${completed ? 'text-slate-900 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400'}`}>
                    {habit.name}
                  </span>
                  {completed && (
                    <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Journal Section */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <h4 className="font-semibold text-slate-900 dark:text-slate-100">Journal ({dayJournalEntries.length})</h4>
          </div>
          {dayJournalEntries.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 pl-7">No journal entries</p>
          ) : (
            <div className="space-y-3 pl-7">
              {dayJournalEntries.map(entry => (
                <div
                  key={entry.id}
                  className="p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800"
                >
                  <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-3">{entry.content}</p>
                  {entry.mood && (
                    <span className="inline-block mt-2 text-xs text-purple-600 dark:text-purple-400 font-medium">
                      Mood: {entry.mood}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="mx-auto flex max-w-7xl flex-col gap-6 p-6">
        <SkeletonCard className="h-64" />
        <div className="grid grid-cols-7 gap-4">
          {Array.from({ length: 35 }).map((_, i) => (
            <SkeletonCard key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 p-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Calendar</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">View your tasks, habits, and journal entries</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={goToToday}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            Today
          </button>
        </div>
      </header>

      {/* Calendar Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4">
        <div className="flex items-center gap-4">
          <button
            onClick={goToPreviousMonth}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>

          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 min-w-[200px] text-center">
            {format(currentDate, 'MMMM yyyy')}
          </h2>

          <button
            onClick={goToNextMonth}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            aria-label="Next month"
          >
            <ChevronRight className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span>Tasks</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span>Habits</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-purple-500" />
            <span>Journal</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Calendar Grid */}
        <div className="flex-1 min-w-0">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
            {/* Week day headers */}
            <div className="grid grid-cols-7 gap-0 bg-slate-50 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600">
              {weekDays.map(day => (
                <div
                  key={day}
                  className="p-3 text-center text-sm font-semibold text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-600 last:border-r-0"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar days */}
            <div className="grid grid-cols-7 gap-0">
              {calendarDays.map((dayData, index) => (
                <DayCell key={index} dayData={dayData} />
              ))}
            </div>
          </div>
        </div>

        {/* Selected date panel */}
        {selectedDate && (
          <div className="w-full lg:w-96 flex-shrink-0">
            <SelectedDatePanel date={selectedDate} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Calendar;
