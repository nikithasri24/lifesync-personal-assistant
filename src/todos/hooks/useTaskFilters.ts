import { useState } from 'react';
import type { Filters, ViewType } from '../types';

type CalendarView = 'month' | 'week' | 'day';

/**
 * Custom hook to manage task view and filter states
 * Handles view switching, calendar navigation, search, and filter criteria
 */
export function useTaskFilters() {
  // View state
  const [currentView, setCurrentView] = useState<ViewType>('inbox');
  const [calendarView, setCalendarView] = useState<CalendarView>('month');
  const [currentDate, setCurrentDate] = useState(new Date());

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Project selection
  const [selectedProject, setSelectedProject] = useState<string>('all');

  // Filter criteria
  const [filters, setFilters] = useState<Filters>({
    priority: 'all',
    status: 'all',
    dueDate: 'all',
    project: 'all',
  });

  // Theme
  const [currentTheme, setCurrentTheme] = useState('blue');

  /**
   * Reset all filters to default values
   */
  const resetFilters = () => {
    setFilters({
      priority: 'all',
      status: 'all',
      dueDate: 'all',
      project: 'all',
    });
  };

  /**
   * Update a specific filter value
   */
  const updateFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  /**
   * Clear search query
   */
  const clearSearch = () => {
    setSearchQuery('');
  };

  /**
   * Navigate to next period in calendar
   */
  const goToNextPeriod = () => {
    const newDate = new Date(currentDate);
    if (calendarView === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else if (calendarView === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setCurrentDate(newDate);
  };

  /**
   * Navigate to previous period in calendar
   */
  const goToPreviousPeriod = () => {
    const newDate = new Date(currentDate);
    if (calendarView === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (calendarView === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() - 1);
    }
    setCurrentDate(newDate);
  };

  /**
   * Reset calendar to today
   */
  const goToToday = () => {
    setCurrentDate(new Date());
  };

  return {
    // View state
    currentView,
    setCurrentView,
    calendarView,
    setCalendarView,
    currentDate,
    setCurrentDate,
    goToNextPeriod,
    goToPreviousPeriod,
    goToToday,

    // Search
    searchQuery,
    setSearchQuery,
    clearSearch,

    // Project selection
    selectedProject,
    setSelectedProject,

    // Filters
    filters,
    setFilters,
    updateFilter,
    resetFilters,

    // Theme
    currentTheme,
    setCurrentTheme,
  };
}
