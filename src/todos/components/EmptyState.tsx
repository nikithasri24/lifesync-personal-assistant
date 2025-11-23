/**
 * EmptyState Component
 *
 * Displays a friendly empty state message when there are no tasks to show.
 * Provides view-specific messaging and icons.
 */

import React from 'react';
import { Sun, Inbox, ArrowRight } from 'lucide-react';
import type { ViewType } from '../types';

interface EmptyStateProps {
  /** Current view type to determine messaging */
  currentView: ViewType;
  /** Optional custom icon */
  icon?: React.ReactNode;
  /** Optional custom title */
  title?: string;
  /** Optional custom description */
  description?: string;
}

/**
 * EmptyState - Display when there are no tasks to show
 */
export function EmptyState({
  currentView,
  icon,
  title,
  description
}: EmptyStateProps): React.ReactElement {
  // Default content based on view type
  const getDefaultContent = (): {
    icon: React.ReactNode;
    title: string;
    description: string;
  } => {
    switch (currentView) {
      case 'today':
        return {
          icon: <Sun className="w-12 h-12 mx-auto text-orange-300" />,
          title: 'What do you need to get done today?',
          description: 'Add a task to get started'
        };
      case 'inbox':
        return {
          icon: <Inbox className="w-12 h-12 mx-auto text-blue-300" />,
          title: 'All clear!',
          description: 'All your tasks are organized'
        };
      case 'upcoming':
        return {
          icon: <ArrowRight className="w-12 h-12 mx-auto text-green-300" />,
          title: 'No upcoming tasks',
          description: 'Enjoy your free time!'
        };
      default:
        return {
          icon: <Inbox className="w-12 h-12 mx-auto text-blue-300" />,
          title: 'No tasks found',
          description: 'Try adjusting your filters'
        };
    }
  };

  const defaultContent = getDefaultContent();
  const displayIcon = icon ?? defaultContent.icon;
  const displayTitle = title ?? defaultContent.title;
  const displayDescription = description ?? defaultContent.description;

  return (
    <div className="text-center py-16 px-6">
      <div className="text-gray-400 dark:text-slate-500 mb-6">
        <div className="space-y-3">
          {displayIcon}
          <p className="text-lg font-medium">{displayTitle}</p>
          <p className="text-sm">{displayDescription}</p>
        </div>
      </div>
    </div>
  );
}
