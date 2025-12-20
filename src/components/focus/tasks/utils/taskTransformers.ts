/**
 * Task and Project transformation utilities
 * Converts store models to view models
 */

import type { Task } from '@/types/task';
import type { FocusSession as StoreFocusSession } from '../../../../types';
import type { Project as StoreProject } from '@/hooks/useProjectsQuery';
import type { TaskView, ProjectView, SubTask } from '../types';
import { mapStatusToView, mapCategoryIdToView } from './statusMappers';

export const transformTaskToView = (
  task: Task,
  focusAggregate: Map<string, { duration: number; sessions: string[] }>
): TaskView => {
  const aggregate = focusAggregate.get(task.id);
  const subtasks: SubTask[] = (task.subtasks ?? []).map((sub) => ({
    id: sub.id,
    title: sub.title,
    completed: sub.completed ?? sub.status === 'done',
    estimatedTime: sub.estimatedTime,
    actualTime: sub.actualTime
  }));

  return {
    id: task.id,
    title: task.title,
    description: task.description,
    projectId: task.projectId,
    status: mapStatusToView(task.status),
    underlyingStatus: task.status,
    priority: task.priority,
    estimatedTime: task.estimatedTime,
    actualTime: aggregate?.duration ?? task.actualTime ?? 0,
    dueDate: task.dueDate,
    tags: task.tags ?? [],
    createdAt: task.createdAt,
    completedAt: task.completedAt,
    difficulty: 3,
    category: mapCategoryIdToView(task.category),
    subtasks,
    notes: task.notes
  };
};

export const transformProjectToView = (
  project: StoreProject,
  tasks: TaskView[]
): ProjectView => {
  const associatedTasks = tasks.filter(task => task.projectId === project.id);
  const totalEstimatedMinutes = associatedTasks.reduce((sum, task) => sum + (task.estimatedTime ?? 0), 0);
  const totalActualMinutes = associatedTasks.reduce((sum, task) => sum + (task.actualTime ?? 0), 0);
  const completedTasks = associatedTasks.filter(task => task.status === 'completed').length;
  const progress = associatedTasks.length > 0 ? (completedTasks / associatedTasks.length) * 100 : 0;

  return {
    id: project.id,
    name: project.name,
    description: project.description,
    color: project.color ?? '#6366f1',
    status: (project.status as ProjectView['status']) ?? 'active',
    startDate: project.start_date ? new Date(project.start_date) : undefined,
    endDate: project.target_date ? new Date(project.target_date) : undefined,
    estimatedHours: Math.round((totalEstimatedMinutes / 60) * 10) / 10,
    actualHours: Math.round((totalActualMinutes / 60) * 10) / 10,
    tasks: associatedTasks.map(task => task.id),
    progress,
    icon: project.icon ?? '📁',
    category: undefined
  };
};

export const buildFocusAggregate = (
  storeFocusSessions: StoreFocusSession[]
): Map<string, { duration: number; sessions: string[] }> => {
  const map = new Map<string, { duration: number; sessions: string[] }>();

  storeFocusSessions.forEach((session: StoreFocusSession) => {
    // Type guard to check for taskId property
    const sessionWithTaskId = session as StoreFocusSession & { taskId?: string };

    if (!session.todoId && !sessionWithTaskId.taskId) {
      return;
    }
    const taskId: string | undefined = session.todoId ?? sessionWithTaskId.taskId;
    if (!taskId) {
      return;
    }

    const entry: { duration: number; sessions: string[] } = map.get(taskId) ?? { duration: 0, sessions: [] };
    const sessionDuration: number = session.actualDuration ?? session.duration ?? 0;
    entry.duration += sessionDuration;
    entry.sessions.push(session.id);
    map.set(taskId, entry);
  });

  return map;
};
