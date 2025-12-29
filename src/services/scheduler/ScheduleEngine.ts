/**
 * ScheduleEngine - Central orchestrator for all scheduling operations
 * 
 * Unifies scattered scheduling logic into a single source of truth:
 * - TimeSlotAllocator: Finds free slots considering ALL sources (calendar, blocks, tasks)
 * - ConflictResolver: Detects and suggests resolutions for conflicts
 * - DayPlanGenerator: AI-assisted optimal day planning
 * 
 * This replaces the duplicate findFreeSlots in schedulerAPI, calendarAPI, and SmartSchedulingService
 */

import { 
  addMinutes, endOfDay, setHours, setMinutes, isBefore, isAfter,
  startOfDay, format, parseISO 
} from 'date-fns';
import { logger } from '../logger';
import { fetchCalendarEvents } from '@/api/calendarData';
import { getScheduleBlocksForDate } from '@/api/schedulerAPI';
import { getScheduledTasksForDate } from '@/api/tasksAPI';
import type {
  TimeSlot, ScoredTimeSlot, UserSchedulingPrefs, EnergyLevel, TaskComplexity
} from '../scheduling/types';
import { DEFAULT_SCHEDULING_PREFS } from '../scheduling/types';
import { getEnergyLevel } from '../scheduling/energy';

// =====================================================
// TYPES
// =====================================================

export interface ScheduleEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: 'calendar_event' | 'schedule_block' | 'scheduled_task';
  source: string; // table name for debugging
}

export interface ScheduleConflict {
  event1: ScheduleEvent;
  event2: ScheduleEvent;
  overlapMinutes: number;
  suggestedResolution: 'move_earlier' | 'move_later' | 'shorten' | 'reschedule';
}

export interface DayPlan {
  date: Date;
  scheduledItems: Array<{
    taskId: string;
    start: Date;
    end: Date;
    score: number;
    reason: string;
  }>;
  conflicts: ScheduleConflict[];
  unscheduledTasks: string[];
  unscheduledReasons?: Record<string, string>;
  totalFreeMinutes: number;
}

// =====================================================
// SCHEDULE ENGINE CLASS
// =====================================================

export class ScheduleEngine {
  /**
   * Get ALL events for a day from all sources:
   * - calendar_events
   * - schedule_blocks
   * - scheduled tasks (tasks with scheduled_start/scheduled_end)
   */
  async getAllEventsForDay(date: Date): Promise<ScheduleEvent[]> {
    const dateKey = format(date, 'yyyy-MM-dd');
    const events: ScheduleEvent[] = [];

    try {
      // 1. Calendar events (including multi-day)
      const calendarEvents = await fetchCalendarEvents({
        startDate: dateKey,
        endDate: dateKey,
      });

      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);

      for (const e of calendarEvents || []) {
        if (e.start_time && e.end_time) {
          const eventStart = parseISO(`${e.start_date}T${e.start_time}`);
          const eventEnd = parseISO(`${e.end_date || e.start_date}T${e.end_time}`);
          const clampedStart = isBefore(eventStart, dayStart) ? dayStart : eventStart;
          const clampedEnd = isAfter(eventEnd, dayEnd) ? dayEnd : eventEnd;

          if (!isBefore(clampedStart, clampedEnd)) continue;

          events.push({
            id: e.id,
            title: e.title || 'Event',
            start: clampedStart,
            end: clampedEnd,
            type: 'calendar_event',
            source: 'calendar_events',
          });
        }
      }

      // 2. Schedule blocks
      const blocks = await getScheduleBlocksForDate(dateKey);

      for (const b of blocks || []) {
        events.push({
          id: b.id,
          title: b.title || 'Block',
          start: parseISO(`${b.date}T${b.start_time}`),
          end: parseISO(`${b.date}T${b.end_time}`),
          type: 'schedule_block',
          source: 'schedule_blocks',
        });
      }

      // 3. Scheduled tasks (tasks with scheduled_start/scheduled_end)
      const tasks = await getScheduledTasksForDate(dateKey);

      for (const t of tasks || []) {
        if (t.scheduled_start) {
          const start = parseISO(t.scheduled_start);
          const end = t.scheduled_end
            ? parseISO(t.scheduled_end)
            : addMinutes(start, t.estimated_time || 30);
          events.push({
            id: t.id,
            title: t.title || 'Task',
            start,
            end,
            type: 'scheduled_task',
            source: 'tasks',
          });
        }
      }
    } catch (error) {
      logger.error('ScheduleEngine', error as Error, { context: 'getAllEventsForDay' });
    }

