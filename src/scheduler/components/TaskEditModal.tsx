/**
 * TaskEditModal — Edit a scheduled task from the calendar view.
 * Reuses TaskFormModalV2 so the full task editing experience is available
 * without leaving the scheduler.
 */

import React from 'react';
import { TaskFormModalV2 } from '@/todos/components/v2/TaskFormModalV2';
import { useUpdateTask, useDeleteTask, useProjects, useTasks } from '@/hooks/useTasksQuery';
import type { ScheduledTask } from '../types';
import type { TaskData } from '@/services/types';

interface TaskEditModalProps {
  task: ScheduledTask | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: ScheduledTask) => void;
}

export function TaskEditModal({ task, isOpen, onClose }: TaskEditModalProps) {
  const { mutate: updateTask, isPending: isUpdating } = useUpdateTask();
  const { mutate: deleteTask, isPending: isDeleting } = useDeleteTask();
  const { data: projects = [] } = useProjects();
  const { data: allTasks = [] } = useTasks();

  if (!isOpen || !task) return null;

  const handleSubmit = (updates: Partial<TaskData>) => {
    updateTask({ id: task.id, updates });
    onClose();
  };

  const handleDelete = () => {
    if (confirm(`Delete "${task.title}"?`)) {
      deleteTask(task.id);
      onClose();
    }
  };

  const initialData: Partial<TaskData> = {
    id: task.id,
    title: task.title,
    description: task.description,
    priority: task.priority as TaskData['priority'],
    status: (task.status === 'in-progress' ? 'in_progress' : task.status) as TaskData['status'],
    category: task.category as TaskData['category'],
    due_date: task.due_date ?? undefined,
    estimated_time: task.estimated_time,
    scheduled_start: task.scheduled_start,
    scheduled_end: task.scheduled_end,
    project_id: task.project_id,
    tags: task.tags,
    created_at: task.created_at,
    updated_at: task.updated_at,
  };

  return (
    <TaskFormModalV2
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      onDelete={handleDelete}
      initialData={initialData}
      projects={projects}
      allTasks={allTasks as TaskData[]}
      isEditing
      isPending={isUpdating || isDeleting}
    />
  );
}
