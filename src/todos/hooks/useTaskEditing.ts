import type { TaskData } from '../../services/types';
import type { Project, Task } from '../types';
import { parseQuickAdd } from '../services/taskHelpers';

/**
 * Mutation hooks interface expected by useTaskEditing
 */
export interface TaskMutations {
  createTaskMutation: {
    mutate: (data: Partial<TaskData>, options?: { onSuccess?: () => void }) => void;
    isPending: boolean;
  };
  updateTaskMutation: {
    mutate: (data: { id: string; updates: Partial<TaskData> }) => void;
    isPending: boolean;
  };
}

/**
 * Interface for task editing state (from useTaskModals)
 */
export interface TaskEditingState {
  quickAddText: string;
  setQuickAddText: (text: string) => void;
  closeQuickAdd: () => void;
  editTaskText: string;
  setEditTaskText: (text: string) => void;
  editingTask: string | null;
  setEditingTask: (id: string | null) => void;
  openTaskEdit: (taskId: string, taskTitle: string) => void;
  closeTaskEdit: () => void;
}

/**
 * Interface for subtask management state (from useTaskExpansion)
 */
export interface SubtaskState {
  subtaskDrafts: Record<string, string>;
  setSubtaskDraft: (taskId: string, text: string) => void;
  clearSubtaskDraft: (taskId: string) => void;
  getSubtaskDraft: (taskId: string) => string;
  setActiveSubtaskForm: (taskId: string | null) => void;
}

/**
 * Custom hook to manage task editing business logic
 * Provides functions for creating, updating, and managing tasks and subtasks
 */
export function useTaskEditing(
  mutations: TaskMutations,
  editingState: TaskEditingState,
  subtaskState: SubtaskState,
  apiTasks: TaskData[],
  projects: Project[]
) {
  const { createTaskMutation, updateTaskMutation } = mutations;

  /**
   * Quick add a new task with natural language parsing
   * Parses priority, due date, project, and tags from text
   */
  const quickAddTask = async () => {
    if (!editingState.quickAddText.trim()) return;

    const parsed = parseQuickAdd(editingState.quickAddText, projects);

    createTaskMutation.mutate(
      {
        title: parsed.title,
        description: '',
        priority: parsed.priority,
        status: 'todo',
        estimated_time: 25,
        actual_time: 0,
        due_date: parsed.dueDate ? parsed.dueDate.toISOString() : null,
        project_id: parsed.projectId || null,
        tags: parsed.tags,
        category: 'work',
      },
      {
        onSuccess: () => {
          editingState.setQuickAddText('');
          editingState.closeQuickAdd();
        },
      }
    );
  };

  /**
   * Start editing a task
   * Opens edit mode with the task's current title
   */
  const startEditingTask = (task: Task) => {
    editingState.openTaskEdit(task.id, task.title);
  };

  /**
   * Save changes to an edited task
   * Parses updated text and merges with existing task data
   */
  const saveTaskEdit = async (taskId: string) => {
    if (editingState.editTaskText.trim()) {
      const parsed = parseQuickAdd(editingState.editTaskText, projects);
      const currentTask = apiTasks.find(t => t.id === taskId);

      if (currentTask) {
        updateTaskMutation.mutate({
          id: taskId,
          updates: {
            title: parsed.title,
            priority: parsed.priority,
            due_date: parsed.dueDate
              ? parsed.dueDate.toISOString()
              : currentTask.due_date,
            project_id: parsed.projectId || currentTask.project_id,
            tags: parsed.tags.length > 0 ? parsed.tags : currentTask.tags,
          },
        });
      }
    }
    editingState.closeTaskEdit();
  };

  /**
   * Cancel task editing without saving
   */
  const cancelTaskEdit = () => {
    editingState.closeTaskEdit();
  };

  /**
   * Add a subtask to a parent task
   * Creates a new task with the parent_id set
   */
  const addSubtask = async (parentId: string) => {
    const draft = subtaskState.getSubtaskDraft(parentId).trim();
    if (!draft) return;

    createTaskMutation.mutate(
      {
        title: draft,
        description: '',
        priority: 'medium',
        status: 'todo',
        estimated_time: 25,
        actual_time: 0,
        tags: [],
        category: 'work',
        parent_id: parentId,
        due_date: null,
        project_id: null,
      },
      {
        onSuccess: () => {
          subtaskState.clearSubtaskDraft(parentId);
          subtaskState.setActiveSubtaskForm(null);
        },
      }
    );
  };

  /**
   * Toggle task completion status
   * Marks task as done/todo and updates completed_at timestamp
   */
  const toggleTaskStatus = async (taskId: string) => {
    const task = apiTasks.find(t => t.id === taskId);
    if (task) {
      updateTaskMutation.mutate({
        id: taskId,
        updates: {
          status: task.status === 'done' ? 'todo' : 'done',
          completed_at: task.status === 'done' ? null : new Date().toISOString(),
        },
      });
    }
  };

  return {
    quickAddTask,
    startEditingTask,
    saveTaskEdit,
    cancelTaskEdit,
    addSubtask,
    toggleTaskStatus,
  };
}
