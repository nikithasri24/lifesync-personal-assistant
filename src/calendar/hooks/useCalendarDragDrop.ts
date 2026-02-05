/**
 * useCalendarDragDrop - Manages drag and drop functionality for calendar
 */

import { useState } from 'react';
import { format } from 'date-fns';
import type { UseMutationResult } from '@tanstack/react-query';
import type { Task } from '../../lib/supabase';
import type { CalendarEvent } from '../../services/types';
import type { UndoRedoContextType } from '../../contexts/UndoRedoContext';
import { MoveTaskCommand, ChangeTaskCategoryCommand } from '../../commands/TaskCommands';

interface UseCalendarDragDropProps {
  updateTaskMutation: UseMutationResult<Task, Error, { id: string; updates: Partial<Task> }>;
  updateEventMutation: UseMutationResult<CalendarEvent, Error, { id: string; updates: Partial<CalendarEvent> }>;
  executeCommand: UndoRedoContextType['executeCommand'];
}

export const useCalendarDragDrop = ({
  updateTaskMutation,
  updateEventMutation,
  executeCommand,
}: UseCalendarDragDropProps) => {
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [draggedEvent, setDraggedEvent] = useState<CalendarEvent | null>(null);

  const handleDragStart = (task: Task, event?: React.DragEvent) => {
    setDraggedTask(task);

    if (event?.dataTransfer && task.id) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', task.id);
    }
  };

  const handleDragEnd = (e?: React.DragEvent) => {
    setDraggedTask(null);
  };

  const handleDrop = (date: Date, e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (draggedTask && draggedTask.id) {
      const newDueDate = format(date, 'yyyy-MM-dd');
      const oldDueDate = draggedTask.due_date || null;

      const command = new MoveTaskCommand(
        draggedTask.id,
        draggedTask.title,
        newDueDate,
        oldDueDate
      );

      executeCommand(command);
      setDraggedTask(null);
    } else if (draggedEvent) {
      // Handle event drop
      const newStartDate = format(date, 'yyyy-MM-dd');
      updateEventMutation.mutate({
        id: draggedEvent.id,
        updates: { start_date: newStartDate, end_date: newStartDate },
      });
      setDraggedEvent(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Allow drop
    e.stopPropagation(); // Prevent bubbling
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move';
    }
  };

  const handleDropInUnscheduled = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (draggedTask && draggedTask.id) {
      const command = new MoveTaskCommand(
        draggedTask.id,
        draggedTask.title,
        null, // new date = null (unscheduled)
        draggedTask.due_date || null // previous date
      );

      executeCommand(command);
      setDraggedTask(null);
    }
  };

  const handleDropInCategory = (
    e: React.DragEvent,
    targetCategory: 'scheduled' | 'todo' | 'inProgress' | 'backlog'
  ) => {
    e.preventDefault();
    e.stopPropagation();

    if (!draggedTask || !draggedTask.id) return;

    // Map UI categories to database sidebar_section values
    const sectionMap: Record<string, 'scheduled' | 'todo' | 'in_progress' | 'backlog'> = {
      scheduled: 'scheduled',
      todo: 'todo',
      inProgress: 'in_progress',
      backlog: 'backlog',
    };

    const newSection = sectionMap[targetCategory] || 'todo';

    const command = new ChangeTaskCategoryCommand(
      draggedTask.id,
      draggedTask.title,
      { sidebar_section: newSection },
      draggedTask
    );

    executeCommand(command);
    setDraggedTask(null);
  };

  const handleEventDragStart = (event: CalendarEvent, e: React.DragEvent) => {
    setDraggedEvent(event);
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', event.id);
    }
  };

  const handleEventDragEnd = (e: React.DragEvent) => {
    setDraggedEvent(null);
  };

  return {
    draggedTask,
    draggedEvent,
    handleDragStart,
    handleDragEnd,
    handleDrop,
    handleDragOver,
    handleDropInUnscheduled,
    handleDropInCategory,
    handleEventDragStart,
    handleEventDragEnd,
  };
};

