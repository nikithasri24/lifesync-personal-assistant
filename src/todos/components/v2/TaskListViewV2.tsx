/**
 * TaskListViewV2 Component
 * Status-based task grouping with terracotta theme
 * Groups tasks by status: To Do, In Progress, Waiting, Done
 */

import React from 'react';
import { useThemeColors } from '../../../hooks/useThemeColors';
import { TaskCardV2 } from './TaskCardV2';
import type { Task, Project } from '../../types';

export interface TaskListViewV2Props {
  tasks: Task[];
  projects?: Project[];
  onToggleStatus: (taskId: string) => void;
  onTaskClick?: (taskId: string) => void;
  isUpdating?: boolean;
  isSelectionMode?: boolean;
  selectedTaskIds?: Set<string>;
  onSelectTask?: (taskId: string) => void;
  className?: string;
  // Drag and drop props
  draggedTask?: import('../../services/types').TaskData | null;
  onDragStart?: (task: import('../../services/types').TaskData, event: React.DragEvent) => void;
  onDragEnd?: () => void;
  onDropOnSection?: (sectionKey: string, event: React.DragEvent) => void;
  onDragOver?: (event: React.DragEvent) => void;
}

interface StatusSection {
  key: string;
  title: string;
  emoji: string;
  statuses: string[];
}

const statusSections: StatusSection[] = [
  {
    key: 'todo',
    title: 'To Do',
    emoji: '📝',
    statuses: ['todo'],
  },
  {
    key: 'in_progress',
    title: 'In Progress',
    emoji: '⚡',
    statuses: ['in_progress', 'scheduled'],
  },
  {
    key: 'waiting',
    title: 'Waiting',
    emoji: '⏸️',
    statuses: ['waiting'],
  },
  {
    key: 'done',
    title: 'Done',
    emoji: '✅',
    statuses: ['done'],
  },
];

export const TaskListViewV2: React.FC<TaskListViewV2Props> = ({
  tasks,
  projects = [],
  onToggleStatus,
  onTaskClick,
  isUpdating = false,
  isSelectionMode = false,
  selectedTaskIds = new Set(),
  onSelectTask,
  className = '',
  draggedTask,
  onDragStart,
  onDragEnd,
  onDropOnSection,
  onDragOver,
}) => {
  const colors = useThemeColors();

  // Group tasks by status
  const groupedTasks = statusSections.map((section) => ({
    ...section,
    tasks: tasks.filter((task) =>
      section.statuses.includes(task.status || 'todo')
    ),
  }));

  return (
    <div className={`py-4 ${className}`}>
      {groupedTasks.map((section) => {
        // Check if this section is a valid drop target
        const isValidDropTarget = draggedTask &&
          !section.statuses.includes(draggedTask.status || 'todo');

        return (
          <div key={section.key} className="mb-5">
            {/* Drop Zone: Status Header - Always visible for drag-and-drop */}
            <div
              className="flex items-center justify-between px-5 mb-2 py-2 rounded-lg transition-all"
              style={{
                backgroundColor: isValidDropTarget
                  ? 'rgba(212, 165, 116, 0.2)'
                  : 'transparent',
                border: isValidDropTarget
                  ? '2px dashed #D4A574'
                  : '2px dashed transparent',
              }}
              onDrop={(e) => onDropOnSection?.(section.key, e)}
              onDragOver={onDragOver}
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wide" style={{ color: colors.text.primary }}>
                  {section.emoji} {section.title}
                </span>
              </div>
              <span
                className="px-2.5 py-1 rounded-xl text-xs font-bold"
                style={{
                  background: 'linear-gradient(135deg, rgba(212, 165, 116, 0.2) 0%, rgba(193, 139, 94, 0.2) 100%)',
                  color: colors.badge.text,
                }}
              >
                {section.tasks.length}
              </span>
            </div>

            {/* Task Cards - Only show if section has tasks */}
            {section.tasks.length > 0 && (
              <div className="space-y-2 px-5">
                {section.tasks.map((task) => {
                  const project = projects.find(p => p.id === task.projectId);
                  const isDragging = draggedTask?.id === task.id;

                  return (
                    <TaskCardV2
                      key={task.id}
                      task={task}
                      onToggleStatus={onToggleStatus}
                      onTaskClick={onTaskClick}
                      isUpdating={isUpdating}
                      project={project}
                      isSelectionMode={isSelectionMode}
                      isSelected={selectedTaskIds.has(task.id || '')}
                      onSelect={onSelectTask}
                      draggable={!isSelectionMode}
                      onDragStart={onDragStart}
                      onDragEnd={onDragEnd}
                      isDragging={isDragging}
                    />
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Empty State */}
      {tasks.length === 0 && (
        <div className="text-center py-12">
          <p className="text-sm" style={{ color: colors.text.tertiary }}>
            No tasks found. Add your first task to get started!
          </p>
        </div>
      )}
    </div>
  );
};

export default TaskListViewV2;
