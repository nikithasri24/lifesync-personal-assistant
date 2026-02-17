/**
 * Calendar Page
 * Schedule events, tasks, and time blocks
 */

import React, { useEffect } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { useThemeColors } from '@/hooks/useThemeColors';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { useCalendarTabState, type CalendarTabView } from '@/calendar/hooks/useCalendarTabState';
import { useCalendarState } from '@/calendar/hooks/useCalendarState';

// Import the main calendar view
const CalendarMainView = React.lazy(() => import('./CalendarMainView'));

const Calendar: React.FC = () => {
  const colors = useThemeColors();
  const { activeTab, setActiveTab } = useCalendarTabState();
  const calendarState = useCalendarState();

  // Sync tab selection with calendar view state
  useEffect(() => {
    calendarState.setView(activeTab as 'week' | 'month' | 'day');
  }, [activeTab]);

  return (
    <div style={{ backgroundColor: colors.bg.primary, minHeight: '100vh' }} data-testid="calendar-container">
      {/* Header with Tabs */}
      <div className="sticky top-0 z-50" style={{ backgroundColor: colors.bg.primary }}>
        <div className="px-6 pt-4 pb-3">
          <div className="flex items-center gap-2 mb-4">
            <CalendarIcon size={24} style={{ color: colors.accent.start }} />
            <h1 className="text-2xl font-bold" style={{ color: colors.text.primary }}>
              Calendar
            </h1>
          </div>

          {/* Tab Navigation */}
          <SegmentedControl
            segments={[
              { value: 'week', label: 'Week' },
              { value: 'month', label: 'Month' },
              { value: 'day', label: 'Day' },
              { value: 'agenda', label: 'Agenda' },
            ]}
            value={activeTab}
            onChange={(value) => setActiveTab(value as CalendarTabView)}
          />
        </div>
      </div>

      {/* Calendar Content */}
      <React.Suspense
        fallback={
          <div className="text-center py-12" style={{ color: colors.text.tertiary }}>
            Loading calendar...
          </div>
        }
      >
        {activeTab === 'agenda' ? (
          <div className="px-6 py-12 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: colors.text.primary }}>
              Agenda View Coming Soon
            </h3>
            <p className="text-sm" style={{ color: colors.text.tertiary }}>
              See your schedule in a list format
            </p>
          </div>
        ) : (
          <CalendarMainView />
        )}
      </React.Suspense>
    </div>
  );
};

export default Calendar;
