/**
 * Calendar Page - Simple view matching calendar-design-spec.html
 * Mobile-first design with month/week/day views
 */

import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths, addDays, subDays, startOfWeek, endOfWeek, addWeeks, subWeeks } from 'date-fns';
import { useTasks } from '@/hooks/useTasksQuery';
import { useCalendarEvents } from '@/hooks/useCalendarQuery';
import { AddEventModal } from '@/calendar/components/AddEventModal';

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

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<ViewType>('month');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDateTime, setSelectedDateTime] = useState<Date | undefined>(undefined);

  // Data fetching
  const { data: tasks = [] } = useTasks();
  const { data: calendarEvents = [] } = useCalendarEvents();

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

    const dayTasks = tasks.filter(t =>
      t.due_date && t.due_date.startsWith(dateStr) && t.status !== 'done'
    );

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
    <div style={{ backgroundColor: '#F9FAFB', minHeight: '100vh' }}>
      {/* Centered container */}
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* Header with terracotta gradient */}
        <div
          className="px-5 py-4"
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
            backgroundColor: 'white',
            borderBottom: '1px solid #E5E7EB',
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
                color: '#6B7280',
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
        {/* Month View */}
        {currentView === 'month' && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: '1px',
              padding: '1px',
              backgroundColor: '#E5E7EB',
            }}
          >
            {monthDays.map((day, index) => {
              const { tasks: dayTasks, events: dayEvents } = getEventsForDay(day);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isTodayDate = isToday(day);

              return (
                <div
                  key={index}
                  style={{
                    backgroundColor: isTodayDate ? '#FEF3E8' : isCurrentMonth ? 'white' : '#F9FAFB',
                    opacity: isCurrentMonth ? 1 : 0.5,
                    minHeight: '70px',
                    padding: '4px',
                    position: 'relative',
                  }}
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
                          backgroundColor: '#D4A574',
                          color: 'white',
                        }}
                      >
                        {format(day, 'd')}
                      </div>
                    ) : (
                      <span style={{ color: isCurrentMonth ? '#1F2937' : '#9CA3AF' }}>
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
                          backgroundColor: '#D4A574',
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
          <div className="bg-white">
            {/* All-day Events Section */}
            {(() => {
              const { events: dayEvents } = getEventsForDay(currentDate);
              const allDayEvents = dayEvents.filter(e => e.all_day);

              return allDayEvents.length > 0 ? (
                <div
                  className="border-b p-3"
                  style={{ borderColor: '#E5E7EB', backgroundColor: '#F9FAFB' }}
                >
                  <div className="text-xs font-semibold text-gray-500 mb-2">ALL DAY</div>
                  <div className="space-y-2">
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
                          <div style={{ fontWeight: 600, color: '#1F2937' }}>
                            {event.title}
                          </div>
                          {event.location && (
                            <div style={{ color: '#6B7280', fontSize: '11px', marginTop: '2px' }}>
                              📍 {event.location}
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

              // Filter events for this hour
              const timeSlotEvents = dayEvents.filter(e => {
                if (e.all_day) return false; // All-day events shown separately
                // Use start_time if available, otherwise parse start_date
                let eventHour: number;
                if (e.start_time) {
                  eventHour = parseInt(e.start_time.split(':')[0], 10);
                } else {
                  // Parse the datetime string as local time
                  const dateStr = e.start_date.replace('Z', ''); // Remove Z if present
                  const localDate = new Date(dateStr);
                  eventHour = localDate.getHours();
                }
                return eventHour === hour;
              });

              // Filter tasks for this hour
              const timeSlotTasks = dayTasks.filter(t => {
                if (!t.due_date) return false;
                const taskHour = new Date(t.due_date).getHours();
                return taskHour === hour;
              });

              return (
                <div
                  key={hour}
                  className="flex border-b min-h-[60px]"
                  style={{ borderColor: '#E5E7EB' }}
                >
                  {/* Hour Label */}
                  <div
                    className="w-16 p-2 text-xs border-r flex-shrink-0"
                    style={{ color: '#6B7280', borderColor: '#E5E7EB' }}
                  >
                    {label}
                  </div>

                  {/* Hour Content */}
                  <div
                    className="flex-1 p-1 relative cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => handleTimeSlotClick(currentDate, hour)}
                    title="Click to create event"
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
                          <div style={{ fontWeight: 600, color: '#1F2937' }}>
                            {formatEventTime(event, true)}
                          </div>
                          <div style={{ color: '#374151' }}>{event.title}</div>
                          {event.location && (
                            <div style={{ color: '#6B7280', fontSize: '10px', marginTop: '2px' }}>
                              📍 {event.location}
                            </div>
                          )}
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
                        <div style={{ fontWeight: 600, color: '#1F2937' }}>
                          {format(new Date(task.due_date!), 'h:mm a')}
                        </div>
                        <div style={{ color: '#374151' }}>{task.title}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Week View */}
        {currentView === 'week' && (
          <div>
            {/* All-day Events Section */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '60px repeat(7, 1fr)',
                backgroundColor: '#F9FAFB',
                borderBottom: '1px solid #E5E7EB',
                minHeight: '40px',
              }}
            >
              <div
                style={{
                  padding: '8px',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#6B7280',
                  borderRight: '1px solid #E5E7EB',
                }}
              >
                ALL DAY
              </div>
              {weekDays.map((day) => {
                const { events: dayEvents } = getEventsForDay(day);
                const allDayEvents = dayEvents.filter(e => e.all_day);

                return (
                  <div
                    key={`allday-${day.toString()}`}
                    style={{
                      borderRight: '1px solid #E5E7EB',
                      padding: '4px',
                      backgroundColor: isToday(day) ? '#FEF3E8' : '#F9FAFB',
                    }}
                  >
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
                  </div>
                );
              })}
            </div>

            {/* Week day headers */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '60px repeat(7, 1fr)',
                backgroundColor: 'white',
                borderBottom: '1px solid #E5E7EB',
              }}
            >
              <div style={{ width: '60px' }}></div>
              {weekDays.map((day) => (
                <div
                  key={day.toString()}
                  style={{
                    padding: '12px 4px',
                    textAlign: 'center',
                    borderRight: '1px solid #E5E7EB',
                  }}
                >
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>
                    {format(day, 'EEE')}
                  </div>
                  <div
                    style={{
                      fontSize: '14px',
                      fontWeight: isToday(day) ? 700 : 600,
                      color: isToday(day) ? '#D4A574' : '#1F2937',
                      marginTop: '4px',
                    }}
                  >
                    {format(day, 'd')}
                  </div>
                </div>
              ))}
            </div>

            {/* Week grid with hours */}
            <div style={{ backgroundColor: 'white' }}>
              {generateDayHours().map(({ hour, label }) => (
                <div
                  key={hour}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '60px repeat(7, 1fr)',
                    borderBottom: '1px solid #E5E7EB',
                    minHeight: '60px',
                  }}
                >
                  {/* Hour Label */}
                  <div
                    style={{
                      padding: '8px',
                      fontSize: '12px',
                      color: '#6B7280',
                      borderRight: '1px solid #E5E7EB',
                    }}
                  >
                    {label}
                  </div>

                  {/* Day columns */}
                  {weekDays.map((day) => {
                    const { tasks: dayTasks, events: dayEvents } = getEventsForDay(day);

                    // Filter events for this hour
                    const timeSlotEvents = dayEvents.filter(e => {
                      if (e.all_day) return false; // All-day events shown separately
                      // Use start_time if available, otherwise parse start_date
                      let eventHour: number;
                      if (e.start_time) {
                        eventHour = parseInt(e.start_time.split(':')[0], 10);
                      } else {
                        // Parse the datetime string as local time
                        const dateStr = e.start_date.replace('Z', ''); // Remove Z if present
                        const localDate = new Date(dateStr);
                        eventHour = localDate.getHours();
                      }
                      return eventHour === hour;
                    });

                    // Filter tasks for this hour
                    const timeSlotTasks = dayTasks.filter(t => {
                      if (!t.due_date) return false;
                      const taskHour = new Date(t.due_date).getHours();
                      return taskHour === hour;
                    });

                    return (
                      <div
                        key={day.toString()}
                        className="cursor-pointer hover:bg-opacity-50 transition-colors"
                        style={{
                          borderRight: '1px solid #E5E7EB',
                          padding: '4px',
                          position: 'relative',
                          backgroundColor: isToday(day) ? '#FEF3E8' : 'white',
                        }}
                        onClick={() => handleTimeSlotClick(day, hour)}
                        title="Click to create event"
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
                              <div style={{ fontWeight: 600, color: '#1F2937' }}>
                                {formatEventTime(event, false)}
                              </div>
                              <div style={{ color: '#374151' }}>{event.title}</div>
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
                            <div style={{ fontWeight: 600, color: '#1F2937' }}>
                              {format(new Date(task.due_date!), 'h:mm a')}
                            </div>
                            <div style={{ color: '#374151' }}>{task.title}</div>
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
}
