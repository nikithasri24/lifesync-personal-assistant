/**
 * Task Dependencies Utilities
 *
 * Pure functions for managing task dependencies and blocked tasks.
 * Extracted from useTasksQuery for better testability and reusability.
 */

import type { TaskData } from '../services/types';

/**
 * Get tasks that would be unblocked when a specific task is completed
 *
 * A task is unblocked if:
 * 1. It depends on the completed task
 * 2. It's not already done or deleted
 * 3. The completed task is its only remaining blocking dependency
 *
 * @param completedTaskId - ID of the task being completed
 * @param allTasks - All tasks in the system
 * @returns Array of tasks that should be unblocked
 *
 * @example
 * ```typescript
 * const tasksToUnblock = getTasksToUnblock('task-123', allTasks);
 * console.log(`${tasksToUnblock.length} tasks will be unblocked`);
 *
 * // Update each unblocked task
 * for (const task of tasksToUnblock) {
 *   await updateTask(task.id, {
 *     depends_on: task.depends_on.filter(id => id !== completedTaskId)
 *   });
 * }
 * ```
 */
export function getTasksToUnblock(completedTaskId: string, allTasks: TaskData[]): TaskData[] {
  return allTasks.filter(task => {
    // Must depend on the completed task
    if (!task.depends_on?.includes(completedTaskId)) return false;

    // Don't unblock already completed or deleted tasks
    if (task.status === 'done' || task.deleted) return false;

    // Check if this is the only blocking dependency
    const otherBlockingDeps = task.depends_on.filter(depId => {
      if (depId === completedTaskId) return false;
      const depTask = allTasks.find(t => t.id === depId);
      // Dependency is blocking if it exists and is not done
      return depTask && depTask.status !== 'done';
    });

    // Unblock only if no other blocking dependencies remain
    return otherBlockingDeps.length === 0;
  });
}

/**
 * Check if a task has any blocking dependencies
 *
 * @param task - The task to check
 * @param allTasks - All tasks in the system
 * @returns true if the task has incomplete dependencies
 *
 * @example
 * ```typescript
 * const isBlocked = hasBlockingDependencies(task, allTasks);
 * if (isBlocked) {
 *   console.log('Task cannot be started yet');
 * }
 * ```
 */
export function hasBlockingDependencies(task: TaskData, allTasks: TaskData[]): boolean {
  if (!task.depends_on || task.depends_on.length === 0) {
    return false;
  }

  return task.depends_on.some(depId => {
    const depTask = allTasks.find(t => t.id === depId);
    return depTask && depTask.status !== 'done';
  });
}

/**
 * Get all blocking dependencies for a task
 *
 * @param task - The task to check
 * @param allTasks - All tasks in the system
 * @returns Array of tasks that are blocking this task
 *
 * @example
 * ```typescript
 * const blockingTasks = getBlockingDependencies(task, allTasks);
 * console.log(`Task is blocked by: ${blockingTasks.map(t => t.title).join(', ')}`);
 * ```
 */
export function getBlockingDependencies(task: TaskData, allTasks: TaskData[]): TaskData[] {
  if (!task.depends_on || task.depends_on.length === 0) {
    return [];
  }

  return task.depends_on
    .map(depId => allTasks.find(t => t.id === depId))
    .filter((t): t is TaskData => t !== undefined && t.status !== 'done');
}