    // Sort by start time
    return events.sort((a, b) => a.start.getTime() - b.start.getTime());
  }

  /**
   * Find free time slots considering ALL sources
   * This is the SINGLE source of truth for free slots
   */
  async findFreeSlots(
    date: Date,
    prefs: UserSchedulingPrefs = DEFAULT_SCHEDULING_PREFS,
    minDurationMinutes: number = 15
  ): Promise<TimeSlot[]> {
    const events = await this.getAllEventsForDay(date);
    return this.calculateFreeSlots(date, events, prefs, minDurationMinutes);
  }

  /**
   * Pure function to calculate free slots from events
   * Can be used with pre-fetched events for efficiency
   */
  calculateFreeSlots(
    date: Date,
    events: Array<{ start: Date; end: Date }>,
    prefs: UserSchedulingPrefs = DEFAULT_SCHEDULING_PREFS,
    minDurationMinutes: number = 15
  ): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const dayOfWeek = date.getDay();
    if (!prefs.workDays.includes(dayOfWeek)) {
      return slots;
    }
    const dayStart = setMinutes(setHours(startOfDay(date), prefs.workHoursStart), 0);
    const dayEnd = setMinutes(setHours(startOfDay(date), prefs.workHoursEnd), 0);

    // Sort events by start time
    const sortedEvents = [...events].sort((a, b) => a.start.getTime() - b.start.getTime());

    let currentTime = dayStart;

    for (const event of sortedEvents) {
      // Skip events outside work hours
      if (isAfter(event.start, dayEnd) || isBefore(event.end, dayStart)) continue;

      // If there's a gap before this event, it's a free slot
      if (isBefore(currentTime, event.start)) {
        const slotStart = currentTime;
        const slotEnd = event.start;
        const durationMinutes = Math.round((slotEnd.getTime() - slotStart.getTime()) / 60000);

        if (durationMinutes >= minDurationMinutes) {
          slots.push({ start: slotStart, end: slotEnd, durationMinutes });
        }
      }

      // Move current time to end of this event
      if (isAfter(event.end, currentTime)) {
        currentTime = event.end;
      }
    }

    // Check for remaining time until end of work day
    if (isBefore(currentTime, dayEnd)) {
      const durationMinutes = Math.round((dayEnd.getTime() - currentTime.getTime()) / 60000);
      if (durationMinutes >= minDurationMinutes) {
        slots.push({ start: currentTime, end: dayEnd, durationMinutes });
      }
    }

    // Remove lunch block from free slots
    if (prefs.lunchBlockStart && prefs.lunchBlockEnd) {
      const lunchStart = setMinutes(setHours(startOfDay(date), prefs.lunchBlockStart), 0);
      const lunchEnd = setMinutes(setHours(startOfDay(date), prefs.lunchBlockEnd), 0);

      const adjusted: TimeSlot[] = [];
      for (const slot of slots) {
        if (isBefore(slot.end, lunchStart) || isAfter(slot.start, lunchEnd)) {
          adjusted.push(slot);
          continue;
        }

        if (isBefore(slot.start, lunchStart)) {
          const durationMinutes = Math.round((lunchStart.getTime() - slot.start.getTime()) / 60000);
          if (durationMinutes >= minDurationMinutes) {
            adjusted.push({ start: slot.start, end: lunchStart, durationMinutes });
          }
        }

        if (isAfter(slot.end, lunchEnd)) {
          const durationMinutes = Math.round((slot.end.getTime() - lunchEnd.getTime()) / 60000);
          if (durationMinutes >= minDurationMinutes) {
            adjusted.push({ start: lunchEnd, end: slot.end, durationMinutes });
          }
        }
      }

      return adjusted;
    }

    return slots;
  }

  /**
   * Score a time slot for a specific task based on energy and priority
   */
  scoreSlot(
    slot: TimeSlot,
    task: { priority: 'urgent' | 'high' | 'medium' | 'low'; estimatedMinutes: number; complexity?: TaskComplexity },
    prefs: UserSchedulingPrefs = DEFAULT_SCHEDULING_PREFS
  ): ScoredTimeSlot {
    let score = 50;
    const reasons: string[] = [];
    const hour = slot.start.getHours();
    const energyLevel = getEnergyLevel(hour, prefs);

    // Check if slot is long enough
    if (slot.durationMinutes < task.estimatedMinutes) {
      return { ...slot, score: 0, reasons: ['Slot too short'], energyLevel, conflicts: [] };
    }

    // Energy matching
    const complexity = task.complexity || 'shallow';
    if (complexity === 'deep_work' && energyLevel === 'peak') {
      score += 30;
      reasons.push('Peak energy for deep work');
    } else if (complexity === 'routine' && energyLevel === 'low') {
      score += 20;
      reasons.push('Low energy suited for routine tasks');
    } else if (energyLevel === 'moderate') {
      score += 10;
      reasons.push('Moderate energy level');
    }

    // Priority bonus for early slots
    if (task.priority === 'urgent' && hour < 11) {
      score += 20;
      reasons.push('Early slot for urgent task');
    } else if (task.priority === 'high' && hour < 14) {
      score += 15;
      reasons.push('Morning/early afternoon for high priority');
    }

    return { ...slot, score: Math.min(100, score), reasons, energyLevel, conflicts: [] };
  }

  /**
   * Detect conflicts in a day's schedule
   */
  private computeConflicts(events: ScheduleEvent[]): ScheduleConflict[] {
    const conflicts: ScheduleConflict[] = [];

    for (let i = 0; i < events.length; i++) {
      for (let j = i + 1; j < events.length; j++) {
        const e1 = events[i];
        const e2 = events[j];

        // Check for overlap
        if (isBefore(e1.start, e2.end) && isAfter(e1.end, e2.start)) {
          const overlapStart = isAfter(e1.start, e2.start) ? e1.start : e2.start;
          const overlapEnd = isBefore(e1.end, e2.end) ? e1.end : e2.end;
          const overlapMinutes = Math.round((overlapEnd.getTime() - overlapStart.getTime()) / 60000);

          conflicts.push({
            event1: e1,
            event2: e2,
            overlapMinutes,
            suggestedResolution: e1.type === 'scheduled_task' ? 'move_later' : 'reschedule',
          });
        }
      }
    }

    return conflicts;
  }

  async detectConflicts(date: Date, events?: ScheduleEvent[]): Promise<ScheduleConflict[]> {
    if (events) {
      return this.computeConflicts(events);
    }
    const dayEvents = await this.getAllEventsForDay(date);
    return this.computeConflicts(dayEvents);
  }

  /**
   * Auto-schedule tasks for a day
   * Uses topological sort for dependencies and energy-based slot selection
   */
  async planDay(
    tasks: Array<{
      id: string;
      title: string;
      priority: 'urgent' | 'high' | 'medium' | 'low';
      estimatedMinutes: number;
      complexity?: TaskComplexity;
      depends_on?: string[];
    }>,
    date: Date,
    prefs: UserSchedulingPrefs = DEFAULT_SCHEDULING_PREFS
  ): Promise<DayPlan> {
    const events = await this.getAllEventsForDay(date);
    const scheduled: DayPlan['scheduledItems'] = [];
    const unscheduledSet = new Set<string>();
    const unscheduledTasks: string[] = [];
    const unscheduledReasons: Record<string, string> = {};
    let allEvents = [...events];

    // Sort tasks by priority (urgent first) and dependencies
    const { sortedTasks, cyclicTaskIds } = this.topologicalSort(tasks);
    for (const taskId of cyclicTaskIds) {
      if (!unscheduledSet.has(taskId)) {
        unscheduledSet.add(taskId);
        unscheduledTasks.push(taskId);
        unscheduledReasons[taskId] = 'Dependency cycle detected';
      }
    }

    for (const task of sortedTasks) {
      const freeSlots = this.calculateFreeSlots(date, allEvents, prefs, task.estimatedMinutes);

      if (freeSlots.length === 0) {
        if (!unscheduledSet.has(task.id)) {
          unscheduledSet.add(task.id);
          unscheduledTasks.push(task.id);
          unscheduledReasons[task.id] = 'No available time slot';
        }
        continue;
      }

      // Score all slots and pick the best
      const scoredSlots = freeSlots.map(slot => this.scoreSlot(slot, task, prefs));
      const bestSlot = scoredSlots.reduce((best, current) =>
        current.score > best.score ? current : best
      );

      if (bestSlot.score > 0) {
        const end = addMinutes(bestSlot.start, task.estimatedMinutes);
        scheduled.push({
          taskId: task.id,
          start: bestSlot.start,
          end,
          score: bestSlot.score,
          reason: bestSlot.reasons.join(', '),
        });

        // Block this time for subsequent tasks
        allEvents.push({ id: task.id, title: task.title, start: bestSlot.start, end, type: 'scheduled_task', source: 'planned' });
        allEvents.sort((a, b) => a.start.getTime() - b.start.getTime());
      } else {
        if (!unscheduledSet.has(task.id)) {
          unscheduledSet.add(task.id);
          unscheduledTasks.push(task.id);
          unscheduledReasons[task.id] = 'No suitable slot found';
        }
      }
    }

    const conflicts = this.computeConflicts(allEvents);
    const finalFreeSlots = this.calculateFreeSlots(date, allEvents, prefs);
    const totalFreeMinutes = finalFreeSlots.reduce((sum, s) => sum + s.durationMinutes, 0);

    return { date, scheduledItems: scheduled, conflicts, unscheduledTasks, unscheduledReasons, totalFreeMinutes };
  }

  /**
   * Topological sort tasks respecting dependencies
   * Generic to preserve full task type information
   */
  private topologicalSort<T extends { id: string; priority: string; depends_on?: string[] }>(
    tasks: T[]
  ): { sortedTasks: T[]; cyclicTaskIds: string[] } {
    const graph = new Map<string, string[]>();
    const inDegree = new Map<string, number>();
    const taskMap = new Map(tasks.map(t => [t.id, t]));

    // Build graph
    for (const task of tasks) {
      if (!graph.has(task.id)) graph.set(task.id, []);
      if (!inDegree.has(task.id)) inDegree.set(task.id, 0);

      for (const dep of task.depends_on || []) {
        if (!graph.has(dep)) graph.set(dep, []);
        graph.get(dep)!.push(task.id);
        inDegree.set(task.id, (inDegree.get(task.id) || 0) + 1);
      }
    }

    // Kahn's algorithm with priority ordering
    const queue = tasks
      .filter(t => (inDegree.get(t.id) || 0) === 0)
      .sort((a, b) => this.priorityValue(a.priority) - this.priorityValue(b.priority));

    const sorted: T[] = [];

    while (queue.length > 0) {
      const task = queue.shift()!;
      sorted.push(task);

      for (const neighbor of graph.get(task.id) || []) {
        const newDegree = (inDegree.get(neighbor) || 1) - 1;
        inDegree.set(neighbor, newDegree);
        if (newDegree === 0) {
          const neighborTask = taskMap.get(neighbor);
          if (neighborTask) {
            queue.push(neighborTask);
            queue.sort((a, b) => this.priorityValue(a.priority) - this.priorityValue(b.priority));
          }
        }
      }
    }

    const cyclicTaskIds = tasks
      .filter(task => !sorted.some(sortedTask => sortedTask.id === task.id))
      .map(task => task.id);

    return { sortedTasks: sorted, cyclicTaskIds };
  }

  private priorityValue(priority: string): number {
    const values: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
    return values[priority] ?? 2;
  }
}

// Singleton instance
export const scheduleEngine = new ScheduleEngine();
