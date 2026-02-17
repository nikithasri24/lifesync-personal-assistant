import { useModalState } from '@/hooks/useModalState';

/**
 * Custom hook to manage all task-related modal and form visibility states
 *
 * REFACTORED: Now uses the generic useModalState hook to eliminate boilerplate.
 * Maintains backward compatibility with the same return interface.
 *
 * @example
 * ```typescript
 * const modals = useTaskModals();
 *
 * // Quick add
 * modals.openQuickAdd();
 * modals.setQuickAddText('New task');
 * modals.closeQuickAdd();
 *
 * // Task editing
 * modals.openTaskEdit(taskId, taskTitle);
 * modals.setEditTaskText('Updated title');
 * modals.closeTaskEdit();
 * ```
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
  // Use the generic modal state hook
  const modals = useModalState({
    showQuickAdd: false,
    quickAddText: '',
    editingTask: null as string | null,
    editTaskText: '',
    activeSubtaskForm: null as string | null,
    showFilters: false,
  });

  /**
   * Open quick add modal
   */
  const openQuickAdd = (): void => {
    modals.open('showQuickAdd');
  };

  /**
   * Close quick add modal and clear text
   */
  const closeQuickAdd = (): void => {
    modals.batch({ showQuickAdd: false, quickAddText: '' });
  };

  /**
   * Toggle filters panel visibility
   */
  const toggleFilters = (): void => {
    modals.toggle('showFilters');
  };

  /**
   * Open task edit mode
   */
  const openTaskEdit = (taskId: string, taskTitle: string): void => {
    modals.batch({ editingTask: taskId, editTaskText: taskTitle });
  };

  /**
   * Close task edit mode and clear text
   */
  const closeTaskEdit = (): void => {
    modals.batch({ editingTask: null, editTaskText: '' });
  };

  /**
   * Open subtask form for a specific task
   */
  const openSubtaskForm = (taskId: string): void => {
    modals.set('activeSubtaskForm', taskId);
  };

  /**
   * Close subtask form
   */
  const closeSubtaskForm = (): void => {
    modals.set('activeSubtaskForm', null);
  };

  return {
    // Quick add
    showQuickAdd: modals.state.showQuickAdd,
    setShowQuickAdd: (show: boolean) => modals.set('showQuickAdd', show),
    quickAddText: modals.state.quickAddText,
    setQuickAddText: (text: string) => modals.set('quickAddText', text),
    openQuickAdd,
    closeQuickAdd,

    // Task editing
    editingTask: modals.state.editingTask,
    setEditingTask: (taskId: string | null) => modals.set('editingTask', taskId),
    editTaskText: modals.state.editTaskText,
    setEditTaskText: (text: string) => modals.set('editTaskText', text),
    openTaskEdit,
    closeTaskEdit,

    // Subtask form
    activeSubtaskForm: modals.state.activeSubtaskForm,
    setActiveSubtaskForm: (taskId: string | null) => modals.set('activeSubtaskForm', taskId),
    openSubtaskForm,
    closeSubtaskForm,

    // Filters
    showFilters: modals.state.showFilters,
    setShowFilters: (show: boolean) => modals.set('showFilters', show),
    toggleFilters,
  };
}
