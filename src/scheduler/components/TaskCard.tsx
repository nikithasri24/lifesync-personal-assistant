/**
 * TaskCard Component
 * Professional task card for board view with all key information
 */

import React from 'react';
import {
  Clock,
  User,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Link2,
  MessageSquare,
  Paperclip,
  Play,
  Flag,
  MoreHorizontal,
} from 'lucide-react';
import { format, formatDistanceToNow, isPast } from 'date-fns';
import type { ScheduledTask, TeamMember } from '../types';

interface TaskCardProps {
  task: ScheduledTask;
  assignees?: TeamMember[];
  isSelected?: boolean;
  isDragging?: boolean;
  onSelect?: () => void;
  onClick?: () => void;
  onStartTimer?: () => void;
  onQuickEdit?: () => void;
  className?: string;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  assignees = [],
  isSelected = false,
  isDragging = false,
  onSelect,
  onClick,
  onStartTimer,
  onQuickEdit,
  className = '',
}) => {
  const scheduleDate = task.scheduled_start
    ? new Date(task.scheduled_start)
    : task.due_date
      ? new Date(task.due_date)
      : null;
  const isOverdue = scheduleDate ? isPast(scheduleDate) && task.status !== 'done' : false;
  const hasComments = (task.comments?.length || 0) > 0;
  const hasAttachments = (task.attachments?.length || 0) > 0;
  const hasDependencies = (task.dependencies?.length || 0) > 0;
  const isBlocked = task.is_blocked || (task.blockedBy?.length || 0) > 0;
  const progress = task.progress || 0;

  // Simple priority-based logic
  const isImportant = task.priority === 'important';

  // Priority colors - Border and background for urgency
  const priorityColors = {
    important: 'border-blue-500 dark:border-blue-400',
    urgent: 'border-red-500 dark:border-red-400',
    high: 'border-orange-500 dark:border-orange-400',
    medium: 'border-yellow-500 dark:border-yellow-400',
    low: 'border-gray-300 dark:border-gray-500',
  };

  const priorityDotColors = {
    important: 'bg-blue-500',
    urgent: 'bg-red-500',
    high: 'bg-orange-500',
    medium: 'bg-yellow-500',
    low: 'bg-slate-400',
  };

  const statusColors = {
    todo: 'text-slate-600 dark:text-slate-400',
    in_progress: 'text-blue-600 dark:text-blue-400',
    done: 'text-green-600 dark:text-green-400',
    waiting: 'text-yellow-600 dark:text-yellow-400',
    scheduled: 'text-purple-600 dark:text-purple-400',
  };

  return (
    <div
      className={`
        group relative rounded-lg shadow-md overflow-hidden
        transition-all duration-200 hover:shadow-xl
        ${isImportant
          ? 'bg-gradient-to-br from-blue-500 to-blue-600 border-2 border-blue-700'
          : 'bg-white dark:bg-gray-800 border-l-4'
        }
        ${!isImportant && task.priority ? priorityColors[task.priority] || '' : ''}
        ${isSelected ? 'ring-2 ring-blue-500 dark:ring-blue-400 ring-offset-2' : ''}
        ${isDragging ? 'opacity-50 rotate-2 scale-105' : ''}
        ${isBlocked ? 'opacity-75' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {/* Important Header Banner */}
      {isImportant && (
        <div className="bg-blue-700 px-3 py-1 flex items-center gap-2">
          <span className="text-lg">⭐</span>
          <span className="text-xs font-bold text-white uppercase tracking-wide">Important</span>
        </div>
      )}

      {/* Card Content Wrapper */}
      <div className={isImportant ? 'bg-white dark:bg-gray-800' : ''}>

      {/* Card Header */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          {/* Title */}
          <div className="flex-1 min-w-0">
            <h4
              className={`
                text-sm font-bold line-clamp-2 text-gray-900 dark:text-white
                ${task.status === 'done' ? 'line-through opacity-60' : ''}
              `}
            >
              {task.title}
            </h4>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            {task.starred && (
              <span className="text-yellow-500">⭐</span>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onQuickEdit?.();
              }}
              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-opacity"
            >
              <MoreHorizontal className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        </div>

        {/* Description */}
        {task.description && (
          <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-2 mb-2">
            {task.description}
          </p>
        )}

        {/* Tags */}
        {task.tags && task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {task.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 text-xs rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-medium"
              >
                {tag}
              </span>
            ))}
            {task.tags.length > 3 && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-medium">
                +{task.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Progress Bar */}
        {progress > 0 && progress < 100 && (
          <div className="mb-2">
            <div className="flex items-center justify-between text-xs text-gray-700 dark:text-gray-300 mb-1">
              <span className="font-semibold">Progress</span>
              <span className="font-bold">{progress}%</span>
            </div>
            <div className="h-1.5 bg-slate-300 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Metadata Row 1: Scheduled/Due date, Estimate, Priority */}
        <div className="flex items-center gap-3 text-xs text-gray-700 dark:text-gray-300 font-medium mb-2">
          {/* Scheduled/Due Date */}
          {scheduleDate && (
            <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-600 dark:text-red-400 font-bold' : ''}`}>
              <Calendar className="w-3 h-3" />
              <span title={format(scheduleDate, 'PPP')}>
                {formatDistanceToNow(scheduleDate, { addSuffix: true })}
              </span>
            </div>
          )}

          {/* Estimated Time */}
          {task.estimated_time != null && task.estimated_time > 0 && (
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{Math.floor(task.estimated_time / 60)}h {task.estimated_time % 60}m</span>
            </div>
          )}

          {/* Priority Indicator */}
          {task.priority && (
            <div className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${priorityDotColors[task.priority] || 'bg-slate-300'}`} />
              <span className="capitalize">{task.priority}</span>
            </div>
          )}
        </div>

        {/* Metadata Row 2: Assignees, Comments, Attachments, Dependencies */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Assignees */}
            {assignees.length > 0 && (
              <div className="flex -space-x-2">
                {assignees.slice(0, 3).map((assignee) => (
                  <div
                    key={assignee.id}
                    className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 border-2 border-white dark:border-slate-800 flex items-center justify-center text-xs font-medium text-white"
                    title={assignee.name}
                  >
                    {assignee.avatar ? (
                      <img src={assignee.avatar} alt={assignee.name} className="w-full h-full rounded-full" />
                    ) : (
                      assignee.name.charAt(0).toUpperCase()
                    )}
                  </div>
                ))}
                {assignees.length > 3 && (
                  <div className="w-6 h-6 rounded-full bg-slate-300 dark:bg-slate-600 border-2 border-white dark:border-slate-800 flex items-center justify-center text-xs font-medium text-slate-700 dark:text-slate-300">
                    +{assignees.length - 3}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Blocked Indicator */}
            {isBlocked && (
              <div className="flex items-center gap-1 text-red-600 dark:text-red-400" title="Task is blocked">
                <AlertCircle className="w-3.5 h-3.5" />
              </div>
            )}

            {/* Dependencies */}
            {hasDependencies && (
              <div className="flex items-center gap-1 text-slate-500" title="Has dependencies">
                <Link2 className="w-3.5 h-3.5" />
                <span className="text-xs">{task.dependencies?.length}</span>
              </div>
            )}

            {/* Comments */}
            {hasComments && (
              <div className="flex items-center gap-1 text-slate-500" title="Has comments">
                <MessageSquare className="w-3.5 h-3.5" />
                <span className="text-xs">{task.comments?.length}</span>
              </div>
            )}

            {/* Attachments */}
            {hasAttachments && (
              <div className="flex items-center gap-1 text-slate-500" title="Has attachments">
                <Paperclip className="w-3.5 h-3.5" />
                <span className="text-xs">{task.attachments?.length}</span>
              </div>
            )}
          </div>
        </div>
      </div>

        {/* Time Tracking Quick Action */}
        {task.status === 'in_progress' && onStartTimer && (
          <div className="border-t border-slate-200 dark:border-slate-700 px-3 py-2 bg-slate-50 dark:bg-slate-900/50">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStartTimer();
              }}
              className="w-full flex items-center justify-center gap-2 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Start Timer</span>
            </button>
          </div>
        )}
      </div>

      {/* Status Indicator */}
      {task.status === 'done' && (
        <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-1">
          <CheckCircle2 className="w-4 h-4" />
        </div>
      )}

      {/* Overdue Badge */}
      {isOverdue && !isImportant && (
        <div className="absolute -top-2 -left-2 bg-red-600 text-white rounded-full px-2 py-0.5 text-xs font-bold shadow-lg">
          OVERDUE
        </div>
      )}
    </div>
  );
};
