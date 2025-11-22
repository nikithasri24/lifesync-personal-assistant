import { useState } from 'react';
import type { Filters, ViewType } from '../types';

type CalendarView = 'month' | 'week' | 'day';

interface UseTaskFiltersReturn {
  currentView: ViewType;
  setCurrentView: React.Dispatch<React.SetStateAction<ViewType>>;
  calendarView: CalendarView;
  setCalendarView: React.Dispatch<React.SetStateAction<CalendarView>>;
  currentDate: Date;
  setCurrentDate: React.Dispatch<React.SetStateAction<Date>>;
  goToNextPeriod: () => void;
  goToPreviousPeriod: () => void;
  goToToday: () => void;
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  clearSearch: () => void;
  selectedProject: string;
  setSelectedProject: React.Dispatch<React.SetStateAction<string>>;
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  updateFilter: <K extends keyof Filters>(key: K, value: Filters[K]) => void;
  resetFilters: () => void;
  currentTheme: string;
  setCurrentTheme: React.Dispatch<React.SetStateAction<string>>;
}

/**
 * Custom hook to manage task view and filter states
 * Handles view switching, calendar navigation, search, and filter criteria
 */
export function useTaskFilters(): UseTaskFiltersReturn {
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
  const resetFilters = (): void => {
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
  const updateFilter = <K extends keyof Filters>(key: K, value: Filters[K]): void => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  /**
   * Clear search query
   */
  const clearSearch = (): void => {
    setSearchQuery('');
  };

  /**
   * Navigate to next period in calendar
   */
  const goToNextPeriod = (): void => {
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
  const goToPreviousPeriod = (): void => {
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
  const goToToday = (): void => {
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
