/**
 * Projects Domain Constants
 */

export const STATUS_CONFIG = {
  active: {
    label: 'Active',
    className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  },
  completed: {
    label: 'Completed',
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  },
  on_hold: {
    label: 'On Hold',
    className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  },
} as const;

export const DEFAULT_PROJECT_COLOR = '#6366f1';
export const DEFAULT_PROJECT_ICON = '📁';
