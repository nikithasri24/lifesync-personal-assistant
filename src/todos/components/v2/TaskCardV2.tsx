/**
 * TaskCardV2 Component
 * Minimal task card with terracotta theme
 * Features:
 * - 32px circular checkbox with terracotta gradient
 * - Task title
 * - Priority badge
 * - Due date with clock icon
 * - Colored left border based on priority
 * - Hover animation
 */

import React from 'react';
import { Clock } from 'lucide-react';
import { format, isToday, isPast, isTomorrow } from 'date-fns';
import { CheckboxV2 } from '../../../components/v2/CheckboxV2';
import { PriorityBadgeV2 } from './PriorityBadgeV2';
import { useThemeColors } from '../../../hooks/useThemeColors';
import type { Task, TaskPriority } from '../../../types/task';

export interface TaskCardV2Props {
  task: Task;
  onToggleStatus: (taskId: string) => void;
  onTaskClick?: (taskId: string) => void;
  isUpdating?: boolean;
  className?: string;
}

const priorityBorderColors: Record<TaskPriority, string> = {
  urgent: '#F44336',
  high: '#FF9800',
  medium: '#FFC107',
  low: '#4CAF50',
};

const formatDueDate = (dueDate: Date | undefined): string | null => {
  if (!dueDate) return null;

  const date = dueDate;

  if (isToday(date)) {
    return 'Due today';
  } else if (isTomorrow(date)) {
    return 'Due tomorrow';
  } else if (isPast(date)) {
    return `Overdue ${format(date, 'MMM d')}`;
  } else {
    return `Due ${format(date, 'MMM d')}`;
  }
};

export const TaskCardV2: React.FC<TaskCardV2Props> = ({
  task,
  onToggleStatus,
  onTaskClick,
  isUpdating = false,
  className = '',
}) => {
  const colors = useThemeColors();
  const isCompleted = task.status === 'done';
  const borderColor = priorityBorderColors[task.priority || 'medium'];
  const dueDateText = formatDueDate(task.dueDate);

  return (
    <div
      className={`
        rounded-xl p-3 flex items-start gap-3
        transition-all duration-200
        hover:shadow-md hover:scale-[1.01]
        ${className}
      `}
      style={{
        backgroundColor: colors.bg.white,
        borderLeft: `3px solid ${borderColor}`,
        boxShadow: '0 1px 4px rgba(139, 111, 71, 0.06)',
        opacity: isCompleted ? 0.6 : 1,
      }}
    >
      {/* Checkbox */}
      <CheckboxV2
        checked={isCompleted}
        onChange={() => onToggleStatus(task.id)}
        disabled={isUpdating}
        size="md"
      />

      {/* Task Content */}
      <div
        className="flex-1 min-w-0 cursor-pointer"
        onClick={() => onTaskClick?.(task.id)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            onTaskClick?.(task.id);
          }
        }}
      >
        {/* Title */}
        <div
          className={`text-sm font-medium mb-1 ${isCompleted ? 'line-through' : ''}`}
          style={{ color: isCompleted ? colors.text.tertiary : colors.text.primary }}
        >
          {task.title}
        </div>

        {/* Meta Information */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Priority Badge */}
          {task.priority && (
            <PriorityBadgeV2 priority={task.priority} size="sm" />
          )}

          {/* Tags */}
          {task.tags.length > 0 && (
            <span
              className="px-2 py-0.5 rounded-lg font-semibold"
              style={{
                backgroundColor: colors.badge.bg,
                color: colors.badge.text,
              }}
            >
              {task.tags[0]}
            </span>
          )}

          {/* Due Date */}
          {dueDateText && (
            <span
              className="flex items-center gap-1"
              style={{ color: colors.text.tertiary }}
            >
              <Clock className="w-3 h-3" />
              {dueDateText}
            </span>
          )}

          {/* Time Estimate */}
          {task.estimatedTime && (
            <span style={{ color: colors.text.tertiary }}>
              ⏱️ {task.estimatedTime}m
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskCardV2;
