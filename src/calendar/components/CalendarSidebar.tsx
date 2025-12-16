/**
 * CalendarSidebar - Left sidebar with mini calendar and smart task scheduling
 * Enhanced with priority-based task picker and smart scheduling suggestions
 */

import React, { useState, useCallback } from 'react';
import { format, addMinutes } from 'date-fns';
import {
  ChevronLeft, ChevronRight, ChevronDown, ChevronUp, GripVertical,
  Zap, Battery, BatteryLow, Clock, Sparkles, AlertTriangle, Star, CheckSquare
} from 'lucide-react';
import type { Task } from '../../lib/supabase';
import type { MiniCalendarDay } from '../hooks/useCalendarState';
import type { CategorizedTasks } from '../hooks/useCalendarTasks';
import { useTaskSchedulingSuggestions } from '../../hooks/useSchedulingQuery';
import type { ScoredTimeSlot, EnergyLevel } from '../../services/scheduling';

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

  // Smart scheduling props (optional for backward compatibility)
  onScheduleTask?: (taskId: string, start: Date, end: Date) => void;
}

// Priority configuration
const priorityConfig = {
  urgent: { icon: AlertTriangle, color: 'red', label: 'Urgent' },
  high: { icon: Star, color: 'orange', label: 'High' },
  medium: { icon: CheckSquare, color: 'blue', label: 'Medium' },
  low: { icon: CheckSquare, color: 'gray', label: 'Low' },
} as const;

