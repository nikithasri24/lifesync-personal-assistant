/**
 * ListView Component
 * Spreadsheet-style task list with inline editing
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Edit2, Trash2, Play, MoreHorizontal } from 'lucide-react';
import { format } from 'date-fns';
import type { ScheduledTask, ListConfig, TeamMember } from '../types';

interface ListViewProps {
  tasks: ScheduledTask[];
  config: ListConfig;
  teamMembers?: TeamMember[];
  onTaskClick?: (task: ScheduledTask) => void;
  onTaskUpdate?: (taskId: string, updates: Partial<ScheduledTask>) => void;
  onTaskDelete?: (taskId: string) => void;
  onStartTimer?: (taskId: string) => void;
  onSortChange?: (sortBy: string, direction: 'asc' | 'desc') => void;
  className?: string;
}

export const ListView: React.FC<ListViewProps> = ({
  tasks,
  config,
  teamMembers = [],
  onTaskClick,
  onTaskUpdate,
  onTaskDelete,
  onStartTimer,
  onSortChange,
  className = '',
}) => {
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [editingCell, setEditingCell] = useState<{ taskId: string; field: string } | null>(null);

  const priorityColors = {
    urgent: 'text-red-600 dark:text-red-400',
    high: 'text-orange-600 dark:text-orange-400',
    medium: 'text-yellow-600 dark:text-yellow-400',
    low: 'text-slate-600 dark:text-slate-400',
  };

  const statusBadges = {
    todo: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
    in_progress: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    done: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
    waiting: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
    scheduled: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
  };

  const handleSelectTask = (taskId: string) => {
    const newSelection = new Set(selectedTasks);
    if (newSelection.has(taskId)) {
      newSelection.delete(taskId);
    } else {
      newSelection.add(taskId);
    }
    setSelectedTasks(newSelection);
  };

  const handleSelectAll = () => {
    if (selectedTasks.size === tasks.length) {
      setSelectedTasks(new Set());
    } else {
      setSelectedTasks(new Set(tasks.map(t => t.id)));
    }
  };

  const handleSort = (field: string) => {
    const newDirection = config.sortDirection === 'asc' ? 'desc' : 'asc';
    onSortChange?.(field, newDirection);
  };

  const renderCell = (task: ScheduledTask, field: string) => {
    switch (field) {
      case 'title':
        return (
          <div className="font-medium text-slate-900 dark:text-slate-100 truncate">
            {task.title}
          </div>
        );

      case 'status':
        return (
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusBadges[task.status]}`}>
            {task.status.replace('_', ' ')}
          </span>
        );

      case 'priority':
        return (
          <span className={`font-medium capitalize ${priorityColors[task.priority]}`}>
            {task.priority}
          </span>
        );

      case 'dueDate':
        return task.due_date ? (
          <span className="text-sm text-slate-600 dark:text-slate-400">
            {format(new Date(task.due_date), 'MMM d, yyyy')}
          </span>
        ) : (
          <span className="text-xs text-slate-400">No date</span>
        );

      case 'assignees':
        if (!task.assignees || task.assignees.length === 0) {
          return <span className="text-xs text-slate-400">Unassigned</span>;
        }
        return (
          <div className="flex -space-x-2">
            {task.assignees.slice(0, 3).map((assignee) => (
              <div
                key={assignee.id}
                className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 border-2 border-white dark:border-slate-900 flex items-center justify-center text-xs font-medium text-white"
                title={assignee.name}
              >
                {assignee.name.charAt(0).toUpperCase()}
              </div>
            ))}
          </div>
        );

      case 'estimatedTime':
        return task.estimated_time ? (
          <span className="text-sm text-slate-600 dark:text-slate-400">
            {Math.floor(task.estimated_time / 60)}h {task.estimated_time % 60}m
          </span>
        ) : (
          <span className="text-xs text-slate-400">-</span>
        );

      case 'progress':
        return (
          <div className="w-full max-w-[100px]">
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all"
                  style={{ width: `${task.progress || 0}%` }}
                />
              </div>
              <span className="text-xs text-slate-600 dark:text-slate-400 w-8 text-right">
                {task.progress || 0}%
              </span>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`flex flex-col h-full bg-white dark:bg-slate-900 ${className}`}>
      {/* Table Header */}
      <div className="overflow-x-auto flex-1">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 z-10">
            <tr>
              {/* Checkbox Column */}
              <th className="w-12 px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedTasks.size === tasks.length && tasks.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
                />
              </th>

              {/* Dynamic Columns */}
              {config.columns.map((column) => (
                <th
                  key={column.id}
                  className="px-4 py-3 text-left"
                  style={{ width: column.width }}
                >
                  <button
                    onClick={() => column.sortable && handleSort(column.field as string)}
                    className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                  >
                    {column.label}
                    {column.sortable && (
                      <div className="flex flex-col">
                        <ChevronUp className={`w-3 h-3 -mb-1 ${config.sortDirection === 'asc' ? 'text-blue-600' : 'text-slate-400'}`} />
                        <ChevronDown className={`w-3 h-3 ${config.sortDirection === 'desc' ? 'text-blue-600' : 'text-slate-400'}`} />
                      </div>
                    )}
                  </button>
                </th>
              ))}

              {/* Actions Column */}
              <th className="w-32 px-4 py-3 text-left">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Actions
                </span>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {tasks.length === 0 ? (
              <tr>
                <td colSpan={config.columns.length + 2} className="px-4 py-12 text-center">
                  <p className="text-sm text-slate-500 dark:text-slate-400">No tasks found</p>
                </td>
              </tr>
            ) : (
              tasks.map((task) => (
                <tr
                  key={task.id}
                  className={`
                    hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer
                    ${selectedTasks.has(task.id) ? 'bg-blue-50 dark:bg-blue-900/10' : ''}
                  `}
                  onClick={() => onTaskClick?.(task)}
                >
                  {/* Checkbox */}
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedTasks.has(task.id)}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleSelectTask(task.id);
                      }}
                      className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
                    />
                  </td>

                  {/* Dynamic Columns */}
                  {config.columns.map((column) => (
                    <td key={column.id} className="px-4 py-3">
                      {column.render ? column.render(task) : renderCell(task, column.field as string)}
                    </td>
                  ))}

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {task.status === 'in_progress' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onStartTimer?.(task.id);
                          }}
                          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
                          title="Start timer"
                        >
                          <Play className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // Handle edit
                        }}
                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
                        title="Edit task"
                      >
                        <Edit2 className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onTaskDelete?.(task.id);
                        }}
                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
                        title="Delete task"
                      >
                        <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                      </button>
                      <button
                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
                        title="More actions"
                      >
                        <MoreHorizontal className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Bulk Actions Bar */}
      {selectedTasks.size > 0 && (
        <div className="border-t border-slate-200 dark:border-slate-700 px-6 py-3 bg-blue-50 dark:bg-blue-900/20">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
              {selectedTasks.size} task{selectedTasks.size > 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 rounded transition-colors">
                Update Status
              </button>
              <button className="px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 rounded transition-colors">
                Assign
              </button>
              <button className="px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-white dark:hover:bg-slate-800 rounded transition-colors">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
