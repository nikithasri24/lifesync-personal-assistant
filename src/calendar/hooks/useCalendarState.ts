/**
 * useCalendarState - Manages calendar view state
 */

import { useState, useMemo } from 'react';
import {
  format,
  startOfWeek,
  addDays,
  startOfMonth,
  endOfMonth,
  isSameMonth,
  isToday,
  addWeeks,
  subWeeks,
} from 'date-fns';

export type CalendarView = 'week' | 'month' | 'day';

export interface TimeSlot {
  hour: number;
  label: string;
}

export interface WeekDay {
  date: Date;
  dayName: string;
  dayNumber: string;
  isToday: boolean;
}

export interface MonthDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
}

export interface MiniCalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
}

export const useCalendarState = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>('week');
  const [miniCalendarDate, setMiniCalendarDate] = useState(new Date());
  const [showUnscheduledPanel, setShowUnscheduledPanel] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(112);
  const [isResizing, setIsResizing] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    scheduled: true,
    inProgress: true,
    todo: true,
    backlog: true,
  });

  const toggleSection = (section: 'scheduled' | 'inProgress' | 'todo' | 'backlog') => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Generate time slots (0-23 hours)
  const timeSlots: TimeSlot[] = useMemo(() => {
    const slots: TimeSlot[] = [];
    for (let hour = 0; hour <= 23; hour++) {
      const period = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      slots.push({
        hour,
        label: `${displayHour} ${period}`,
      });
    }
    return slots;
  }, []);

  // Generate week days
  const weekDays: WeekDay[] = useMemo(() => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(weekStart, i);
      return {
        date,
        dayName: format(date, 'EEE'),
        dayNumber: format(date, 'd'),
        isToday: isToday(date),
      };
    });
  }, [currentDate]);

  // Generate mini calendar days
  const miniCalendarDays: MiniCalendarDay[] = useMemo(() => {
    const monthStart = startOfMonth(miniCalendarDate);
    const monthEnd = endOfMonth(miniCalendarDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calendarEnd = addDays(calendarStart, 41); // 6 weeks

    const days: MiniCalendarDay[] = [];
    let day = calendarStart;

    while (day <= calendarEnd) {
      days.push({
        date: day,
        isCurrentMonth: isSameMonth(day, miniCalendarDate),
        isToday: isToday(day),
        isSelected: format(day, 'yyyy-MM-dd') === format(currentDate, 'yyyy-MM-dd'),
      });
      day = addDays(day, 1);
    }

    return days;
  }, [miniCalendarDate, currentDate]);

  // Generate month view days
  const monthGridDays: MonthDay[] = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calendarEnd = addDays(calendarStart, 41); // 6 weeks

    const days: MonthDay[] = [];
    let day = calendarStart;

    while (day <= calendarEnd) {
      days.push({
        date: day,
        isCurrentMonth: isSameMonth(day, currentDate),
        isToday: isToday(day),
      });
      day = addDays(day, 1);
    }

    return days;
  }, [currentDate]);

  // Navigation handlers
  const goToPreviousWeek = () => setCurrentDate(subWeeks(currentDate, 1));
  const goToNextWeek = () => setCurrentDate(addWeeks(currentDate, 1));
  const goToPreviousMonth = () => setCurrentDate(prev => addWeeks(prev, -4));
  const goToNextMonth = () => setCurrentDate(prev => addWeeks(prev, 4));
  const goToPreviousDay = () => setCurrentDate(prev => addDays(prev, -1));
  const goToNextDay = () => setCurrentDate(prev => addDays(prev, 1));
  const goToToday = () => setCurrentDate(new Date());
  const goToPreviousMonthMini = () => setMiniCalendarDate(prev => addWeeks(prev, -4));
  const goToNextMonthMini = () => setMiniCalendarDate(prev => addWeeks(prev, 4));

  return {
    // State
    currentDate,
    setCurrentDate,
    view,
    setView,
    miniCalendarDate,
    setMiniCalendarDate,
    showUnscheduledPanel,
    setShowUnscheduledPanel,
    sidebarWidth,
    setSidebarWidth,
    isResizing,
    setIsResizing,
    expandedSections,
    toggleSection,
    
    // Computed values
    timeSlots,
    weekDays,
    miniCalendarDays,
    monthGridDays,
    
    // Navigation
    goToPreviousWeek,
    goToNextWeek,
    goToPreviousMonth,
    goToNextMonth,
    goToPreviousDay,
    goToNextDay,
    goToToday,
    goToPreviousMonthMini,
    goToNextMonthMini,
  };
};

