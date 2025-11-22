/**
 * Task and Project transformation utilities
 * Converts store models to view models
 */

import type { TodoItem, FocusSession as StoreFocusSession } from '../../../../types';
import type { Project as StoreProject } from '../../../../projects/hooks/useProjectsQuery';
import type { TaskView, ProjectView, SubTask } from '../types';
import { mapStatusToView, mapCategoryIdToView } from './statusMappers';

export const transformTaskToView = (
  todo: TodoItem,
  focusAggregate: Map<string, { duration: number; sessions: string[] }>
): TaskView => {
  const aggregate = focusAggregate.get(todo.id);
  const subtasks: SubTask[] = (todo.subtasks || []).map((sub) => ({
    id: sub.id,
    title: sub.title,
    completed: sub.completed ?? sub.status === 'done',
    estimatedTime: sub.estimatedTime,
    actualTime: sub.actualTime
  }));

  return {
    id: todo.id,
    title: todo.title,
    description: todo.description,
    projectId: todo.projectId,
    status: mapStatusToView(todo.status),
    underlyingStatus: todo.status,
    priority: todo.priority,
    estimatedTime: todo.estimatedTime,
    actualTime: aggregate?.duration ?? todo.actualTime ?? 0,
    dueDate: todo.dueDate,
    tags: todo.tags ?? [],
    createdAt: todo.createdAt,
    completedAt: todo.completedAt,
    difficulty: 3,
    category: mapCategoryIdToView(todo.categoryId),
    subtasks,
    notes: todo.notes
  };
};

export const transformProjectToView = (
  project: StoreProject,
  tasks: TaskView[]
): ProjectView => {
  const associatedTasks = tasks.filter(task => task.projectId === project.id);
  const totalEstimatedMinutes = associatedTasks.reduce((sum, task) => sum + (task.estimatedTime || 0), 0);
  const totalActualMinutes = associatedTasks.reduce((sum, task) => sum + (task.actualTime || 0), 0);
  const completedTasks = associatedTasks.filter(task => task.status === 'completed').length;
  const progress = associatedTasks.length > 0 ? (completedTasks / associatedTasks.length) * 100 : 0;

  return {
    id: project.id,
    name: project.name,
    description: project.description,
    color: project.color || '#6366f1',
    status: project.status === 'on_hold' ? 'on-hold' : (project.status as ProjectView['status']) || 'active',
    startDate: undefined,
    endDate: undefined,
    estimatedHours: Math.round((totalEstimatedMinutes / 60) * 10) / 10,
    actualHours: Math.round((totalActualMinutes / 60) * 10) / 10,
    tasks: associatedTasks.map(task => task.id),
    progress,
    icon: (project as any).icon ?? '📁',
    category: undefined
  };
};

export const buildFocusAggregate = (
  storeFocusSessions: StoreFocusSession[]
): Map<string, { duration: number; sessions: string[] }> => {
  const map = new Map<string, { duration: number; sessions: string[] }>();

  storeFocusSessions.forEach((session: StoreFocusSession) => {
    if (!session.todoId && !session.taskId) {
      return;
    }
    const taskId = session.todoId || (session as any).taskId;
    if (!taskId) {
      return;
    }

    const entry = map.get(taskId) || { duration: 0, sessions: [] };
    const sessionDuration = session.actualDuration ?? session.duration ?? 0;
    entry.duration += sessionDuration;
    entry.sessions.push(session.id);
    map.set(taskId, entry);
  });

  return map;
};
