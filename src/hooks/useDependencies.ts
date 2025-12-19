/**
 * useDependencies Hook
 * Provides dependency logic: check blocked status, get blocking tasks, get dependent tasks
 */

import { useMemo, useCallback } from 'react';
import type { TaskData } from '@/services/types';

export interface DependencyInfo {
  /** Whether this task is blocked by incomplete dependencies */
  isBlocked: boolean;
  /** Tasks that block this task (dependencies that aren't complete) */
  blockingTasks: TaskData[];
  /** All dependency tasks (complete and incomplete) */
  allDependencies: TaskData[];
  /** Tasks that depend on this task (this task blocks them) */
  dependentTasks: TaskData[];
  /** Percentage of dependencies completed */
  completionPercentage: number;
}

/**
 * Check if a task is blocked by its dependencies
 */
export function isTaskBlocked(task: TaskData, allTasks: TaskData[]): boolean {
  if (!task.depends_on || task.depends_on.length === 0) {
    return false;
  }
  
  return task.depends_on.some(depId => {
    const depTask = allTasks.find(t => t.id === depId);
    return depTask && depTask.status !== 'done';
  });
}

/**
 * Get dependency information for a task
 */
export function getTaskDependencyInfo(task: TaskData, allTasks: TaskData[]): DependencyInfo {
  const dependsOn = task.depends_on || [];
  
  // Get all dependency tasks
  const allDependencies = dependsOn
    .map(id => allTasks.find(t => t.id === id))
    .filter((t): t is TaskData => t !== undefined);
  
  // Get incomplete dependencies (blocking tasks)
  const blockingTasks = allDependencies.filter(t => t.status !== 'done');
  
  // Get tasks that depend on this task
  const dependentTasks = allTasks.filter(t =>
    task.id && t.depends_on?.includes(task.id) && !t.deleted
  );
  
  // Calculate completion percentage
  const completionPercentage = allDependencies.length > 0
    ? Math.round(((allDependencies.length - blockingTasks.length) / allDependencies.length) * 100)
    : 100;
  
  return {
    isBlocked: blockingTasks.length > 0,
    blockingTasks,
    allDependencies,
    dependentTasks,
    completionPercentage,
  };
}

/**
 * Hook to get dependency info for a single task
 */
export function useDependencyInfo(task: TaskData | null, allTasks: TaskData[]): DependencyInfo | null {
  return useMemo(() => {
    if (!task) return null;
    return getTaskDependencyInfo(task, allTasks);
  }, [task, allTasks]);
}

/**
 * Hook to check if adding a dependency would create a cycle
 */
export function useWouldCreateCycle(
  taskId: string,
  allTasks: TaskData[]
): (candidateDependencyId: string) => boolean {
  return useCallback((candidateDependencyId: string): boolean => {
    // Check if candidateDependencyId (or any of its dependencies) already depends on taskId
    const visited = new Set<string>();
    const queue = [candidateDependencyId];
    
    while (queue.length > 0) {
      const currentId = queue.shift()!;
      if (currentId === taskId) {
        return true; // Cycle detected
      }
      if (visited.has(currentId)) continue;
      visited.add(currentId);
      
      const currentTask = allTasks.find(t => t.id === currentId);
      if (currentTask?.depends_on) {
        queue.push(...currentTask.depends_on);
      }
    }
    
    return false;
  }, [taskId, allTasks]);
}

/**
 * Hook to get tasks that would be unblocked if a task is completed
 */
export function useTasksToUnblock(taskId: string, allTasks: TaskData[]): TaskData[] {
  return useMemo(() => {
    return allTasks.filter(task => {
      if (!task.depends_on?.includes(taskId)) return false;
      if (task.status === 'done' || task.deleted) return false;
      
      // Check if this is the only blocking dependency
      const otherBlockingDeps = task.depends_on.filter(depId => {
        if (depId === taskId) return false;
        const depTask = allTasks.find(t => t.id === depId);
        return depTask && depTask.status !== 'done';
      });
      
      return otherBlockingDeps.length === 0;
    });
  }, [taskId, allTasks]);
}

/**
 * Main hook for dependency management
 */
export function useDependencies(allTasks: TaskData[]) {
  const getInfo = useCallback((task: TaskData) => {
    return getTaskDependencyInfo(task, allTasks);
  }, [allTasks]);
  
  const isBlocked = useCallback((task: TaskData) => {
    return isTaskBlocked(task, allTasks);
  }, [allTasks]);
  
  const getBlockedTasks = useCallback(() => {
    return allTasks.filter(t => !t.deleted && isTaskBlocked(t, allTasks));
  }, [allTasks]);
  
  const getUnblockedTasks = useCallback(() => {
    return allTasks.filter(t => !t.deleted && t.status !== 'done' && !isTaskBlocked(t, allTasks));
  }, [allTasks]);
  
  return {
    getInfo,
    isBlocked,
    getBlockedTasks,
    getUnblockedTasks,
  };
}

