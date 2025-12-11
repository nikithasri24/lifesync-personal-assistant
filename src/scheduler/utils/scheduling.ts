/**
 * Auto-Scheduling Utilities
 * Intelligent task scheduling based on dependencies, constraints, and workload
 */

import { addMinutes, addDays, format, parse, isWeekend, setHours, setMinutes } from 'date-fns';
import type {
  ScheduledTask,
  TaskDependency,
  SchedulingConstraints,
  SchedulingResult,
} from '../types';
import { logger } from '../../services/logger';

/**
 * Default scheduling constraints
 */
export const DEFAULT_CONSTRAINTS: SchedulingConstraints = {
  workingHours: { start: 9, end: 17 },
  workingDays: [1, 2, 3, 4, 5], // Monday-Friday
  excludeDates: [],
  maxTasksPerDay: 8,
  preferredTimeSlots: [
    { priority: 'urgent', hours: [9, 10, 11] }, // Morning for urgent tasks
    { priority: 'high', hours: [11, 14, 15] },
    { priority: 'medium', hours: [14, 15, 16] },
    { priority: 'low', hours: [16, 17] },
  ],
};

/**
 * Topological sort for task dependencies
 * Returns tasks in order they should be executed
 */
export function topologicalSort(
  tasks: ScheduledTask[],
  dependencies: TaskDependency[]
): string[] {
  const graph = new Map<string, string[]>();
  const inDegree = new Map<string, number>();

  // Initialize graph
  tasks.forEach(task => {
    graph.set(task.id, []);
    inDegree.set(task.id, 0);
  });

  // Build graph
  dependencies.forEach(dep => {
    if (dep.type === 'finish-to-start' || dep.type === 'start-to-start') {
      graph.get(dep.predecessorId)?.push(dep.successorId);
      inDegree.set(dep.successorId, (inDegree.get(dep.successorId) || 0) + 1);
    }
  });

  // Kahn's algorithm
  const queue: string[] = [];
  const result: string[] = [];

  // Find all nodes with no incoming edges
  inDegree.forEach((degree, taskId) => {
    if (degree === 0) queue.push(taskId);
  });

  while (queue.length > 0) {
    const current = queue.shift()!;
    result.push(current);

    graph.get(current)?.forEach(successor => {
      const newDegree = (inDegree.get(successor) || 0) - 1;
      inDegree.set(successor, newDegree);
      if (newDegree === 0) {
        queue.push(successor);
      }
    });
  }

  // Check for cycles
  if (result.length !== tasks.length) {
    logger.warn('Scheduler', 'Circular dependencies detected in task graph', {
      totalTasks: tasks.length,
      sortedTasks: result.length
    });
    // Return all tasks, cycles will be handled separately
    return tasks.map(t => t.id);
  }

  return result;
}

/**
 * Find the critical path (longest path through the project)
 */
export function findCriticalPath(
  tasks: ScheduledTask[],
  dependencies: TaskDependency[]
): string[] {
  const taskMap = new Map(tasks.map(t => [t.id, t]));
  const sortedIds = topologicalSort(tasks, dependencies);

  // Calculate earliest start times
  const earliestStart = new Map<string, number>();
  const earliestFinish = new Map<string, number>();

  sortedIds.forEach(taskId => {
    const task = taskMap.get(taskId)!;
    const duration = task.estimated_time || 60;

    // Find max finish time of all predecessors
    const predecessorDeps = dependencies.filter(d => d.successorId === taskId);
    let maxPredecessorFinish = 0;

    predecessorDeps.forEach(dep => {
      const predFinish = earliestFinish.get(dep.predecessorId) || 0;
      const lag = dep.lag || 0;
      maxPredecessorFinish = Math.max(maxPredecessorFinish, predFinish + lag);
    });

    earliestStart.set(taskId, maxPredecessorFinish);
    earliestFinish.set(taskId, maxPredecessorFinish + duration);
  });

  // Calculate latest start times (backward pass)
  const latestStart = new Map<string, number>();
  const latestFinish = new Map<string, number>();

  // Find project end time
  const projectEnd = Math.max(...Array.from(earliestFinish.values()));

  // Work backwards
  for (let i = sortedIds.length - 1; i >= 0; i--) {
    const taskId = sortedIds[i];
    const task = taskMap.get(taskId)!;
    const duration = task.estimated_time || 60;

    // Find min start time of all successors
    const successorDeps = dependencies.filter(d => d.predecessorId === taskId);
    let minSuccessorStart = projectEnd;

    if (successorDeps.length > 0) {
      successorDeps.forEach(dep => {
        const succStart = latestStart.get(dep.successorId) || projectEnd;
        const lag = dep.lag || 0;
        minSuccessorStart = Math.min(minSuccessorStart, succStart - lag);
      });
    }

    latestFinish.set(taskId, minSuccessorStart);
    latestStart.set(taskId, minSuccessorStart - duration);
  }

  // Find critical path (tasks with zero slack)
  const criticalPath: string[] = [];
  sortedIds.forEach(taskId => {
    const slack = (latestStart.get(taskId) || 0) - (earliestStart.get(taskId) || 0);
    if (slack === 0) {
      criticalPath.push(taskId);
    }
  });

  return criticalPath;
}

