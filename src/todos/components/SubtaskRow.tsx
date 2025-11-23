/**
 * SubtaskRow Component
 *
 * Displays an individual subtask with a smaller checkbox and edit button.
 * Used within expanded parent tasks to show subtask hierarchies.
 */

import React from 'react';
import { CheckCircle2, Edit } from 'lucide-react';
import type { Task } from '../types';

interface SubtaskRowProps {
  /** The subtask to display */
  subtask: Task;
  /** Called when the subtask status is toggled */
  onToggleStatus: (id: string) => void;
  /** Called when the edit button is clicked */
  onStartEdit: (task: Task) => void;
  /** Whether an update is in progress */
  isUpdating: boolean;
}

/**
 * SubtaskRow - Individual subtask display with smaller styling
 */
export function SubtaskRow({
  subtask,
  onToggleStatus,
  onStartEdit,
  isUpdating
}: SubtaskRowProps): React.ReactElement {
  const getPriorityBorderClass = (priority: Task['priority'], status: Task['status']): string => {
    if (status === 'done') {
      return 'bg-blue-500 border-blue-500 text-white';
    }

    switch (priority) {
      case 'urgent':
        return 'border-red-400 hover:border-red-500';
      case 'high':
        return 'border-orange-400 hover:border-orange-500';
      case 'medium':
        return 'border-blue-400 hover:border-blue-500';
      default:
        return 'border-gray-300 hover:border-gray-400';
    }
  };

  return (
    <div className="group flex items-start py-2 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors rounded-md px-2">
      {/* Smaller checkbox for subtasks */}
      <button
        onClick={() => onToggleStatus(subtask.id)}
        disabled={isUpdating}
        className={`mt-1 mr-3 w-4 h-4 rounded border-2 flex items-center justify-center transition-all disabled:opacity-50 ${getPriorityBorderClass(subtask.priority, subtask.status)}`}
      >
        {subtask.status === 'done' && <CheckCircle2 size={8} />}
      </button>

      {/* Subtask title */}
      <div className="flex-1 min-w-0">
        <span className={`text-sm ${subtask.status === 'done' ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}>
          {subtask.title}
        </span>
      </div>

      {/* Edit button */}
      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onStartEdit(subtask)}
          className="p-1 hover:bg-gray-200 dark:hover:bg-slate-700 rounded text-gray-400 hover:text-gray-600 transition-colors"
        >
          <Edit size={12} />
        </button>
      </div>
    </div>
  );
}
