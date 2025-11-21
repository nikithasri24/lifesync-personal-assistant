import { useState } from 'react';

/**
 * Custom hook to manage all task-related modal and form visibility states
 * Consolidates modal states and provides helper functions for opening/closing
 */
export function useTaskModals() {
  // Quick add modal
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickAddText, setQuickAddText] = useState('');

  // Task editing
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [editTaskText, setEditTaskText] = useState('');

  // Subtask form
  const [activeSubtaskForm, setActiveSubtaskForm] = useState<string | null>(null);

  // Filters panel
  const [showFilters, setShowFilters] = useState(false);

  /**
   * Open quick add modal
   */
  const openQuickAdd = () => {
    setShowQuickAdd(true);
  };

  /**
   * Close quick add modal and clear text
   */
  const closeQuickAdd = () => {
    setShowQuickAdd(false);
    setQuickAddText('');
  };

  /**
   * Toggle filters panel visibility
   */
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  /**
   * Open task edit mode
   */
  const openTaskEdit = (taskId: string, taskTitle: string) => {
    setEditingTask(taskId);
    setEditTaskText(taskTitle);
  };

  /**
   * Close task edit mode and clear text
   */
  const closeTaskEdit = () => {
    setEditingTask(null);
    setEditTaskText('');
  };

  /**
   * Open subtask form for a specific task
   */
  const openSubtaskForm = (taskId: string) => {
    setActiveSubtaskForm(taskId);
  };

  /**
   * Close subtask form
   */
  const closeSubtaskForm = () => {
    setActiveSubtaskForm(null);
  };

  return {
    // Quick add
    showQuickAdd,
    setShowQuickAdd,
    quickAddText,
    setQuickAddText,
    openQuickAdd,
    closeQuickAdd,

    // Task editing
    editingTask,
    setEditingTask,
    editTaskText,
    setEditTaskText,
    openTaskEdit,
    closeTaskEdit,

    // Subtask form
    activeSubtaskForm,
    setActiveSubtaskForm,
    openSubtaskForm,
    closeSubtaskForm,

    // Filters
    showFilters,
    setShowFilters,
    toggleFilters,
  };
}
