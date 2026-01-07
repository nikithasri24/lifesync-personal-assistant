/**
 * Calendar hooks barrel export
 */

export { useCalendarState } from './useCalendarState';
export type { CalendarView, TimeSlot, WeekDay, MonthDay, MiniCalendarDay } from './useCalendarState';

export { useCalendarTasks } from './useCalendarTasks';
export type { CategorizedTasks } from './useCalendarTasks';

export { useCalendarEventsForDay } from './useCalendarEvents';
export type { DayEvents } from './useCalendarEvents';

export { useCalendarDragDrop } from './useCalendarDragDrop';

export { useCalendarModals } from './useCalendarModals';

// Re-export task helpers
export { isMultiDayTask, getTaskSpanDays, taskAppearsOnDate, getTaskSpanPosition } from '../utils/taskHelpers';

