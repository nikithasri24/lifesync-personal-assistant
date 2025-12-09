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
import { useTasks, useUpdateTask, useProjects, useDeleteTask } from '../hooks/useTasksQuery';
import { useHabits, useHabitEntries } from '../hooks/useHabitsQuery';
import type { Task } from '../lib/supabase';
import type { Habit } from '../types';
import { SkeletonCard } from '../components/LoadingSpinner';
import { TaskEditModal } from '../scheduler/components/TaskEditModal';
import type { ScheduledTask } from '../scheduler/types';
import { useUndoRedo } from '../contexts/UndoRedoContext';
import { MoveTaskCommand, ChangeTaskCategoryCommand } from '../commands/TaskCommands';

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
  const [showUnscheduledPanel, setShowUnscheduledPanel] = useState(false);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [sidebarWidth, setSidebarWidth] = useState(112);
  const [isResizing, setIsResizing] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    scheduled: true,
    inProgress: true,
    todo: true,
    backlog: true,
  });

  const toggleSection = (section: 'scheduled' | 'inProgress' | 'todo' | 'backlog') => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Fetch data
  const { data: tasks = [], isLoading: tasksLoading } = useTasks();
  const { data: habits = [], isLoading: habitsLoading } = useHabits({ isActive: true });
  const { data: habitEntries = [], isLoading: entriesLoading } = useHabitEntries();
  const { data: apiProjects = [], isLoading: projectsLoading } = useProjects();
  const updateTaskMutation = useUpdateTask();
  const deleteTaskMutation = useDeleteTask();

  // Undo/Redo
  const { executeCommand } = useUndoRedo();

  // Task editing state
  const [editingTask, setEditingTask] = useState<ScheduledTask | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const isLoading = tasksLoading || habitsLoading || entriesLoading;

  // Get unscheduled tasks (no due_date or deleted) and categorize them
  const unscheduledTasks = useMemo(() => {
    return tasks.filter(task => !task.due_date && task.status !== 'done' && !task.deleted);
  }, [tasks]);

  // Get scheduled tasks (tasks WITH due_date that are not done)
  const scheduledTasks = useMemo(() => {
    return tasks.filter(task => task.due_date && task.status !== 'done' && !task.deleted);
  }, [tasks]);

  const categorizedTasks = useMemo(() => {
    // Scheduled: tasks already on calendar (WITH due_date)
    const scheduled = scheduledTasks;

    // Unscheduled categories
    const inProgress = unscheduledTasks.filter(t => t.status === 'in_progress');

    // Backlog: todo items with low/medium priority
    const backlog = unscheduledTasks.filter(t =>
      t.status === 'todo' &&
      (t.priority === 'low' || t.priority === 'medium')
    );

    // Todo: todo items with high/urgent priority, or other statuses
    const todo = unscheduledTasks.filter(t =>
      (t.status === 'todo' && (t.priority === 'high' || t.priority === 'urgent')) ||
      (t.status === 'waiting' || t.status === 'blocked')
    );

    return { scheduled, todo, inProgress, backlog };
  }, [scheduledTasks, unscheduledTasks]);

  // Time slots (All 24 hours: Midnight to 11 PM)
  const timeSlots: TimeSlot[] = useMemo(() => {
    const slots: TimeSlot[] = [];
    for (let hour = 0; hour <= 23; hour++) {
      const period = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
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
    const previousDate = draggedTask.due_date;

    // Use command for undo/redo support
    const command = new MoveTaskCommand(
      draggedTask.id as string,
      draggedTask.title,
      dateString,
      previousDate
    );

    void executeCommand(command);
    setDraggedTask(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Allow drop
  };

  // Drop task in unscheduled panel to remove due_date
  const handleDropInUnscheduled = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedTask) return;

    // Only update if task has a due_date (i.e., it's currently scheduled)
    if (draggedTask.due_date) {
      const command = new MoveTaskCommand(
        draggedTask.id as string,
        draggedTask.title,
        null,
        draggedTask.due_date
      );
      void executeCommand(command);
    }

    setDraggedTask(null);
  };

  // Drop task into a specific category (scheduled, todo, inProgress, backlog)
  const handleDropInCategory = (
    e: React.DragEvent,
    targetCategory: 'scheduled' | 'todo' | 'inProgress' | 'backlog'
  ) => {
    e.preventDefault();
    e.stopPropagation();

    if (!draggedTask) return;

    const updates: Partial<Task> = {};

    switch (targetCategory) {
      case 'scheduled':
        // Can't move to scheduled without a date - keep existing behavior
        // User should drag to calendar instead
        break;

      case 'todo':
        // Move to To Do = high priority + unscheduled
        updates.status = 'todo';
        updates.priority = 'high';
        updates.due_date = null;
        break;

      case 'inProgress':
        // Move to In Progress = in_progress status + unscheduled
        updates.status = 'in_progress';
        updates.due_date = null;
        break;

      case 'backlog':
        // Move to Backlog = low priority + unscheduled
        updates.status = 'todo';
        updates.priority = 'low';
        updates.due_date = null;
        break;
    }

    if (Object.keys(updates).length > 0) {
      // Use command for undo/redo support
      const command = new ChangeTaskCategoryCommand(
        draggedTask.id as string,
        draggedTask.title,
        updates,
        draggedTask
      );
      void executeCommand(command);
    }

    setDraggedTask(null);
  };

  // Click handler to edit a task
  const handleTaskClick = (task: Task) => {
    // Convert Task to ScheduledTask for the modal
    const scheduledTask: ScheduledTask = {
      ...task,
      id: task.id as string,
      title: task.title,
      description: task.description,
      status: task.status as ScheduledTask['status'],
      priority: task.priority as ScheduledTask['priority'],
      due_date: task.due_date || undefined,
      estimated_time: task.estimated_time,
      project_id: task.project_id,
      tags: task.tags,
      starred: task.starred,
      category: task.category as ScheduledTask['category'],
      created_at: task.created_at,
      updated_at: task.updated_at,
    };
    setEditingTask(scheduledTask);
    setShowEditModal(true);
  };

  // Save task changes
  const handleSaveTask = (taskId: string, updates: Partial<Task>) => {
    updateTaskMutation.mutate(
      { id: taskId, updates },
      {
        onSuccess: () => {
          setShowEditModal(false);
          setEditingTask(null);
        },
      }
    );
  };

  // Delete task
  const handleDeleteTask = (taskId: string) => {
    deleteTaskMutation.mutate(taskId, {
      onSuccess: () => {
        setShowEditModal(false);
        setEditingTask(null);
      },
    });
  };

  // Close edit modal
  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingTask(null);
  };

  // Resize handlers
  React.useEffect(() => {
    const handleResizeMove = (e: MouseEvent) => {
      const newWidth = window.innerWidth - e.clientX;
      // Constrain between 80px and 400px
      const constrainedWidth = Math.max(80, Math.min(400, newWidth));
      setSidebarWidth(constrainedWidth);
    };

    const handleResizeEnd = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';

      return () => {
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isResizing]);

  const handleResizeStart = () => {
    setIsResizing(true);
  };

  // Auto-scroll to current time on mount and view change
  React.useEffect(() => {
    const currentHour = new Date().getHours();
    const timeSlotElement = document.getElementById(`time-slot-${currentHour}`);

    if (timeSlotElement) {
      // Delay to ensure DOM is ready
      setTimeout(() => {
        timeSlotElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }, 100);
    }
  }, [view, currentDate]); // Re-scroll when view or date changes

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
      <div className="flex-1 flex overflow-hidden">
        {/* Calendar Content */}
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
                    className="flex-1 min-w-[140px] max-w-[140px] text-center py-3 border-r border-slate-200 dark:border-slate-700 last:border-r-0"
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
                      flex-1 min-w-[140px] max-w-[140px] border-r border-slate-200 dark:border-slate-700 last:border-r-0 p-1 overflow-hidden
                      ${day.isToday ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}
                    `}
                  >
                    {hasAllDayEvents && (
                      <div className="space-y-0.5">
                        {events.allDayTasks.map((task) => {
                          const spanInfo = getTaskSpanPosition(task, day.date);
                          const isMultiDay = isMultiDayTask(task);

                          return (
                            <div
                              key={task.id}
                              draggable
                              onDragStart={() => handleDragStart(task)}
                              onDragEnd={handleDragEnd}
                              onClick={() => handleTaskClick(task)}
                              className={`
                                text-[10px] px-1.5 py-0.5 truncate flex items-center gap-0.5 cursor-pointer hover:opacity-80 transition-opacity
                                ${task.status === 'done'
                                  ? 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 line-through'
                                  : 'bg-red-500 dark:bg-red-600 text-white font-medium'
                                }
                                ${spanInfo.isFirst ? 'rounded-l' : ''}
                                ${spanInfo.isLast ? 'rounded-r' : ''}
                                ${!spanInfo.isFirst && !spanInfo.isLast ? '' : ''}
                                ${draggedTask?.id === task.id ? 'opacity-50' : ''}
                              `}
                              title={isMultiDay ? `${task.title} (Day ${spanInfo.position + 1}/${spanInfo.totalDays})` : task.title}
                            >
                              {!spanInfo.isFirst && <span className="text-[8px]">←</span>}
                              <span className="truncate">{task.title}</span>
                              {!spanInfo.isLast && <span className="text-[8px]">→</span>}
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
                <div key={slot.hour} id={`time-slot-${slot.hour}`} className="flex">
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
                          flex-1 min-w-[140px] max-w-[140px] min-h-[60px] border-r border-b border-slate-200 dark:border-slate-700 last:border-r-0 p-1 overflow-hidden
                          ${day.isToday ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}
                          ${draggedTask ? 'hover:bg-blue-100 dark:hover:bg-blue-900/20 transition-colors' : ''}
                        `}
                      >
                        {/* Show events assigned to this time slot */}
                        {eventsForThisSlot.length > 0 && (
                          <div className="space-y-0.5">
                            {eventsForThisSlot.map((event, idx) => {
                              if (event.type === 'task') {
                                const task = event.data as Task;
                                return (
                                  <div
                                    key={`task-${task.id}`}
                                    draggable
                                    onDragStart={() => handleDragStart(task)}
                                    onDragEnd={handleDragEnd}
                                    onClick={() => handleTaskClick(task)}
                                    className={`
                                      text-[10px] px-1.5 py-0.5 rounded border-l-2 truncate cursor-pointer hover:opacity-80 transition-opacity
                                      ${task.status === 'done'
                                        ? 'bg-slate-100 dark:bg-slate-800 border-slate-400 text-slate-600 dark:text-slate-400'
                                        : 'bg-blue-500 dark:bg-blue-600 border-blue-600 text-white'
                                      }
                                      ${draggedTask?.id === task.id ? 'opacity-50' : ''}
                                    `}
                                    title={`${slot.label} - ${task.title}`}
                                  >
                                    <div className="truncate">
                                      <span className="font-medium">{slot.label.replace(' ', '')}</span> {task.title}
                                    </div>
                                  </div>
                                );
                              }

                              if (event.type === 'habit') {
                                const habit = event.data as Habit;
                                return (
                                  <div
                                    key={`habit-${habit.id}`}
                                    className="text-[10px] px-1.5 py-0.5 rounded border-l-2 border-green-600 bg-green-500 dark:bg-green-600 text-white truncate"
                                    title={`${slot.label} - ${habit.name}`}
                                  >
                                    <div className="truncate">
                                      <span className="font-medium">{slot.label.replace(' ', '')}</span> ✓ {habit.name}
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
                              draggable
                              onDragStart={() => handleDragStart(task)}
                              onDragEnd={handleDragEnd}
                              onClick={() => handleTaskClick(task)}
                              className={`
                                flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded truncate cursor-pointer hover:opacity-80 transition-opacity
                                ${task.status === 'done'
                                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                  : 'bg-red-500 dark:bg-red-600 text-white'
                                }
                                ${draggedTask?.id === task.id ? 'opacity-50' : ''}
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
                              draggable
                              onDragStart={() => handleDragStart(task)}
                              onDragEnd={handleDragEnd}
                              onClick={() => handleTaskClick(task)}
                              className={`
                                flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded truncate cursor-pointer hover:opacity-80 transition-opacity
                                ${task.status === 'done'
                                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                  : 'bg-blue-500 dark:bg-blue-600 text-white'
                                }
                                ${draggedTask?.id === task.id ? 'opacity-50' : ''}
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
                          draggable
                          onDragStart={() => handleDragStart(task)}
                          onDragEnd={handleDragEnd}
                          onClick={() => handleTaskClick(task)}
                          className={`
                            flex items-start gap-3 p-3 rounded-lg border-l-4 cursor-pointer hover:opacity-80 transition-opacity
                            ${task.status === 'done'
                              ? 'bg-slate-100 dark:bg-slate-800 border-slate-400 text-slate-600 dark:text-slate-400'
                              : 'bg-red-50 dark:bg-red-900/20 border-red-500'
                            }
                            ${draggedTask?.id === task.id ? 'opacity-50' : ''}
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
                  <div key={slot.hour} id={`time-slot-${slot.hour}`} className="flex">
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
                                  draggable
                                  onDragStart={() => handleDragStart(task)}
                                  onDragEnd={handleDragEnd}
                                  onClick={() => handleTaskClick(task)}
                                  className={`
                                    flex items-start gap-3 p-3 rounded-lg border-l-4 cursor-pointer hover:opacity-80 transition-opacity
                                    ${task.status === 'done'
                                      ? 'bg-green-50 dark:bg-green-900/20 border-green-500'
                                      : 'bg-blue-50 dark:bg-blue-900/20 border-blue-500'
                                    }
                                    ${draggedTask?.id === task.id ? 'opacity-50' : ''}
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

        {/* Right Sidebar - Unscheduled Tasks */}
        {unscheduledTasks.length > 0 && (
          <div
            className={`border-l border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex-shrink-0 relative`}
            style={{
              width: showUnscheduledPanel ? `${sidebarWidth}px` : '48px',
              maxWidth: showUnscheduledPanel ? `${sidebarWidth}px` : '48px',
              minWidth: showUnscheduledPanel ? `${sidebarWidth}px` : '48px',
              overflow: 'hidden',
              transition: showUnscheduledPanel ? 'none' : 'all 300ms'
            }}
          >
            {/* Resize Handle */}
            {showUnscheduledPanel && (
              <div
                onMouseDown={handleResizeStart}
                className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500 transition-colors z-10"
                style={{
                  marginLeft: '-2px',
                  width: '4px'
                }}
              />
            )}
            <button
              onClick={() => setShowUnscheduledPanel(!showUnscheduledPanel)}
              className="w-full flex items-center justify-center py-2 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border-b border-slate-200 dark:border-slate-700"
              style={{ overflow: 'hidden' }}
            >
              {showUnscheduledPanel ? (
                <div className="flex flex-col items-center gap-1 w-full px-1" style={{ overflow: 'hidden' }}>
                  <Inbox className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                  <span className="text-[10px] font-medium text-slate-700 dark:text-slate-300 text-center">
                    ({unscheduledTasks.length})
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Inbox className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                  <span className="text-xs text-slate-600 dark:text-slate-400 transform -rotate-90 whitespace-nowrap">
                    {unscheduledTasks.length}
                  </span>
                </div>
              )}
            </button>

            {showUnscheduledPanel && (
              <div
                className="p-2 overflow-y-auto h-full w-full"
                onDragOver={handleDragOver}
                onDrop={handleDropInUnscheduled}
              >
                {/* Scheduled Section */}
                {categorizedTasks.scheduled.length > 0 && (
                  <div
                    className="mb-3"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDropInCategory(e, 'scheduled')}
                  >
                    <button
                      onClick={() => toggleSection('scheduled')}
                      className="w-full flex items-center justify-between px-1 py-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
                    >
                      <h4 className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">
                        📅 SCHEDULED ({categorizedTasks.scheduled.length})
                      </h4>
                      {expandedSections.scheduled ? (
                        <ChevronDown className="w-3 h-3 text-slate-400" />
                      ) : (
                        <ChevronUp className="w-3 h-3 text-slate-400" />
                      )}
                    </button>
                    {expandedSections.scheduled && (
                    <div
                      className={`space-y-1.5 w-full mt-1.5 rounded transition-colors ${
                        draggedTask ? 'border-2 border-dashed border-green-300 dark:border-green-600 bg-green-50/50 dark:bg-green-900/10 p-2' : ''
                      }`}
                      style={{ minHeight: draggedTask ? '60px' : 'auto' }}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDropInCategory(e, 'scheduled')}
                    >
                      {categorizedTasks.scheduled.map((task) => (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={() => handleDragStart(task)}
                          onDragEnd={handleDragEnd}
                          onClick={() => handleTaskClick(task)}
                          className={`
                            p-2 rounded border cursor-move transition-all hover:shadow-sm w-full
                            ${draggedTask?.id === task.id
                              ? 'opacity-50 border-green-400 bg-green-50 dark:bg-green-900/20'
                              : 'border-green-200 dark:border-green-600 bg-green-50 dark:bg-green-900/10 hover:border-green-300 dark:hover:border-green-500'
                            }
                          `}
                          style={{ maxWidth: '100%', overflow: 'hidden' }}
                        >
                          <div className="w-full" style={{ maxWidth: '100%' }}>
                            <div className="flex items-start gap-1" style={{ width: '100%', maxWidth: '100%' }}>
                              <GripVertical className="w-3 h-3 text-green-400 dark:text-green-500 flex-shrink-0 mt-0.5" />
                              <div style={{ flex: '1', minWidth: '0', maxWidth: '100%' }}>
                                <p
                                  className="text-xs font-medium text-green-900 dark:text-green-100 leading-tight"
                                  style={{
                                    wordBreak: 'break-word',
                                    overflowWrap: 'break-word',
                                    hyphens: 'auto',
                                    whiteSpace: 'normal',
                                    overflow: 'hidden'
                                  }}
                                >
                                  {task.title}
                                </p>
                                {/* Show due date for scheduled tasks */}
                                {task.due_date && (
                                  <p className="text-[10px] text-green-700 dark:text-green-300 mt-0.5">
                                    {format(new Date(task.due_date), 'MMM d, h:mm a')}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    )}
                  </div>
                )}

                {/* In Progress Section */}
                {categorizedTasks.inProgress.length > 0 && (
                  <div
                    className="mb-3"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDropInCategory(e, 'inProgress')}
                  >
                    <button
                      onClick={() => toggleSection('inProgress')}
                      className="w-full flex items-center justify-between px-1 py-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
                    >
                      <h4 className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">
                        IN PROGRESS ({categorizedTasks.inProgress.length})
                      </h4>
                      {expandedSections.inProgress ? (
                        <ChevronDown className="w-3 h-3 text-slate-400" />
                      ) : (
                        <ChevronUp className="w-3 h-3 text-slate-400" />
                      )}
                    </button>
                    {expandedSections.inProgress && (
                    <div
                      className={`space-y-1.5 w-full mt-1.5 rounded transition-colors ${
                        draggedTask ? 'border-2 border-dashed border-purple-300 dark:border-purple-600 bg-purple-50/50 dark:bg-purple-900/10 p-2' : ''
                      }`}
                      style={{ minHeight: draggedTask ? '60px' : 'auto' }}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDropInCategory(e, 'inProgress')}
                    >
                      {categorizedTasks.inProgress.map((task) => (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={() => handleDragStart(task)}
                          onDragEnd={handleDragEnd}
                          className={`
                            p-2 rounded border cursor-move transition-all hover:shadow-sm w-full
                            ${draggedTask?.id === task.id
                              ? 'opacity-50 border-purple-400 bg-purple-50 dark:bg-purple-900/20'
                              : 'border-purple-200 dark:border-purple-600 bg-purple-50 dark:bg-purple-900/10 hover:border-purple-300 dark:hover:border-purple-500'
                            }
                          `}
                          style={{ maxWidth: '100%', overflow: 'hidden' }}
                        >
                          <div className="w-full" style={{ maxWidth: '100%' }}>
                            <div className="flex items-start gap-1 mb-1" style={{ width: '100%', maxWidth: '100%' }}>
                              <GripVertical className="w-3 h-3 text-purple-400 dark:text-purple-500 flex-shrink-0 mt-0.5" />
                              <div style={{ flex: '1', minWidth: '0', maxWidth: '100%' }}>
                                <p
                                  className="text-xs font-medium text-purple-900 dark:text-purple-100 leading-tight"
                                  style={{
                                    wordBreak: 'break-word',
                                    overflowWrap: 'break-word',
                                    hyphens: 'auto',
                                    whiteSpace: 'normal',
                                    overflow: 'hidden'
                                  }}
                                >
                                  {task.title}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    )}
                  </div>
                )}

                {/* To Do Section */}
                {categorizedTasks.todo.length > 0 && (
                  <div
                    className="mb-3"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDropInCategory(e, 'todo')}
                  >
                    <button
                      onClick={() => toggleSection('todo')}
                      className="w-full flex items-center justify-between px-1 py-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
                    >
                      <h4 className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">
                        TO DO ({categorizedTasks.todo.length})
                      </h4>
                      {expandedSections.todo ? (
                        <ChevronDown className="w-3 h-3 text-slate-400" />
                      ) : (
                        <ChevronUp className="w-3 h-3 text-slate-400" />
                      )}
                    </button>
                    {expandedSections.todo && (
                    <div
                      className={`space-y-1.5 w-full mt-1.5 rounded transition-colors ${
                        draggedTask ? 'border-2 border-dashed border-blue-300 dark:border-blue-600 bg-blue-50/50 dark:bg-blue-900/10 p-2' : ''
                      }`}
                      style={{ minHeight: draggedTask ? '60px' : 'auto' }}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDropInCategory(e, 'todo')}
                    >
                      {categorizedTasks.todo.map((task) => (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={() => handleDragStart(task)}
                          onDragEnd={handleDragEnd}
                          className={`
                            p-2 rounded border cursor-move transition-all hover:shadow-sm w-full
                            ${draggedTask?.id === task.id
                              ? 'opacity-50 border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-blue-200 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/10 hover:border-blue-300 dark:hover:border-blue-500'
                            }
                          `}
                          style={{ maxWidth: '100%', overflow: 'hidden' }}
                        >
                          <div className="w-full" style={{ maxWidth: '100%' }}>
                            <div className="flex items-start gap-1" style={{ width: '100%', maxWidth: '100%' }}>
                              <GripVertical className="w-3 h-3 text-blue-400 dark:text-blue-500 flex-shrink-0 mt-0.5" />
                              <div style={{ flex: '1', minWidth: '0', maxWidth: '100%' }}>
                                <p
                                  className="text-xs font-medium text-blue-900 dark:text-blue-100 leading-tight"
                                  style={{
                                    wordBreak: 'break-word',
                                    overflowWrap: 'break-word',
                                    hyphens: 'auto',
                                    whiteSpace: 'normal',
                                    overflow: 'hidden'
                                  }}
                                >
                                  {task.title}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    )}
                  </div>
                )}

                {/* Backlog Section */}
                {categorizedTasks.backlog.length > 0 && (
                  <div
                    className="mb-3"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDropInCategory(e, 'backlog')}
                  >
                    <button
                      onClick={() => toggleSection('backlog')}
                      className="w-full flex items-center justify-between px-1 py-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
                    >
                      <h4 className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">
                        BACKLOG ({categorizedTasks.backlog.length})
                      </h4>
                      {expandedSections.backlog ? (
                        <ChevronDown className="w-3 h-3 text-slate-400" />
                      ) : (
                        <ChevronUp className="w-3 h-3 text-slate-400" />
                      )}
                    </button>
                    {expandedSections.backlog && (
                    <div
                      className={`space-y-1.5 w-full mt-1.5 rounded transition-colors ${
                        draggedTask ? 'border-2 border-dashed border-slate-300 dark:border-slate-600 bg-slate-50/50 dark:bg-slate-800/30 p-2' : ''
                      }`}
                      style={{ minHeight: draggedTask ? '60px' : 'auto' }}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDropInCategory(e, 'backlog')}
                    >
                      {categorizedTasks.backlog.map((task) => (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={() => handleDragStart(task)}
                          onDragEnd={handleDragEnd}
                          className={`
                            p-2 rounded border cursor-move transition-all hover:shadow-sm w-full
                            ${draggedTask?.id === task.id
                              ? 'opacity-50 border-slate-400 bg-slate-50 dark:bg-slate-900/20'
                              : 'border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-500'
                            }
                          `}
                          style={{ maxWidth: '100%', overflow: 'hidden' }}
                        >
                          <div className="w-full" style={{ maxWidth: '100%' }}>
                            <div className="flex items-start gap-1" style={{ width: '100%', maxWidth: '100%' }}>
                              <GripVertical className="w-3 h-3 text-slate-400 dark:text-slate-500 flex-shrink-0 mt-0.5" />
                              <div style={{ flex: '1', minWidth: '0', maxWidth: '100%' }}>
                                <p
                                  className="text-xs font-medium text-slate-700 dark:text-slate-300 leading-tight"
                                  style={{
                                    wordBreak: 'break-word',
                                    overflowWrap: 'break-word',
                                    hyphens: 'auto',
                                    whiteSpace: 'normal',
                                    overflow: 'hidden'
                                  }}
                                >
                                  {task.title}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    )}
                  </div>
                )}

                <p className="text-xs text-slate-500 dark:text-slate-400 mt-4 text-center">
                  Drag tasks to schedule
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Task Edit Modal */}
      <TaskEditModal
        task={editingTask}
        projects={apiProjects}
        isOpen={showEditModal}
        onClose={handleCloseEditModal}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
        isSaving={updateTaskMutation.isPending || deleteTaskMutation.isPending}
      />
    </div>
  );
};

export default Calendar;
