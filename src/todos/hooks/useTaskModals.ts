import { useState } from 'react';

/**
 * Custom hook to manage all task-related modal and form visibility states
 * Consolidates modal states and provides helper functions for opening/closing
 */
interface UseTaskModalsReturn {
  // Quick add
  showQuickAdd: boolean;
  setShowQuickAdd: (show: boolean) => void;
  quickAddText: string;
  setQuickAddText: (text: string) => void;
  openQuickAdd: () => void;
  closeQuickAdd: () => void;
  // Task editing
  editingTask: string | null;
  setEditingTask: (taskId: string | null) => void;
  editTaskText: string;
  setEditTaskText: (text: string) => void;
  openTaskEdit: (taskId: string, taskTitle: string) => void;
  closeTaskEdit: () => void;
  // Subtask form
  activeSubtaskForm: string | null;
  setActiveSubtaskForm: (taskId: string | null) => void;
  openSubtaskForm: (taskId: string) => void;
  closeSubtaskForm: () => void;
  // Filters
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  toggleFilters: () => void;
}

export function useTaskModals(): UseTaskModalsReturn {
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
  const openQuickAdd = (): void => {
    setShowQuickAdd(true);
  };

  /**
   * Close quick add modal and clear text
   */
  const closeQuickAdd = (): void => {
    setShowQuickAdd(false);
    setQuickAddText('');
  };

  /**
   * Toggle filters panel visibility
   */
  const toggleFilters = (): void => {
    setShowFilters(!showFilters);
  };

  /**
   * Open task edit mode
   */
  const openTaskEdit = (taskId: string, taskTitle: string): void => {
    setEditingTask(taskId);
    setEditTaskText(taskTitle);
  };

  /**
   * Close task edit mode and clear text
   */
  const closeTaskEdit = (): void => {
    setEditingTask(null);
    setEditTaskText('');
  };

  /**
   * Open subtask form for a specific task
   */
  const openSubtaskForm = (taskId: string): void => {
    setActiveSubtaskForm(taskId);
  };

  /**
   * Close subtask form
   */
  const closeSubtaskForm = (): void => {
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
