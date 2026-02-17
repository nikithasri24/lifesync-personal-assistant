/**
 * Permission Badge Component
 * Displays a module permission badge with icon and permission level
 */

import React from 'react';
import type { ShareableModule, PermissionLevel } from '../types';

interface PermissionBadgeProps {
  module: ShareableModule;
  permission: PermissionLevel;
}

const MODULE_ICONS: Record<ShareableModule, string> = {
  meals: '🍽️',
  shopping: '🛒',
  tasks: '✓',
  finances: '💰',
  habits: '🎯',
  goals: '🏆',
  travel: '✈️',
  journal: '📔',
  notes: '📝',
  calendar: '📅',
};

const MODULE_LABELS: Record<ShareableModule, string> = {
  meals: 'Meals',
  shopping: 'Shopping',
  tasks: 'Tasks',
  finances: 'Finances',
  habits: 'Habits',
  goals: 'Goals',
  travel: 'Travel',
  journal: 'Journal',
  notes: 'Notes',
  calendar: 'Calendar',
};

export function PermissionBadge({ module, permission }: PermissionBadgeProps) {
  const getPermissionStyles = () => {
    switch (permission) {
      case 'merged':
        return 'bg-green-100 text-green-700';
      case 'edit':
        return 'bg-purple-100 text-purple-700';
      case 'view':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-500';
    }
  };

  if (permission === 'off') return null;

  return (
    <div
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold ${getPermissionStyles()}`}
    >
      <span>{MODULE_ICONS[module]}</span>
      <span>{MODULE_LABELS[module]}</span>
    </div>
  );
}
