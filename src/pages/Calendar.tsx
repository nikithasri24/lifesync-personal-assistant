/**
 * Calendar Page - Simple view matching calendar-design-spec.html
 * Mobile-first design with month/week/day views
 */

import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths, addDays, subDays } from 'date-fns';
import { useTasks } from '@/hooks/useTasksQuery';
import { useCalendarEvents } from '@/hooks/useCalendarQuery';

type ViewType = 'month' | 'week' | 'day';

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<ViewType>('month');

  // Data fetching
  const { data: tasks = [] } = useTasks();
  const { data: calendarEvents = [] } = useCalendarEvents();

  // Navigation handlers
  const handlePrevious = () => {
    if (currentView === 'month') {
      setCurrentDate(subMonths(currentDate, 1));
    } else if (currentView === 'day') {
      setCurrentDate(subDays(currentDate, 1));
    }
  };

  const handleNext = () => {
    if (currentView === 'month') {
      setCurrentDate(addMonths(currentDate, 1));
    } else if (currentView === 'day') {
      setCurrentDate(addDays(currentDate, 1));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
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
    } else if (currentView === 'day') {
      return format(currentDate, 'EEEE, MMM d');
    }
    return format(currentDate, 'MMMM yyyy');
  };

  // Generate day view hours
  const generateDayHours = () => {
    const hours = [];
    for (let i = 6; i <= 17; i++) {
      const hour12 = i > 12 ? i - 12 : i;
      const period = i >= 12 ? 'PM' : 'AM';
      hours.push({ hour: i, label: `${hour12} ${period}` });
    }
    return hours;
  };

  return (
    <div style={{ backgroundColor: '#F9FAFB', minHeight: '100vh' }}>
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
        <div className="flex items-center justify-between mb-2">
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
        <button
          onClick={handleToday}
          className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', color: 'white' }}
        >
          Today
        </button>
      </div>

      {/* Weekday Headers */}
      {currentView === 'month' && (
        <div
          className="grid grid-cols-7 bg-white border-b"
          style={{ borderColor: '#E5E7EB' }}
        >
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div
              key={day}
              className="py-3 text-center text-xs font-semibold uppercase"
              style={{ color: '#6B7280' }}
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
            className="grid grid-cols-7 gap-px p-px bg-gray-200"
          >
            {monthDays.map((day, index) => {
              const { tasks: dayTasks, events: dayEvents } = getEventsForDay(day);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isTodayDate = isToday(day);

              return (
                <div
                  key={index}
                  className="bg-white min-h-[70px] p-1 relative"
                  style={{
                    backgroundColor: isTodayDate ? '#FEF3E8' : isCurrentMonth ? 'white' : '#F9FAFB',
                    opacity: isCurrentMonth ? 1 : 0.5,
                  }}
                >
                  {/* Day Number */}
                  <div className="text-xs font-semibold mb-1 text-center">
                    {isTodayDate ? (
                      <div
                        className="w-6 h-6 rounded-full mx-auto flex items-center justify-center"
                        style={{ backgroundColor: '#D4A574', color: 'white' }}
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
                  <div className="flex flex-wrap gap-0.5 justify-center">
                    {/* Events - Terracotta */}
                    {dayEvents.slice(0, 3).map((_, idx) => (
                      <div
                        key={`event-${idx}`}
                        className="rounded-full"
                        style={{ backgroundColor: '#D4A574', width: '4px', height: '4px' }}
                      />
                    ))}
                    {/* Tasks - Blue */}
                    {dayTasks.slice(0, 3).map((_, idx) => (
                      <div
                        key={`task-${idx}`}
                        className="rounded-full"
                        style={{ backgroundColor: '#3B82F6', width: '4px', height: '4px' }}
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
            {generateDayHours().map(({ hour, label }) => (
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
                <div className="flex-1 p-1 relative">
                  {/* Events/tasks would be rendered here */}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Week View */}
        {currentView === 'week' && (
          <div className="p-6 text-center text-gray-500">
            Week view coming soon
          </div>
        )}
      </div>

      {/* FAB - Add Event Button */}
      <button
        className="fixed bottom-24 right-6 w-14 h-14 rounded-full flex items-center justify-center text-white text-3xl shadow-lg"
        style={{
          background: 'linear-gradient(135deg, #D4A574, #C18B5E)',
          boxShadow: '0 4px 12px rgba(212, 165, 116, 0.4)',
        }}
        aria-label="Add event"
      >
        +
      </button>
    </div>
  );
}
