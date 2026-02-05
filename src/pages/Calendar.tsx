/**
 * Calendar Component - Google Calendar Style Week View
 * Refactored to use extracted hooks and components
 */

import React, { useState, useMemo, useEffect } from 'react';
import { format, parseISO, isSameDay, addDays, isToday, addMinutes } from 'date-fns';
import { logger } from '../services/logger';
import { CheckCircle2, Target } from 'lucide-react';

// Hooks
import { useTasks, useUpdateTask, useDeleteTask } from '../hooks/useTasksQuery';
import { useHabits, useHabitEntries } from '../hooks/useHabitsQuery';
import { useCalendarEvents, useCreateCalendarEvent, useUpdateCalendarEvent, useDeleteCalendarEvent } from '../hooks/useCalendarQuery';
import { useScheduleBlocks, useCreateScheduleBlock, useUpdateScheduleBlock, useDeleteScheduleBlock } from '../hooks/useScheduleBlocksQuery';
import { useCalendarState } from '../calendar/hooks/useCalendarState';
import { useCalendarTasks } from '../calendar/hooks/useCalendarTasks';
import { isMultiDayTask, getTaskSpanDays, taskAppearsOnDate, getTaskSpanPosition } from '../calendar/hooks';
import { useUndoRedo } from '../contexts/UndoRedoContext';
import { useProjectsQuery } from '@/hooks/useProjectsQuery';

// Components
import { CalendarHeader } from '../calendar/components/CalendarHeader';
import { CalendarSidebar } from '../calendar/components/CalendarSidebar';
import { TaskEditModal } from '../scheduler/components/TaskEditModal';
import { EventModal } from '../components/calendar/EventModal';
import { EventCard } from '../components/calendar/EventCard';
import { QuickScheduleModal } from '../components/calendar/QuickScheduleModal';
import { ScheduleBlockModal } from '../components/scheduleBlocks/ScheduleBlockModal';
import { CalendarLoadingState } from '../calendar/components/layout/CalendarLoadingState';
import { WeekDayHeaders } from '../calendar/components/layout/WeekDayHeaders';
import { MonthView } from '../calendar/components/layout/MonthView';
import { DayView } from '../calendar/components/layout/DayView';

// Types
import type { Task } from '../lib/supabase';
import type { Habit } from '../types';
import type { CalendarEvent } from '../services/types';
import type { ScheduledTask } from '../scheduler/types';
import type { ScheduleBlock } from '../services/types';

// Commands
import { ChangeTaskCategoryCommand } from '../commands/TaskCommands';

