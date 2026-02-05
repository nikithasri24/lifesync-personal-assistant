/**
 * useCalendarModals - Manages modal state for calendar
 */

import { useState } from 'react';
import type { UseMutationResult } from '@tanstack/react-query';
import type { Task } from '../../lib/supabase';
import type { CalendarEvent } from '../../services/types';
import type { ScheduledTask } from '../../scheduler/types';

export const useCalendarModals = (
  updateTaskMutation: UseMutationResult<Task, Error, { id: string; updates: Partial<Task> }>,
  deleteTaskMutation: UseMutationResult<void, Error, string>,
  createEventMutation: UseMutationResult<CalendarEvent, Error, Partial<CalendarEvent>>,
  updateEventMutation: UseMutationResult<CalendarEvent, Error, { id: string; updates: Partial<CalendarEvent> }>,
  deleteEventMutation: UseMutationResult<void, Error, string>,
  tasks: Task[]
) => {
  // Task editing state
  const [editingTask, setEditingTask] = useState<ScheduledTask | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Event editing state
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventModalInitialDate, setEventModalInitialDate] = useState<Date | null>(null);

  // Quick schedule state
  const [showQuickSchedule, setShowQuickSchedule] = useState(false);
  const [quickScheduleDate, setQuickScheduleDate] = useState<Date | null>(null);

  // Task handlers
  const handleTaskClick = (task: Task) => {
    // Convert Task to ScheduledTask for the modal
    // ScheduledTask extends Task, so we can spread the task directly
    const scheduledTask: ScheduledTask = {
      ...task,
      // ScheduledTask-specific fields can be added here if needed
      scheduledStart: task.scheduled_start || undefined,
    };

    setEditingTask(scheduledTask);
    setShowEditModal(true);
  };

  const handleSaveTask = (taskId: string, updates: Partial<Task>) => {
    updateTaskMutation.mutate(
      { id: taskId, updates },
      {
        onSuccess: () => {
          setShowEditModal(false);
          setEditingTask(null);
        },
      }
    );
  };

  const handleDeleteTask = (taskId: string) => {
    deleteTaskMutation.mutate(taskId, {
      onSuccess: () => {
        setShowEditModal(false);
        setEditingTask(null);
      },
    });
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingTask(null);
  };

  // Event handlers
  const handleEventClick = (event: CalendarEvent) => {
    setEditingEvent(event);
    setEventModalInitialDate(null);
    setShowEventModal(true);
  };

  const handleNewEvent = (date?: Date) => {
    setEditingEvent(null);
    setEventModalInitialDate(date || null);
    setShowEventModal(true);
  };

  const handleSaveEvent = (eventId: string | null, eventData: Partial<CalendarEvent>) => {
    if (eventId) {
      // Update existing event
      updateEventMutation.mutate(
        { id: eventId, updates: eventData },
        {
          onSuccess: () => {
            setShowEventModal(false);
            setEditingEvent(null);
          },
        }
      );
    } else {
      // Create new event
      createEventMutation.mutate(eventData, {
        onSuccess: () => {
          setShowEventModal(false);
          setEventModalInitialDate(null);
        },
      });
    }
  };

  const handleDeleteEvent = (eventId: string) => {
    deleteEventMutation.mutate(eventId, {
      onSuccess: () => {
        setShowEventModal(false);
        setEditingEvent(null);
      },
    });
  };

  const handleCloseEventModal = () => {
    setShowEventModal(false);
    setEditingEvent(null);
    setEventModalInitialDate(null);
  };

  // Quick schedule handlers
  const handleCellClick = (date: Date, e: React.MouseEvent, draggedTask: Task | null, draggedEvent: CalendarEvent | null) => {
    // Don't open quick schedule if user is dragging
    if (draggedTask || draggedEvent) return;

    // Don't open if clicking on a task/event
    const target = e.target as HTMLElement;
    if (target.closest('[draggable="true"]') || target.closest('button')) return;

    setQuickScheduleDate(date);
    setShowQuickSchedule(true);
  };

  const handleQuickScheduleTask = (taskId: string, date: Date) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    updateTaskMutation.mutate({
      id: taskId,
      updates: {
        due_date: date.toISOString().split('T')[0],
        sidebar_section: 'scheduled',
      },
    });

    setShowQuickSchedule(false);
  };

  const handleQuickCreateNew = (date: Date) => {
    // Open the new event modal with the selected date
    setEventModalInitialDate(date);
    setShowEventModal(true);
    setShowQuickSchedule(false);
  };

  return {
    // Task modal state
    editingTask,
    showEditModal,
    handleTaskClick,
    handleSaveTask,
    handleDeleteTask,
    handleCloseEditModal,

    // Event modal state
    editingEvent,
    showEventModal,
    eventModalInitialDate,
    handleEventClick,
    handleNewEvent,
    handleSaveEvent,
    handleDeleteEvent,
    handleCloseEventModal,

    // Quick schedule state
    showQuickSchedule,
    setShowQuickSchedule,
    quickScheduleDate,
    handleCellClick,
    handleQuickScheduleTask,
    handleQuickCreateNew,
  };
};
