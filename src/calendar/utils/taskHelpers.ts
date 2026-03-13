/**
 * Task helper utilities for calendar
 */

import { isSameDay, addDays } from 'date-fns';
import type { Task } from '../../lib/supabase';

/**
 * Parse a due_date string to its intended local calendar date.
 * due_date is conceptually a DATE (stored as midnight UTC), so we use the
 * UTC date component to preserve the user's intended date regardless of timezone.
 * e.g. '2026-03-11T00:00:00+00:00' → March 11 in any timezone.
 */
const parseDueDateLocal = (dateStr: string): Date => {
  const datePart = dateStr.substring(0, 10); // always 'YYYY-MM-DD'
  const [year, month, day] = datePart.split('-').map(Number);
  return new Date(year, month - 1, day);
};

/**
 * Parse a scheduled_start/scheduled_end datetime to its LOCAL calendar date.
 * scheduled_start is a real datetime, so we use the browser's local date:
 * e.g. midnight UTC (= 5PM PDT) belongs to the PDT date (yesterday), not the UTC date.
 * This prevents tasks scheduled at 5PM PDT from appearing on the next UTC day.
 */
const parseScheduledDateLocal = (dateStr: string): Date => {
  const d = new Date(dateStr); // parsed in local timezone
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
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
 * Check if a task appears on a specific date.
 * Uses local-date parsing for scheduled_start/end (real datetimes) and
 * UTC-date parsing for due_date (conceptual date stored as midnight UTC).
 */
export const taskAppearsOnDate = (task: Task, date: Date): boolean => {
  let taskStartDate: Date;

  if (task.scheduled_start) {
    // scheduled_start is a specific datetime → use browser LOCAL date
    const raw = task.scheduled_start;
    taskStartDate = typeof raw === 'string' ? parseScheduledDateLocal(raw) : raw;
  } else if (task.due_date) {
    // due_date is a calendar date stored as midnight UTC → use UTC date part
    const raw = task.due_date as string;
    taskStartDate = parseDueDateLocal(raw);
  } else {
    return false;
  }

  const rawEnd = task.scheduled_end || null;
  const taskEndDate = rawEnd
    ? (typeof rawEnd === 'string' ? parseScheduledDateLocal(rawEnd) : rawEnd)
    : null;

  if (taskEndDate) {
    const start = taskStartDate <= taskEndDate ? taskStartDate : taskEndDate;
    const end = taskStartDate <= taskEndDate ? taskEndDate : taskStartDate;
    return date >= start && date <= end;
  }

  if (!isMultiDayTask(task)) {
    return isSameDay(taskStartDate, date);
  }

  // For multi-day tasks, check if date falls within the span
  const spanDays = getTaskSpanDays(task);
  const startDate = addDays(taskStartDate, -(spanDays - 1)); // Task ends on start date if no end

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
  let taskStartDate: Date;
  if (task.scheduled_start) {
    const raw = task.scheduled_start;
    taskStartDate = typeof raw === 'string' ? parseScheduledDateLocal(raw) : raw;
  } else if (task.due_date) {
    taskStartDate = parseDueDateLocal(task.due_date as string);
  } else {
    return { position: -1, totalDays: 1, isFirst: true, isLast: true };
  }

  const rawEnd = task.scheduled_end || null;
  const taskEndDate = rawEnd
    ? (typeof rawEnd === 'string' ? parseScheduledDateLocal(rawEnd) : rawEnd)
    : null;

  if (taskEndDate) {
    const start = taskStartDate <= taskEndDate ? taskStartDate : taskEndDate;
    const end = taskStartDate <= taskEndDate ? taskEndDate : taskStartDate;
    if (date < start || date > end) {
      return { position: -1, totalDays: 1, isFirst: false, isLast: false };
    }

    const totalDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1);
    const position = Math.round((date.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
    return {
      position,
      totalDays,
      isFirst: position === 0,
      isLast: position === totalDays - 1,
    };
  }

  if (!isMultiDayTask(task)) {
    return { position: 0, totalDays: 1, isFirst: true, isLast: true };
  }

  const totalDays = getTaskSpanDays(task);
  const startDate = addDays(taskStartDate, -(totalDays - 1));

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