/**
 * Check if a date/time is within working hours
 */
export function isWorkingTime(
  date: Date,
  constraints: SchedulingConstraints
): boolean {
  const day = date.getDay();
  const hour = date.getHours();

  // Check if working day
  if (!constraints.workingDays.includes(day)) {
    return false;
  }

  // Check if excluded date
  const dateStr = format(date, 'yyyy-MM-dd');
  if (constraints.excludeDates.includes(dateStr)) {
    return false;
  }

  // Check if working hours
  if (hour < constraints.workingHours.start || hour >= constraints.workingHours.end) {
    return false;
  }

  return true;
}

/**
 * Get next available working time slot
 */
export function getNextWorkingTime(
  startDate: Date,
  constraints: SchedulingConstraints
): Date {
  let current = new Date(startDate);

  // If outside working hours, move to next working period
  while (!isWorkingTime(current, constraints)) {
    const hour = current.getHours();

    // If before working hours, move to start of working hours
    if (hour < constraints.workingHours.start) {
      current = setHours(setMinutes(current, 0), constraints.workingHours.start);
    } else {
      // Move to next day
      current = addDays(current, 1);
      current = setHours(setMinutes(current, 0), constraints.workingHours.start);
    }
  }

  return current;
}

/**
 * Calculate actual duration considering working hours
 */
export function calculateWorkingDuration(
  startDate: Date,
  durationMinutes: number,
  constraints: SchedulingConstraints
): Date {
  let current = getNextWorkingTime(startDate, constraints);
  let remainingMinutes = durationMinutes;

  while (remainingMinutes > 0) {
    const workingHoursEnd = setHours(
      setMinutes(current, 0),
      constraints.workingHours.end
    );
    const minutesUntilEndOfDay = Math.floor(
      (workingHoursEnd.getTime() - current.getTime()) / 60000
    );

    if (minutesUntilEndOfDay >= remainingMinutes) {
      // Task fits in current day
      return addMinutes(current, remainingMinutes);
    } else {
      // Use rest of current day and continue next working day
      remainingMinutes -= minutesUntilEndOfDay;
      current = addDays(current, 1);
      current = setHours(setMinutes(current, 0), constraints.workingHours.start);
      current = getNextWorkingTime(current, constraints);
    }
  }

  return current;
}

/**
 * Get preferred time slot for a task based on priority
 */
export function getPreferredTimeSlot(
  task: ScheduledTask,
  date: Date,
  constraints: SchedulingConstraints
): number {
  const prioritySlots = constraints.preferredTimeSlots?.find(
    slot => slot.priority === task.priority
  );

  if (!prioritySlots || prioritySlots.hours.length === 0) {
    return constraints.workingHours.start;
  }

  // Find first available hour from preferred slots
  for (const hour of prioritySlots.hours) {
    if (hour >= constraints.workingHours.start && hour < constraints.workingHours.end) {
      return hour;
    }
  }

  return constraints.workingHours.start;
}

/**
 * Auto-schedule tasks based on dependencies and constraints
 */
