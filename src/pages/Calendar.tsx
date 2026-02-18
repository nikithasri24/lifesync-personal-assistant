/**
 * Calendar Page
 * Schedule events, tasks, and time blocks with centered 900px layout
 */

import React, { useEffect } from 'react';
import { format } from 'date-fns';
import { useCalendarTabState, type CalendarTabView } from '@/calendar/hooks/useCalendarTabState';
import { useCalendarState } from '@/calendar/hooks/useCalendarState';
import { CalendarPageHeaderV2 } from '@/calendar/components/v2/CalendarPageHeaderV2';

// Import the main calendar view
const CalendarMainView = React.lazy(() => import('./CalendarMainView'));

const Calendar: React.FC = () => {
  const { activeTab, setActiveTab } = useCalendarTabState();
  const calendarState = useCalendarState();

  // Sync tab selection with calendar view state
  useEffect(() => {
    calendarState.setView(activeTab as 'week' | 'month' | 'day');
  }, [activeTab]);

  // Format current month/date for display
  const getCurrentDisplay = () => {
    if (activeTab === 'month') {
      return format(calendarState.currentDate, 'MMMM yyyy');
    } else if (activeTab === 'day') {
      return format(calendarState.currentDate, 'EEEE, MMM d');
    } else {
      return format(calendarState.currentDate, 'MMMM yyyy');
    }
  };

  const handlePrevious = () => {
    if (activeTab === 'month') {
      calendarState.goToPrevMonth();
    } else if (activeTab === 'week') {
      calendarState.goToPrevWeek();
    } else {
      calendarState.goToPrevDay();
    }
  };

  const handleNext = () => {
    if (activeTab === 'month') {
      calendarState.goToNextMonth();
    } else if (activeTab === 'week') {
      calendarState.goToNextWeek();
    } else {
      calendarState.goToNextDay();
    }
  };

  const handleToday = () => {
    calendarState.goToToday();
  };

  return (
    <div style={{ backgroundColor: '#F9FAFB', minHeight: '100vh' }} data-testid="calendar-container">
      {/* Header with terracotta gradient */}
      <CalendarPageHeaderV2
        currentView={activeTab === 'agenda' ? 'month' : activeTab as 'month' | 'week' | 'day'}
        onViewChange={(view) => setActiveTab(view)}
        currentMonth={getCurrentDisplay()}
        onPrevious={handlePrevious}
        onNext={handleNext}
        onToday={handleToday}
      />

      {/* Calendar Content - Full width for grid visibility */}
      <div className="pb-32">
        <React.Suspense
          fallback={
            <div className="text-center py-12 text-gray-500">
              Loading calendar...
            </div>
          }
        >
          {activeTab === 'agenda' ? (
            <div className="py-12 text-center px-6">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900">
                Agenda View Coming Soon
              </h3>
              <p className="text-sm text-gray-600">
                See your schedule in a list format
              </p>
            </div>
          ) : (
            <CalendarMainView />
          )}
        </React.Suspense>
      </div>
    </div>
  );
};

export default Calendar;
