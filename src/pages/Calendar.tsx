/**
 * Calendar Component - Google Calendar Style Week View
 * Refactored to use extracted hooks and components
 */

import React, { useState, useMemo } from 'react';
import { format, parseISO, isSameDay, addDays } from 'date-fns';
import { CheckCircle2, Target, GripVertical } from 'lucide-react';

// Hooks
import { useTasks, useUpdateTask, useDeleteTask } from '../hooks/useTasksQuery';
import { useHabits, useHabitEntries } from '../hooks/useHabitsQuery';
import { useCalendarEvents, useCreateCalendarEvent, useUpdateCalendarEvent, useDeleteCalendarEvent } from '../hooks/useCalendarQuery';
import { useCalendarState } from '../calendar/hooks/useCalendarState';
import { useCalendarTasks } from '../calendar/hooks/useCalendarTasks';
import { isMultiDayTask, getTaskSpanDays, taskAppearsOnDate, getTaskSpanPosition } from '../calendar/hooks';
import { useUndoRedo } from '../contexts/UndoRedoContext';
import { useProjectsQuery } from '../projects/hooks/useProjectsQuery';

// Components
import { CalendarHeader } from '../calendar/components/CalendarHeader';
import { CalendarSidebar } from '../calendar/components/CalendarSidebar';
import { TaskEditModal } from '../scheduler/components/TaskEditModal';
import { EventModal } from '../components/calendar/EventModal';
import { EventCard } from '../components/calendar/EventCard';
import { QuickScheduleModal } from '../components/calendar/QuickScheduleModal';
import { CalendarLoadingState } from '../calendar/components/layout/CalendarLoadingState';
import { WeekDayHeaders } from '../calendar/components/layout/WeekDayHeaders';
import { MonthViewPlaceholder } from '../calendar/components/layout/MonthViewPlaceholder';
import { DayViewPlaceholder } from '../calendar/components/layout/DayViewPlaceholder';

// Types
import type { Task } from '../lib/supabase';
import type { Habit } from '../types';
import type { CalendarEvent } from '../services/types';
import type { ScheduledTask } from '../scheduler/types';

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

  // Hooks
  const calendarState = useCalendarState();
  const { categorizedTasks, unscheduledTasks } = useCalendarTasks(tasks);
  const { executeCommand } = useUndoRedo();

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

  const isLoading = tasksLoading || habitsLoading || entriesLoading || eventsLoading;

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

    return { tasks: timedTasks, allDayTasks, events: timedEvents, allDayEvents, habits: completedHabits };
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

    const target = e.currentTarget as HTMLElement;
    const dataDate = target.getAttribute('data-date');
    const finalDate = dataDate ? parseISO(dataDate) : date;

    if (!draggedTask) return;

    const dateString = format(finalDate, 'yyyy-MM-dd');
    const updates: Partial<Task> = {
      due_date: dateString,
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
  const handleScheduleTask = (taskId: string, start: Date, _end: Date) => {
    const dateStr = format(start, 'yyyy-MM-dd');
    updateTaskMutation.mutate({
      id: taskId,
      updates: {
        due_date: dateStr,
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

    setQuickScheduleDate(date);
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
                  <div className="w-20 flex-shrink-0">
                    {calendarState.timeSlots.map((slot) => (
                      <div
                        key={slot.hour}
                        id={`time-slot-${slot.hour}`}
                        className="h-16 border-b border-slate-200 dark:border-slate-700 px-2 py-1 text-xs text-slate-500 dark:text-slate-400"
                      >
                        {slot.label}
                      </div>
                    ))}
                  </div>

                  {/* Day columns */}
                  {calendarState.weekDays.map((day) => {
                    const events = getEventsForDay(day.date);

                    return (
                      <div key={day.date.toISOString()} className="flex-1 min-w-[140px] max-w-[140px] border-r border-slate-200 dark:border-slate-700 last:border-r-0">
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
                            {/* Timed tasks */}
                            {events.tasks
                              .filter(task => {
                                // Simple time check - show in hour slot if task has no specific time
                                return slot.hour === 9; // Default to 9 AM for tasks without time
                              })
                              .map((task) => (
                                <div
                                  key={task.id}
                                  draggable
                                  onDragStart={(e) => { e.stopPropagation(); handleDragStart(task, e); }}
                                  onDragEnd={handleDragEnd}
                                  onClick={(e) => { e.stopPropagation(); handleTaskClick(task); }}
                                  className="absolute inset-x-1 top-1 p-1.5 rounded shadow-sm bg-indigo-100 dark:bg-indigo-900/30 border-l-2 border-indigo-500 cursor-move hover:shadow-md transition-shadow z-10"
                                >
                                  <div className="flex items-start gap-1">
                                    <GripVertical className="w-3 h-3 text-indigo-500 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-[10px] font-medium text-indigo-900 dark:text-indigo-100 truncate">
                                        {task.title}
                                      </p>
                                      {task.estimated_time && (
                                        <p className="text-[9px] text-indigo-600 dark:text-indigo-300">
                                          {Math.round(task.estimated_time / 60)}h
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}

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
          {calendarState.view === 'month' && <MonthViewPlaceholder />}

          {/* Day View */}
          {calendarState.view === 'day' && <DayViewPlaceholder />}
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
          created_at: p.createdAt.toISOString(),
          updated_at: p.updatedAt?.toISOString(),
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
        onClose={() => setShowQuickSchedule(false)}
      />
    </div>
  );
};

export default Calendar;