export function autoScheduleTasks(
  tasks: ScheduledTask[],
  dependencies: TaskDependency[],
  startDate: Date,
  constraints: SchedulingConstraints = DEFAULT_CONSTRAINTS
): SchedulingResult {
  const result: SchedulingResult = {
    success: true,
    scheduledTasks: new Map(),
    unscheduledTasks: [],
    warnings: [],
  };

  // Sort tasks by dependencies
  const sortedTaskIds = topologicalSort(tasks, dependencies);
  const taskMap = new Map(tasks.map(t => [t.id, t]));
  const scheduledDates = new Map<string, { start: Date; end: Date }>();

  sortedTaskIds.forEach(taskId => {
    const task = taskMap.get(taskId);
    if (!task) return;

    try {
      // Find earliest possible start time based on dependencies
      let earliestStart = new Date(startDate);

      const predecessorDeps = dependencies.filter(
        d => d.successorId === taskId && d.type === 'finish-to-start'
      );

      predecessorDeps.forEach(dep => {
        const predSchedule = scheduledDates.get(dep.predecessorId);
        if (predSchedule) {
          const predEnd = predSchedule.end;
          const withLag = addMinutes(predEnd, dep.lag || 0);
          if (withLag > earliestStart) {
            earliestStart = withLag;
          }
        }
      });

      // Get preferred time slot
      const preferredHour = getPreferredTimeSlot(task, earliestStart, constraints);
      earliestStart = setHours(setMinutes(earliestStart, 0), preferredHour);

      // Get next working time
      const taskStart = getNextWorkingTime(earliestStart, constraints);

      // Calculate end time
      const duration = task.estimated_time || 60;
      const taskEnd = calculateWorkingDuration(taskStart, duration, constraints);

      // Save schedule
      scheduledDates.set(taskId, { start: taskStart, end: taskEnd });

      result.scheduledTasks.set(taskId, {
        start: format(taskStart, "yyyy-MM-dd'T'HH:mm:ss"),
        end: format(taskEnd, "yyyy-MM-dd'T'HH:mm:ss"),
        conflicts: [],
      });
    } catch (error) {
      result.unscheduledTasks.push(taskId);
      result.warnings.push(`Failed to schedule task ${task.title}: ${error}`);
      result.success = false;
    }
  });

  return result;
}

/**
 * Detect conflicts between scheduled tasks
 */
export function detectConflicts(
  tasks: ScheduledTask[]
): Map<string, string[]> {
  const conflicts = new Map<string, string[]>();
  const scheduledTasks = tasks.filter(
    t => t.scheduledStart && t.scheduledEnd
  );

  for (let i = 0; i < scheduledTasks.length; i++) {
    for (let j = i + 1; j < scheduledTasks.length; j++) {
      const task1 = scheduledTasks[i];
      const task2 = scheduledTasks[j];

      const start1 = new Date(task1.scheduledStart!);
      const end1 = new Date(task1.scheduledEnd!);
      const start2 = new Date(task2.scheduledStart!);
      const end2 = new Date(task2.scheduledEnd!);

      // Check for overlap
      if (start1 < end2 && start2 < end1) {
        // Add conflict
        if (!conflicts.has(task1.id)) {
          conflicts.set(task1.id, []);
        }
        if (!conflicts.has(task2.id)) {
          conflicts.set(task2.id, []);
        }
        conflicts.get(task1.id)!.push(task2.id);
        conflicts.get(task2.id)!.push(task1.id);
      }
    }
  }

  return conflicts;
}

/**
 * Calculate task slack (float) - how much a task can be delayed
 */
export function calculateSlack(
  task: ScheduledTask,
  dependencies: TaskDependency[],
  allTasks: ScheduledTask[]
): number {
  if (!task.scheduledStart || !task.scheduledEnd) return 0;

  const taskMap = new Map(allTasks.map(t => [t.id, t]));

  // Find successor tasks
  const successors = dependencies
    .filter(d => d.predecessorId === task.id)
    .map(d => taskMap.get(d.successorId))
    .filter(Boolean) as ScheduledTask[];

  if (successors.length === 0) {
    // No successors, slack is time until project end or due date
    if (task.due_date) {
      const dueDate = new Date(task.due_date);
      const endDate = new Date(task.scheduledEnd);
      return Math.max(0, Math.floor((dueDate.getTime() - endDate.getTime()) / 60000));
    }
    return Infinity;
  }

  // Calculate minimum slack based on successors
  let minSlack = Infinity;

  successors.forEach(successor => {
    if (successor.scheduledStart) {
      const successorStart = new Date(successor.scheduledStart);
      const taskEnd = new Date(task.scheduledEnd!);
      const slack = Math.floor((successorStart.getTime() - taskEnd.getTime()) / 60000);
      minSlack = Math.min(minSlack, slack);
    }
  });

  return minSlack === Infinity ? 0 : Math.max(0, minSlack);
}
