/**
 * View Helpers
 *
 * Helper functions for view-specific logic and display
 */

import {
  Inbox,
  Sun,
  ArrowRight,
  Grid,
  Layers,
  _CalendarDays,
  List,
  _Filter,
  type LucideIcon
} from 'lucide-react';
import type { ViewType, Project } from '../types';

/**
 * Get the title for the current view
 *
 * @param view - Current view type
 * @param project - Optional project if viewing project-specific tasks
 * @returns The title string for the view
 */
export function getViewTitle(view: ViewType, project?: Project): string {
  if (project) {
    return project.name;
  }

  const titles: Record<ViewType, string> = {
    inbox: 'All',
    today: 'Today',
    upcoming: 'Next 7 days',
    kanban: 'Kanban',
    matrix: 'Eisenhower Matrix'
  };

  return titles[view] || 'Tasks';
}

/**
 * Get the description for the current view
 *
 * @param view - Current view type
 * @param project - Optional project if viewing project-specific tasks
 * @param currentDate - Optional current date for date-based views
 * @returns The description string for the view
 */
export function getViewDescription(view: ViewType, project?: Project, currentDate?: Date): string {
  if (project?.description) {
    return project.description;
  }

  const descriptions: Record<ViewType, string> = {
    inbox: 'Manage all your tasks in one place',
    today: currentDate ? new Date(currentDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) : 'Tasks for today',
    upcoming: 'Tasks due in the next 7 days',
    kanban: 'Organize tasks in columns by status',
    matrix: 'Prioritize tasks using the Eisenhower Matrix'
  };

  return descriptions[view] || 'Your tasks';
}

/**
 * Get the icon component for the current view
 *
 * @param view - Current view type
 * @returns The icon component for the view
 */
export function getViewIcon(view: ViewType): LucideIcon {
  const icons: Record<ViewType, LucideIcon> = {
    inbox: Inbox,
    today: Sun,
    upcoming: ArrowRight,
    kanban: Grid,
    matrix: Layers
  };

  return icons[view] || List;
}

/**
 * Get the icon color class for the current view
 *
 * @param view - Current view type
 * @returns The Tailwind color class for the icon
 */
export function getViewIconColor(view: ViewType): string {
  const colors: Record<ViewType, string> = {
    inbox: 'text-blue-500',
    today: 'text-orange-500',
    upcoming: 'text-green-500',
    kanban: 'text-indigo-500',
    matrix: 'text-rose-500'
  };

  return colors[view] || 'text-gray-500';
}

/**
 * Get the empty state message for the current view
 *
 * @param view - Current view type
 * @returns Object containing icon, title, and description for empty state
 */
export function getEmptyStateContent(view: ViewType): {
  icon: LucideIcon;
  title: string;
  description: string;
} {
  const Icon = getViewIcon(view);

  const content: Record<ViewType, { title: string; description: string }> = {
    inbox: {
      title: 'All clear!',
      description: 'All your tasks are organized'
    },
    today: {
      title: 'What do you need to get done today?',
      description: 'Add a task to get started'
    },
    upcoming: {
      title: 'No upcoming tasks',
      description: 'Enjoy your free time!'
    },
    kanban: {
      title: 'No tasks',
      description: 'Create your first task to get started'
    },
    matrix: {
      title: 'No tasks to prioritize',
      description: 'Add tasks to organize them by urgency and importance'
    }
  };

  return {
    icon: Icon,
    ...content[view]
  };
}
