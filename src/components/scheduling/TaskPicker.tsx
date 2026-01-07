/**
 * TaskPicker - Select tasks to schedule
 * Shows unscheduled tasks that can be dragged onto the timeline
 */

import React from 'react';
import { CheckSquare, Clock, AlertTriangle, Star, GripVertical } from 'lucide-react';
import type { Task } from '../../lib/supabase';

interface TaskPickerProps {
  tasks: Task[];
  selectedTaskId?: string;
  onTaskSelect?: (task: Task) => void;
  onTaskDragStart?: (task: Task) => void;
  className?: string;
}

const priorityColors = {
  urgent: 'border-l-red-500 bg-red-50 dark:bg-red-900/20',
  high: 'border-l-orange-500 bg-orange-50 dark:bg-orange-900/20',
  medium: 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/20',
  low: 'border-l-gray-400 bg-gray-50 dark:bg-gray-800/50',
};

const priorityIcons = {
  urgent: <AlertTriangle className="w-3 h-3 text-red-500" />,
  high: <Star className="w-3 h-3 text-orange-500" />,
  medium: <CheckSquare className="w-3 h-3 text-blue-500" />,
  low: <CheckSquare className="w-3 h-3 text-gray-400" />,
};

export function TaskPicker({
  tasks,
  selectedTaskId,
  onTaskSelect,
  onTaskDragStart,
  className = '',
}: TaskPickerProps) {
  // Filter to unscheduled tasks (no due_date set or status is todo)
  const unscheduledTasks = tasks.filter(t =>
    !t.completed_at &&
    t.status !== 'done' &&
    (!t.due_date || t.status === 'todo')
  );
  
  // Group by priority
  const urgentTasks = unscheduledTasks.filter(t => t.priority === 'urgent');
  const highTasks = unscheduledTasks.filter(t => t.priority === 'high');
  const mediumTasks = unscheduledTasks.filter(t => t.priority === 'medium');
  const lowTasks = unscheduledTasks.filter(t => t.priority === 'low');
  
  const groupedTasks = [
    { label: 'Urgent', tasks: urgentTasks, color: 'text-red-600' },
    { label: 'High Priority', tasks: highTasks, color: 'text-orange-600' },
    { label: 'Medium', tasks: mediumTasks, color: 'text-blue-600' },
    { label: 'Low', tasks: lowTasks, color: 'text-gray-500' },
  ].filter(g => g.tasks.length > 0);

  if (unscheduledTasks.length === 0) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 ${className}`}>
        <div className="text-center text-gray-500 dark:text-gray-400 py-8">
          <CheckSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">All tasks are scheduled!</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <h3 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
          <CheckSquare className="w-4 h-4 text-purple-500" />
          Unscheduled Tasks
          <span className="ml-auto text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
            {unscheduledTasks.length}
          </span>
        </h3>
      </div>

      {/* Task list */}
      <div className="max-h-[400px] overflow-y-auto">
        {groupedTasks.map(group => (
          <div key={group.label}>
            <div className={`px-3 py-1.5 text-xs font-semibold ${group.color} bg-gray-50 dark:bg-gray-900/50`}>
              {group.label} ({group.tasks.length})
            </div>
            {group.tasks.map(task => {
              const isSelected = task.id === selectedTaskId;
              const priority = (task.priority || 'medium') as keyof typeof priorityColors;
              
              return (
                <div
                  key={task.id}
                  className={`px-3 py-2 border-l-4 cursor-pointer transition-all ${priorityColors[priority]} ${
                    isSelected ? 'ring-2 ring-purple-500 ring-inset' : 'hover:brightness-95'
                  }`}
                  draggable
                  onClick={() => onTaskSelect?.(task)}
                  onDragStart={() => onTaskDragStart?.(task)}
                >
                  <div className="flex items-start gap-2">
                    <GripVertical className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0 cursor-grab" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        {priorityIcons[priority]}
                        <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {task.title}
                        </span>
                      </div>
                      {task.estimated_time && (
                        <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          <span>{task.estimated_time} min</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer hint */}
      <div className="p-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-400 text-center">
        Drag tasks to timeline or click to schedule
      </div>
    </div>
  );
}

export default TaskPicker;

