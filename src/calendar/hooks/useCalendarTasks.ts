/**
 * useCalendarTasks - Manages task categorization and filtering for calendar
 */

import { useMemo } from 'react';
import type { Task } from '../../lib/supabase';

export interface CategorizedTasks {
  scheduled: Task[];
  inProgress: Task[];
  todo: Task[];
  backlog: Task[];
}

export const useCalendarTasks = (tasks: Task[]) => {
  // Get unscheduled tasks (no due_date or deleted) and categorize them
  const unscheduledTasks = useMemo(() => {
    return tasks.filter(task => !task.due_date && task.status !== 'done' && !task.deleted);
  }, [tasks]);

  const scheduledTasks = useMemo(() => {
    return tasks.filter(task => task.due_date && task.status !== 'done' && !task.deleted);
  }, [tasks]);

  const categorizedTasks: CategorizedTasks = useMemo(() => {
    // Scheduled: tasks WITH due_date OR manually set to scheduled section
    const scheduled = tasks.filter(t =>
      !t.deleted &&
      t.status !== 'done' &&
      (t.due_date || t.sidebar_section === 'scheduled')
    );

    // Get unscheduled tasks (no due_date AND not manually in scheduled section)
    const unscheduled = tasks.filter(t =>
      !t.deleted &&
      t.status !== 'done' &&
      !t.due_date &&
      t.sidebar_section !== 'scheduled'
    );

    // Use manual sidebar_section if set, otherwise use automatic categorization
    const inProgress = unscheduled.filter(t =>
      t.sidebar_section === 'in_progress' ||
      (!t.sidebar_section && t.status === 'in_progress')
    );

    const todo = unscheduled.filter(t =>
      t.sidebar_section === 'todo' ||
      (!t.sidebar_section && (
        (t.status === 'todo' && (t.priority === 'high' || t.priority === 'urgent')) ||
        t.status === 'waiting'
      ))
    );

    const backlog = unscheduled.filter(t =>
      t.sidebar_section === 'backlog' ||
      (!t.sidebar_section &&
        t.status === 'todo' &&
        (t.priority === 'low' || t.priority === 'medium')
      )
    );

    return {
      scheduled,
      inProgress,
      todo,
      backlog,
    };
  }, [tasks]);

  return {
    unscheduledTasks,
    scheduledTasks,
    categorizedTasks,
  };
};

