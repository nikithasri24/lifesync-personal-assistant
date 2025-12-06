/**
 * Task filtering and search logic
 */
import { isToday, isPast } from 'date-fns';
import type { Task, Filters } from '../types';

export function applyFilters(taskList: Task[], filters: Filters, searchQuery: string): Task[] {
  let filtered = taskList;

  // Search filter
  if (searchQuery.trim()) {
    filtered = filtered.filter(task =>
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      task.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }

  // Priority filter
  if (filters.priority !== 'all') {
    filtered = filtered.filter(task => task.priority === filters.priority);
  }

  // Status filter
  if (filters.status !== 'all') {
    filtered = filtered.filter(task => task.status === filters.status);
  }

  // Due date filter
  if (filters.dueDate !== 'all') {
    const now = new Date();
    const startOfWeekDate = new Date(now.setDate(now.getDate() - now.getDay()));
    const endOfWeekDate = new Date(now.setDate(startOfWeekDate.getDate() + 6));

    filtered = filtered.filter(task => {
      if (!task.dueDate && filters.dueDate === 'none') return true;
      if (!task.dueDate) return false;

      switch (filters.dueDate) {
        case 'overdue': return isPast(task.dueDate) && task.status !== 'done';
        case 'today': return isToday(task.dueDate);
        case 'week': return task.dueDate >= startOfWeekDate && task.dueDate <= endOfWeekDate;
        default: return true;
      }
    });
  }

  return filtered;
}
