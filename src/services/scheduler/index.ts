/**
 * Schedule Engine
 *
 * Core scheduling engine for time blocking and task scheduling.
 * This is a stub implementation - full scheduling logic to be implemented.
 */

import { addMinutes, setHours, setMinutes } from 'date-fns';
import type { UserSchedulingPrefs, TaskComplexity, TimeSlot, ScoredTimeSlot } from '../scheduling/types';
import { DEFAULT_SCHEDULING_PREFS } from '../scheduling/types';

interface SchedulableTask {
  id: string;
  title: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  estimatedMinutes: number;
  complexity?: TaskComplexity;
  depends_on?: string[];
}

interface ScheduledItem {
  taskId: string;
  start: Date;
  end: Date;
}

interface DayPlanResult {
  scheduledItems: ScheduledItem[];
  unscheduledTasks: string[];
}

/**
 * Calculate free time slots in a day
 */
function calculateFreeSlots(
  date: Date,
  events: Array<{ start: Date; end: Date }>,
  prefs: UserSchedulingPrefs = DEFAULT_SCHEDULING_PREFS,
  minDurationMinutes: number = 15
): TimeSlot[] {
  const slots: TimeSlot[] = [];

  // Create work day boundaries
  const workStart = setHours(setMinutes(date, 0), prefs.workHoursStart);
  const workEnd = setHours(setMinutes(date, 0), prefs.workHoursEnd);

  // Sort events by start time
  const sortedEvents = [...events].sort((a, b) => a.start.getTime() - b.start.getTime());

  let currentTime = workStart;

  for (const event of sortedEvents) {
    // If there's a gap before this event, add it as a free slot
    const gap = (event.start.getTime() - currentTime.getTime()) / (1000 * 60);
    if (gap >= minDurationMinutes) {
      slots.push({
        start: currentTime,
        end: event.start,
        durationMinutes: gap,
      });
    }

    // Move current time to end of this event
    currentTime = event.end > currentTime ? event.end : currentTime;
  }

  // Add remaining time until end of work day
  const remainingGap = (workEnd.getTime() - currentTime.getTime()) / (1000 * 60);
  if (remainingGap >= minDurationMinutes) {
    slots.push({
      start: currentTime,
      end: workEnd,
      durationMinutes: remainingGap,
    });
  }

  return slots;
}

/**
 * Score a time slot for a task
 */
function scoreSlot(
  slot: TimeSlot,
  task: { priority: string; estimatedMinutes: number; complexity?: TaskComplexity },
  prefs: UserSchedulingPrefs = DEFAULT_SCHEDULING_PREFS
): ScoredTimeSlot {
  let score = 50; // Base score

  // Priority bonus
  const priorityBonus = {
    urgent: 30,
    high: 20,
    medium: 10,
    low: 0,
  };
  score += priorityBonus[task.priority as keyof typeof priorityBonus] || 0;

  // Duration fit bonus (prefer slots that fit the task well)
  if (slot.durationMinutes >= task.estimatedMinutes && slot.durationMinutes < task.estimatedMinutes * 2) {
    score += 20;
  }

  // Morning bonus for deep work
  const hour = slot.start.getHours();
  if (task.complexity === 'deep' && hour >= 8 && hour <= 11) {
    score += 15;
  }

  return {
    ...slot,
    score,
    reasons: [`Priority: ${task.priority}`, `Duration: ${slot.durationMinutes}m`],
  };
}

/**
 * Plan tasks for a day
 */
async function planDay(
  tasks: SchedulableTask[],
  date: Date,
  prefs: UserSchedulingPrefs = DEFAULT_SCHEDULING_PREFS
): Promise<DayPlanResult> {
  const scheduledItems: ScheduledItem[] = [];
  const unscheduledTasks: string[] = [];

  // Sort tasks by priority
  const sortedTasks = [...tasks].sort((a, b) => {
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  const events: Array<{ start: Date; end: Date }> = [];

  for (const task of sortedTasks) {
    const freeSlots = calculateFreeSlots(date, events, prefs, task.estimatedMinutes);

    if (freeSlots.length === 0) {
      unscheduledTasks.push(task.id);
      continue;
    }

    // Score slots and pick the best one
    const scoredSlots = freeSlots
      .map(slot => scoreSlot(slot, task, prefs))
      .sort((a, b) => b.score - a.score);

    const bestSlot = scoredSlots[0];
    if (bestSlot) {
      const end = addMinutes(bestSlot.start, task.estimatedMinutes);
      scheduledItems.push({
        taskId: task.id,
        start: bestSlot.start,
        end,
      });

      // Add to events so it blocks future slots
      events.push({ start: bestSlot.start, end });
    } else {
      unscheduledTasks.push(task.id);
    }
  }

  return { scheduledItems, unscheduledTasks };
}

/**
 * Export schedule engine interface
 */
export const scheduleEngine = {
  calculateFreeSlots,
  scoreSlot,
  planDay,
};
