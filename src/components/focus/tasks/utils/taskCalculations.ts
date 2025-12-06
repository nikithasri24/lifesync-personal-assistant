/**
 * Task calculation utilities
 * Filtering, sorting, and progress calculations
 */

import { isToday, isPast } from 'date-fns';
import type { TaskView, FilterType, SortByType } from '../types';

export const getTaskProgress = (task: TaskView): number => {
  if (task.subtasks.length === 0) {
    const actual = task.actualTime ?? 0;
    return task.status === 'completed' ? 100 : actual > 0 ? 50 : 0;
  }
  const completed = task.subtasks.filter(st => st.completed).length;
  return (completed / task.subtasks.length) * 100;
};

export const filterTasks = (
  tasks: TaskView[],
  filter: FilterType,
  selectedProject: string,
  searchQuery: string
): TaskView[] => {
  return tasks.filter(task => {
    // Filter by status/date
    if (filter === 'today' && (!task.dueDate || !isToday(task.dueDate))) return false;
    if (filter === 'overdue' && (!task.dueDate || !isPast(task.dueDate) || task.status === 'completed')) return false;
    if (filter === 'completed' && task.status !== 'completed') return false;

    // Filter by project
    if (selectedProject !== 'all' && task.projectId !== selectedProject) return false;

    // Filter by search query
    if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;

    return true;
  });
};

export const sortTasks = (tasks: TaskView[], sortBy: SortByType): TaskView[] => {
  return [...tasks].sort((a, b) => {
    switch (sortBy) {
      case 'priority': {
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      case 'dueDate': {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.getTime() - b.dueDate.getTime();
      }
      case 'estimatedTime':
        return (b.estimatedTime ?? 0) - (a.estimatedTime ?? 0);
      case 'createdAt':
        return b.createdAt.getTime() - a.createdAt.getTime();
      default:
        return 0;
    }
  });
};
