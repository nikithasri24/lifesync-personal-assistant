/**
 * useTodosDragDrop - Manages drag and drop for V2 Todos UI
 *
 * Handles dragging tasks between status sections (To Do → In Progress → Waiting → Done)
 * Uses Command pattern for undo/redo support
 */

import { useState } from 'react';
import type { UseMutationResult } from '@tanstack/react-query';
import type { Task } from '../../lib/supabase';
import type { TaskData } from '../../services/types';
import type { UndoRedoContextType } from '../../contexts/UndoRedoContext';
import { ChangeTaskStatusCommand } from '../../commands/TaskCommands';
import { logger } from '../../services/logger';

interface UseTodosDragDropProps {
  updateTaskMutation: UseMutationResult<Task, Error, { id: string; updates: Partial<Task> }>;
  executeCommand?: UndoRedoContextType['executeCommand'];
}

export const useTodosDragDrop = ({
  updateTaskMutation,
  executeCommand,
}: UseTodosDragDropProps) => {
  const [draggedTask, setDraggedTask] = useState<TaskData | null>(null);

  const handleDragStart = (task: TaskData, event: React.DragEvent) => {
    setDraggedTask(task);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', task.id || '');
    logger.debug('Todos', 'Drag started', { taskId: task.id, title: task.title });
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
    logger.debug('Todos', 'Drag ended');
  };

  const handleDropOnSection = (targetSectionKey: string, event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (!draggedTask?.id) {
      logger.debug('Todos', 'Drop ignored - no dragged task');
      setDraggedTask(null);
      return;
    }

    // Map section keys to database status values
    const statusMap: Record<string, Task['status']> = {
      todo: 'todo',
      in_progress: 'in_progress',
      waiting: 'waiting',
      done: 'done',
    };

    const newStatus = statusMap[targetSectionKey];

    if (!newStatus) {
      logger.warn('Todos', 'Invalid target section', { targetSectionKey });
      setDraggedTask(null);
      return;
    }

    // Don't update if already in this status
    if (draggedTask.status === newStatus) {
      logger.debug('Todos', 'Drop ignored - task already in target status', { status: newStatus });
      setDraggedTask(null);
      return;
    }

    logger.info('Todos', 'Dropping task on section', {
      taskId: draggedTask.id,
      title: draggedTask.title,
      oldStatus: draggedTask.status,
      newStatus,
    });

    if (executeCommand) {
      // Use Command pattern for undo/redo support
      const command = new ChangeTaskStatusCommand(
        draggedTask.id,
        draggedTask.title,
        newStatus,
        draggedTask.status || 'todo'
      );
      executeCommand(command);
    } else {
      // Fallback: Direct mutation (when undo/redo context not available)
      updateTaskMutation.mutate({
        id: draggedTask.id,
        updates: { status: newStatus },
      });
    }

    setDraggedTask(null);
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = 'move';
  };

  return {
    draggedTask,
    handleDragStart,
    handleDragEnd,
    handleDropOnSection,
    handleDragOver,
  };
};
