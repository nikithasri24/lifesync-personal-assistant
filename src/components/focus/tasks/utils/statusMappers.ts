/**
 * Status mapping utilities
 * Converts between store and view representations
 */

import type { TodoItem } from '../../../../types';
import type { TaskStatusView, TaskView } from '../types';

export const mapStatusToView = (status: TodoItem['status']): TaskStatusView => {
  switch (status) {
    case 'done':
      return 'completed';
    case 'in-progress':
      return 'in_progress';
    case 'waiting':
    case 'scheduled':
      return 'in_progress';
    case 'todo':
    default:
      return 'todo';
  }
};

export const mapCategoryIdToView = (categoryId?: string): TaskView['category'] => {
  switch (categoryId) {
    case 'work':
      return 'work';
    case 'health':
      return 'health';
    case 'learning':
      return 'learning';
    case 'creative':
      return 'creative';
    case 'personal':
    case 'household':
      return 'personal';
    default:
      return 'other';
  }
};

export const mapCategoryViewToId = (category?: TaskView['category']): string => {
  switch (category) {
    case 'work':
      return 'work';
    case 'health':
      return 'health';
    case 'learning':
      return 'learning';
    case 'creative':
      return 'creative';
    case 'personal':
      return 'personal';
    case 'other':
    default:
      return 'other';
  }
};
