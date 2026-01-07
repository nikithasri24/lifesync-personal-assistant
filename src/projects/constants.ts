/**
 * Projects Domain Constants
 */

export const STATUS_CONFIG = {
  planning: {
    label: 'Planning',
    className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  },
  active: {
    label: 'Active',
    className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  },
  'on-hold': {
    label: 'On Hold',
    className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  },
  completed: {
    label: 'Completed',
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  },
  archived: {
    label: 'Archived',
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  },
} as const;

export const DEFAULT_PROJECT_COLOR = '#6366f1';
export const DEFAULT_PROJECT_ICON = '📁';
