/**
 * CalendarSidebar - Left sidebar with mini calendar and task sections
 */

import React from 'react';
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, GripVertical } from 'lucide-react';
import type { Task } from '../../lib/supabase';
import type { MiniCalendarDay } from '../hooks/useCalendarState';
import type { CategorizedTasks } from '../hooks/useCalendarTasks';

interface CalendarSidebarProps {
  // Mini calendar props
  miniCalendarDate: Date;
  miniCalendarDays: MiniCalendarDay[];
  onMiniPrevious: () => void;
  onMiniNext: () => void;
  onDateSelect: (date: Date) => void;

  // Task props
  categorizedTasks: CategorizedTasks;
  unscheduledTasks: Task[];
  expandedSections: {
    scheduled: boolean;
    inProgress: boolean;
    todo: boolean;
    backlog: boolean;
  };
  onToggleSection: (section: 'scheduled' | 'inProgress' | 'todo' | 'backlog') => void;

  // Drag & drop props
  draggedTask: Task | null;
  onDragStart: (task: Task, e: React.DragEvent) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDropInUnscheduled: (e: React.DragEvent) => void;
  onDropInCategory: (e: React.DragEvent, category: string) => void;
}

export const CalendarSidebar: React.FC<CalendarSidebarProps> = ({
  miniCalendarDate,
  miniCalendarDays,
  onMiniPrevious,
  onMiniNext,
  onDateSelect,
  categorizedTasks,
  unscheduledTasks,
  expandedSections,
  onToggleSection,
  draggedTask,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDropInUnscheduled,
  onDropInCategory,
}) => {
  const renderTaskSection = (
    key: keyof CategorizedTasks,
    title: string,
    emoji: string,
    tasks: Task[],
    colorClass: string
  ) => {
    if (tasks.length === 0) return null;

    return (
      <div className="mb-2" onDragOver={onDragOver} onDrop={(e) => onDropInCategory(e, key)}>
        <button
          onClick={() => onToggleSection(key)}
          className="w-full flex items-center justify-between px-1 py-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
        >
          <h4 className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 truncate">
            {emoji} ({tasks.length})
          </h4>
          {expandedSections[key] ? (
            <ChevronDown className="w-2.5 h-2.5 text-slate-400" />
          ) : (
            <ChevronUp className="w-2.5 h-2.5 text-slate-400" />
          )}
        </button>
        {expandedSections[key] && (
          <div className="space-y-1 mt-1">
            {tasks.map((task) => (
              <div
                key={task.id}
                draggable
                onDragStart={(e) => { e.stopPropagation(); onDragStart(task, e); }}
                onDragEnd={onDragEnd}
                className={`p-1 rounded border cursor-move transition-all hover:shadow-sm ${
                  draggedTask?.id === task.id
                    ? `opacity-50 ${colorClass}-400 bg-${colorClass}-50 dark:bg-${colorClass}-900/20`
                    : `${colorClass}-200 dark:border-${colorClass}-700 bg-${colorClass}-50 dark:bg-${colorClass}-900/10`
                }`}
              >
                <div className="flex items-start gap-1">
                  <GripVertical className={`w-2 h-2 text-${colorClass}-500 flex-shrink-0 mt-0.5`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-[9px] font-medium text-${colorClass}-900 dark:text-${colorClass}-100 truncate`} title={task.title}>
                      {task.title}
                    </p>
                    {task.due_date && key === 'scheduled' && (
                      <p className={`text-[8px] text-${colorClass}-700 dark:text-${colorClass}-300`}>
                        {format(new Date(task.due_date), 'MMM d')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      style={{ width: '200px' }}
      className="flex-shrink-0 border-r border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden bg-white dark:bg-slate-900"
    >
      {/* Mini Calendar */}
      <div className="p-2 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
            {format(miniCalendarDate, 'MMM yy')}
          </h3>
          <div className="flex gap-0.5">
            <button
              onClick={onMiniPrevious}
              className="p-0.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-3 h-3 text-slate-600 dark:text-slate-400" />
            </button>
            <button
              onClick={onMiniNext}
              className="p-0.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
              aria-label="Next month"
            >
              <ChevronRight className="w-3 h-3 text-slate-600 dark:text-slate-400" />
            </button>
          </div>
        </div>

        {/* Mini calendar grid */}
        <div>
          {/* Day headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }} className="text-center mb-1">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
              <div key={i} className="text-slate-400 dark:text-slate-500 font-medium text-xs">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
            {miniCalendarDays.map((day, i) => (
              <button
                key={i}
                onClick={() => onDateSelect(day.date)}
                style={{ height: '20px', fontSize: '10px' }}
                className={`
                  flex items-center justify-center font-normal transition-all rounded-full
                  ${!day.isCurrentMonth ? 'text-slate-400 dark:text-slate-600' : 'text-slate-900 dark:text-slate-100'}
                  ${day.isToday ? 'bg-blue-500 text-white font-medium' : ''}
                  ${day.isSelected && !day.isToday ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300' : ''}
                  ${!day.isToday && !day.isSelected ? 'hover:bg-slate-100 dark:hover:bg-slate-700' : ''}
                `}
              >
                {format(day.date, 'd')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Task Sections */}
      <div
        className="flex-1 overflow-y-auto p-1.5 bg-slate-50 dark:bg-slate-800/50"
        onDragOver={onDragOver}
        onDrop={onDropInUnscheduled}
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide truncate">
            Tasks
          </h3>
          <span className="text-[10px] text-slate-500 dark:text-slate-400">
            {unscheduledTasks.length}
          </span>
        </div>

        {renderTaskSection('scheduled', 'Scheduled', '📅', categorizedTasks.scheduled, 'border-green')}
        {renderTaskSection('inProgress', 'In Progress', '🔄', categorizedTasks.inProgress, 'border-purple')}
        {renderTaskSection('todo', 'To Do', '✅', categorizedTasks.todo, 'border-blue')}
        {renderTaskSection('backlog', 'Backlog', '📦', categorizedTasks.backlog, 'border-slate')}

        {unscheduledTasks.length === 0 && (
          <p className="text-[9px] text-slate-500 dark:text-slate-400 text-center mt-4">
            All scheduled
          </p>
        )}
      </div>
    </div>
  );
};
