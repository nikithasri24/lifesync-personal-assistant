/**
 * TaskListViewV2 Component
 * Status-based task grouping with terracotta theme
 * Groups tasks by status: To Do, In Progress, Waiting, Done
 */

import React from 'react';
import { useThemeColors } from '../../../hooks/useThemeColors';
import { TaskCardV2 } from './TaskCardV2';
import type { Task } from '../../types';

export interface TaskListViewV2Props {
  tasks: Task[];
  onToggleStatus: (taskId: string) => void;
  onTaskClick?: (taskId: string) => void;
  isUpdating?: boolean;
  className?: string;
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
  onToggleStatus,
  onTaskClick,
  isUpdating = false,
  className = '',
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
        if (section.tasks.length === 0) return null;

        return (
          <div key={section.key} className="mb-5">
            {/* Status Header */}
            <div className="flex items-center justify-between px-5 mb-2">
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

            {/* Task Cards */}
            <div className="space-y-2 px-5">
              {section.tasks.map((task) => (
                <TaskCardV2
                  key={task.id}
                  task={task}
                  onToggleStatus={onToggleStatus}
                  onTaskClick={onTaskClick}
                  isUpdating={isUpdating}
                />
              ))}
            </div>
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
