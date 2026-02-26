/**
 * Calendar Page - Simple view matching calendar-design-spec.html
 * Mobile-first design with month/week/day views
 */

import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths, addDays, subDays, startOfWeek, endOfWeek, addWeeks, subWeeks } from 'date-fns';
import { useTasks, useUpdateTask } from '@/hooks/useTasksQuery';
import { useCalendarEvents, useUpdateCalendarEvent } from '@/hooks/useCalendarQuery';
import { AddEventModal } from '@/calendar/components/AddEventModal';
import { useThemeColors } from '@/hooks/useThemeColors';
import { FeatureErrorBoundary } from '@/components/FeatureErrorBoundary';
import { useUndoRedo } from '@/contexts/UndoRedoContext';
import { useCalendarDragDrop } from '@/calendar/hooks/useCalendarDragDrop';
import type { CalendarEvent } from '@/services/types';
import type { Task } from '@/lib/supabase';

type ViewType = 'month' | 'week' | 'day';

// Helper function to get event colors based on type
const getEventColors = (type: 'event' | 'meeting' | 'reminder' | 'birthday' | 'holiday') => {
  const colorMap = {
    event: { bg: '#E0E7FF', border: '#4F46E5' }, // Indigo
    meeting: { bg: '#DBEAFE', border: '#3B82F6' }, // Blue
    reminder: { bg: '#FEF3C7', border: '#F59E0B' }, // Amber
    birthday: { bg: '#FCE7F3', border: '#EC4899' }, // Pink
    holiday: { bg: '#D1FAE5', border: '#10B981' }, // Green
  };
  return colorMap[type] || colorMap.event;
};

// Helper function to filter events for a specific hour
const filterEventsForHour = (events: CalendarEvent[], hour: number): CalendarEvent[] => {
  return events.filter(e => {
    if (e.all_day) return false; // All-day events shown separately
    let eventHour: number;
    if (e.start_time) {
      eventHour = parseInt(e.start_time.split(':')[0], 10);
    } else {
      const dateStr = e.start_date.replace('Z', '');
      const localDate = new Date(dateStr);
      eventHour = localDate.getHours();
    }
    return eventHour === hour;
  });
};

// Helper function to filter tasks for a specific hour
const filterTasksForHour = (tasks: any[], hour: number): any[] => {
  return tasks.filter(t => {
    if (!t.due_date) return false;
    const taskHour = new Date(t.due_date).getHours();
    return taskHour === hour;
  });
};

// Helper function to format event time properly
const formatEventTime = (event: { start_date: string; start_time?: string | null; end_date?: string; end_time?: string | null }, showEndTime = false) => {
  // Use start_time if available, otherwise parse start_date
  let timeStr: string;
  if (event.start_time) {
    const [hours, minutes] = event.start_time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;
    timeStr = `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
  } else {
    timeStr = format(new Date(event.start_date.replace('Z', '')), 'h:mm a');
  }

  if (showEndTime && event.end_date) {
    if (event.end_time) {
      const [hours, minutes] = event.end_time.split(':').map(Number);
      const period = hours >= 12 ? 'PM' : 'AM';
      const hour12 = hours % 12 || 12;
      timeStr += ` - ${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
    } else {
      timeStr += ` - ${format(new Date(event.end_date.replace('Z', '')), 'h:mm a')}`;
    }
  }

  return timeStr;
};