const Calendar: React.FC = () => {
  // Data fetching
  const { data: tasks = [], isLoading: tasksLoading } = useTasks();
  const { data: habits = [], isLoading: habitsLoading } = useHabits({ isActive: true });
  const { data: habitEntries = [], isLoading: entriesLoading } = useHabitEntries();
  const { data: calendarEvents = [], isLoading: eventsLoading } = useCalendarEvents();
  const { data: projects = [] } = useProjectsQuery();

  // Mutations
  const updateTaskMutation = useUpdateTask();
  const deleteTaskMutation = useDeleteTask();
  const createEventMutation = useCreateCalendarEvent();
  const updateEventMutation = useUpdateCalendarEvent();
  const deleteEventMutation = useDeleteCalendarEvent();
  const createScheduleBlockMutation = useCreateScheduleBlock();
  const updateScheduleBlockMutation = useUpdateScheduleBlock();
  const deleteScheduleBlockMutation = useDeleteScheduleBlock();

  // Hooks
  const calendarState = useCalendarState();
  const scheduleFilters = useMemo(() => {
    if (calendarState.view === 'week' && calendarState.weekDays.length > 0) {
      return {
        startDate: format(calendarState.weekDays[0].date, 'yyyy-MM-dd'),
        endDate: format(calendarState.weekDays[calendarState.weekDays.length - 1].date, 'yyyy-MM-dd'),
      };
    }

    if (calendarState.view === 'month' && calendarState.monthGridDays.length > 0) {
      return {
        startDate: format(calendarState.monthGridDays[0].date, 'yyyy-MM-dd'),
        endDate: format(calendarState.monthGridDays[calendarState.monthGridDays.length - 1].date, 'yyyy-MM-dd'),
      };
    }

    return {
      startDate: format(calendarState.currentDate, 'yyyy-MM-dd'),
      endDate: format(calendarState.currentDate, 'yyyy-MM-dd'),
    };
  }, [calendarState.view, calendarState.weekDays, calendarState.monthGridDays, calendarState.currentDate]);
  const { data: scheduleBlocks = [], isLoading: blocksLoading } = useScheduleBlocks(scheduleFilters);
  const { categorizedTasks, unscheduledTasks } = useCalendarTasks(tasks);
  const { executeCommand } = useUndoRedo();
  const scheduleBlockStyles: Record<ScheduleBlock['type'], string> = {
    task: 'bg-emerald-200/70 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100',
    event: 'bg-slate-200/80 text-slate-900 dark:bg-slate-700/60 dark:text-slate-100',
    focus: 'bg-purple-200/70 text-purple-900 dark:bg-purple-900/40 dark:text-purple-100',
    break: 'bg-amber-200/70 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100',
  };

  // Local state for drag & drop
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [draggedEvent, setDraggedEvent] = useState<CalendarEvent | null>(null);

  // Modal state
  const [editingTask, setEditingTask] = useState<ScheduledTask | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventModalInitialDate, setEventModalInitialDate] = useState<Date | null>(null);
  const [showQuickSchedule, setShowQuickSchedule] = useState(false);
  const [quickScheduleDate, setQuickScheduleDate] = useState<Date | null>(null);
  const [showScheduleBlockModal, setShowScheduleBlockModal] = useState(false);
  const [scheduleBlockInitialDate, setScheduleBlockInitialDate] = useState<Date | null>(null);
  const [editingScheduleBlock, setEditingScheduleBlock] = useState<ScheduleBlock | null>(null);

  // Current time indicator state
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  const isLoading = tasksLoading || habitsLoading || entriesLoading || eventsLoading || blocksLoading;

  // Get events for a specific day
  const getEventsForDay = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');

    // Tasks (including multi-day tasks that span this date)
    const dayTasks = tasks.filter(task => taskAppearsOnDate(task, date));

    // Separate all-day tasks (high priority or starred tasks are treated as all-day)
    const allDayTasks = dayTasks.filter(task =>
      task.priority === 'urgent' || task.starred || (task.estimated_time ?? 0) >= 240 // 4+ hours
    );
    const timedTasks = dayTasks.filter(task =>
      !(task.priority === 'urgent' || task.starred || (task.estimated_time ?? 0) >= 240)
    );

    // Calendar Events
    const dayEvents = calendarEvents.filter(event => {
      const eventStart = parseISO(event.start_date);
      const eventEnd = parseISO(event.end_date);
      return isSameDay(date, eventStart) || isSameDay(date, eventEnd) ||
             (date >= eventStart && date <= eventEnd);
    });

    const allDayEvents = dayEvents.filter(event => event.all_day);
    const timedEvents = dayEvents.filter(event => !event.all_day);

    // Habits
    const dayHabitCompletions = habitEntries.filter(entry => entry.date === dateKey);
    const completedHabits = habits.filter(habit =>
      dayHabitCompletions.some(entry => entry.habit_id === habit.id)
    );

    const dayScheduleBlocks = scheduleBlocks.filter(block => block.date === dateKey);

    return {
      tasks: timedTasks,
      allDayTasks,
      events: timedEvents,
      allDayEvents,
      habits: completedHabits,
      scheduleBlocks: dayScheduleBlocks,
    };
  };

  // Drag and drop handlers
  const handleDragStart = (task: Task, event?: React.DragEvent) => {
    setDraggedTask(task);
    if (event?.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', task.id as string);
    }
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
  };

  const handleDrop = (date: Date, e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!draggedTask) return;

    // Use the currentTarget - this is the element with the drop handler attached
    // which is the time slot cell with data-date and data-hour attributes
    const timeSlotElement = e.currentTarget as HTMLElement;
    const dataDate = timeSlotElement.getAttribute('data-date');
    const dataHour = timeSlotElement.getAttribute('data-hour');

    // Use the data-date directly to avoid timezone issues with parseISO
    const dateString = dataDate || format(date, 'yyyy-MM-dd');

    // Calculate exact time from drop position within the cell
    const rect = timeSlotElement.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    const cellHeight = rect.height; // Each cell is 64px (h-16)

    // Calculate minutes within the hour based on drop position
    const minutesInHour = Math.floor((offsetY / cellHeight) * 60);
    const roundedMinutes = Math.round(minutesInHour / 15) * 15;
    const clampedMinutes = Math.min(45, Math.max(0, roundedMinutes));

    // Get hour from data attribute
    const hour = dataHour !== null ? parseInt(dataHour, 10) : 9;
    const scheduledTime = `${hour.toString().padStart(2, '0')}:${clampedMinutes.toString().padStart(2, '0')}`;

    logger.debug('Calendar', 'Drop detected', {
      dataDate,
      dataHour,
      hour,
      scheduledTime,
      dateString
    });

    const scheduledStart = parseISO(`${dateString}T${scheduledTime}`);
    const scheduledEnd = addMinutes(scheduledStart, draggedTask.estimated_time || 30);

    const updates: Partial<Task> = {
      due_date: dateString,
      scheduled_start: scheduledStart.toISOString(),
      scheduled_end: scheduledEnd.toISOString(),
      status: 'scheduled' as const,
      sidebar_section: null,
    };

    const command = new ChangeTaskCategoryCommand(
      draggedTask.id as string,
      draggedTask.title,
      updates,
      draggedTask
    );

    void executeCommand(command);
    setDraggedTask(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move';
    }
  };

  const handleDropInUnscheduled = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggedTask) return;

    const updates: Partial<Task> = {
      due_date: null,
      scheduled_start: null,
      scheduled_end: null,
      sidebar_section: null,
    };

    const command = new ChangeTaskCategoryCommand(
      draggedTask.id as string,
      draggedTask.title,
      updates,
      draggedTask
    );
    void executeCommand(command);
    setDraggedTask(null);
  };

  const handleDropInCategory = (
    e: React.DragEvent,
    targetCategory: string
  ) => {
    e.preventDefault();
    e.stopPropagation();

    if (!draggedTask) return;

    const updates: Partial<Task> = {};

    switch (targetCategory) {
      case 'scheduled':
        updates.sidebar_section = 'scheduled';
        break;
      case 'todo':
        updates.sidebar_section = 'todo';
        updates.due_date = null;
        break;
      case 'inProgress':
        updates.sidebar_section = 'in_progress';
        updates.due_date = null;
        break;
      case 'backlog':
        updates.sidebar_section = 'backlog';
        updates.due_date = null;
        break;
    }

    if (Object.keys(updates).length > 0) {
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

  // Task modal handlers
  const handleTaskClick = (task: Task) => {
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

  const handleDeleteTask = (taskId: string) => {
    deleteTaskMutation.mutate(taskId, {
      onSuccess: () => {
        setShowEditModal(false);
        setEditingTask(null);
      },
    });
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingTask(null);
  };

  // Smart scheduling handler - schedules a task to a specific time slot
  const handleScheduleTask = (taskId: string, start: Date, end: Date) => {
    const dateStr = format(start, 'yyyy-MM-dd');
    updateTaskMutation.mutate({
      id: taskId,
      updates: {
        due_date: dateStr,
        scheduled_start: start.toISOString(),
        scheduled_end: end.toISOString(),
        status: 'scheduled',
      },
    });
  };

  // Event modal handlers
  const handleEventClick = (event: CalendarEvent) => {
    setEditingEvent(event);
    setEventModalInitialDate(null);
    setShowEventModal(true);
  };

  const handleNewEvent = (date?: Date) => {
    setEditingEvent(null);
    setEventModalInitialDate(date || null);
    setShowEventModal(true);
  };

  const handleSaveEvent = (eventId: string | null, eventData: Partial<CalendarEvent>) => {
    if (eventId) {
      updateEventMutation.mutate(
        { id: eventId, updates: eventData },
        {
          onSuccess: () => {
            setShowEventModal(false);
            setEditingEvent(null);
            setEventModalInitialDate(null);
          },
        }
      );
    } else {
      createEventMutation.mutate(
        eventData as Omit<CalendarEvent, 'id' | 'user_id' | 'created_at' | 'updated_at'>,
        {
          onSuccess: () => {
            setShowEventModal(false);
            setEditingEvent(null);
            setEventModalInitialDate(null);
          },
        }
      );
    }
  };

  const handleDeleteEvent = (eventId: string) => {
    deleteEventMutation.mutate(eventId, {
      onSuccess: () => {
        setShowEventModal(false);
        setEditingEvent(null);
        setEventModalInitialDate(null);
      },
    });
  };

  const handleCloseEventModal = () => {
    setShowEventModal(false);
    setEditingEvent(null);
    setEventModalInitialDate(null);
  };

  const handleEventDragStart = (event: CalendarEvent, e: React.DragEvent) => {
    setDraggedEvent(event);
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', event.id);
    }
  };

  const handleEventDragEnd = () => {
    setDraggedEvent(null);
  };

  // Quick schedule handlers
  const handleCellClick = (date: Date, e: React.MouseEvent) => {
    if (draggedTask || draggedEvent) return;

    const target = e.target as HTMLElement;
    if (target.closest('[draggable="true"]') || target.closest('button')) return;

    const cell = e.currentTarget as HTMLElement;
    const hourAttr = cell.getAttribute('data-hour');
    const dateWithTime = new Date(date);
    if (hourAttr) {
      const hour = Number(hourAttr);
      if (!Number.isNaN(hour)) {
        dateWithTime.setHours(hour, 0, 0, 0);
      }
    }

    setQuickScheduleDate(dateWithTime);
    setShowQuickSchedule(true);
  };

  const handleQuickScheduleTask = (taskId: string, date: Date) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const dateString = format(date, 'yyyy-MM-dd');
    const updates: Partial<Task> = {
      due_date: dateString,
      sidebar_section: null,
    };

    const command = new ChangeTaskCategoryCommand(
      taskId,
      task.title,
      updates,
      task
    );

    void executeCommand(command);
    setShowQuickSchedule(false);
  };

  const handleQuickCreateNew = (date: Date) => {
    setEventModalInitialDate(date);
    setEditingEvent(null);
    setShowEventModal(true);
    setShowQuickSchedule(false);
  };

  const handleQuickCreateBlock = (date: Date) => {
    setScheduleBlockInitialDate(date);
    setEditingScheduleBlock(null);
    setShowScheduleBlockModal(true);
  };

  const handleScheduleBlockClick = (block: ScheduleBlock) => {
    setEditingScheduleBlock(block);
    setScheduleBlockInitialDate(parseISO(`${block.date}T${block.start_time}`));
    setShowScheduleBlockModal(true);
  };

  const handleSaveScheduleBlock = (
    input: Omit<ScheduleBlock, 'id' | 'user_id' | 'created_at' | 'updated_at'>,
    id?: string
  ) => {
    if (id) {
      updateScheduleBlockMutation.mutate({ id, updates: input });
      return;
    }
    createScheduleBlockMutation.mutate(input);
  };

  const handleDeleteScheduleBlock = (id: string) => {
    deleteScheduleBlockMutation.mutate(id);
  };

  // Auto-scroll to current time on mount
  React.useEffect(() => {
    const currentHour = new Date().getHours();
    const timeSlotElement = document.getElementById(`time-slot-${currentHour}`);

    if (timeSlotElement) {
      setTimeout(() => {
        timeSlotElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }, 100);
    }
  }, [calendarState.view, calendarState.currentDate]);

  // Loading state
  if (isLoading) {
    return <CalendarLoadingState />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-white dark:bg-slate-900">
      {/* Left Sidebar */}
      <CalendarSidebar
        miniCalendarDate={calendarState.miniCalendarDate}
        miniCalendarDays={calendarState.miniCalendarDays}
        onMiniPrevious={calendarState.goToPreviousMonthMini}
        onMiniNext={calendarState.goToNextMonthMini}
        onDateSelect={calendarState.setCurrentDate}
        categorizedTasks={categorizedTasks}
        unscheduledTasks={unscheduledTasks}
        expandedSections={calendarState.expandedSections}
        onToggleSection={calendarState.toggleSection}
        draggedTask={draggedTask}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDropInUnscheduled={handleDropInUnscheduled}
        onDropInCategory={handleDropInCategory}
        onScheduleTask={handleScheduleTask}
      />

      {/* Main Calendar Area */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <CalendarHeader
            currentDate={calendarState.currentDate}
            view={calendarState.view}
            weekDays={calendarState.weekDays}
            onToday={calendarState.goToToday}
            onPrevious={
              calendarState.view === 'week'
                ? calendarState.goToPreviousWeek
                : calendarState.view === 'month'
                ? calendarState.goToPreviousMonth
                : calendarState.goToPreviousDay
            }
            onNext={
              calendarState.view === 'week'
                ? calendarState.goToNextWeek
                : calendarState.view === 'month'
                ? calendarState.goToNextMonth
                : calendarState.goToNextDay
            }
            onViewChange={calendarState.setView}
            onNewEvent={() => handleNewEvent()}
            onNewBlock={() => handleQuickCreateBlock(calendarState.currentDate)}
          />

          {/* Week View */}
          {calendarState.view === 'week' && (
            <div className="flex-1 overflow-auto">
              <div className="min-w-max">
                <WeekDayHeaders weekDays={calendarState.weekDays} />

                {/* All-day events section */}
                <div className="flex border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                  <div className="w-20 border-r border-slate-200 dark:border-slate-700 flex-shrink-0 px-2 py-2">
                    <span className="text-xs text-slate-500 dark:text-slate-400">All day</span>
                  </div>
                  {calendarState.weekDays.map((day, dayIndex) => {
                    const events = getEventsForDay(day.date);
                    const hasAllDayEvents = events.allDayTasks.length > 0 || events.allDayEvents.length > 0;

                    return (
                      <div
                        key={dayIndex}
                        data-date={format(day.date, 'yyyy-MM-dd')}
                        onClick={(e) => handleCellClick(day.date, e)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(day.date, e)}
                        className={`flex-1 min-w-[140px] max-w-[140px] border-r border-slate-200 dark:border-slate-700 last:border-r-0 p-1 overflow-hidden cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                          day.isToday ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''
                        }`}
                      >
                        {hasAllDayEvents && (
                          <div className="space-y-0.5">
                            {/* All-day tasks */}
                            {events.allDayTasks.map((task) => {
                              const spanInfo = getTaskSpanPosition(task, day.date);
                              const isMultiDay = isMultiDayTask(task);

                              return (
                                <div
                                  key={task.id}
                                  draggable
                                  onDragStart={(e) => { e.stopPropagation(); handleDragStart(task, e); }}
                                  onDragEnd={handleDragEnd}
                                  onClick={(e) => { e.stopPropagation(); handleTaskClick(task); }}
                                  className={`text-[10px] px-1.5 py-0.5 rounded text-white font-medium cursor-move hover:opacity-90 truncate ${
                                    task.priority === 'urgent' ? 'bg-red-500' :
                                    task.priority === 'high' ? 'bg-orange-500' :
                                    task.starred ? 'bg-yellow-500' : 'bg-indigo-500'
                                  } ${
                                    isMultiDay
                                      ? spanInfo.isFirst
                                        ? 'rounded-l rounded-r-none'
                                        : spanInfo.isLast
                                        ? 'rounded-r rounded-l-none'
                                        : 'rounded-none'
                                      : ''
                                  }`}
                                >
                                  {spanInfo.isFirst || !isMultiDay ? task.title : ''}
                                </div>
                              );
                            })}

                            {/* All-day events */}
                            {events.allDayEvents.map((event) => (
                              <div
                                key={event.id}
                                draggable
                                onDragStart={(e) => { e.stopPropagation(); handleEventDragStart(event, e); }}
                                onDragEnd={handleEventDragEnd}
                                onClick={(e) => { e.stopPropagation(); handleEventClick(event); }}
                                className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500 text-white font-medium cursor-move hover:opacity-90 truncate"
                              >
                                {event.title}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Time slots */}
                <div className="flex">
                  {/* Time labels */}
                  <div className="w-20 flex-shrink-0 relative">
                    {calendarState.timeSlots.map((slot) => (
                      <div
                        key={slot.hour}
                        id={`time-slot-${slot.hour}`}
                        className="h-16 border-b border-slate-200 dark:border-slate-700 px-2 py-1 text-xs text-slate-500 dark:text-slate-400"
                      >
                        {slot.label}
                      </div>
                    ))}

                    {/* Current time label indicator */}
                    {(() => {
                      const firstSlotHour = calendarState.timeSlots[0]?.hour ?? 6;
                      const currentHour = currentTime.getHours();
                      const currentMinute = currentTime.getMinutes();
                      const currentTimeTop = ((currentHour - firstSlotHour) * 64) + ((currentMinute / 60) * 64);
                      const timeLabel = format(currentTime, 'h:mm a');

                      if (currentTimeTop >= 0) {
                        return (
                          <div
                            className="absolute right-0 z-20 pointer-events-none transform -translate-y-1/2"
                            style={{ top: `${currentTimeTop}px` }}
                          >
                            <span className="text-[10px] font-semibold text-red-500 bg-white dark:bg-slate-900 px-1 rounded">
                              {timeLabel}
                            </span>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>

                  {/* Day columns */}
                  {calendarState.weekDays.map((day) => {
                    const events = getEventsForDay(day.date);

                    // Calculate current time indicator position (only for today)
                    const showCurrentTimeIndicator = isToday(day.date);
                    const currentHour = currentTime.getHours();
                    const currentMinute = currentTime.getMinutes();
                    // Each hour is 64px (h-16), starting from first time slot (6 AM = index 0)
                    const firstSlotHour = calendarState.timeSlots[0]?.hour ?? 6;
                    const currentTimeTop = ((currentHour - firstSlotHour) * 64) + ((currentMinute / 60) * 64);

                    return (
                      <div key={day.date.toISOString()} className="flex-1 min-w-[140px] max-w-[140px] border-r border-slate-200 dark:border-slate-700 last:border-r-0 relative overflow-visible">
                        {/* Current time indicator - red line showing "now" */}
                        {showCurrentTimeIndicator && currentTimeTop >= 0 && (
                          <div
                            className="absolute z-50 pointer-events-none"
                            style={{
                              top: `${currentTimeTop}px`,
                              left: 0,
                              right: 0,
                            }}
                          >
                            {/* Red line spanning full width */}
                            <div
                              style={{
                                position: 'absolute',
                                left: 0,
                                right: 0,
                                height: '2px',
                                backgroundColor: '#ef4444',
                                top: '50%',
                                transform: 'translateY(-50%)',
                              }}
                            />
                            {/* Red dot at the start */}
                            <div
                              style={{
                                position: 'absolute',
                                left: '-6px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                width: '12px',
                                height: '12px',
                                borderRadius: '50%',
                                backgroundColor: '#ef4444',
                                border: '2px solid white',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                              }}
                            />
                          </div>
                        )}

                        {calendarState.timeSlots.map((slot) => (
                          <div
                            key={slot.hour}
                            data-date={format(day.date, 'yyyy-MM-dd')}
                            data-hour={slot.hour}
                            onClick={(e) => handleCellClick(day.date, e)}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(day.date, e)}
                            className={`h-16 border-b border-slate-200 dark:border-slate-700 relative group cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                              day.isToday ? 'bg-blue-50/10 dark:bg-blue-900/5' : ''
                            }`}
                          >
                            {/* Schedule blocks */}
                            {events.scheduleBlocks
                              .filter(block => parseInt(block.start_time.split(':')[0], 10) === slot.hour)
                              .map((block) => {
                                const blockStart = parseISO(`${block.date}T${block.start_time}`);
                                const blockEnd = parseISO(`${block.date}T${block.end_time}`);
                                const durationMinutes = Math.max(1, Math.round((blockEnd.getTime() - blockStart.getTime()) / 60000));
                                const topOffset = (blockStart.getMinutes() / 60) * 64;
                                const blockHeight = Math.max(16, (durationMinutes / 60) * 64);
                                const blockLabel = block.title || `${block.type[0].toUpperCase()}${block.type.slice(1)}`;
                                const blockClass = scheduleBlockStyles[block.type] || 'bg-slate-200/70 text-slate-900';

                                return (
                                  <div
                                    key={block.id}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleScheduleBlockClick(block);
                                    }}
                                    style={{
                                      top: `${topOffset}px`,
                                      height: `${blockHeight}px`,
                                      left: '2px',
                                      right: '2px',
                                      maxWidth: 'calc(100% - 4px)',
                                    }}
                                    className={`absolute px-1.5 py-0.5 rounded-sm text-[10px] font-medium z-0 overflow-hidden cursor-pointer ${blockClass}`}
                                    title={blockLabel}
                                  >
                                    {blockLabel}
                                  </div>
                                );
                              })}

                            {/* Timed tasks */}
                            {events.tasks
                              .filter(task => {
                                if (!task.scheduled_start) return false;
                                const taskStart = parseISO(task.scheduled_start);
                                return taskStart.getHours() === slot.hour;
                              })
                              .map((task) => {
                                const taskStart = parseISO(task.scheduled_start as string);
                                const taskMinutes = taskStart.getMinutes();
                                const topOffset = (taskMinutes / 60) * 64; // 64px = h-16 cell height

                                const durationMinutes = task.estimated_time || 30;
                                const taskHeight = Math.max(24, (durationMinutes / 60) * 64); // Minimum 24px
                                const taskTimeLabel = format(taskStart, 'HH:mm');

                                return (
                                  <div
                                    key={task.id}
                                    draggable
                                    onDragStart={(e) => { e.stopPropagation(); handleDragStart(task, e); }}
                                    onDragEnd={handleDragEnd}
                                    onClick={(e) => { e.stopPropagation(); handleTaskClick(task); }}
                                    style={{
                                      top: `${topOffset}px`,
                                      height: `${taskHeight}px`,
                                      left: '2px',
                                      right: '2px',
                                      maxWidth: 'calc(100% - 4px)',
                                    }}
                                    className="absolute px-1.5 py-0.5 rounded-sm bg-blue-500 dark:bg-blue-600 cursor-pointer hover:bg-blue-600 dark:hover:bg-blue-500 transition-colors z-10 overflow-hidden"
                                  >
                                    <p className="text-[11px] font-medium text-white leading-tight truncate whitespace-nowrap overflow-hidden text-ellipsis">
                                      {task.title}
                                    </p>
                                    {taskHeight >= 32 && (
                                      <p className="text-[10px] text-blue-100 truncate whitespace-nowrap overflow-hidden">
                                        {taskTimeLabel}
                                      </p>
                                    )}
                                  </div>
                                );
                              })}

                            {/* Timed events */}
                            {events.events
                              .filter(event => {
                                const eventStart = parseISO(event.start_date);
                                return eventStart.getHours() === slot.hour;
                              })
                              .map((event) => (
                                <EventCard
                                  key={event.id}
                                  event={event}
                                  onClick={() => handleEventClick(event)}
                                  onDragStart={handleEventDragStart}
                                  onDragEnd={handleEventDragEnd}
                                />
                              ))}

                            {/* Habits */}
                            {events.habits.length > 0 && slot.hour === 8 && (
                              <div className="absolute inset-x-1 bottom-1 flex gap-0.5 justify-center">
                                {events.habits.map((habit) => (
                                  <div
                                    key={habit.id}
                                    className="w-1.5 h-1.5 rounded-full bg-green-500"
                                    title={habit.name}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Month View */}
          {calendarState.view === 'month' && (
            <MonthView
              currentDate={calendarState.currentDate}
              tasks={tasks}
              events={calendarEvents}
              onDateClick={(date) => {
                calendarState.setCurrentDate(date);
                calendarState.setView('day');
              }}
              onTaskClick={handleTaskClick}
              onEventClick={handleEventClick}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            />
          )}

          {/* Day View */}
          {calendarState.view === 'day' && (
            <DayView
              date={calendarState.currentDate}
              tasks={tasks}
              events={calendarEvents}
              scheduleBlocks={scheduleBlocks}
              currentTime={currentTime}
              onTaskClick={handleTaskClick}
              onEventClick={handleEventClick}
              onScheduleBlockClick={handleScheduleBlockClick}
              onCellClick={(date, hour) => {
                const newDate = new Date(date);
                newDate.setHours(hour, 0, 0, 0);
                setEventModalInitialDate(newDate);
                setShowEventModal(true);
              }}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onEventDragStart={handleEventDragStart}
              onEventDragEnd={handleEventDragEnd}
            />
          )}
        </div>
      </div>

      {/* Modals */}
      <TaskEditModal
        task={editingTask}
        projects={projects.map(p => ({
          id: p.id,
          name: p.name,
          description: p.description,
          color: p.color,
          status: p.status,
          icon: p.icon,
          created_at: p.created_at,
          updated_at: p.updated_at,
        }))}
        isOpen={showEditModal}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
        onClose={handleCloseEditModal}
      />

      <EventModal
        event={editingEvent}
        isOpen={showEventModal}
        initialDate={eventModalInitialDate}
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
        onClose={handleCloseEventModal}
      />

      <QuickScheduleModal
        isOpen={showQuickSchedule}
        selectedDate={quickScheduleDate}
        unscheduledTasks={unscheduledTasks}
        onScheduleTask={handleQuickScheduleTask}
        onCreateNew={handleQuickCreateNew}
        onCreateBlock={handleQuickCreateBlock}
        onClose={() => setShowQuickSchedule(false)}
      />

      <ScheduleBlockModal
        isOpen={showScheduleBlockModal}
        onClose={() => setShowScheduleBlockModal(false)}
        initialStart={scheduleBlockInitialDate}
        block={editingScheduleBlock}
        onSave={handleSaveScheduleBlock}
        onDelete={handleDeleteScheduleBlock}
      />
    </div>
  );
};

export default Calendar;
