/**
 * Task helper utilities for calendar
 */

import { isSameDay, addDays } from 'date-fns';
import type { Task } from '../../lib/supabase';

/**
 * Parse a date string into a local Date object (date only, ignoring time/timezone)
 * This avoids timezone issues where UTC dates shift to previous day in local time
 * Handles both 'YYYY-MM-DD' and ISO timestamp formats like '2025-12-17T00:00:00+00:00'
 */
const parseDateLocal = (dateStr: string): Date => {
  // Extract just the date part (YYYY-MM-DD) from the string
  const datePart = dateStr.split('T')[0];
  const [year, month, day] = datePart.split('-').map(Number);
  return new Date(year, month - 1, day); // month is 0-indexed
};

/**
 * Check if a task is multi-day (estimated time >= 8 hours)
 */
export const isMultiDayTask = (task: Task): boolean => {
  return task.estimated_time != null && task.estimated_time >= 480; // 8+ hours = multi-day (480 minutes)
};

/**
 * Get the number of days a task spans
 */
export const getTaskSpanDays = (task: Task): number => {
  if (!isMultiDayTask(task) || task.estimated_time == null) return 1;
  // Each day = 480 minutes (8 working hours)
  return Math.ceil(task.estimated_time / 480);
};

/**
 * Check if a task appears on a specific date
 */
export const taskAppearsOnDate = (task: Task, date: Date): boolean => {
  if (!task.due_date) return false;

  // Use local date parsing to avoid timezone issues
  const taskDate = typeof task.due_date === 'string'
    ? parseDateLocal(task.due_date)
    : task.due_date;

  if (!isMultiDayTask(task)) {
    return isSameDay(taskDate, date);
  }

  // For multi-day tasks, check if date falls within the span
  const spanDays = getTaskSpanDays(task);
  const startDate = addDays(taskDate, -(spanDays - 1)); // Task ends on due_date

  for (let i = 0; i < spanDays; i++) {
    const checkDate = addDays(startDate, i);
    if (isSameDay(checkDate, date)) {
      return true;
    }
  }

  return false;
};

/**
 * Get the position of a task within its span for a given date
 */
export const getTaskSpanPosition = (
  task: Task,
  date: Date
): { position: number; totalDays: number; isFirst: boolean; isLast: boolean } => {
  if (!task.due_date) return { position: -1, totalDays: 1, isFirst: true, isLast: true };

  // Use local date parsing to avoid timezone issues
  const taskDate = typeof task.due_date === 'string'
    ? parseDateLocal(task.due_date)
    : task.due_date;

  if (!isMultiDayTask(task)) {
    return { position: 0, totalDays: 1, isFirst: true, isLast: true };
  }

  const totalDays = getTaskSpanDays(task);
  const startDate = addDays(taskDate, -(totalDays - 1));

  // Find which day of the span this date is
  for (let i = 0; i < totalDays; i++) {
    const checkDate = addDays(startDate, i);
    if (isSameDay(checkDate, date)) {
      return {
        position: i,
        totalDays,
        isFirst: i === 0,
        isLast: i === totalDays - 1,
      };
    }
  }

  return { position: -1, totalDays, isFirst: false, isLast: false };
};

