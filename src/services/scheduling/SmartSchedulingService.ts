/**
 * Smart Scheduling Service
 * Suggests optimal times for tasks based on energy patterns, calendar, and preferences
 */

import {
  addMinutes, setHours, setMinutes, isBefore, isAfter,
  startOfDay, endOfDay, format, isWithinInterval
} from 'date-fns';
import type {
  TimeSlot, ScoredTimeSlot, SchedulingSuggestion,
  UserSchedulingPrefs, SchedulingContext, EnergyLevel, TaskComplexity,
  DaySchedule
} from './types';
import { DEFAULT_SCHEDULING_PREFS } from './types';

/**
 * Get energy level for a given hour or Date
 */
export function getEnergyLevel(timeOrHour: Date | number, prefs: UserSchedulingPrefs): EnergyLevel {
  const hour = typeof timeOrHour === 'number' ? timeOrHour : timeOrHour.getHours();
  if (hour >= prefs.peakEnergyStart && hour < prefs.peakEnergyEnd) {
    return 'peak';
  }
  if (hour >= prefs.lowEnergyStart && hour < prefs.lowEnergyEnd) {
    return 'low';
  }
  return 'moderate';
}

/**
 * Check if a time is within working hours
 */
function isWorkingHour(date: Date, prefs: UserSchedulingPrefs): boolean {
  const hour = date.getHours();
  const dayOfWeek = date.getDay();

  if (!prefs.workDays.includes(dayOfWeek)) return false;
  if (hour < prefs.workHoursStart || hour >= prefs.workHoursEnd) return false;

  // Skip lunch block
  if (hour >= prefs.lunchBlockStart && hour < prefs.lunchBlockEnd) return false;

  return true;
}

/**
 * Find free time slots for a given day
 */
export function findFreeSlots(
  date: Date,
  events: Array<{ start: Date; end: Date }>,
  prefs: UserSchedulingPrefs = DEFAULT_SCHEDULING_PREFS,
  minDurationMinutes: number = 15
): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const dayStart = setMinutes(setHours(startOfDay(date), prefs.workHoursStart), 0);
  const dayEnd = setMinutes(setHours(startOfDay(date), prefs.workHoursEnd), 0);

  // Sort events by start time
  const sortedEvents = [...events].sort((a, b) => a.start.getTime() - b.start.getTime());

  let currentTime = dayStart;

  for (const event of sortedEvents) {
    // Skip events outside working hours
    if (isAfter(event.end, dayStart) && isBefore(event.start, dayEnd)) {
      const eventStart = isBefore(event.start, dayStart) ? dayStart : event.start;

      // Free slot before this event
      if (isBefore(currentTime, eventStart)) {
        const duration = (eventStart.getTime() - currentTime.getTime()) / 60000;
        if (duration >= minDurationMinutes && isWorkingHour(currentTime, prefs)) {
          slots.push({
            start: new Date(currentTime),
            end: new Date(eventStart),
            durationMinutes: Math.floor(duration),
          });
        }
      }

      // Move current time to after this event
      if (isAfter(event.end, currentTime)) {
        currentTime = new Date(event.end);
      }
    }
  }

  // Free slot after last event
  if (isBefore(currentTime, dayEnd)) {
    const duration = (dayEnd.getTime() - currentTime.getTime()) / 60000;
    if (duration >= minDurationMinutes && isWorkingHour(currentTime, prefs)) {
      slots.push({
        start: new Date(currentTime),
        end: new Date(dayEnd),
        durationMinutes: Math.floor(duration),
      });
    }
  }

  // Filter out lunch block from slots
  return slots.flatMap(slot => {
    const lunchStart = setMinutes(setHours(startOfDay(date), prefs.lunchBlockStart), 0);
    const lunchEnd = setMinutes(setHours(startOfDay(date), prefs.lunchBlockEnd), 0);

    // If slot doesn't overlap lunch, return as-is
    if (isAfter(slot.start, lunchEnd) || isBefore(slot.end, lunchStart)) {
      return [slot];
    }

    // Split around lunch
    const result: TimeSlot[] = [];
    if (isBefore(slot.start, lunchStart)) {
      const duration = (lunchStart.getTime() - slot.start.getTime()) / 60000;
      if (duration >= minDurationMinutes) {
        result.push({ start: slot.start, end: lunchStart, durationMinutes: Math.floor(duration) });
      }
    }
    if (isAfter(slot.end, lunchEnd)) {
      const duration = (slot.end.getTime() - lunchEnd.getTime()) / 60000;
      if (duration >= minDurationMinutes) {
        result.push({ start: lunchEnd, end: slot.end, durationMinutes: Math.floor(duration) });
      }
    }
    return result;
  });
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
  let score = 50; // Base score
  const reasons: string[] = [];
  const hour = slot.start.getHours();
  const energyLevel = getEnergyLevel(hour, prefs);

  // Check if slot is long enough
  if (slot.durationMinutes < taskDuration) {
    return { ...slot, score: 0, reasons: ['Slot too short'], energyLevel, conflicts: [] };
  }

  // Energy alignment scoring
  if (complexity === 'deep_work') {
    if (energyLevel === 'peak') {
      score += 30;
      reasons.push('Peak energy for deep work');
    } else if (energyLevel === 'low') {
      score -= 20;
      reasons.push('Low energy period - not ideal for deep work');
    }
  } else if (complexity === 'routine') {
    if (energyLevel === 'low') {
      score += 15;
      reasons.push('Good time for routine tasks');
    }
  }

  // Priority scoring - urgent tasks get morning slots
  if (taskPriority === 'urgent' && hour < 11) {
    score += 20;
    reasons.push('Morning slot for urgent task');
  }

  // Prefer starting at clean times (on the hour or half hour)
  const minutes = slot.start.getMinutes();
  if (minutes === 0 || minutes === 30) {
    score += 5;
    reasons.push('Clean start time');
  }

  return { ...slot, score: Math.min(100, Math.max(0, score)), reasons, energyLevel, conflicts: [] };
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
  const freeSlots = findFreeSlots(context.date, context.events, prefs, task.estimatedMinutes);

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
    .map(slot => scoreTimeSlot(slot, task.priority, task.estimatedMinutes, task.complexity, prefs))
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
  const dayStart = setMinutes(setHours(startOfDay(date), prefs.workHoursStart), 0);
  const dayEnd = setMinutes(setHours(startOfDay(date), prefs.workHoursEnd), 0);
  const totalWorkMinutes = (prefs.workHoursEnd - prefs.workHoursStart - (prefs.lunchBlockEnd - prefs.lunchBlockStart)) * 60;

  const freeSlots = findFreeSlots(date, events, prefs);
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
    const suggestion = suggestTimesForTask(
      task,
      { date, events: allEvents },
      prefs,
      1
    );

    if (suggestion.bestSlot) {
      const taskEnd = addMinutes(suggestion.bestSlot.start, task.estimatedMinutes + prefs.bufferBetweenTasks);
      schedule.set(task.id, {
        start: suggestion.bestSlot.start,
        end: taskEnd,
      });

      // Add to events so next task sees this as busy
      allEvents.push({
        start: suggestion.bestSlot.start,
        end: taskEnd,
      });
    }
  }

  return schedule;
}
