/**
 * Individual task item component with inline editing and actions
 */
import React from 'react';
import { format, isToday } from 'date-fns';
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CalendarDays,
  IndentIncrease,
  Timer,
  Edit,
  MoreHorizontal
} from 'lucide-react';
import type { Task, Project } from '../types';
import { PRIORITY_FLAGS } from '../constants';
import { isOverdue } from '../services/taskHelpers';

interface TaskItemProps {
  task: Task;
  project?: Project;
  subtasks: Task[];
  isExpanded: boolean;
  isEditing: boolean;
  editText: string;
  pomodoroActive: boolean;
  onToggleStatus: () => void;
  onToggleExpansion: () => void;
  onStartEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onEditTextChange: (text: string) => void;
  onAddSubtask: () => void;
  onStartPomodoro: () => void;
  isUpdating: boolean;
}

export function TaskItem({
  task,
  project,
  subtasks,
  isExpanded,
  isEditing,
  editText,
  pomodoroActive,
  onToggleStatus,
  onToggleExpansion,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onEditTextChange,
  onAddSubtask,
  onStartPomodoro,
  isUpdating
}: TaskItemProps) {
  const taskIsOverdue = task.dueDate && isOverdue(task.dueDate, task.status);

  const getPriorityStyles = (priority: string): string => {
    switch (priority) {
      case 'urgent': return 'border-red-400 hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/20';
      case 'high': return 'border-orange-400 hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20';
      case 'medium': return 'border-blue-400 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20';
      default: return 'border-gray-300 hover:border-gray-400 hover:bg-gray-50 dark:border-slate-600 dark:hover:bg-slate-700';
    }
  };

  return (
    <div className="mb-2">
      <div className="group flex items-start px-6 py-3 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
        {/* Expand/Collapse button for tasks with subtasks */}
        {subtasks.length > 0 && (
          <button
            onClick={onToggleExpansion}
            className="p-1 mr-2 hover:bg-gray-200 dark:hover:bg-slate-600 rounded transition-colors"
          >
            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
        )}
        {subtasks.length === 0 && <div className="w-6"></div>}

        {/* Checkbox */}
        <button
          onClick={onToggleStatus}
          disabled={isUpdating}
          className={`mt-1 mr-4 w-5 h-5 rounded border-2 flex items-center justify-center transition-all disabled:opacity-50 ${
            task.status === 'done'
              ? 'bg-blue-500 border-blue-500 text-white'
              : getPriorityStyles(task.priority)
          }`}
        >
          {task.status === 'done' && <CheckCircle2 size={12} />}
        </button>

        {/* Task Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-2">
            {isEditing ? (
              <input
                type="text"
                value={editText}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => onEditTextChange(e.target.value)}
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                  if (e.key === 'Enter') onSaveEdit();
                  if (e.key === 'Escape') onCancelEdit();
                }}
                onBlur={onSaveEdit}
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
                onClick={onStartEdit}
              >
                {task.title}
              </span>
            )}

            {/* Priority flag */}
            {task.priority !== 'low' && PRIORITY_FLAGS[task.priority]}
          </div>

          {/* Task metadata */}
          {(task.description ?? task.dueDate ?? project ?? task.tags.length > 0) && (
            <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-slate-400 ml-2">
              {task.description && (
                <span className="truncate max-w-xs text-gray-600 dark:text-slate-400">
                  {task.description}
                </span>
              )}

              {task.dueDate && (
                <span
                  className={`flex items-center space-x-1.5 px-2 py-1 rounded ${
                    taskIsOverdue
                      ? 'text-red-600 bg-red-50'
                      : 'text-green-600 bg-green-50'
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
                    style={{ backgroundColor: project.color }}
                  ></div>
                  <span className="text-gray-700 dark:text-gray-300 font-medium">
                    {project.name}
                  </span>
                </span>
              )}

              {task.tags.map((tag) => (
                <span
                  key={`tag-${tag}`}
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
            onClick={onAddSubtask}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md text-gray-400 hover:text-gray-600 dark:text-slate-400 transition-colors"
            title="Add Subtask"
          >
            <IndentIncrease size={14} />
          </button>
          <button
            onClick={onStartPomodoro}
            className={`p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md transition-colors ${
              pomodoroActive
                ? 'text-red-600 bg-red-100'
                : 'text-gray-400 hover:text-gray-600'
            } dark:text-slate-400`}
            title="Start Pomodoro"
          >
            <Timer size={14} />
          </button>
          <button
            onClick={onStartEdit}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md text-gray-400 hover:text-gray-600 dark:text-slate-400 transition-colors"
            title="Edit"
            aria-label="Edit task"
          >
            <Edit size={14} />
          </button>
          <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md text-gray-400 hover:text-gray-600 dark:text-slate-400 transition-colors" aria-label="More options">
            <MoreHorizontal size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
