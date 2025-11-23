/**
 * TaskRow Component
 *
 * Displays an individual task row with all interactions.
 * Handles checkbox, priority, editing, metadata display, and action buttons.
 */

import React from 'react';
import {
  CheckCircle2,
  Edit,
  Timer,
  MoreHorizontal,
  IndentIncrease,
  ChevronDown,
  ChevronRight,
  CalendarDays
} from 'lucide-react';
import { format, isToday } from 'date-fns';
import type { Task, Project, PomodoroTimer } from '../types';
import { PRIORITY_FLAGS } from '../constants';
import { isOverdue } from '../services/taskHelpers';

interface TaskRowProps {
  /** The task to display */
  task: Task;
  /** The project this task belongs to */
  project?: Project;
  /** Whether this task is being edited */
  isEditing: boolean;
  /** Current edit text value */
  editText: string;
  /** Called when edit text changes */
  onEditChange: (text: string) => void;
  /** Called when task status is toggled */
  onToggleStatus: (taskId: string) => void;
  /** Called when edit mode is started */
  onStartEdit: (task: Task) => void;
  /** Called when edit is saved */
  onSaveEdit: (taskId: string) => void;
  /** Called when edit is cancelled */
  onCancelEdit: () => void;
  /** Called when pomodoro is started for this task */
  onStartPomodoro: (taskId: string) => void;
  /** Called when add subtask button is clicked */
  onAddSubtask: (taskId: string) => void;
  /** Called when expand/collapse button is clicked */
  onToggleExpansion: (taskId: string) => void;
  /** Current pomodoro timer state */
  pomodoroTimer: PomodoroTimer;
  /** Whether an update is in progress */
  isUpdating: boolean;
  /** Whether this task is expanded (showing subtasks) */
  isExpanded: boolean;
  /** Whether this task has subtasks */
  hasSubtasks: boolean;
}

/**
 * TaskRow - Individual task display with full interaction support
 */
export function TaskRow({
  task,
  project,
  isEditing,
  editText,
  onEditChange,
  onToggleStatus,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onStartPomodoro,
  onAddSubtask,
  onToggleExpansion,
  pomodoroTimer,
  isUpdating,
  isExpanded,
  hasSubtasks
}: TaskRowProps): React.ReactElement {
  const taskIsOverdue = task.dueDate && isOverdue(task.dueDate, task.status);

  const getPriorityBorderClass = (): string => {
    if (task.status === 'done') {
      return 'bg-blue-500 border-blue-500 text-white';
    }

    switch (task.priority) {
      case 'urgent':
        return 'border-red-400 hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/20';
      case 'high':
        return 'border-orange-400 hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20';
      case 'medium':
        return 'border-blue-400 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20';
      default:
        return 'border-gray-300 hover:border-gray-400 hover:bg-gray-50 dark:border-slate-600 dark:hover:bg-slate-700';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      onSaveEdit(task.id);
    }
    if (e.key === 'Escape') {
      onCancelEdit();
    }
  };

  return (
    <div className="group flex items-start px-6 py-3 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
      {/* Expand/Collapse button for tasks with subtasks */}
      {hasSubtasks ? (
        <button
          onClick={() => onToggleExpansion(task.id)}
          className="p-1 mr-2 hover:bg-gray-200 dark:hover:bg-slate-600 rounded transition-colors"
        >
          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>
      ) : (
        <div className="w-6"></div>
      )}

      {/* Checkbox */}
      <button
        onClick={() => onToggleStatus(task.id)}
        disabled={isUpdating}
        className={`mt-1 mr-4 w-5 h-5 rounded border-2 flex items-center justify-center transition-all disabled:opacity-50 ${getPriorityBorderClass()}`}
      >
        {task.status === 'done' && <CheckCircle2 size={12} />}
      </button>

      {/* Task Content */}
      <div className="flex-1 min-w-0">
        {/* Title and Priority */}
        <div className="flex items-center space-x-2 mb-2">
          {isEditing ? (
            <input
              type="text"
              value={editText}
              onChange={(e) => onEditChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={() => onSaveEdit(task.id)}
              disabled={isUpdating}
              className="flex-1 text-sm bg-transparent border-none outline-none focus:bg-white dark:focus:bg-slate-700 rounded px-2 py-1 disabled:opacity-50"
              autoFocus
            />
          ) : (
            <span
              className={`text-base cursor-pointer font-normal ${
                task.status === 'done'
                  ? 'line-through text-gray-400'
                  : 'text-gray-800 dark:text-white'
              } hover:bg-gray-100 dark:hover:bg-slate-700 rounded px-2 py-1 -mx-2`}
              onClick={() => onStartEdit(task)}
            >
              {task.title}
            </span>
          )}

          {/* Priority flag */}
          {task.priority !== 'low' && PRIORITY_FLAGS[task.priority]}
        </div>

        {/* Task metadata */}
        {(task.description ?? false) || (task.dueDate ?? false) || (project ?? false) || (task.tags.length > 0) && (
          <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-slate-400 ml-2">
            {task.description && (
              <span className="truncate max-w-xs text-gray-600 dark:text-slate-400">
                {task.description}
              </span>
            )}

            {task.dueDate && (
              <span
                className={`flex items-center space-x-1.5 px-2 py-1 rounded ${
                  taskIsOverdue ? 'text-red-600 bg-red-50' : 'text-green-600 bg-green-50'
                }`}
              >
                <CalendarDays size={12} />
                <span className="font-medium">
                  {isToday(task.dueDate) ? 'Today' : format(task.dueDate, 'MMM d')}
                </span>
              </span>
            )}

            {project && (
              <span className="flex items-center space-x-1.5 px-2 py-1 bg-gray-100 dark:bg-slate-700 rounded">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: project.color ?? 'defaultColor' }}
                ></div>
                <span className="text-gray-700 dark:text-gray-300 font-medium">{project.name}</span>
              </span>
            )}

            {task.tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 rounded bg-blue-50 dark:bg-slate-700 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-slate-600 transition-colors"
              >
                <span className="text-blue-500 mr-1 text-xs">#</span>
                <span className="font-medium">{tag}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity ml-3">
        <button
          onClick={() => onAddSubtask(task.id)}
          className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md text-gray-400 hover:text-gray-600 dark:text-slate-400 transition-colors"
          title="Add Subtask"
        >
          <IndentIncrease size={14} />
        </button>
        <button
          onClick={() => onStartPomodoro(task.id)}
          className={`p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md transition-colors ${
            pomodoroTimer.taskId === task.id ? 'text-red-600 bg-red-100' : 'text-gray-400 hover:text-gray-600'
          } dark:text-slate-400`}
          title="Start Pomodoro"
        >
          <Timer size={14} />
        </button>
        <button
          onClick={() => onStartEdit(task)}
          className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md text-gray-400 hover:text-gray-600 dark:text-slate-400 transition-colors"
          title="Edit"
        >
          <Edit size={14} />
        </button>
        <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md text-gray-400 hover:text-gray-600 dark:text-slate-400 transition-colors">
          <MoreHorizontal size={14} />
        </button>
      </div>
    </div>
  );
}