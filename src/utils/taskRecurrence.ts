/**
 * Task Recurrence Utilities
 *
 * Pure functions for calculating recurring task dates and creating
 * next task instances. Extracted from useTasksQuery for better testability
 * and reusability.
 */

import { addDays, addWeeks, addMonths, addYears, format, getDay, setDay, parseISO } from 'date-fns';
import type { TaskData } from '../services/types';
import { logger } from '@/services/logger';

/**
 * Calculate the next occurrence date for a recurring task
 *
 * @param task - The task with recurrence pattern
 * @returns ISO date string (YYYY-MM-DD) for the next occurrence, or null if not recurring
 *
 * @example
 * ```typescript
 * const nextDate = calculateNextOccurrence(task);
 * // For daily task: "2024-03-16"
 * // For weekly task with specific days: "2024-03-18" (next Monday)
 * // For non-recurring task: null
 * ```
 */
export function calculateNextOccurrence(task: TaskData): string | null {
  if (!task.recurrence_pattern || task.recurrence_pattern === 'none') {
    return null;
  }

  const baseDate = task.due_date ? parseISO(task.due_date) : new Date();
  const interval = task.recurrence_interval || 1;

  let nextDate: Date;

  switch (task.recurrence_pattern) {
    case 'daily':
      nextDate = addDays(baseDate, interval);
      break;

    case 'weekly':
      if (task.recurrence_days && task.recurrence_days.length > 0) {
        // Find the next day in the recurrence_days array
        const currentDay = getDay(baseDate);
        const sortedDays = [...task.recurrence_days].sort((a, b) => a - b);

        // Find next day in current week
        const nextDayInWeek = sortedDays.find(d => d > currentDay);
        if (nextDayInWeek !== undefined) {
          nextDate = setDay(baseDate, nextDayInWeek);
        } else {
          // Move to next week and get first day
          nextDate = addWeeks(setDay(baseDate, sortedDays[0]), interval);
        }
      } else {
        nextDate = addWeeks(baseDate, interval);
      }
      break;

    case 'monthly':
      nextDate = addMonths(baseDate, interval);
      break;

    case 'yearly':
      nextDate = addYears(baseDate, interval);
      break;

    default:
      return null;
  }

  return format(nextDate, 'yyyy-MM-dd');
}

/**
 * Create the next occurrence of a recurring task
 *
 * Handles recurrence end date validation and creates a new task instance
 * with the same properties as the completed task but with updated due date.
 *
 * @param completedTask - The completed recurring task
 * @param createTaskFn - Function to create the new task
 * @returns The created task, or null if end date/count reached or creation failed
 *
 * @example
 * ```typescript
 * const nextTask = await createNextRecurringTask(completedTask, createTask);
 * if (nextTask) {
 *   console.log('Next recurring task created:', nextTask.id);
 * }
 * ```
 */
export async function createNextRecurringTask(
  completedTask: TaskData,
  createTaskFn: (task: Omit<TaskData, 'id'>) => Promise<TaskData>
): Promise<TaskData | null> {
  const nextDueDate = calculateNextOccurrence(completedTask);
  if (!nextDueDate) return null;

  // Check if we've reached the end date
  if (completedTask.recurrence_end_date) {
    const endDate = parseISO(completedTask.recurrence_end_date);
    const nextDate = parseISO(nextDueDate);
    if (nextDate > endDate) {
      logger.info('Tasks', 'Recurring task reached end date, not creating next occurrence');
      return null;
    }
  }

  // Create the next task instance with all recurrence properties
  const nextTask: Omit<TaskData, 'id'> = {
    title: completedTask.title,
    description: completedTask.description,
    status: 'todo',
    priority: completedTask.priority,
    due_date: nextDueDate,
    estimated_time: completedTask.estimated_time,
    project_id: completedTask.project_id,
    tags: completedTask.tags,
    category: completedTask.category,
    starred: completedTask.starred,
    recurrence_pattern: completedTask.recurrence_pattern,
    recurrence_interval: completedTask.recurrence_interval,
    recurrence_days: completedTask.recurrence_days,
    recurrence_end_date: completedTask.recurrence_end_date,
    recurrence_count: completedTask.recurrence_count,
    parent_recurring_id: completedTask.parent_recurring_id || completedTask.id,
  };

  try {
    const created = await createTaskFn(nextTask);
    logger.info('Tasks', 'Created next recurring task', {
      originalTask: completedTask.title,
      nextDueDate,
      newTaskId: created.id,
    });
    return created;
  } catch (error) {
    logger.error('Tasks', 'Failed to create next recurring task', { error });
    return null;
  }
}
