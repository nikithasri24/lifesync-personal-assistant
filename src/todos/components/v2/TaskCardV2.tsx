/**
 * TaskCardV2 Component
 * Enhanced task card with all features
 * Features:
 * - 32px circular checkbox with terracotta gradient
 * - Task title
 * - Priority badge
 * - Status badge
 * - Project badge
 * - Due date with clock icon
 * - Subtask count
 * - Recurring indicator
 * - Owner badge (merged mode)
 * - Colored left border based on priority
 * - Hover animation
 */

import React from 'react';
import { Clock, Repeat, User } from 'lucide-react';
import { format, isToday, isPast, isTomorrow } from 'date-fns';
import { CheckboxV2 } from '../../../components/v2/CheckboxV2';
import { PriorityBadgeV2 } from './PriorityBadgeV2';
import { StatusBadgeV2 } from './StatusBadgeV2';
import { ProjectBadgeV2 } from './ProjectBadgeV2';
import { useThemeColors } from '../../../hooks/useThemeColors';
import type { TaskData, ProjectData } from '../../../services/types';

export interface TaskCardV2Props {
  task: TaskData;
  onToggleStatus: (taskId: string) => void;
  onTaskClick?: (taskId: string) => void;
  isUpdating?: boolean;
  project?: ProjectData;
  subtaskCount?: number;
  ownerName?: string; // For merged mode
  isSelectionMode?: boolean; // For multi-select mode
  isSelected?: boolean; // Whether this task is selected
  onSelect?: (taskId: string) => void; // Callback for selection toggle
  className?: string;
  // Drag and drop props
  draggable?: boolean;
  onDragStart?: (task: TaskData, event: React.DragEvent) => void;
  onDragEnd?: () => void;
  isDragging?: boolean; // For opacity feedback
}

const priorityBorderColors: Record<NonNullable<TaskData['priority']>, string> = {
  urgent: '#EF4444',
  important: '#F59E0B',
  high: '#F97316',
  medium: '#3B82F6',
  low: '#6B7280',
};

const formatDueDate = (dueDate: string | null | undefined): { text: string; isOverdue: boolean } | null => {
  if (!dueDate) return null;

  const date = new Date(dueDate);

  if (isToday(date)) {
    return { text: 'Due today', isOverdue: false };
  } else if (isTomorrow(date)) {
    return { text: 'Due tomorrow', isOverdue: false };
  } else if (isPast(date)) {
    return { text: `Overdue ${format(date, 'MMM d')}`, isOverdue: true };
  } else {
    return { text: `Due ${format(date, 'MMM d')}`, isOverdue: false };
  }
};

export const TaskCardV2: React.FC<TaskCardV2Props> = ({
  task,
  onToggleStatus,
  onTaskClick,
  isUpdating = false,
  project,
  subtaskCount = 0,
  ownerName,
  isSelectionMode = false,
  isSelected = false,
  onSelect,
  className = '',
  draggable = false,
  onDragStart,
  onDragEnd,
  isDragging = false,
}) => {
  const colors = useThemeColors();
  const isCompleted = task.status === 'done';
  const borderColor = priorityBorderColors[task.priority || 'medium'];
  const dueDateInfo = formatDueDate(task.due_date);
  const isRecurring = task.recurrence_pattern && task.recurrence_pattern !== 'none';

  const handleDragStart = (e: React.DragEvent) => {
    if (onDragStart) {
      onDragStart(task, e);
    }
  };

  // Determine if this card should be draggable
  const isDraggableNow = draggable && !isSelectionMode;

  return (
    <div
      className={`
        rounded-xl p-4 flex items-start gap-3
        transition-all duration-200
        hover:shadow-md hover:scale-[1.01]
        ${className}
      `}
      style={{
        backgroundColor: isSelected ? 'rgba(212, 165, 116, 0.1)' : colors.bg.white,
        borderLeft: `4px solid ${borderColor}`,
        boxShadow: isSelected ? '0 2px 8px rgba(193, 139, 94, 0.3)' : '0 1px 4px rgba(139, 111, 71, 0.06)',
        opacity: isDragging ? 0.4 : (isCompleted ? 0.6 : 1),
        cursor: isDraggableNow ? 'grab' : 'default',
      }}
      draggable={isDraggableNow ? 'true' : 'false'}
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      data-task-card="true"
      data-task-id={task.id}
    >
      {/* Checkbox - Selection mode or Complete mode */}
      {isSelectionMode ? (
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onSelect?.(task.id || '')}
          className="w-5 h-5 text-terracotta-400 rounded focus:ring-terracotta-300 cursor-pointer"
          style={{ marginTop: '2px' }}
        />
      ) : (
        <CheckboxV2
          checked={isCompleted}
          onChange={() => onToggleStatus(task.id || '')}
          disabled={isUpdating}
          size="md"
        />
      )}

      {/* Task Content */}
      <div
        className="flex-1 min-w-0 cursor-pointer"
        onClick={() => onTaskClick?.(task.id || '')}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            onTaskClick?.(task.id || '');
          }
        }}
      >
        {/* Title Row */}
        <div className="flex items-start gap-2 mb-2">
          <div
            className={`text-base font-medium flex-1 ${isCompleted ? 'line-through' : ''}`}
            style={{ color: isCompleted ? colors.text.tertiary : colors.text.primary }}
          >
            {task.title}
          </div>
          {task.starred && (
            <span className="text-base">⭐</span>
          )}
        </div>

        {/* Meta Information */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Badge */}
          {task.status && task.status !== 'todo' && (
            <StatusBadgeV2 status={task.status} size="sm" />
          )}

          {/* Priority Badge */}
          {task.priority && (
            <PriorityBadgeV2 priority={task.priority} size="sm" />
          )}

          {/* Project Badge */}
          {project && (
            <ProjectBadgeV2
              projectName={project.name}
              projectColor={project.color || undefined}
              size="sm"
            />
          )}

          {/* Due Date */}
          {dueDateInfo && (
            <span
              className="flex items-center gap-1 text-xs"
              style={{ color: dueDateInfo.isOverdue ? '#EF4444' : colors.text.tertiary }}
            >
              <Clock className="w-3 h-3" />
              {dueDateInfo.text}
            </span>
          )}

          {/* Subtask Count */}
          {subtaskCount > 0 && (
            <span
              className="text-xs flex items-center gap-1"
              style={{ color: colors.text.tertiary }}
            >
              📋 {subtaskCount}
            </span>
          )}

          {/* Recurring Indicator */}
          {isRecurring && (
            <span
              className="flex items-center gap-1 text-xs"
              style={{ color: colors.text.tertiary }}
            >
              <Repeat className="w-3 h-3" />
            </span>
          )}

          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <span
              className="px-2 py-0.5 rounded-lg font-semibold text-xs"
              style={{
                backgroundColor: colors.badge.bg,
                color: colors.badge.text,
              }}
            >
              {task.tags[0]}
            </span>
          )}

          {/* Time Estimate */}
          {task.estimated_time && (
            <span className="text-xs" style={{ color: colors.text.tertiary }}>
              ⏱️ {task.estimated_time}m
            </span>
          )}

          {/* Owner Badge (Merged Mode) */}
          {ownerName && (
            <span
              className="flex items-center gap-1 px-2 py-0.5 rounded-lg font-semibold text-xs"
              style={{
                backgroundColor: colors.badge.bg,
                color: colors.badge.text,
              }}
            >
              <User className="w-3 h-3" />
              {ownerName}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskCardV2;
