/**
 * Calendar Tab State Hook
 * Manages tab navigation for the calendar feature
 */

import { useState } from 'react';

export type CalendarTabView = 'week' | 'month' | 'day' | 'agenda';

export function useCalendarTabState() {
  const [activeTab, setActiveTab] = useState<CalendarTabView>('week');

  return {
    activeTab,
    setActiveTab,
  };
}
