/**
 * BoardView Component
 * Kanban-style board with drag-and-drop task management
 */

import React, { useState, useMemo } from 'react';
import { Plus, MoreVertical, AlertCircle } from 'lucide-react';
import { TaskCard } from './TaskCard';
import type { ScheduledTask, BoardColumn, TeamMember, DragDropResult } from '../types';
import type { Task } from '../../lib/supabase';

interface BoardViewProps {
  tasks: ScheduledTask[];
  columns: BoardColumn[];
  teamMembers?: TeamMember[];
  onTaskClick?: (task: ScheduledTask) => void;
  onTaskDrop?: (result: DragDropResult) => void;
  onCreateTask?: (columnId: string) => void;
  onStartTimer?: (taskId: string) => void;
  onColumnEdit?: (columnId: string) => void;
  showSubtasks?: boolean;
  className?: string;
}

export const BoardView: React.FC<BoardViewProps> = ({
  tasks,
  columns,
  teamMembers = [],
  onTaskClick,
  onTaskDrop,
  onCreateTask,
  onStartTimer,
  onColumnEdit,
  showSubtasks = false,
  className = '',
}) => {
  const [draggedTask, setDraggedTask] = useState<ScheduledTask | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  // Group tasks by column
  const tasksByColumn = useMemo(() => {
    const grouped = new Map<string, ScheduledTask[]>();

    columns.forEach(column => {
      const columnTasks = tasks.filter(task => {
        // Prioritize taskIds if provided (for custom filtering like backlog vs todo)
        if (column.taskIds !== undefined) {
          return task.id && column.taskIds.includes(task.id);
        }
        // Otherwise, match based on status
        if (column.status) {
          return task.status === column.status;
        }
        return false;
      });

      // Filter out subtasks if not showing them
      const filteredTasks = showSubtasks
        ? columnTasks
        : columnTasks.filter(task => !task.parent_id);

      grouped.set(column.id, filteredTasks);
    });

    return grouped;
  }, [tasks, columns, showSubtasks]);

  // Get assignees for a task
  const getTaskAssignees = (task: ScheduledTask): TeamMember[] => {
    if (!task.assignees || !teamMembers) return [];
    return teamMembers.filter(member =>
      task.assignees!.some(a => a.id === member.id)
    );
  };

  // Drag handlers
  const handleDragStart = (e: React.DragEvent, task: ScheduledTask) => {
    if (!task.id) return;
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', task.id);
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
    setDragOverColumn(null);
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(columnId);
  };

  const handleDragLeave = (e: React.DragEvent, columnId: string) => {
    // Only clear if we're leaving the column entirely
    if (e.currentTarget === e.target) {
      setDragOverColumn(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetColumn: BoardColumn) => {
    e.preventDefault();
    e.stopPropagation();

    if (!draggedTask) {
      return;
    }

    const sourceColumn = columns.find(col =>
      tasksByColumn.get(col.id)?.some(t => t.id === draggedTask.id)
    );

    if (!sourceColumn) {
      return;
    }

    const targetTasks = tasksByColumn.get(targetColumn.id) || [];
    const newIndex = targetTasks.length;

    // Determine new status based on column
    const newStatus = (targetColumn.status || 'todo') as Task['status'];

    if (!draggedTask.id) {
      return;
    }

    const result: DragDropResult = {
      taskId: draggedTask.id,
      sourceColumn: sourceColumn.id,
      targetColumn: targetColumn.id,
      newIndex,
      newStatus,
    };

    if (onTaskDrop) {
      onTaskDrop(result);
    }

    handleDragEnd();
  };

  // Column stats
  const getColumnStats = (columnId: string) => {
    const columnTasks = tasksByColumn.get(columnId) || [];
    const totalEstimate = columnTasks.reduce((sum, task) => sum + (task.estimated_time || 0), 0);
    const completedCount = columnTasks.filter(task => task.status === 'done').length;

    return {
      count: columnTasks.length,
      totalEstimateHours: Math.floor(totalEstimate / 60),
      completedCount,
    };
  };

  // Check if column is at WIP limit
  const isAtWipLimit = (column: BoardColumn): boolean => {
    if (!column.limit) return false;
    const columnTasks = tasksByColumn.get(column.id) || [];
    return columnTasks.length >= column.limit;
  };

  return (
    <div className={`h-full flex flex-col ${className}`}>
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex gap-4 h-full p-4 min-w-max">
          {columns.map((column) => {
            const columnTasks = tasksByColumn.get(column.id) || [];
            const stats = getColumnStats(column.id);
            const atWipLimit = isAtWipLimit(column);
            const isDragOver = dragOverColumn === column.id;

            return (
              <div
                key={column.id}
                className="flex flex-col w-80 flex-shrink-0 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 h-full"
                onDragOver={(e) => handleDragOver(e, column.id)}
                onDrop={(e) => handleDrop(e, column)}
              >
              {/* Column Header */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full ring-2 ring-offset-2 ring-slate-200 dark:ring-slate-600 dark:ring-offset-slate-900"
                      style={{ backgroundColor: column.color }}
                    />
                    <h3 className="font-semibold text-slate-900 dark:text-white">
                      {column.title}
                    </h3>
                    <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white">
                      {stats.count}
                    </span>
                    {atWipLimit && (
                      <div title="At WIP limit">
                        <AlertCircle className="w-4 h-4 text-red-500" />
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => onColumnEdit?.(column.id)}
                    className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
                  >
                    <MoreVertical className="w-4 h-4 text-slate-500" />
                  </button>
                </div>

                {/* Column Stats */}
                <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300">
                  {stats.totalEstimateHours > 0 && (
                    <span>{stats.totalEstimateHours}h estimated</span>
                  )}
                  {column.limit && (
                    <span className={atWipLimit ? 'text-red-600 dark:text-red-300 font-semibold' : ''}>
                      Limit: {column.limit}
                    </span>
                  )}
                </div>
              </div>

              {/* Column Content - Scrollable */}
              <div
                className={`
                  flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px]
                  transition-colors
                  ${isDragOver ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                `}
                onDragOver={(e) => handleDragOver(e, column.id)}
                onDragLeave={(e) => handleDragLeave(e, column.id)}
                onDrop={(e) => handleDrop(e, column)}
              >
                {columnTasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-center">
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
                      No tasks
                    </p>
                    <button
                      onClick={() => onCreateTask?.(column.id)}
                      className="text-sm text-blue-600 dark:text-blue-300 hover:text-blue-700 dark:hover:text-blue-200 font-semibold"
                    >
                      Create task
                    </button>
                  </div>
                ) : (
                  columnTasks.map((task) => (
                    <div
                      key={task.id}
                      draggable={true}
                      onDragStart={(e) => handleDragStart(e, task)}
                      onDragEnd={handleDragEnd}
                      className={`cursor-move ${draggedTask?.id === task.id ? 'pointer-events-none' : ''}`}
                    >
                      <TaskCard
                        task={task}
                        assignees={getTaskAssignees(task)}
                        isDragging={draggedTask?.id === task.id}
                        onClick={() => onTaskClick?.(task)}
                        onQuickEdit={() => onTaskClick?.(task)}
                        onStartTimer={() => task.id && onStartTimer?.(task.id)}
                      />
                    </div>
                  ))
                )}
              </div>

              {/* Add Task Button */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                <button
                  onClick={() => onCreateTask?.(column.id)}
                  className={`
                    w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg
                    text-sm font-medium transition-colors
                    ${atWipLimit
                      ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }
                  `}
                  disabled={atWipLimit}
                >
                  <Plus className="w-4 h-4" />
                  Add Task
                </button>
              </div>
            </div>
          );
        })}

          {/* Add Column Button */}
          <div className="flex items-center justify-center w-64 flex-shrink-0">
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
              <Plus className="w-4 h-4" />
              Add Column
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