const energyIcons: Record<EnergyLevel, React.ReactNode> = {
  peak: <Zap className="w-3 h-3 text-yellow-500" />,
  moderate: <Battery className="w-3 h-3 text-blue-500" />,
  low: <BatteryLow className="w-3 h-3 text-gray-400" />,
};

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
  onScheduleTask,
}) => {
  // State for smart scheduling
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [expandedPriorities, setExpandedPriorities] = useState({
    urgent: true,
    high: true,
    medium: false,
    low: false,
  });

  // Get scheduling suggestions for selected task
  const taskForSuggestions = selectedTask ? {
    id: selectedTask.id || '',
    title: selectedTask.title,
    priority: (selectedTask.priority || 'medium') as 'urgent' | 'high' | 'medium' | 'low',
    estimatedMinutes: selectedTask.estimated_time || 30,
  } : null;

  const { data: suggestions, isLoading: suggestionsLoading } = useTaskSchedulingSuggestions(
    taskForSuggestions,
    miniCalendarDate
  );

  // Get suggested slots from the suggestion result
  const suggestedSlots = suggestions?.suggestedSlots || [];

  // Group tasks by priority
  const allTasks = [...unscheduledTasks, ...categorizedTasks.todo, ...categorizedTasks.backlog];
  const tasksByPriority = {
    urgent: allTasks.filter(t => t.priority === 'urgent'),
    high: allTasks.filter(t => t.priority === 'high'),
    medium: allTasks.filter(t => t.priority === 'medium' || !t.priority),
    low: allTasks.filter(t => t.priority === 'low'),
  };

  const handleTaskClick = useCallback((task: Task) => {
    if (selectedTask?.id === task.id) {
      setSelectedTask(null);
      setShowSuggestions(false);
    } else {
      setSelectedTask(task);
      setShowSuggestions(true);
    }
  }, [selectedTask]);

  const handleScheduleSlot = useCallback((slot: ScoredTimeSlot) => {
    if (selectedTask?.id && onScheduleTask) {
      const end = addMinutes(slot.start, selectedTask.estimated_time || 30);
      onScheduleTask(selectedTask.id, slot.start, end);
      setSelectedTask(null);
      setShowSuggestions(false);
    }
  }, [selectedTask, onScheduleTask]);

  const togglePriority = (priority: keyof typeof expandedPriorities) => {
    setExpandedPriorities(prev => ({ ...prev, [priority]: !prev[priority] }));
  };

  // Render a priority-based task section
  const renderPrioritySection = (
    priority: 'urgent' | 'high' | 'medium' | 'low',
    tasks: Task[]
  ) => {
    if (tasks.length === 0) return null;
    const config = priorityConfig[priority];
    const Icon = config.icon;
    const isExpanded = expandedPriorities[priority];

    return (
      <div className="mb-1.5">
        <button
          onClick={() => togglePriority(priority)}
          className={`w-full flex items-center gap-1.5 px-1.5 py-1 rounded text-left transition-colors
            hover:bg-${config.color}-50 dark:hover:bg-${config.color}-900/20`}
        >
          <Icon className={`w-3 h-3 text-${config.color}-500`} />
          <span className={`text-[10px] font-semibold text-${config.color}-700 dark:text-${config.color}-300 flex-1`}>
            {config.label}
          </span>
          <span className={`text-[9px] text-${config.color}-500 bg-${config.color}-100 dark:bg-${config.color}-900/30 px-1.5 rounded-full`}>
            {tasks.length}
          </span>
          {isExpanded ? (
            <ChevronDown className="w-2.5 h-2.5 text-slate-400" />
          ) : (
            <ChevronUp className="w-2.5 h-2.5 text-slate-400" />
          )}
        </button>

        {isExpanded && (
          <div className="mt-1 space-y-0.5 pl-1">
            {tasks.map((task) => {
              const isSelected = selectedTask?.id === task.id;
              return (
                <div
                  key={task.id}
                  draggable
                  onClick={() => handleTaskClick(task)}
                  onDragStart={(e) => { e.stopPropagation(); onDragStart(task, e); }}
                  onDragEnd={onDragEnd}
                  className={`p-1.5 rounded border-l-2 cursor-pointer transition-all text-left
                    ${isSelected
                      ? 'border-l-purple-500 bg-purple-50 dark:bg-purple-900/30 ring-1 ring-purple-300 dark:ring-purple-700'
                      : 'border-l-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }
                    ${draggedTask?.id === task.id ? 'opacity-50' : ''}
                  `}
                >
                  <div className="flex items-start gap-1">
                    <GripVertical className="w-2.5 h-2.5 text-slate-400 flex-shrink-0 mt-0.5 cursor-grab" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] font-medium text-slate-800 dark:text-slate-200 truncate" title={task.title}>
                        {task.title}
                      </p>
                      {task.estimated_time && (
                        <div className="flex items-center gap-0.5 mt-0.5">
                          <Clock className="w-2 h-2 text-slate-400" />
                          <span className="text-[8px] text-slate-500">{task.estimated_time}m</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
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

      {/* Smart Scheduling - Task Picker by Priority */}
      <div
        className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-800/50"
        onDragOver={onDragOver}
        onDrop={onDropInUnscheduled}
      >
        {/* Header */}
        <div className="p-1.5 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <div className="flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-purple-500" />
            <h3 className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
              Schedule Tasks
            </h3>
            <span className="ml-auto text-[9px] text-slate-500 bg-slate-100 dark:bg-slate-700 px-1.5 rounded-full">
              {allTasks.length}
            </span>
          </div>
          {selectedTask && (
            <div className="mt-1.5 text-[9px] text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 px-1.5 py-1 rounded flex items-center gap-1">
              <span className="truncate flex-1">Scheduling: <strong>{selectedTask.title}</strong></span>
              <button
                onClick={() => { setSelectedTask(null); setShowSuggestions(false); }}
                className="text-purple-500 hover:text-purple-700 font-medium"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Priority-based task list */}
        <div className="p-1.5">
          {renderPrioritySection('urgent', tasksByPriority.urgent)}
          {renderPrioritySection('high', tasksByPriority.high)}
          {renderPrioritySection('medium', tasksByPriority.medium)}
          {renderPrioritySection('low', tasksByPriority.low)}

          {allTasks.length === 0 && (
            <div className="text-center py-4">
              <CheckSquare className="w-6 h-6 mx-auto text-slate-300 dark:text-slate-600 mb-1" />
              <p className="text-[9px] text-slate-500 dark:text-slate-400">
                All tasks scheduled!
              </p>
            </div>
          )}
        </div>

        {/* Smart Suggestions Panel */}
        {showSuggestions && selectedTask && onScheduleTask && (
          <div className="border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-1.5">
            <div className="flex items-center gap-1 mb-1.5">
              <Zap className="w-3 h-3 text-yellow-500" />
              <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-300">
                Best Times
              </span>
            </div>

            {suggestionsLoading ? (
              <div className="text-[9px] text-slate-500 text-center py-2">Loading...</div>
            ) : suggestedSlots.length > 0 ? (
              <div className="space-y-1">
                {suggestedSlots.slice(0, 3).map((slot, i) => (
                  <button
                    key={i}
                    onClick={() => handleScheduleSlot(slot)}
                    className="w-full flex items-center gap-1.5 p-1.5 rounded border border-slate-200 dark:border-slate-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:border-purple-300 dark:hover:border-purple-700 transition-colors text-left"
                  >
                    {energyIcons[slot.energyLevel]}
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-medium text-slate-800 dark:text-slate-200">
                        {format(slot.start, 'h:mm a')}
                      </div>
                      <div className="text-[8px] text-slate-500">
                        {slot.reasons?.[0] || `${slot.energyLevel} energy`}
                      </div>
                    </div>
                    <div className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                      slot.score >= 80 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      slot.score >= 60 ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                      'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                    }`}>
                      {slot.score}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-[9px] text-slate-500 text-center py-2">
                No suggestions available
              </p>
            )}

            <p className="text-[8px] text-slate-400 text-center mt-1.5">
              Or drag task to calendar
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
