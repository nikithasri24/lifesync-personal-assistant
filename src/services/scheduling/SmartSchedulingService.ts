/**
 * Smart Scheduling Service
 * Suggests optimal times for tasks based on energy patterns, calendar, and preferences
 */

import { addMinutes } from 'date-fns';
import { scheduleEngine } from '../scheduler';
import type {
  TimeSlot, ScoredTimeSlot, SchedulingSuggestion,
  UserSchedulingPrefs, TaskComplexity, DaySchedule
} from './types';
import { DEFAULT_SCHEDULING_PREFS } from './types';

/**
 * Find free time slots for a given day
 */
export function findFreeSlots(
  date: Date,
  events: Array<{ start: Date; end: Date }>,
  prefs: UserSchedulingPrefs = DEFAULT_SCHEDULING_PREFS,
  minDurationMinutes: number = 15
): TimeSlot[] {
  return scheduleEngine.calculateFreeSlots(date, events, prefs, minDurationMinutes);
}

/**
 * Score a time slot for a specific task
 */
export function scoreTimeSlot(
  slot: TimeSlot,
  taskPriority: 'urgent' | 'high' | 'medium' | 'low',
  taskDuration: number,
  complexity: TaskComplexity = 'shallow',
  prefs: UserSchedulingPrefs = DEFAULT_SCHEDULING_PREFS
): ScoredTimeSlot {
  return scheduleEngine.scoreSlot(
    slot,
    { priority: taskPriority, estimatedMinutes: taskDuration, complexity },
    prefs
  );
}

/**
 * Get scheduling suggestions for a task
 */
export function suggestTimesForTask(
  task: {
    id: string;
    title: string;
    priority: 'urgent' | 'high' | 'medium' | 'low';
    estimatedMinutes: number;
    dueDate?: Date;
    complexity?: TaskComplexity;
  },
  context: {
    date: Date;
    events: Array<{ start: Date; end: Date }>;
  },
  prefs: UserSchedulingPrefs = DEFAULT_SCHEDULING_PREFS,
  maxSuggestions: number = 5
): SchedulingSuggestion {
  const freeSlots = scheduleEngine.calculateFreeSlots(
    context.date,
    context.events,
    prefs,
    task.estimatedMinutes
  );

  if (freeSlots.length === 0) {
    return {
      taskId: task.id,
      taskTitle: task.title,
      suggestedSlots: [],
      bestSlot: null,
      unschedulable: true,
      unschedulableReason: 'No free slots available on this day',
    };
  }

  // Score all slots
  const scoredSlots = freeSlots
    .map(slot => scheduleEngine.scoreSlot(slot, task, prefs))
    .filter(slot => slot.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxSuggestions);

  return {
    taskId: task.id,
    taskTitle: task.title,
    suggestedSlots: scoredSlots,
    bestSlot: scoredSlots[0] || null,
    unschedulable: scoredSlots.length === 0,
    unschedulableReason: scoredSlots.length === 0 ? 'No suitable slots found' : undefined,
  };
}

/**
 * Get a day's schedule overview
 */
export function getDaySchedule(
  date: Date,
  events: Array<{ id: string; title: string; start: Date; end: Date; type?: string }>,
  prefs: UserSchedulingPrefs = DEFAULT_SCHEDULING_PREFS
): DaySchedule {
  const totalWorkMinutes = (prefs.workHoursEnd - prefs.workHoursStart - (prefs.lunchBlockEnd - prefs.lunchBlockStart)) * 60;

  const freeSlots = scheduleEngine.calculateFreeSlots(date, events, prefs);
  const totalFreeMinutes = freeSlots.reduce((sum, slot) => sum + slot.durationMinutes, 0);
  const busyMinutes = totalWorkMinutes - totalFreeMinutes;

  return {
    date,
    events: events.map(e => ({
      id: e.id,
      title: e.title,
      start: e.start,
      end: e.end,
      type: (e.type as 'event' | 'task' | 'block') || 'event',
    })),
    freeSlots,
    busyPercentage: Math.round((busyMinutes / totalWorkMinutes) * 100),
    totalFreeMinutes,
  };
}

/**
 * Auto-schedule multiple tasks for a day
 */
export function autoScheduleDay(
  tasks: Array<{
    id: string;
    title: string;
    priority: 'urgent' | 'high' | 'medium' | 'low';
    estimatedMinutes: number;
    complexity?: TaskComplexity;
  }>,
  existingEvents: Array<{ start: Date; end: Date }>,
  date: Date,
  prefs: UserSchedulingPrefs = DEFAULT_SCHEDULING_PREFS
): Map<string, { start: Date; end: Date }> {
  const schedule = new Map<string, { start: Date; end: Date }>();

  // Sort tasks: urgent first, then by priority, then by estimated time (longer first)
  const sortedTasks = [...tasks].sort((a, b) => {
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return b.estimatedMinutes - a.estimatedMinutes;
  });

  // Track scheduled events (include existing + newly scheduled)
  const allEvents = [...existingEvents];

  for (const task of sortedTasks) {
    const freeSlots = scheduleEngine.calculateFreeSlots(date, allEvents, prefs, task.estimatedMinutes);
    const scoredSlots = freeSlots
      .map(slot => scheduleEngine.scoreSlot(slot, task, prefs))
      .filter(slot => slot.score > 0)
      .sort((a, b) => b.score - a.score);
    const bestSlot = scoredSlots[0];

    if (bestSlot) {
      const taskEnd = addMinutes(bestSlot.start, task.estimatedMinutes + prefs.bufferBetweenTasks);
      schedule.set(task.id, {
        start: bestSlot.start,
        end: taskEnd,
      });

      // Add to events so next task sees this as busy
      allEvents.push({
        start: bestSlot.start,
        end: taskEnd,
      });
    }
  }

  return schedule;
}