const CalendarContent = () => {
  const colors = useThemeColors();
  const [currentDate, setCurrentDate] = useState(new Date());

  // Persist view to localStorage, default to 'day'
  const [currentView, setCurrentView] = useState<ViewType>(() => {
    const saved = localStorage.getItem('calendar_view');
    return (saved as ViewType) || 'day';
  });

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDateTime, setSelectedDateTime] = useState<Date | undefined>(undefined);

  // Save view to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('calendar_view', currentView);
  }, [currentView]);

  // Data fetching
  const { data: tasks = [], isLoading: tasksLoading } = useTasks();
  const { data: calendarEvents = [], isLoading: eventsLoading } = useCalendarEvents();

  // Mutations for drag-and-drop
  const updateTaskMutation = useUpdateTask();
  const updateEventMutation = useUpdateCalendarEvent();
  const { executeCommand } = useUndoRedo();

  const isLoading = tasksLoading || eventsLoading;

  // Drag and drop support
  const {
    draggedTask,
    handleDragStart,
    handleDragEnd,
    handleDrop,
    handleDragOver,
  } = useCalendarDragDrop({
    updateTaskMutation,
    updateEventMutation,
    executeCommand,
  });

  // Navigation handlers
  const handlePrevious = () => {
    if (currentView === 'month') {
      setCurrentDate(subMonths(currentDate, 1));
    } else if (currentView === 'week') {
      setCurrentDate(subWeeks(currentDate, 1));
    } else if (currentView === 'day') {
      setCurrentDate(subDays(currentDate, 1));
    }
  };

  const handleNext = () => {
    if (currentView === 'month') {
      setCurrentDate(addMonths(currentDate, 1));
    } else if (currentView === 'week') {
      setCurrentDate(addWeeks(currentDate, 1));
    } else if (currentView === 'day') {
      setCurrentDate(addDays(currentDate, 1));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Handle clicking on a time slot to create event
  const handleTimeSlotClick = (date: Date, hour: number) => {
    const newDateTime = new Date(date);
    newDateTime.setHours(hour, 0, 0, 0);
    setSelectedDateTime(newDateTime);
    setShowAddModal(true);
  };

  // Generate month grid
  const generateMonthDays = () => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    const days = eachDayOfInterval({ start, end });

    // Pad with previous/next month days to fill grid
    const startDay = start.getDay(); // 0 = Sunday
    const paddedDays = [];

    // Add previous month days
    for (let i = startDay - 1; i >= 0; i--) {
      paddedDays.push(subDays(start, i + 1));
    }

    // Add current month days
    paddedDays.push(...days);

    // Add next month days to complete last week
    const remaining = 7 - (paddedDays.length % 7);
    if (remaining < 7) {
      for (let i = 1; i <= remaining; i++) {
        paddedDays.push(addDays(end, i));
      }
    }

    return paddedDays;
  };

  const monthDays = generateMonthDays();

  // Generate week days
  const generateWeekDays = () => {
    const start = startOfWeek(currentDate, { weekStartsOn: 0 }); // Start on Sunday
    const end = endOfWeek(currentDate, { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  };

  const weekDays = generateWeekDays();

  // Get events/tasks for a specific day
  const getEventsForDay = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');

    const dayTasks = tasks.filter(t => {
      if (!t.due_date || t.status === 'done') return false;

      // Extract date string directly to avoid timezone issues
      // If due_date is "2026-02-25" or "2026-02-25T10:00:00Z", we want "2026-02-25"
      const taskDateStr = t.due_date.split('T')[0];

      return taskDateStr === dateStr;
    });

    const dayEvents = calendarEvents.filter(e => {
      const eventDate = e.start_date.split('T')[0];
      return eventDate === dateStr;
    });

    return { tasks: dayTasks, events: dayEvents };
  };

  // Format current date display
  const getDateDisplay = () => {
    if (currentView === 'month') {
      return format(currentDate, 'MMMM yyyy');
    } else if (currentView === 'week') {
      const start = startOfWeek(currentDate, { weekStartsOn: 0 });
      const end = endOfWeek(currentDate, { weekStartsOn: 0 });
      return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
    } else if (currentView === 'day') {
      return format(currentDate, 'EEEE, MMM d');
    }
    return format(currentDate, 'MMMM yyyy');
  };

  // Generate day view hours (full 24 hours)
  const generateDayHours = () => {
    const hours = [];
    for (let i = 0; i <= 23; i++) {
      let hour12 = i % 12;
      if (hour12 === 0) hour12 = 12; // Convert 0 to 12 for midnight/noon
      const period = i < 12 ? 'AM' : 'PM';
      hours.push({ hour: i, label: `${hour12} ${period}` });
    }
    return hours;
  };

  return (
    <div style={{ backgroundColor: colors.bg.primary, minHeight: '100vh' }}>
      {/* Centered container following CLAUDE.md pattern */}
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1.5rem', paddingBottom: '5rem' }}>
        {/* Header with terracotta gradient */}
        <div
          className="px-5 py-4 -mx-6 -mt-6"
          style={{
            background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)',
          }}
        >
        {/* Title and View Toggle */}
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-2xl font-bold text-white">📅 Calendar</h1>

          {/* View Toggle */}
          <div
            className="flex gap-1 p-1 rounded-lg"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
          >
            {(['month', 'week', 'day'] as const).map((view) => (
              <button
                key={view}
                onClick={() => setCurrentView(view)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  currentView === view ? 'bg-white' : ''
                }`}
                style={{
                  color: currentView === view ? '#D4A574' : 'white',
                }}
                aria-label={`View ${view}`}
              >
                {view.charAt(0).toUpperCase() + view.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Navigation Row */}
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={handlePrevious}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
            aria-label="Previous"
          >
            <span className="text-white text-lg">‹</span>
          </button>

          <div className="text-white text-base font-semibold">{getDateDisplay()}</div>

          <button
            onClick={handleNext}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
            aria-label="Next"
          >
            <span className="text-white text-lg">›</span>
          </button>
        </div>

        {/* Today Button */}
        <div className="flex justify-center">
          <button
            onClick={handleToday}
            className="px-4 py-2 rounded-lg font-semibold text-sm transition-colors"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', color: 'white' }}
            aria-label="Go to today"
          >
            Today
          </button>
        </div>
      </div>

      {/* Weekday Headers */}
      {currentView === 'month' && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            backgroundColor: colors.bg.white,
            borderBottom: `1px solid ${colors.border.light}`,
          }}
        >
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div
              key={day}
              style={{
                padding: '12px 4px',
                textAlign: 'center',
                fontSize: '11px',
                fontWeight: 600,
                color: colors.text.secondary,
                textTransform: 'uppercase',
              }}
            >
              {day}
            </div>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="pb-32">
        {/* Loading Skeleton */}
        {isLoading ? (
          <div className="space-y-3 animate-pulse">
            {currentView === 'month' && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, 1fr)',
                  gap: '1px',
                  padding: '1px',
                  backgroundColor: colors.border.light,
                }}
              >
                {Array.from({ length: 35 }).map((_, i) => (
                  <div
                    key={i}
                    style={{
                      backgroundColor: colors.bg.white,
                      minHeight: '70px',
                      padding: '4px',
                    }}
                  >
                    <div
                      className="h-6 w-6 mx-auto rounded-full"
                      style={{ backgroundColor: colors.border.medium }}
                    />
                  </div>
                ))}
              </div>
            )}
            {(currentView === 'week' || currentView === 'day') && (
              <div style={{ backgroundColor: colors.bg.white }}>
                {Array.from({ length: 12 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex border-b min-h-[60px]"
                    style={{ borderColor: colors.border.light }}
                  >
                    <div
                      className="w-16 p-2"
                      style={{ backgroundColor: colors.border.medium }}
                    />
                    <div className="flex-1 p-2">
                      <div
                        className="h-8 rounded"
                        style={{ backgroundColor: colors.border.medium, width: '80%' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Month View */}
            {currentView === 'month' && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, 1fr)',
                  gap: '1px',
                  padding: '1px',
                  backgroundColor: colors.border.light,
                }}
              >
            {monthDays.map((day, index) => {
              const { tasks: dayTasks, events: dayEvents } = getEventsForDay(day);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isTodayDate = isToday(day);

              // Check if this day is a valid drop target
              const isDropTarget = draggedTask && isCurrentMonth;

              return (
                <div
                  key={index}
                  style={{
                    backgroundColor: isTodayDate ? '#FEF3E8' : isCurrentMonth ? colors.bg.white : colors.bg.secondary,
                    opacity: isCurrentMonth ? 1 : 0.5,
                    minHeight: '70px',
                    padding: '4px',
                    position: 'relative',
                    border: isDropTarget ? '2px dashed #D4A574' : 'none',
                    cursor: isDropTarget ? 'pointer' : 'default',
                  }}
                  onDrop={(e) => handleDrop(day, e)}
                  onDragOver={handleDragOver}
                >
                  {/* Day Number */}
                  <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '4px', textAlign: 'center' }}>
                    {isTodayDate ? (
                      <div
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          margin: '0 auto',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: colors.accent.end,
                          color: 'white',
                        }}
                      >
                        {format(day, 'd')}
                      </div>
                    ) : (
                      <span style={{ color: isCurrentMonth ? colors.text.primary : colors.text.tertiary }}>
                        {format(day, 'd')}
                      </span>
                    )}
                  </div>

                  {/* Event Dots */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px', justifyContent: 'center' }}>
                    {/* Events - Terracotta */}
                    {dayEvents.slice(0, 3).map((_, idx) => (
                      <div
                        key={`event-${idx}`}
                        style={{
                          borderRadius: '50%',
                          backgroundColor: colors.accent.end,
                          width: '4px',
                          height: '4px',
                          display: 'inline-block',
                        }}
                      />
                    ))}
                    {/* Tasks - Blue */}
                    {dayTasks.slice(0, 3).map((_, idx) => (
                      <div
                        key={`task-${idx}`}
                        style={{
                          borderRadius: '50%',
                          backgroundColor: '#3B82F6',
                          width: '4px',
                          height: '4px',
                          display: 'inline-block',
                        }}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

            {/* Day View */}
            {currentView === 'day' && (
              <div style={{ backgroundColor: colors.bg.white }}>
                {/* All-day Events & Tasks Section */}
                {(() => {
                  const { events: dayEvents, tasks: dayTasks } = getEventsForDay(currentDate);
                  const allDayEvents = dayEvents.filter(e => e.all_day);
                  // Tasks without specific times (hour is 0/midnight in local time)
                  const allDayTasks = dayTasks.filter(t => {
                    if (!t.due_date) return false;
                    const taskDate = new Date(t.due_date);
                    const taskHour = taskDate.getHours();
                    const taskMinute = taskDate.getMinutes();
                    // Consider it all-day if it's exactly midnight (00:00)
                    return taskHour === 0 && taskMinute === 0;
                  });

                  return (allDayEvents.length > 0 || allDayTasks.length > 0) ? (
                    <div
                      className="border-b p-3"
                      style={{ borderColor: colors.border.light, backgroundColor: colors.bg.secondary }}
                    >
                      <div className="text-xs font-semibold mb-2" style={{ color: colors.text.secondary }}>
                        ALL DAY
                      </div>
                      <div className="space-y-2">
                        {/* All-day Events */}
                        {allDayEvents.map((event, idx) => {
                          const eventColors = getEventColors(event.type);
                          return (
                            <div
                              key={`allday-${event.id || idx}`}
                              style={{
                                backgroundColor: eventColors.bg,
                                borderLeft: `3px solid ${eventColors.border}`,
                                padding: '6px 8px',
                                borderRadius: '4px',
                                fontSize: '12px',
                              }}
                            >
                              <div style={{ fontWeight: 600, color: colors.text.primary }}>
                                {event.title}
                              </div>
                              {event.location && (
                                <div style={{ color: colors.text.secondary, fontSize: '11px', marginTop: '2px' }}>
                                  📍 {event.location}
                                </div>
                              )}
                            </div>
                          );
                        })}
                        {/* All-day Tasks */}
                        {allDayTasks.map((task, idx) => {
                          const isDragging = draggedTask?.id === task.id;
                          return (
                            <div
                              key={`allday-task-${task.id || idx}`}
                              draggable="true"
                              onDragStart={(e) => handleDragStart(task as Task, e)}
                              onDragEnd={handleDragEnd}
                              style={{
                                backgroundColor: '#DBEAFE',
                                borderLeft: '3px solid #3B82F6',
                                padding: '6px 8px',
                                borderRadius: '4px',
                                fontSize: '12px',
                                cursor: 'grab',
                                opacity: isDragging ? 0.4 : 1,
                              }}
                            >
                              <div style={{ fontWeight: 600, color: colors.text.primary }}>
                                ✓ {task.title}
                              </div>
                              {task.priority && task.priority !== 'medium' && (
                                <div style={{ color: colors.text.secondary, fontSize: '11px', marginTop: '2px' }}>
                                  {task.priority === 'high' ? '🔴 High' : task.priority === 'low' ? '🟢 Low' : ''}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                </div>
              ) : null;
            })()}

                {/* Hourly Schedule */}
                {generateDayHours().map(({ hour, label }) => {
                  const { tasks: dayTasks, events: dayEvents } = getEventsForDay(currentDate);

                  // Use helper functions to filter events and tasks
                  const timeSlotEvents = filterEventsForHour(dayEvents, hour);
                  const timeSlotTasks = filterTasksForHour(dayTasks, hour);

                  return (
                    <div
                      key={hour}
                      className="flex border-b min-h-[60px]"
                      style={{ borderColor: colors.border.light }}
                    >
                      {/* Hour Label */}
                      <div
                        className="w-16 p-2 text-xs border-r flex-shrink-0"
                        style={{ color: colors.text.secondary, borderColor: colors.border.light }}
                      >
                        {label}
                      </div>

                      {/* Hour Content */}
                      <div
                        className="flex-1 p-1 relative cursor-pointer transition-colors"
                        style={{
                          backgroundColor: colors.bg.white,
                          border: draggedTask ? '1px dashed #D4A574' : 'none',
                        }}
                        onClick={() => handleTimeSlotClick(currentDate, hour)}
                        title="Click to create event"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = colors.bg.secondary;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = colors.bg.white;
                        }}
                        onDrop={(e) => {
                          e.stopPropagation();
                          const dropDate = new Date(currentDate);
                          dropDate.setHours(hour, 0, 0, 0);
                          handleDrop(dropDate, e);
                        }}
                        onDragOver={(e) => {
                          e.stopPropagation();
                          handleDragOver(e);
                        }}
                      >
                        {/* Events */}
                        {timeSlotEvents.map((event, idx) => {
                          const eventColors = getEventColors(event.type);
                          return (
                            <div
                              key={`event-${event.id || idx}`}
                              style={{
                                backgroundColor: eventColors.bg,
                                borderLeft: `3px solid ${eventColors.border}`,
                                padding: '4px',
                                margin: '2px',
                                borderRadius: '4px',
                                fontSize: '11px',
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div style={{ fontWeight: 600, color: colors.text.primary }}>
                                {formatEventTime(event, true)}
                              </div>
                              <div style={{ color: colors.text.primary }}>{event.title}</div>
                              {event.location && (
                                <div style={{ color: colors.text.secondary, fontSize: '10px', marginTop: '2px' }}>
                                  📍 {event.location}
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {/* Tasks */}
                        {timeSlotTasks.map((task, idx) => {
                          const isDragging = draggedTask?.id === task.id;
                          return (
                            <div
                              key={`task-${task.id || idx}`}
                              draggable="true"
                              onDragStart={(e) => {
                                e.stopPropagation();
                                handleDragStart(task as Task, e);
                              }}
                              onDragEnd={handleDragEnd}
                              style={{
                                backgroundColor: '#DBEAFE',
                                borderLeft: '3px solid #3B82F6',
                                padding: '4px',
                                margin: '2px',
                                borderRadius: '4px',
                                fontSize: '11px',
                                cursor: 'grab',
                                opacity: isDragging ? 0.4 : 1,
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div style={{ fontWeight: 600, color: colors.text.primary }}>
                                {format(new Date(task.due_date!), 'h:mm a')}
                              </div>
                              <div style={{ color: colors.text.primary }}>{task.title}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Week View */}
            {currentView === 'week' && (
              <div>
                {/* All-day Events & Tasks Section */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '60px repeat(7, 1fr)',
                    backgroundColor: colors.bg.secondary,
                    borderBottom: `1px solid ${colors.border.light}`,
                    minHeight: '40px',
                  }}
                >
                  <div
                    style={{
                      padding: '8px',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: colors.text.secondary,
                      borderRight: `1px solid ${colors.border.light}`,
                    }}
                  >
                    ALL DAY
                  </div>
                  {weekDays.map((day) => {
                    const { events: dayEvents, tasks: dayTasks } = getEventsForDay(day);
                    const allDayEvents = dayEvents.filter(e => e.all_day);
                    // Tasks without specific times (exactly midnight in local time)
                    const allDayTasks = dayTasks.filter(t => {
                      if (!t.due_date) return false;
                      const taskDate = new Date(t.due_date);
                      const taskHour = taskDate.getHours();
                      const taskMinute = taskDate.getMinutes();
                      return taskHour === 0 && taskMinute === 0;
                    });

                    return (
                      <div
                        key={`allday-${day.toString()}`}
                        style={{
                          borderRight: `1px solid ${colors.border.light}`,
                          padding: '4px',
                          backgroundColor: isToday(day) ? '#FEF3E8' : colors.bg.secondary,
                        }}
                      >
                    {/* All-day Events */}
                    {allDayEvents.map((event, idx) => {
                      const eventColors = getEventColors(event.type);
                      return (
                        <div
                          key={`allday-event-${event.id || idx}`}
                          style={{
                            backgroundColor: eventColors.bg,
                            borderLeft: `3px solid ${eventColors.border}`,
                            padding: '4px',
                            margin: '2px',
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontWeight: 600,
                          }}
                        >
                          {event.title}
                        </div>
                      );
                    })}
                    {/* All-day Tasks */}
                    {allDayTasks.map((task, idx) => (
                      <div
                        key={`allday-task-${task.id || idx}`}
                        style={{
                          backgroundColor: '#DBEAFE',
                          borderLeft: '3px solid #3B82F6',
                          padding: '4px',
                          margin: '2px',
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontWeight: 600,
                        }}
                      >
                        ✓ {task.title}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>

                {/* Week day headers */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '60px repeat(7, 1fr)',
                    backgroundColor: colors.bg.white,
                    borderBottom: `1px solid ${colors.border.light}`,
                  }}
                >
                  <div style={{ width: '60px' }}></div>
                  {weekDays.map((day) => (
                    <div
                      key={day.toString()}
                      style={{
                        padding: '12px 4px',
                        textAlign: 'center',
                        borderRight: `1px solid ${colors.border.light}`,
                      }}
                    >
                      <div style={{ fontSize: '11px', fontWeight: 600, color: colors.text.secondary, textTransform: 'uppercase' }}>
                        {format(day, 'EEE')}
                      </div>
                      <div
                        style={{
                          fontSize: '14px',
                          fontWeight: isToday(day) ? 700 : 600,
                          color: isToday(day) ? colors.accent.end : colors.text.primary,
                          marginTop: '4px',
                        }}
                      >
                        {format(day, 'd')}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Week grid with hours */}
                <div style={{ backgroundColor: colors.bg.white }}>
                  {generateDayHours().map(({ hour, label }) => (
                    <div
                      key={hour}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '60px repeat(7, 1fr)',
                        borderBottom: `1px solid ${colors.border.light}`,
                        minHeight: '60px',
                      }}
                    >
                      {/* Hour Label */}
                      <div
                        style={{
                          padding: '8px',
                          fontSize: '12px',
                          color: colors.text.secondary,
                          borderRight: `1px solid ${colors.border.light}`,
                        }}
                      >
                        {label}
                      </div>

                      {/* Day columns */}
                      {weekDays.map((day) => {
                        const { tasks: dayTasks, events: dayEvents } = getEventsForDay(day);

                        // Use helper functions to filter events and tasks
                        const timeSlotEvents = filterEventsForHour(dayEvents, hour);
                        const timeSlotTasks = filterTasksForHour(dayTasks, hour);

                        return (
                          <div
                            key={day.toString()}
                            className="cursor-pointer transition-colors"
                            style={{
                              borderRight: `1px solid ${colors.border.light}`,
                              padding: '4px',
                              position: 'relative',
                              backgroundColor: isToday(day) ? '#FEF3E8' : colors.bg.white,
                            }}
                            onClick={() => handleTimeSlotClick(day, hour)}
                            title="Click to create event"
                            onMouseEnter={(e) => {
                              if (!isToday(day)) {
                                e.currentTarget.style.backgroundColor = colors.bg.secondary;
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isToday(day)) {
                                e.currentTarget.style.backgroundColor = colors.bg.white;
                              }
                            }}
                          >
                            {/* Events */}
                            {timeSlotEvents.map((event, idx) => {
                              const eventColors = getEventColors(event.type);
                              return (
                                <div
                                  key={`event-${event.id || idx}`}
                                  style={{
                                    backgroundColor: eventColors.bg,
                                    borderLeft: `3px solid ${eventColors.border}`,
                                    padding: '4px',
                                    margin: '2px',
                                    borderRadius: '4px',
                                    fontSize: '11px',
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <div style={{ fontWeight: 600, color: colors.text.primary }}>
                                    {formatEventTime(event, false)}
                                  </div>
                                  <div style={{ color: colors.text.primary }}>{event.title}</div>
                                </div>
                              );
                            })}

                            {/* Tasks */}
                            {timeSlotTasks.map((task, idx) => (
                              <div
                                key={`task-${task.id || idx}`}
                                style={{
                                  backgroundColor: '#DBEAFE',
                                  borderLeft: '3px solid #3B82F6',
                                  padding: '4px',
                                  margin: '2px',
                                  borderRadius: '4px',
                                  fontSize: '11px',
                                }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div style={{ fontWeight: 600, color: colors.text.primary }}>
                                  {format(new Date(task.due_date!), 'h:mm a')}
                                </div>
                                <div style={{ color: colors.text.primary }}>{task.title}</div>
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

        {/* FAB - Add Event Button */}
        <button
          onClick={() => setShowAddModal(true)}
          className="fixed bottom-24 right-6 w-14 h-14 rounded-full flex items-center justify-center text-white text-3xl shadow-lg"
          style={{
            background: 'linear-gradient(135deg, #D4A574, #C18B5E)',
            boxShadow: '0 4px 12px rgba(212, 165, 116, 0.4)',
          }}
          aria-label="Add event"
        >
          +
        </button>

        {/* Add Event Modal */}
        <AddEventModal
          isOpen={showAddModal}
          onClose={() => {
            setShowAddModal(false);
            setSelectedDateTime(undefined);
          }}
          initialDate={selectedDateTime || currentDate}
        />
      </div>
    </div>
  );
};

// Wrap with error boundary for graceful error handling
export default function Calendar() {
  return (
    <FeatureErrorBoundary feature="Calendar">
      <CalendarContent />
    </FeatureErrorBoundary>
  );
}
