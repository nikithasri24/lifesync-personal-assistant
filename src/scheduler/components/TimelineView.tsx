/**
 * TimelineView Component
 * Gantt-style timeline view with task dependencies and scheduling
 */

import React, { useMemo, useState, useRef } from 'react';
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addWeeks,
  subWeeks,
  isSameDay,
  differenceInDays,
  addDays,
  isWeekend,
} from 'date-fns';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import type { ScheduledTask, TimelineConfig, TaskDependency } from '../types';

interface TimelineViewProps {
  tasks: ScheduledTask[];
  dependencies?: TaskDependency[];
  config: TimelineConfig;
  onConfigChange?: (config: TimelineConfig) => void;
  onTaskClick?: (task: ScheduledTask) => void;
  onTaskDrag?: (taskId: string, newStart: Date, newEnd: Date) => void;
  className?: string;
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  tasks,
  dependencies = [],
  config,
  onConfigChange,
  onTaskClick,
  onTaskDrag,
  className = '',
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  // Calculate timeline dates based on zoom level
  const timelineDates = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });

    let numWeeks = 4; // Default for month view
    if (config.zoom === 'week') numWeeks = 2;
    if (config.zoom === 'day') numWeeks = 1;
    if (config.zoom === 'quarter') numWeeks = 12;

    const end = endOfWeek(addWeeks(start, numWeeks - 1), { weekStartsOn: 1 });

    return eachDayOfInterval({ start, end });
  }, [currentDate, config.zoom]);

  // Filter and position tasks
  const timelineTasks = useMemo(() => {
    return tasks
      .filter(task => task.scheduledStart && task.scheduledEnd)
      .map(task => {
        const startDate = new Date(task.scheduledStart!);
        const endDate = new Date(task.scheduledEnd!);

        // Calculate position and width
        const firstDate = timelineDates[0];
        const lastDate = timelineDates[timelineDates.length - 1];

        const startOffset = differenceInDays(startDate, firstDate);
        const duration = differenceInDays(endDate, startDate) + 1;

        // Skip if task is completely outside visible range
        if (endDate < firstDate || startDate > lastDate) {
          return null;
        }

        // Determine color based on status and priority
        let color = '#3b82f6'; // blue
        if (task.status === 'done') color = '#10b981'; // green
        else if (task.status === 'in_progress') color = '#8b5cf6'; // purple
        else if (task.priority === 'urgent') color = '#ef4444'; // red
        else if (task.priority === 'high') color = '#f59e0b'; // orange

        // Check if overdue
        const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';

        return {
          task,
          startOffset,
          duration,
          color,
          isOverdue,
        };
      })
      .filter(Boolean);
  }, [tasks, timelineDates]);

  // Calculate task dependencies for rendering
  const dependencyLines = useMemo(() => {
    if (!config.showDependencies) return [];

    const lines: Array<{
      from: { taskId: string; x: number; y: number };
      to: { taskId: string; x: number; y: number };
      type: string;
    }> = [];

    dependencies.forEach(dep => {
      const predTask = timelineTasks.find(t => t?.task.id === dep.predecessorId);
      const succTask = timelineTasks.find(t => t?.task.id === dep.successorId);

      if (predTask && succTask) {
        // Calculate line positions
        // This is simplified - in a real implementation, you'd calculate exact pixel positions
        lines.push({
          from: {
            taskId: dep.predecessorId,
            x: predTask.startOffset + predTask.duration,
            y: 0, // Will be calculated based on row
          },
          to: {
            taskId: dep.successorId,
            x: succTask.startOffset,
            y: 0,
          },
          type: dep.type,
        });
      }
    });

    return lines;
  }, [dependencies, timelineTasks, config.showDependencies]);

  // Navigation handlers
  const handlePrevious = () => {
    const weeksToMove = config.zoom === 'day' ? 1 : config.zoom === 'week' ? 2 : 4;
    setCurrentDate(prev => subWeeks(prev, weeksToMove));
  };

  const handleNext = () => {
    const weeksToMove = config.zoom === 'day' ? 1 : config.zoom === 'week' ? 2 : 4;
    setCurrentDate(prev => addWeeks(prev, weeksToMove));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleZoomChange = (zoom: TimelineConfig['zoom']) => {
    onConfigChange?.({ ...config, zoom });
  };

  // Calculate column width based on zoom
  const getColumnWidth = () => {
    switch (config.zoom) {
      case 'day': return 120;
      case 'week': return 60;
      case 'month': return 30;
      case 'quarter': return 15;
      default: return 30;
    }
  };

  const columnWidth = getColumnWidth();

  // Get month header groupings
  const monthGroups = useMemo(() => {
    const groups: Array<{ month: string; startIndex: number; span: number }> = [];
    let currentMonth = '';
    let startIndex = 0;
    let span = 0;

    timelineDates.forEach((date, index) => {
      const monthStr = format(date, 'MMM yyyy');
      if (monthStr !== currentMonth) {
        if (currentMonth) {
          groups.push({ month: currentMonth, startIndex, span });
        }
        currentMonth = monthStr;
        startIndex = index;
        span = 1;
      } else {
        span++;
      }
    });

    if (currentMonth) {
      groups.push({ month: currentMonth, startIndex, span });
    }

    return groups;
  }, [timelineDates]);

  return (
    <div className={`flex flex-col h-full bg-white dark:bg-slate-900 ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-4">
          {/* Navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleToday}
              className="px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 rounded hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Today
            </button>
            <button
              onClick={handlePrevious}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </button>
            <button
              onClick={handleNext}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </button>
          </div>

          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {format(currentDate, 'MMMM yyyy')}
          </h3>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-600 dark:text-slate-400 mr-2">Zoom:</span>
          {(['day', 'week', 'month', 'quarter'] as const).map((zoom) => (
            <button
              key={zoom}
              onClick={() => handleZoomChange(zoom)}
              className={`
                px-3 py-1.5 text-sm font-medium rounded transition-colors
                ${config.zoom === zoom
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }
              `}
            >
              {zoom.charAt(0).toUpperCase() + zoom.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline Grid */}
      <div ref={timelineRef} className="flex-1 overflow-auto">
        <div className="min-w-max">
          {/* Month Headers */}
          <div className="sticky top-0 z-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
            <div className="flex">
              <div className="w-64 flex-shrink-0 border-r border-slate-200 dark:border-slate-700 px-4 py-2">
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">Task</span>
              </div>
              <div className="flex">
                {monthGroups.map((group, index) => (
                  <div
                    key={index}
                    className="border-r border-slate-200 dark:border-slate-700 px-2 py-2 text-center"
                    style={{ width: `${group.span * columnWidth}px` }}
                  >
                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {group.month}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Day Headers */}
          <div className="sticky top-10 z-10 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
            <div className="flex">
              <div className="w-64 flex-shrink-0 border-r border-slate-200 dark:border-slate-700" />
              <div className="flex">
                {timelineDates.map((date, index) => {
                  const isToday = isSameDay(date, new Date());
                  const isWeekendDay = isWeekend(date);

                  return (
                    <div
                      key={index}
                      className={`
                        border-r border-slate-200 dark:border-slate-700 px-1 py-2 text-center
                        ${isWeekendDay ? 'bg-slate-100 dark:bg-slate-900' : ''}
                        ${isToday ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                      `}
                      style={{ width: `${columnWidth}px` }}
                    >
                      <div className="text-xs text-slate-600 dark:text-slate-400">
                        {config.zoom === 'day' || config.zoom === 'week' ? format(date, 'EEE') : format(date, 'dd')}
                      </div>
                      {config.zoom === 'day' && (
                        <div className={`text-sm font-medium ${isToday ? 'text-blue-600 dark:text-blue-400' : 'text-slate-900 dark:text-slate-100'}`}>
                          {format(date, 'd')}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Task Rows */}
          <div className="relative">
            {timelineTasks.map((item, rowIndex) => {
              if (!item) return null;
              const { task, startOffset, duration, color, isOverdue } = item;

              return (
                <div
                  key={task.id}
                  className="flex border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  {/* Task Name Column */}
                  <div className="w-64 flex-shrink-0 border-r border-slate-200 dark:border-slate-700 px-4 py-3">
                    <div
                      className="cursor-pointer"
                      onClick={() => onTaskClick?.(task)}
                    >
                      <div className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                        {task.title}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {task.estimated_time ? `${Math.floor(task.estimated_time / 60)}h ${task.estimated_time % 60}m` : ''}
                      </div>
                    </div>
                  </div>

                  {/* Timeline Grid */}
                  <div className="flex-1 relative" style={{ height: '60px' }}>
                    {/* Background grid */}
                    <div className="absolute inset-0 flex">
                      {timelineDates.map((date, index) => {
                        const isWeekendDay = isWeekend(date);
                        return (
                          <div
                            key={index}
                            className={`border-r border-slate-200 dark:border-slate-700 ${isWeekendDay ? 'bg-slate-50 dark:bg-slate-900/50' : ''}`}
                            style={{ width: `${columnWidth}px` }}
                          />
                        );
                      })}
                    </div>

                    {/* Task Bar */}
                    <div
                      className="absolute top-1/2 -translate-y-1/2 h-8 rounded-lg shadow-sm cursor-pointer transition-all hover:shadow-md group"
                      style={{
                        left: `${Math.max(0, startOffset) * columnWidth}px`,
                        width: `${duration * columnWidth}px`,
                        backgroundColor: color,
                        opacity: task.status === 'done' ? 0.6 : 1,
                      }}
                      onClick={() => onTaskClick?.(task)}
                    >
                      <div className="h-full flex items-center px-2 text-white">
                        <span className="text-xs font-medium truncate">
                          {task.title}
                        </span>
                      </div>

                      {/* Progress overlay */}
                      {task.progress && task.progress > 0 && (
                        <div
                          className="absolute bottom-0 left-0 h-1 bg-white/30 rounded-bl-lg transition-all"
                          style={{ width: `${task.progress}%` }}
                        />
                      )}

                      {/* Overdue indicator */}
                      {isOverdue && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-slate-900" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Empty State */}
            {timelineTasks.length === 0 && (
              <div className="flex items-center justify-center h-64 text-slate-500 dark:text-slate-400">
                <div className="text-center">
                  <Maximize2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No scheduled tasks to display</p>
                  <p className="text-xs mt-1">Tasks need start and end dates to appear on the timeline</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="border-t border-slate-200 dark:border-slate-700 px-6 py-3 bg-slate-50 dark:bg-slate-800">
        <div className="flex items-center gap-6 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-500" />
            <span className="text-slate-600 dark:text-slate-400">To Do</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-purple-500" />
            <span className="text-slate-600 dark:text-slate-400">In Progress</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-500" />
            <span className="text-slate-600 dark:text-slate-400">Done</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-500" />
            <span className="text-slate-600 dark:text-slate-400">Urgent Priority</span>
          </div>
        </div>
      </div>
    </div>
  );
};
