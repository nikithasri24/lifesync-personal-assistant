import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTaskModals } from '../useTaskModals';

describe('useTaskModals', () => {
  describe('Quick Add Modal', () => {
    it('should initialize with quick add closed', () => {
      const { result } = renderHook(() => useTaskModals());

      expect(result.current.showQuickAdd).toBe(false);
      expect(result.current.quickAddText).toBe('');
    });

    it('should open quick add modal', () => {
      const { result } = renderHook(() => useTaskModals());

      act(() => {
        result.current.openQuickAdd();
      });

      expect(result.current.showQuickAdd).toBe(true);
    });

    it('should close quick add modal and clear text', () => {
      const { result } = renderHook(() => useTaskModals());

      // Open and set text
      act(() => {
        result.current.openQuickAdd();
        result.current.setQuickAddText('Test task');
      });

      expect(result.current.showQuickAdd).toBe(true);
      expect(result.current.quickAddText).toBe('Test task');

      // Close should clear both
      act(() => {
        result.current.closeQuickAdd();
      });

      expect(result.current.showQuickAdd).toBe(false);
      expect(result.current.quickAddText).toBe('');
    });

    it('should update quick add text', () => {
      const { result } = renderHook(() => useTaskModals());

      act(() => {
        result.current.setQuickAddText('New task title');
      });

      expect(result.current.quickAddText).toBe('New task title');
    });

    it('should manually set quick add visibility', () => {
      const { result } = renderHook(() => useTaskModals());

      act(() => {
        result.current.setShowQuickAdd(true);
      });

      expect(result.current.showQuickAdd).toBe(true);

      act(() => {
        result.current.setShowQuickAdd(false);
      });

      expect(result.current.showQuickAdd).toBe(false);
    });
  });

  describe('Task Edit Modal', () => {
    it('should initialize with task edit closed', () => {
      const { result } = renderHook(() => useTaskModals());

      expect(result.current.editingTask).toBeNull();
      expect(result.current.editTaskText).toBe('');
    });

    it('should open task edit with ID and title', () => {
      const { result } = renderHook(() => useTaskModals());

      act(() => {
        result.current.openTaskEdit('task-123', 'Task Title');
      });

      expect(result.current.editingTask).toBe('task-123');
      expect(result.current.editTaskText).toBe('Task Title');
    });

    it('should close task edit and clear data', () => {
      const { result } = renderHook(() => useTaskModals());

      // Open task edit
      act(() => {
        result.current.openTaskEdit('task-456', 'Another Task');
      });

      expect(result.current.editingTask).toBe('task-456');
      expect(result.current.editTaskText).toBe('Another Task');

      // Close should clear both
      act(() => {
        result.current.closeTaskEdit();
      });

      expect(result.current.editingTask).toBeNull();
      expect(result.current.editTaskText).toBe('');
    });

    it('should update edit task text', () => {
      const { result } = renderHook(() => useTaskModals());

      act(() => {
        result.current.openTaskEdit('task-789', 'Original Title');
        result.current.setEditTaskText('Updated Title');
      });

      expect(result.current.editTaskText).toBe('Updated Title');
    });

    it('should manually set editing task ID', () => {
      const { result } = renderHook(() => useTaskModals());

      act(() => {
        result.current.setEditingTask('task-abc');
      });

      expect(result.current.editingTask).toBe('task-abc');

      act(() => {
        result.current.setEditingTask(null);
      });

      expect(result.current.editingTask).toBeNull();
    });
  });

  describe('Subtask Form', () => {
    it('should initialize with subtask form closed', () => {
      const { result } = renderHook(() => useTaskModals());

      expect(result.current.activeSubtaskForm).toBeNull();
    });

    it('should open subtask form for a task', () => {
      const { result } = renderHook(() => useTaskModals());

      act(() => {
        result.current.openSubtaskForm('parent-task-123');
      });

      expect(result.current.activeSubtaskForm).toBe('parent-task-123');
    });

    it('should close subtask form', () => {
      const { result } = renderHook(() => useTaskModals());

      // Open subtask form
      act(() => {
        result.current.openSubtaskForm('parent-task-456');
      });

      expect(result.current.activeSubtaskForm).toBe('parent-task-456');

      // Close it
      act(() => {
        result.current.closeSubtaskForm();
      });

      expect(result.current.activeSubtaskForm).toBeNull();
    });

    it('should manually set active subtask form', () => {
      const { result } = renderHook(() => useTaskModals());

      act(() => {
        result.current.setActiveSubtaskForm('task-xyz');
      });

      expect(result.current.activeSubtaskForm).toBe('task-xyz');

      act(() => {
        result.current.setActiveSubtaskForm(null);
      });

      expect(result.current.activeSubtaskForm).toBeNull();
    });

    it('should switch between different task subtask forms', () => {
      const { result } = renderHook(() => useTaskModals());

      act(() => {
        result.current.openSubtaskForm('task-1');
      });

      expect(result.current.activeSubtaskForm).toBe('task-1');

      act(() => {
        result.current.openSubtaskForm('task-2');
      });

      expect(result.current.activeSubtaskForm).toBe('task-2');
    });
  });

  describe('Filters Panel', () => {
    it('should initialize with filters closed', () => {
      const { result } = renderHook(() => useTaskModals());

      expect(result.current.showFilters).toBe(false);
    });

    it('should toggle filters on', () => {
      const { result } = renderHook(() => useTaskModals());

      act(() => {
        result.current.toggleFilters();
      });

      expect(result.current.showFilters).toBe(true);
    });

    it('should toggle filters off', () => {
      const { result } = renderHook(() => useTaskModals());

      // Toggle on
      act(() => {
        result.current.toggleFilters();
      });

      expect(result.current.showFilters).toBe(true);

      // Toggle off
      act(() => {
        result.current.toggleFilters();
      });

      expect(result.current.showFilters).toBe(false);
    });

    it('should manually set filters visibility', () => {
      const { result } = renderHook(() => useTaskModals());

      act(() => {
        result.current.setShowFilters(true);
      });

      expect(result.current.showFilters).toBe(true);

      act(() => {
        result.current.setShowFilters(false);
      });

      expect(result.current.showFilters).toBe(false);
    });
  });

  describe('Multiple Modals', () => {
    it('should handle multiple modals open simultaneously', () => {
      const { result } = renderHook(() => useTaskModals());

      act(() => {
        result.current.openQuickAdd();
        result.current.openTaskEdit('task-123', 'Task');
        result.current.openSubtaskForm('parent-456');
        result.current.setShowFilters(true);
      });

      expect(result.current.showQuickAdd).toBe(true);
      expect(result.current.editingTask).toBe('task-123');
      expect(result.current.activeSubtaskForm).toBe('parent-456');
      expect(result.current.showFilters).toBe(true);
    });

    it('should close all modals independently', () => {
      const { result } = renderHook(() => useTaskModals());

      // Open all
      act(() => {
        result.current.openQuickAdd();
        result.current.openTaskEdit('task-123', 'Task');
        result.current.openSubtaskForm('parent-456');
        result.current.setShowFilters(true);
      });

      // Close quick add
      act(() => {
        result.current.closeQuickAdd();
      });

      expect(result.current.showQuickAdd).toBe(false);
      expect(result.current.editingTask).toBe('task-123'); // Still open

      // Close task edit
      act(() => {
        result.current.closeTaskEdit();
      });

      expect(result.current.editingTask).toBeNull();
      expect(result.current.activeSubtaskForm).toBe('parent-456'); // Still open

      // Close subtask form
      act(() => {
        result.current.closeSubtaskForm();
      });

      expect(result.current.activeSubtaskForm).toBeNull();
      expect(result.current.showFilters).toBe(true); // Still open
    });

    it('should preserve state when switching between modals', () => {
      const { result } = renderHook(() => useTaskModals());

      // Set quick add text
      act(() => {
        result.current.setQuickAddText('Task from quick add');
      });

      // Open task edit (should not affect quick add text)
      act(() => {
        result.current.openTaskEdit('task-789', 'Edit task');
      });

      expect(result.current.quickAddText).toBe('Task from quick add');
      expect(result.current.editTaskText).toBe('Edit task');

      // Update edit text (should not affect quick add text)
      act(() => {
        result.current.setEditTaskText('Updated edit task');
      });

      expect(result.current.quickAddText).toBe('Task from quick add');
      expect(result.current.editTaskText).toBe('Updated edit task');
    });
  });
});
