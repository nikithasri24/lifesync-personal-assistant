/**
 * SmartSchedulerPanel - Full scheduling interface
 * Combines timeline view, task picker, and smart suggestions
 */

import React, { useState, useCallback } from 'react';
import { format, addDays, parseISO, addMinutes } from 'date-fns';
import { ChevronLeft, ChevronRight, Sparkles, Wand2 } from 'lucide-react';
import { TimeBlockView } from './TimeBlockView';
import { TaskPicker } from './TaskPicker';
import { SmartScheduler } from './SmartScheduler';
import { useTasks, useUpdateTask } from '../../hooks/useTasksQuery';
import { useCalendarEvents } from '../../hooks/useCalendarQuery';
import type { Task } from '../../lib/supabase';

interface SmartSchedulerPanelProps {
  className?: string;
  initialDate?: Date;
}

export function SmartSchedulerPanel({ className = '', initialDate }: SmartSchedulerPanelProps) {
  const [selectedDate, setSelectedDate] = useState(initialDate || new Date());
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Fetch data
  const { data: tasks = [] } = useTasks();
  const { data: calendarEvents = [] } = useCalendarEvents();
  const updateTask = useUpdateTask();

  // Convert calendar events to time blocks
  const dateKey = format(selectedDate, 'yyyy-MM-dd');
  const dayEvents = calendarEvents.filter(e => e.start_date === dateKey);
  // Tasks scheduled for this day (using due_date since TaskData doesn't have start_date)
  const dayTasks = tasks.filter(t =>
    t.due_date === dateKey &&
    t.status !== 'done' &&
    !t.completed_at
  );

  const timeBlocks = [
    ...dayEvents.map(e => ({
      id: e.id,
      title: e.title,
      start: parseISO(`${e.start_date}T${e.start_time || '09:00'}`),
      end: parseISO(`${e.end_date || e.start_date}T${e.end_time || '10:00'}`),
      type: 'event' as const,
    })),
    ...dayTasks
      .filter((t): t is Task & { id: string; due_date: string } => !!t.id && !!t.due_date)
      .map(t => ({
        id: t.id,
        title: t.title,
        start: parseISO(`${t.due_date}T09:00`),
        end: addMinutes(
          parseISO(`${t.due_date}T09:00`),
          t.estimated_time || 30
        ),
        type: 'task' as const,
      })),
  ];

  // Handle scheduling a task to a time slot
  const handleScheduleTask = useCallback(async (taskId: string, start: Date, end: Date) => {
    const dateStr = format(start, 'yyyy-MM-dd');

    await updateTask.mutateAsync({
      id: taskId,
      updates: {
        due_date: dateStr,
        scheduled_start: start.toISOString(),
        scheduled_end: end.toISOString(),
        status: 'scheduled',
      },
    });

    setSelectedTask(null);
    setShowSuggestions(false);
  }, [updateTask]);

  // Handle clicking on a time slot
  const handleSlotClick = useCallback((start: Date, end: Date) => {
    if (selectedTask?.id) {
      handleScheduleTask(selectedTask.id, start, end);
    }
  }, [selectedTask, handleScheduleTask]);

  // Handle task selection
  const handleTaskSelect = useCallback((task: Task) => {
    setSelectedTask(task);
    setShowSuggestions(true);
  }, []);

  return (
    <div className={`bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Smart Time Blocking</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedDate(d => addDays(d, -1))}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <button
              onClick={() => setSelectedDate(new Date())}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              Today
            </button>
            <span className="text-sm font-medium text-gray-900 dark:text-white min-w-[140px] text-center">
              {format(selectedDate, 'EEE, MMM d, yyyy')}
            </span>
            <button
              onClick={() => setSelectedDate(d => addDays(d, 1))}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Selected task indicator */}
        {selectedTask && (
          <div className="mt-3 flex items-center gap-2 p-2 bg-purple-50 dark:bg-purple-900/30 rounded-lg border border-purple-200 dark:border-purple-800">
            <Wand2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span className="text-sm text-purple-700 dark:text-purple-300">
              Scheduling: <strong>{selectedTask.title}</strong>
            </span>
            <button
              onClick={() => setSelectedTask(null)}
              className="ml-auto text-xs text-purple-600 dark:text-purple-400 hover:underline"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="p-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Task Picker */}
        <div className="lg:col-span-1">
          <TaskPicker
            tasks={tasks}
            selectedTaskId={selectedTask?.id}
            onTaskSelect={handleTaskSelect}
          />
        </div>

        {/* Timeline View */}
        <div className="lg:col-span-2">
          <TimeBlockView
            date={selectedDate}
            blocks={timeBlocks}
            onSlotClick={handleSlotClick}
          />
        </div>
      </div>

      {/* Smart Suggestions Modal */}
      {showSuggestions && selectedTask?.id && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <SmartScheduler
            task={{
              id: selectedTask.id,
              title: selectedTask.title,
              priority: (selectedTask.priority || 'medium') as 'urgent' | 'high' | 'medium' | 'low',
              estimatedMinutes: selectedTask.estimated_time || 30,
            }}
            onSchedule={handleScheduleTask}
          />
        </div>
      )}
    </div>
  );
}

export default SmartSchedulerPanel;
