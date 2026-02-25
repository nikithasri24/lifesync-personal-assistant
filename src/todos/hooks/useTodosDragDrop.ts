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
import { ChangeTaskStatusCommand, BulkChangeTaskStatusCommand } from '../../commands/TaskCommands';
import { logger } from '../../services/logger';

interface UseTodosDragDropProps {
  updateTaskMutation: UseMutationResult<Task, Error, { id: string; updates: Partial<Task> }>;
  executeCommand?: UndoRedoContextType['executeCommand'];
  selectedTaskIds?: Set<string>;
  allTasks?: TaskData[];
}

export const useTodosDragDrop = ({
  updateTaskMutation,
  executeCommand,
  selectedTaskIds = new Set(),
  allTasks = [],
}: UseTodosDragDropProps) => {
  const [draggedTask, setDraggedTask] = useState<TaskData | null>(null);
  const [draggedTaskIds, setDraggedTaskIds] = useState<Set<string>>(new Set());

  const handleDragStart = (task: TaskData, event: React.DragEvent) => {
    setDraggedTask(task);

    // Check if this task is part of a selection
    const isTaskSelected = task.id && selectedTaskIds.has(task.id);

    if (isTaskSelected && selectedTaskIds.size > 1) {
      // Multi-select drag: drag all selected tasks
      setDraggedTaskIds(new Set(selectedTaskIds));
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', Array.from(selectedTaskIds).join(','));
      logger.debug('Todos', 'Multi-select drag started', {
        count: selectedTaskIds.size,
        taskIds: Array.from(selectedTaskIds)
      });
    } else {
      // Single task drag
      setDraggedTaskIds(new Set([task.id || '']));
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', task.id || '');
      logger.debug('Todos', 'Drag started', { taskId: task.id, title: task.title });
    }
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
    setDraggedTaskIds(new Set());
    logger.debug('Todos', 'Drag ended');
  };

  const handleDropOnSection = (targetSectionKey: string, event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (!draggedTask?.id || draggedTaskIds.size === 0) {
      logger.debug('Todos', 'Drop ignored - no dragged task');
      setDraggedTask(null);
      setDraggedTaskIds(new Set());
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
      setDraggedTaskIds(new Set());
      return;
    }

    // Multi-select drag: update all selected tasks
    if (draggedTaskIds.size > 1) {
      // Get task details for all dragged tasks
      const tasksToUpdate = allTasks.filter(t => t.id && draggedTaskIds.has(t.id));

      // Filter out tasks that are already in the target status
      const tasksNeedingUpdate = tasksToUpdate.filter(t => t.status !== newStatus);

      if (tasksNeedingUpdate.length === 0) {
        logger.debug('Todos', 'Drop ignored - all tasks already in target status', { status: newStatus });
        setDraggedTask(null);
        setDraggedTaskIds(new Set());
        return;
      }

      logger.info('Todos', 'Dropping multiple tasks on section', {
        count: tasksNeedingUpdate.length,
        newStatus,
      });

      if (executeCommand) {
        // Use Bulk Command for undo/redo support
        const taskData = tasksNeedingUpdate.map(t => ({
          id: t.id!,
          title: t.title,
          oldStatus: t.status || 'todo'
        }));

        const command = new BulkChangeTaskStatusCommand(taskData, newStatus);
        executeCommand(command);
      } else {
        // Fallback: Direct mutations
        tasksNeedingUpdate.forEach(task => {
          if (task.id) {
            updateTaskMutation.mutate({
              id: task.id,
              updates: { status: newStatus },
            });
          }
        });
      }
    } else {
      // Single task drag
      // Don't update if already in this status
      if (draggedTask.status === newStatus) {
        logger.debug('Todos', 'Drop ignored - task already in target status', { status: newStatus });
        setDraggedTask(null);
        setDraggedTaskIds(new Set());
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
    }

    setDraggedTask(null);
    setDraggedTaskIds(new Set());
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = 'move';
  };

  return {
    draggedTask,
    draggedTaskIds,
    handleDragStart,
    handleDragEnd,
    handleDropOnSection,
    handleDragOver,
  };
};
