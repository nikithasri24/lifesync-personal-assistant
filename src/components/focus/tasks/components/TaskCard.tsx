/**
 * Task Card Component
 * Displays a single task with all its details
 */

import React from 'react';
import { format, isPast } from 'date-fns';
import { CheckCircle, AlertCircle, Clock, Calendar, Star, Play, Edit } from 'lucide-react';
import type { TaskView, ProjectView } from '../types';
import { getPriorityColor, getStatusColor, getCategoryIcon, getTaskProgress } from '../utils';

interface TaskCardProps {
  task: TaskView;
  project?: ProjectView;
  activeFocusSession?: unknown;
  onToggleStatus: (taskId: string) => void;
  onStartFocus: (taskId: string, estimatedTime: number) => void;
  onEdit: (task: TaskView) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  project,
  activeFocusSession,
  onToggleStatus,
  onStartFocus,
  onEdit,
  onToggleSubtask
}) => {
  const progress = getTaskProgress(task);
  const isOverdue = task.dueDate && isPast(task.dueDate) && task.status !== 'completed';

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start space-x-4 flex-1">
          <button
            onClick={() => onToggleStatus(task.id)}
            className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
              task.status === 'completed'
                ? 'bg-green-500 border-green-500 text-white'
                : 'border-slate-300 dark:border-slate-600 hover:border-green-400'
            }`}
          >
            {task.status === 'completed' && <CheckCircle size={14} />}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-3 mb-2">
              <h3 className={`font-semibold ${task.status === 'completed' ? 'line-through text-slate-500' : 'text-slate-900 dark:text-white'}`}>
                {task.title}
              </h3>
              <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(task.priority)}`}>
                {task.priority}
              </span>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(task.status)}`}>
                {task.status.replace('_', ' ')}
              </span>
              {isOverdue && (
                <span className="flex items-center space-x-1 text-red-500 text-xs">
                  <AlertCircle size={12} />
                  <span>Overdue</span>
                </span>
              )}
            </div>

            {task.description && (
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">{task.description}</p>
            )}

            <div className="flex items-center space-x-4 text-xs text-slate-500 dark:text-slate-400">
              {project && (
                <span className="flex items-center space-x-1">
                  <span style={{ color: project.color }}>{project.icon}</span>
                  <span>{project.name}</span>
                </span>
              )}

              <span className="flex items-center space-x-1">
                {getCategoryIcon(task.category)}
                <span>{task.category}</span>
              </span>

              <span className="flex items-center space-x-1">
                <Clock size={12} />
                <span>{task.actualTime}m / {task.estimatedTime}m</span>
              </span>

              {task.dueDate && (
                <span className="flex items-center space-x-1">
                  <Calendar size={12} />
                  <span>{format(task.dueDate, 'MMM d')}</span>
                </span>
              )}

              <span className="flex items-center space-x-1">
                <Star size={12} />
                <span>Difficulty: {task.difficulty}/5</span>
              </span>
            </div>

            {task.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {task.tags.map((tag, index) => (
                  <span key={index} className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs rounded">
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Subtasks */}
            {task.subtasks.length > 0 && (
              <div className="mt-3 space-y-1">
                {task.subtasks.map((subtask) => (
                  <div key={subtask.id} className="flex items-center space-x-2">
                    <button
                      onClick={() => onToggleSubtask(task.id, subtask.id)}
                      className={`w-3 h-3 rounded border flex items-center justify-center ${
                        subtask.completed
                          ? 'bg-green-400 border-green-400 text-white'
                          : 'border-slate-300 dark:border-slate-600'
                      }`}
                    >
                      {subtask.completed && <CheckCircle size={8} />}
                    </button>
                    <span className={`text-sm ${subtask.completed ? 'line-through text-slate-500' : 'text-slate-700 dark:text-slate-300'}`}>
                      {subtask.title}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Progress Bar */}
            {progress > 0 && (
              <div className="mt-3">
                <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                  <span>Progress</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2 ml-4">
          <button
            onClick={() => onStartFocus(task.id, task.estimatedTime ?? 25)}
            disabled={!!activeFocusSession}
            className="flex items-center space-x-1 px-3 py-1 bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-400 text-white rounded-lg text-sm transition-colors"
          >
            <Play size={14} />
            <span>Focus</span>
          </button>

          <button
            onClick={() => onEdit(task)}
            className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            aria-label="Edit task"
          >
            <Edit size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
